import { anilist, ApiError, errorMessage as erreurAniList } from '../api/anilist';
import { tmdb } from '../api/tmdb';
import type { MediaSnapshot, MediaType } from '../domain/types';

/** Une fiche, quelle que soit la source (TMDB pour films / séries, AniList pour anime / manga). */
export interface Fiche {
  media: MediaSnapshot;
  description: string;
  recommendations: { rating: number; media: MediaSnapshot }[];
}

export function details(type: MediaType, id: number, signal?: AbortSignal, force = false) {
  if (type === 'MOVIE' || type === 'TV') return tmdb.details(type, id, signal, force);
  return anilist.details(id, signal, force);
}

export async function rechercher(type: MediaType, q: string, signal?: AbortSignal): Promise<{ items: MediaSnapshot[]; stale: boolean }> {
  if (type === 'MOVIE' || type === 'TV') {
    const r = await tmdb.search(q, 1, signal);
    return { items: r.data.items.filter(m => m.type === type), stale: r.stale };
  }
  const r = await anilist.search(type, q, 1, signal);
  return { items: r.data.items, stale: r.stale };
}

/** Recherche dans toutes les catégories : TMDB (films + séries) et AniList (anime + manga) en parallèle. */
export async function rechercherTout(q: string, signal?: AbortSignal) {
  const [t, a, m] = await Promise.allSettled([tmdb.search(q, 1, signal), anilist.search('ANIME', q, 1, signal), anilist.search('MANGA', q, 1, signal)]);
  const items: MediaSnapshot[] = [];
  const erreurs: string[] = [];
  for (const r of [t, a, m]) {
    if (r.status === 'fulfilled') items.push(...r.value.data.items);
    else if (!(r.reason instanceof ApiError && r.reason.kind === 'aborted')) erreurs.push(messageErreur(r.reason));
    else throw r.reason;
  }
  return { items, erreurs: [...new Set(erreurs)] };
}

export function tendances(type: MediaType, signal?: AbortSignal) {
  if (type === 'MOVIE' || type === 'TV') return tmdb.trending(type, signal);
  return anilist.trending(type, signal);
}

/** Message lisible, avec la bonne source nommée. */
export function messageErreur(e: unknown): string {
  if (e instanceof ApiError && /TMDB/i.test(e.message)) {
    if (e.kind === 'rate_limited') return 'Trop de requêtes vers TMDB, réessaie dans quelques secondes.';
    if (e.kind === 'unavailable') return 'TMDB est indisponible pour le moment.';
  }
  return erreurAniList(e).replace('la recherche AniList', 'la recherche');
}
