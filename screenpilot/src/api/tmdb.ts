import { TMDB_API_KEY } from '../config';
import { ApiError, TTL, type CacheStore, type Result } from './anilist';
import { RateLimiter } from './limiter';
import type { MediaSnapshot } from '../domain/types';

export const TMDB_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
export type TmdbType = 'MOVIE' | 'TV';
const chemin = (t: TmdbType) => (t === 'MOVIE' ? 'movie' : 'tv');

interface RawResult {
  id: number; media_type?: string; adult?: boolean; title?: string; name?: string; original_title?: string; original_name?: string;
  poster_path?: string | null; release_date?: string; first_air_date?: string; vote_average?: number; overview?: string;
  genre_ids?: number[]; original_language?: string; popularity?: number;
}
export interface RawMovie extends RawResult {
  runtime: number | null; status: string; genres: { id: number; name: string }[];
}
export interface RawTv extends RawResult {
  status: string; genres: { id: number; name: string }[]; episode_run_time: number[]; number_of_episodes: number;
  seasons: { season_number: number; episode_count: number }[];
  last_episode_to_air: { runtime: number | null; season_number: number; episode_number: number } | null;
  next_episode_to_air: { air_date: string | null; season_number: number; episode_number: number } | null;
}

const STATUTS: Record<string, string> = {
  Released: 'FINISHED', 'Returning Series': 'RELEASING', Ended: 'FINISHED', Canceled: 'CANCELLED',
  'In Production': 'NOT_YET_RELEASED', 'Post Production': 'NOT_YET_RELEASED', Planned: 'NOT_YET_RELEASED', Rumored: 'NOT_YET_RELEASED', Pilot: 'NOT_YET_RELEASED',
};
/** Genres TMDB (fr-FR) : les listes ne donnent que les identifiants. */
const GENRES: Record<number, string> = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime', 99: 'Documentaire', 18: 'Drame', 10751: 'Familial',
  14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique', 9648: 'Mystère', 10749: 'Romance', 878: 'Science-Fiction',
  10770: 'Téléfilm', 53: 'Thriller', 10752: 'Guerre', 37: 'Western', 10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Science-Fiction & Fantastique', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};
/** Animation japonaise : rangée dans la catégorie Anime (AniList), pas dans Films / Séries. */
export const estAnimeJaponais = (r: Pick<RawResult, 'original_language' | 'genre_ids'>) => r.original_language === 'ja' && !!r.genre_ids?.includes(16);
const annee = (d?: string) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

/** Résultat TMDB → copie locale, au même format que les titres AniList. */
export function toSnapshot(r: RawResult & Partial<RawMovie & RawTv>, type: TmdbType, now = Date.now()): MediaSnapshot {
  const film = type === 'MOVIE';
  const saisons = (r.seasons ?? []).filter(s => s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number).map(s => ({ number: s.season_number, episodes: s.episode_count }));
  const total = film ? 1 : saisons.length ? saisons.reduce((n, s) => n + s.episodes, 0) : r.number_of_episodes ?? null;
  // Prochain épisode : numéro cumulé (comme AniList) pour réutiliser calendrier et « épisodes en retard ».
  const next = !film && r.next_episode_to_air?.air_date ? r.next_episode_to_air : null;
  let cumul: number | null = null;
  if (next) cumul = saisons.filter(s => s.number < next.season_number).reduce((n, s) => n + s.episodes, 0) + next.episode_number;
  const date = film ? r.release_date : r.first_air_date;
  return {
    id: r.id,
    type,
    title: { romaji: null, english: (film ? r.title : r.name) || null, native: (film ? r.original_title : r.original_name) || null },
    cover: r.poster_path ? TMDB_IMG + r.poster_path : null,
    coverColor: null,
    format: type,
    status: r.status ? STATUTS[r.status] ?? r.status : null,
    episodes: total,
    duration: film ? r.runtime ?? null : r.episode_run_time?.[0] ?? r.last_episode_to_air?.runtime ?? null,
    chapters: null,
    volumes: null,
    genres: r.genres ? r.genres.map(g => g.name) : (r.genre_ids ?? []).map(id => GENRES[id]).filter((g): g is string => !!g),
    tags: [],
    season: null,
    seasonYear: null,
    startYear: annee(date),
    releaseDate: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    averageScore: r.vote_average ? Math.round(r.vote_average * 10) : null,
    nextAiring: next && cumul ? { episode: cumul, airingAt: Math.floor(Date.parse(next.air_date + 'T12:00:00Z') / 1000) } : null,
    siteUrl: `https://www.themoviedb.org/${chemin(type)}/${r.id}`,
    isAdult: !!r.adult,
    fetchedAt: now,
    ...(film ? {} : {
      seasons: saisons,
      nextEpisode: next ? { season: next.season_number, episode: next.episode_number, date: next.air_date! } : null,
    }),
  };
}

/** Plateformes d'un titre dans un pays (données JustWatch, via TMDB). */
export interface Plateforme { id: number; nom: string; logo: string | null }
export interface Disponibilite { lien: string | null; abonnement: Plateforme[]; gratuit: Plateforme[]; location: Plateforme[]; achat: Plateforme[] }
type RawFournisseur = { provider_id: number; provider_name: string; logo_path: string | null; display_priority?: number };
const LOGO = 'https://image.tmdb.org/t/p/w92';
const plateformes = (l?: RawFournisseur[]) => (l ?? []).sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
  .map(p => ({ id: p.provider_id, nom: p.provider_name, logo: p.logo_path ? LOGO + p.logo_path : null }));

export interface TmdbDetails {
  media: MediaSnapshot;
  description: string;
  recommendations: { rating: number; media: MediaSnapshot }[];
}

export class TmdbClient {
  readonly limiter = new RateLimiter(35, 10_000);
  private cache: CacheStore | null = null;
  constructor(private key = TMDB_API_KEY, private fetchImpl: typeof fetch = (...a) => fetch(...a), private now: () => number = () => Date.now()) {}

  setCache(cache: CacheStore | null) { this.cache = cache; }
  get disponible() { return !!this.key; }

  async request<T>(path: string, params: Record<string, string | number> = {}, signal?: AbortSignal): Promise<T> {
    if (!this.key) throw new ApiError('unavailable', 'clé TMDB absente');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline', 'hors-ligne');
    if (!(await this.limiter.acquire(signal, 4000).catch(() => { throw new ApiError('aborted', 'annulée'); }))) throw new ApiError('rate_limited', 'limite locale', this.limiter.waitTime());
    const q = new URLSearchParams({ api_key: this.key, language: 'fr-FR', ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    let res: Response;
    try {
      res = await this.fetchImpl(`${TMDB_URL}/${path}?${q}`, { signal, headers: { Accept: 'application/json' } });
    } catch (e) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) throw new ApiError('aborted', 'annulée');
      throw new ApiError('offline', 'réseau injoignable');
    }
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After')) || 10;
      this.limiter.block(retry * 1000);
      throw new ApiError('rate_limited', 'limite TMDB', retry * 1000);
    }
    if (res.status === 404) throw new ApiError('not_found', 'introuvable');
    if (res.status === 401) throw new ApiError('unavailable', 'clé TMDB refusée');
    if (res.status >= 500) throw new ApiError('unavailable', `HTTP ${res.status}`);
    if (!res.ok) throw new ApiError('http', `HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  /** Même stratégie que pour AniList : cache frais, sinon réseau, sinon ancien cache. */
  private async cached<T>(key: string, ttl: number, load: () => Promise<T>, force = false): Promise<Result<T>> {
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

  /** Recherche films + séries (les personnes sont ignorées). */
  search(text: string, page = 1, signal?: AbortSignal) {
    const q = text.trim().replace(/\s+/g, ' ');
    return this.cached(`tmdb:search:${page}:${q.toLowerCase()}`, TTL.search, async () => {
      const d = await this.request<{ results: RawResult[]; page: number; total_pages: number }>('search/multi', { query: q, page, include_adult: 'false' }, signal);
      const items = d.results
        .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && !r.adult)
        .map(r => toSnapshot(r, r.media_type === 'movie' ? 'MOVIE' : 'TV', this.now()));
      return { items, hasNext: d.page < d.total_pages };
    });
  }

  details(type: TmdbType, id: number, signal?: AbortSignal, force = false) {
    return this.cached<TmdbDetails>(`tmdb:${type}:${id}`, TTL.media, async () => {
      const r = await this.request<(RawMovie | RawTv) & { recommendations?: { results: RawResult[] } }>(`${chemin(type)}/${id}`, { append_to_response: 'recommendations' }, signal);
      return {
        media: toSnapshot(r as RawMovie & RawTv, type, this.now()),
        description: r.overview ?? '',
        recommendations: (r.recommendations?.results ?? []).filter(x => !x.adult).slice(0, 12)
          .map(x => ({ rating: Math.round((x.vote_average ?? 0) * 10), media: toSnapshot(x, type, this.now()) })),
      };
    }, force);
  }

  /** Où regarder, pays par pays (seuls les pays proposés par l'app sont gardés). */
  disponibilites(type: TmdbType, id: number, pays: readonly string[], signal?: AbortSignal) {
    return this.cached<Record<string, Disponibilite>>(`tmdb:dispo:${type}:${id}`, TTL.media, async () => {
      const d = await this.request<{ results: Record<string, { link?: string; flatrate?: RawFournisseur[]; free?: RawFournisseur[]; ads?: RawFournisseur[]; rent?: RawFournisseur[]; buy?: RawFournisseur[] }> }>(`${chemin(type)}/${id}/watch/providers`, {}, signal);
      const out: Record<string, Disponibilite> = {};
      for (const p of pays) {
        const r = d.results?.[p];
        if (!r) continue;
        out[p] = { lien: r.link ?? null, abonnement: plateformes(r.flatrate), gratuit: plateformes([...(r.free ?? []), ...(r.ads ?? [])]), location: plateformes(r.rent), achat: plateformes(r.buy) };
      }
      return out;
    });
  }

  /**
   * Retrouve un anime AniList dans TMDB (où sont les disponibilités par pays), par score :
   * titre japonais identique, titre proche, même année (à un an près), popularité. Rien si aucun titre ne colle.
   * Les saisons 2, 3… d'AniList tombent sur la série TMDB (qui regroupe toutes les saisons).
   */
  trouverAnime(m: Pick<MediaSnapshot, 'id' | 'format' | 'title' | 'startYear'>, signal?: AbortSignal) {
    const film = m.format === 'MOVIE';
    const norm = (t: string | null | undefined) => (t ?? '').normalize('NFKC').toLowerCase().replace(/[\s:：!！?？.,'’\-–—]+/g, '');
    const natif = norm(m.title.native);
    const autres = [m.title.english, m.title.romaji].map(norm).filter(Boolean);
    const score = (r: RawResult) => {
      const noms = [film ? r.title : r.name, film ? r.original_title : r.original_name].map(norm).filter(Boolean);
      let s = 0;
      if (natif && noms.includes(natif)) s += 10;
      else if (natif && noms.some(n => natif.startsWith(n) || n.startsWith(natif))) s += 5;
      if (noms.some(n => autres.includes(n))) s += 6;
      else if (noms.some(n => autres.some(a => a.startsWith(n) || n.startsWith(a)))) s += 3;
      const an = annee(film ? r.release_date : r.first_air_date);
      if (m.startYear && an && Math.abs(an - m.startYear) <= 1) s += 3;
      return s + Math.min(2, Math.log10(1 + (r.popularity ?? 0)));
    };
    return this.cached<{ id: number; nom: string } | null>(`tmdb:anime:v2:${m.id}`, 7 * TTL.media, async () => {
      const requetes = [...new Set([m.title.native, m.title.english, m.title.romaji].filter((t): t is string => !!t))];
      let meilleur: { r: RawResult; s: number } | null = null;
      for (const q of requetes) {
        const d = await this.request<{ results: RawResult[] }>(`search/${film ? 'movie' : 'tv'}`, { query: q, include_adult: 'false' }, signal);
        for (const r of d.results.filter(estAnimeJaponais)) {
          const s = score(r);
          if (!meilleur || s > meilleur.s) meilleur = { r, s };
        }
        if (meilleur && meilleur.s >= 13) break; // titre japonais exact + année : inutile de chercher plus
      }
      if (!meilleur || meilleur.s < 5) return null;
      return { id: meilleur.r.id, nom: (film ? meilleur.r.title : meilleur.r.name) ?? '' };
    });
  }

  trending(type: TmdbType, signal?: AbortSignal) {
    return this.liste(type, `trending/${chemin(type)}/week`, {}, signal);
  }

  /** Liste TMDB (à l'affiche, découverte par pays / langue…), sans contenu adulte ni anime japonais. */
  liste(type: TmdbType, route: string, params: Record<string, string | number> = {}, signal?: AbortSignal) {
    const cle = `tmdb:liste:${type}:${route}:${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`;
    return this.cached(cle, TTL.trending, async () => {
      const d = await this.request<{ results: RawResult[] }>(route, params, signal);
      return d.results.filter(r => !r.adult && !estAnimeJaponais(r)).map(r => toSnapshot(r, type, this.now()));
    });
  }
}

export const tmdb = new TmdbClient();
