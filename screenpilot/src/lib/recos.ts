import { ApiError } from '@/api/anilist';
import * as store from '@/data/store';
import { recommend, seeds, type Candidate, type Recommendation } from '@/domain/recommend';
import type { MediaType } from '@/domain/types';
import { details, messageErreur, tendances } from './sources';

export interface Recos { items: Recommendation[]; partiel: boolean; erreur: string | null }

/**
 * Candidats = recommandations de la source (TMDB ou AniList) pour tes titres aimés (≤ 5 requêtes, en cache)
 * + tendances de la semaine. Le classement est calculé localement.
 */
export async function chargerRecos(type: MediaType, signal?: AbortSignal): Promise<Recos> {
  const { entries, settings } = store.getState();
  const candidats: Candidate[] = [];
  let echecs = 0;
  let derniere: unknown = null;
  for (const graine of seeds(entries, type)) {
    try {
      const r = await details(type, graine.mediaId, signal);
      for (const rec of r.data.recommendations) candidats.push({ media: rec.media, from: graine, rating: rec.rating });
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'aborted') throw e;
      echecs++; derniere = e;
    }
  }
  try {
    const t = await tendances(type, signal);
    for (const m of t.data) candidats.push({ media: m, trending: true });
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'aborted') throw e;
    echecs++; derniere = e;
  }
  if (!candidats.length && derniere) return { items: [], partiel: false, erreur: messageErreur(derniere) };
  return { items: recommend(entries, candidats, type, settings.titleLanguage, 12), partiel: echecs > 0, erreur: null };
}
