import { ApiError, isAbort } from './errors';
import { RateLimiter, abortableSleep } from './limiter';

/** Description d'une source réseau : base, en-têtes, débit autorisé. */
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  headers?: Record<string, string>;
  /** Requêtes par minute que l'app s'autorise (sous la limite du fournisseur). */
  rpm: number;
}


export interface CacheEntry {
  data: unknown;
  at: number;
}

export interface CacheStore {
  get(key: string): Promise<CacheEntry | undefined>;
  put(key: string, data: unknown, at: number): Promise<void>;
}

export interface GetOptions {
  signal?: AbortSignal;
  /** Durée de validité du cache (ms). Infinity = jamais rechargé (donnée définitive). 0 = toujours recharger. */
  ttl: number;
  /** Ignore le cache frais (actualisation manuelle). */
  force?: boolean;
  /** Attente max d'un créneau du limiteur avant d'abandonner (ms). */
  maxWait?: number;
  /** Ne pas écrire en cache (données en direct volumineuses). */
  noStore?: boolean;
  /** Vérifie la réponse avant mise en cache (erreur « en 200 » de certaines API) ; lève une ApiError sinon. */
  validate?: (data: unknown, p: ProviderConfig) => void;
}

export interface HttpResult<T> {
  data: T;
  fetchedAt: number;
  stale: boolean;
  fromCache: boolean;
}

export interface HttpDeps {
  fetch?: typeof fetch;
  cache?: CacheStore | null;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  online?: () => boolean;
}

/** Délais entre tentatives après une erreur réseau ou 5xx. */
export const RETRY_DELAYS = [800, 2500];

/**
 * Client HTTP commun : cache IndexedDB à durée de vie, données périmées en secours,
 * déduplication des requêtes identiques simultanées, limiteur par source,
 * réessais avec attente croissante, respect de 429 / Retry-After.
 */
export class Http {
  private fetchImpl: typeof fetch;
  private cache: CacheStore | null;
  private now: () => number;
  private sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  private online: () => boolean;
  private limiters = new Map<string, RateLimiter>();
  private inflight = new Map<string, Promise<HttpResult<unknown>>>();
  /** Statistiques par source, affichées dans l'écran Sources. */
  readonly stats = new Map<string, { requests: number; errors: number; lastOk: number | null; lastError: string | null }>();

  constructor(deps: HttpDeps = {}) {
    this.fetchImpl = deps.fetch ?? ((...a) => fetch(...a));
    this.cache = deps.cache ?? null;
    this.now = deps.now ?? (() => Date.now());
    this.sleep = deps.sleep ?? abortableSleep;
    this.online = deps.online ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
  }

  setCache(cache: CacheStore | null) {
    this.cache = cache;
  }

  limiter(p: ProviderConfig) {
    let l = this.limiters.get(p.id);
    if (!l) this.limiters.set(p.id, (l = new RateLimiter(p.rpm, 60_000, this.now, this.sleep)));
    return l;
  }

  private stat(id: string) {
    let s = this.stats.get(id);
    if (!s) this.stats.set(id, (s = { requests: 0, errors: 0, lastOk: null, lastError: null }));
    return s;
  }

  /** Lit une entrée de cache sans réseau (affichage instantané avant actualisation). */
  async peek<T>(p: ProviderConfig, path: string): Promise<CacheEntry & { data: T } | undefined> {
    return (await this.cache?.get(`${p.id}:${path}`).catch(() => undefined)) as (CacheEntry & { data: T }) | undefined;
  }

  async get<T>(p: ProviderConfig, path: string, o: GetOptions): Promise<HttpResult<T>> {
    const key = `${p.id}:${path}`;
    const hit = this.cache ? await this.cache.get(key).catch(() => undefined) : undefined;
    if (hit && !o.force && this.now() - hit.at < o.ttl) return { data: hit.data as T, fetchedAt: hit.at, stale: false, fromCache: true };

    // Une seule requête réseau par clé à la fois : les appels simultanés partagent la même promesse.
    let run = this.inflight.get(key) as Promise<HttpResult<T>> | undefined;
    if (!run) {
      run = this.network<T>(p, path, o, key).finally(() => this.inflight.delete(key));
      this.inflight.set(key, run as Promise<HttpResult<unknown>>);
    }
    try {
      return await run;
    } catch (e) {
      if (hit && !isAbort(e) && !(e instanceof ApiError && e.kind === 'not_found')) {
        return { data: hit.data as T, fetchedAt: hit.at, stale: true, fromCache: true };
      }
      throw e;
    }
  }

  private async network<T>(p: ProviderConfig, path: string, o: GetOptions, key: string): Promise<HttpResult<T>> {
    const s = this.stat(p.id);
    if (!this.online()) throw new ApiError('offline', 'hors-ligne', 0, p.name);
    for (let attempt = 0; ; attempt++) {
      if (o.signal?.aborted) throw new ApiError('aborted', 'annulée');
      try {
        if (!(await this.limiter(p).acquire(o.signal, o.maxWait ?? 8000))) {
          throw new ApiError('rate_limited', 'limite locale', this.limiter(p).waitTime(), p.name);
        }
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError('aborted', 'annulée');
      }
      s.requests++;
      try {
        const data = await this.once<T>(p, path, o.signal);
        o.validate?.(data, p);
        const at = this.now();
        s.lastOk = at;
        if (!o.noStore) await this.cache?.put(key, data, at).catch(() => {});
        return { data, fetchedAt: at, stale: false, fromCache: false };
      } catch (e) {
        if (isAbort(e)) throw new ApiError('aborted', 'annulée');
        const err = e instanceof ApiError ? e : new ApiError('http', String(e), 0, p.name);
        if (err.kind === 'rate_limited' && err.retryAfter) this.limiter(p).block(err.retryAfter);
        s.errors++;
        s.lastError = err.kind;
        const retryable = err.kind === 'offline' || err.kind === 'unavailable';
        if (!retryable || attempt >= RETRY_DELAYS.length) throw err;
        await this.sleep(RETRY_DELAYS[attempt]!, o.signal).catch(() => { throw new ApiError('aborted', 'annulée'); });
      }
    }
  }

  private async once<T>(p: ProviderConfig, path: string, signal?: AbortSignal): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(p.baseUrl + path, { headers: { Accept: 'application/json', ...p.headers }, signal });
    } catch (e) {
      if (signal?.aborted || isAbort(e)) throw new ApiError('aborted', 'annulée');
      throw new ApiError('offline', 'réseau injoignable', 0, p.name);
    }
    if (res.status === 429) {
      const retry = (Number(res.headers.get('Retry-After')) || 60) * 1000;
      this.limiter(p).block(retry);
      throw new ApiError('rate_limited', 'HTTP 429', retry, p.name);
    }
    const remaining = res.headers.get('x-rate-limit-remaining-minute') ?? res.headers.get('X-RateLimit-Remaining');
    if (remaining !== null && Number(remaining) <= 1) this.limiter(p).block(60_000);
    // Quota journalier (OpenDota : 3 000/jour sans clé) : on garde une marge.
    const day = res.headers.get('x-rate-limit-remaining-day');
    if (day !== null && Number(day) <= 50) this.limiter(p).block(3_600_000);
    if (res.status === 404) throw new ApiError('not_found', 'HTTP 404', 0, p.name);
    if (res.status === 401 || res.status === 403) throw new ApiError('unavailable', `HTTP ${res.status}`, 0, p.name);
    if (res.status >= 500) throw new ApiError('unavailable', `HTTP ${res.status}`, 0, p.name);
    if (!res.ok) throw new ApiError('http', `HTTP ${res.status}`, 0, p.name);
    try {
      return (await res.json()) as T;
    } catch {
      throw new ApiError('bad_data', 'JSON invalide', 0, p.name);
    }
  }
}

export const http = new Http();
