import { ApiError } from '@/api/anilist';
import * as store from '@/data/store';
import { recommend, seeds, type Candidate, type Recommendation } from '@/domain/recommend';
import type { MediaType } from '@/domain/types';
import { details, messageErreur } from './sources';
import { paysDe, rangees } from './catalogue';
import { pasSorti } from '@/domain/sortie';

export interface Recos { items: Recommendation[]; partiel: boolean; erreur: string | null }

/**
 * Candidats = recommandations de la source (TMDB ou AniList) pour tes titres aimés (≤ 5 requêtes, en cache)
 * + listes de ton pays et tendances. Classement local selon tes goûts ; sans historique, selon la popularité.
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
  // Listes du pays (sorties, cinéma local, cinéma du monde) + tendances : utiles même sans historique.
  const listes = rangees(type, paysDe(settings)).filter(r => r.id !== 'classiques' && !r.aVenir);
  const resultats = await Promise.allSettled(listes.map(r => r.charger(signal)));
  resultats.forEach((r, i) => {
    if (r.status === 'fulfilled') for (const m of r.value.data) candidats.push({ media: m, trending: true, raison: listes[i]!.titre });
    else if (r.reason instanceof ApiError && r.reason.kind === 'aborted') throw r.reason;
    else { echecs++; derniere = r.reason; }
  });
  if (!candidats.length && derniere) return { items: [], partiel: false, erreur: messageErreur(derniere) };
  // Recommander un titre pas encore sorti prête à confusion : il reste dans « Prochainement ».
  return { items: recommend(entries, candidats.filter(c => !pasSorti(c.media)), type, settings.titleLanguage, 12), partiel: echecs > 0, erreur: null };
}
