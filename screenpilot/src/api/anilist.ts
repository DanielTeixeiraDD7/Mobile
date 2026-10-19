import { RateLimiter } from './limiter';
import { plainText, toSnapshot, type RawMedia } from './mapper';
import { AIRING_QUERY, MEDIA_BATCH_QUERY, MEDIA_QUERY, SEARCH_QUERY, TRENDING_QUERY } from './queries';
import type { MediaSnapshot, MediaType } from '../domain/types';

export const ANILIST_URL = 'https://graphql.anilist.co';
/** AniList annonce 90 req/min (30 en mode dégradé) : on reste sous les deux. */
export const REQUESTS_PER_MINUTE = 25;

export type ApiErrorKind = 'offline' | 'rate_limited' | 'unavailable' | 'not_found' | 'http' | 'graphql' | 'aborted';

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string, public retryAfter = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.kind) {
      case 'offline': return 'Hors-ligne : la recherche AniList reprendra avec le réseau.';
      case 'rate_limited': return `Trop de requêtes vers AniList. Réessaie dans ${Math.max(1, Math.ceil(e.retryAfter / 1000))} s.`;
      case 'unavailable': return 'AniList est temporairement indisponible. Ta bibliothèque reste utilisable.';
      case 'not_found': return 'Titre introuvable sur AniList.';
      default: return 'Erreur AniList : ' + e.message;
    }
  }
  return e instanceof Error ? e.message : String(e);
}

export interface CacheStore {
  get(key: string): Promise<{ data: unknown; at: number } | undefined>;
  put(key: string, data: unknown, at: number): Promise<void>;
}

export interface Result<T> {
  data: T;
  /** true = servi depuis le cache local parce que le réseau a échoué. */
  stale: boolean;
  fetchedAt: number;
}

export interface ClientOptions {
  fetch?: typeof fetch;
  cache?: CacheStore | null;
  limiter?: RateLimiter;
  now?: () => number;
  online?: () => boolean;
}

export const TTL = {
  search: 6 * 3600_000,
  media: 24 * 3600_000,
  airing: 3600_000,
  trending: 12 * 3600_000,
};

export interface MediaDetails {
  media: MediaSnapshot;
  description: string;
  /** Sites officiels de visionnage / lecture (AniList, non liés à un pays). */
  liens?: { site: string; url: string; langue: string | null; couleur: string | null }[];
  recommendations: { rating: number; media: MediaSnapshot }[];
}

export interface AiringItem {
  id: number;
  mediaId: number;
  episode: number;
  airingAt: number;
}

export class AniListClient {
  private fetchImpl: typeof fetch;
  readonly limiter: RateLimiter;
  private cache: CacheStore | null;
  private now: () => number;
  private online: () => boolean;

  constructor(o: ClientOptions = {}) {
    this.fetchImpl = o.fetch ?? ((...a) => fetch(...a));
    this.now = o.now ?? (() => Date.now());
    this.limiter = o.limiter ?? new RateLimiter(REQUESTS_PER_MINUTE, 60_000, this.now);
    this.cache = o.cache ?? null;
    this.online = o.online ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
  }

  setCache(cache: CacheStore | null) {
    this.cache = cache;
  }

  /** Requête GraphQL brute, limitée et annulable. `maxWait` : attente max d'un créneau. */
  async request<T>(query: string, variables: Record<string, unknown>, signal?: AbortSignal, maxWait = 4000): Promise<T> {
    if (!this.online()) throw new ApiError('offline', 'hors-ligne');
    if (signal?.aborted) throw new ApiError('aborted', 'annulée');
    try {
      if (!(await this.limiter.acquire(signal, maxWait))) throw new ApiError('rate_limited', 'limite locale', this.limiter.waitTime());
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('aborted', 'annulée');
    }
    let res: Response;
    try {
      res = await this.fetchImpl(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal,
      });
    } catch (e) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) throw new ApiError('aborted', 'annulée');
      throw new ApiError('offline', 'réseau injoignable');
    }
    const remaining = Number(res.headers.get('X-RateLimit-Remaining'));
    if (res.headers.has('X-RateLimit-Remaining') && remaining <= 1) this.limiter.block(60_000);

    let body: { data?: T; errors?: { message: string; status?: number }[] } | null = null;
    try { body = await res.json(); } catch { body = null; }

    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After')) || 60;
      this.limiter.block(retry * 1000);
      throw new ApiError('rate_limited', 'limite AniList', retry * 1000);
    }
    if (res.status === 403) throw new ApiError('unavailable', body?.errors?.[0]?.message ?? 'accès refusé');
    if (res.status === 404) throw new ApiError('not_found', body?.errors?.[0]?.message ?? 'introuvable');
    if (res.status >= 500) throw new ApiError('unavailable', `HTTP ${res.status}`);
    if (!res.ok) throw new ApiError('http', `HTTP ${res.status}`);
    if (body?.errors?.length) throw new ApiError('graphql', body.errors.map(e => e.message).join(' ; '));
    if (!body?.data) throw new ApiError('graphql', 'réponse vide');
    return body.data;
  }

  /** Cache d'abord si frais ; sinon réseau ; si le réseau échoue, ancien cache marqué « stale ». */
  async cached<T>(key: string, ttl: number, load: () => Promise<T>, force = false): Promise<Result<T>> {
    const hit = this.cache ? await this.cache.get(key).catch(() => undefined) : undefined;
    if (hit && !force && this.now() - hit.at < ttl) return { data: hit.data as T, stale: false, fetchedAt: hit.at };
    try {
      const data = await load();
      const at = this.now();
      await this.cache?.put(key, data, at).catch(() => {});
      return { data, stale: false, fetchedAt: at };
    } catch (e) {
      if (hit && e instanceof ApiError && e.kind !== 'aborted' && e.kind !== 'not_found') return { data: hit.data as T, stale: true, fetchedAt: hit.at };
      throw e;
    }
  }

  search(type: MediaType, text: string, page = 1, signal?: AbortSignal) {
    const q = text.trim().replace(/\s+/g, ' ');
    return this.cached(`search:${type}:${page}:${q.toLowerCase()}`, TTL.search, async () => {
      const d = await this.request<{ Page: { pageInfo: { hasNextPage: boolean }; media: RawMedia[] } }>(
        SEARCH_QUERY, { search: q, type, page, perPage: 20 }, signal);
      return { items: d.Page.media.filter(m => !m.isAdult).map(m => toSnapshot(m, this.now())), hasNext: d.Page.pageInfo.hasNextPage };
    });
  }

  details(id: number, signal?: AbortSignal, force = false) {
    return this.cached<MediaDetails>(`media:v2:${id}`, TTL.media, async () => {
      const d = await this.request<{ Media: RawMedia & { description: string | null; externalLinks?: { site: string; url: string; type: string; language: string | null; isDisabled: boolean | null; color: string | null }[] | null; recommendations: { nodes: ({ rating: number | null; mediaRecommendation: RawMedia | null } | null)[] } | null } }>(
        MEDIA_QUERY, { id }, signal);
      const m = d.Media;
      return {
        media: toSnapshot(m, this.now()),
        description: plainText(m.description),
        // Certains liens AniList sont en http:// : passés en https (les sites concernés le servent tous).
        liens: (m.externalLinks ?? []).filter(l => l.type === 'STREAMING' && !l.isDisabled && /^https?:\/\//.test(l.url))
          .map(l => ({ site: l.site, url: l.url.replace(/^http:/, 'https:'), langue: l.language, couleur: l.color })),
        recommendations: (m.recommendations?.nodes ?? [])
          .filter((n): n is { rating: number | null; mediaRecommendation: RawMedia } => !!n?.mediaRecommendation && !n.mediaRecommendation.isAdult)
          .map(n => ({ rating: n.rating ?? 0, media: toSnapshot(n.mediaRecommendation, this.now()) })),
      };
    }, force);
  }

  /** Infos à jour pour une liste d'ids (pagination 50 par 50). */
  async batch(ids: number[], signal?: AbortSignal): Promise<MediaSnapshot[]> {
    const out: MediaSnapshot[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const d = await this.request<{ Page: { media: RawMedia[] } }>(MEDIA_BATCH_QUERY, { ids: ids.slice(i, i + 50), page: 1 }, signal, 60_000);
      out.push(...d.Page.media.map(m => toSnapshot(m, this.now())));
    }
    return out;
  }

  /** Épisodes diffusés entre `from` et `to` (secondes Unix) pour les anime donnés. */
  airing(ids: number[], from: number, to: number, signal?: AbortSignal, force = false) {
    const key = `airing:${[...ids].sort((a, b) => a - b).join(',')}:${Math.floor(from / 3600)}:${Math.floor(to / 3600)}`;
    return this.cached<AiringItem[]>(key, TTL.airing, async () => {
      const out: AiringItem[] = [];
      for (let i = 0; i < ids.length; i += 50) {
        for (let page = 1; page <= 10; page++) {
          const d = await this.request<{ Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AiringItem[] } }>(
            AIRING_QUERY, { ids: ids.slice(i, i + 50), from, to, page }, signal, 60_000);
          out.push(...d.Page.airingSchedules);
          if (!d.Page.pageInfo.hasNextPage) break;
        }
      }
      return out.sort((a, b) => a.airingAt - b.airingAt);
    }, force);
  }

  trending(type: MediaType, signal?: AbortSignal) {
    return this.cached(`trending:${type}`, TTL.trending, async () => {
      const d = await this.request<{ Page: { media: RawMedia[] } }>(TRENDING_QUERY, { type, page: 1 }, signal, 30_000);
      return d.Page.media.filter(m => !m.isAdult).map(m => toSnapshot(m, this.now()));
    });
  }
}

export const anilist = new AniListClient();
