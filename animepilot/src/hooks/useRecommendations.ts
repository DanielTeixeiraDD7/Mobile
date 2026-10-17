import { useEffect, useState } from 'react';
import { anilist, ApiError, errorMessage } from '../api/anilist';
import { getState } from '../data/store';
import { recommend, seeds, type Candidate, type Recommendation } from '../domain/recommend';
import type { MediaType } from '../domain/types';

export interface RecState {
  status: 'idle' | 'loading' | 'done' | 'error';
  items: Recommendation[];
  partial: boolean;
  error: string | null;
}

/**
 * Candidats = recommandations AniList des titres que tu as aimés (≤ 5 requêtes, en cache 24 h)
 * + tendances du moment (1 requête, cache 12 h). Le classement est calculé localement.
 */
export function useRecommendations(type: MediaType, run: boolean, key = 0): RecState {
  const [state, setState] = useState<RecState>({ status: 'idle', items: [], partial: false, error: null });
  useEffect(() => {
    if (!run) return;
    const ac = new AbortController();
    setState(s => ({ ...s, status: 'loading', error: null }));
    (async () => {
      const { entries, settings } = getState();
      const candidates: Candidate[] = [];
      let failures = 0;
      let lastError: unknown = null;
      for (const seed of seeds(entries, type)) {
        try {
          const r = await anilist.details(seed.mediaId, ac.signal);
          for (const rec of r.data.recommendations) candidates.push({ media: rec.media, from: seed, rating: rec.rating });
        } catch (e) {
          if (e instanceof ApiError && e.kind === 'aborted') return;
          failures++; lastError = e;
        }
      }
      try {
        const t = await anilist.trending(type, ac.signal);
        for (const m of t.data) candidates.push({ media: m, trending: true });
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'aborted') return;
        failures++; lastError = e;
      }
      if (ac.signal.aborted) return;
      if (candidates.length === 0 && lastError) return setState({ status: 'error', items: [], partial: false, error: errorMessage(lastError) });
      setState({ status: 'done', items: recommend(entries, candidates, type, settings.titleLanguage, 12), partial: failures > 0, error: null });
    })();
    return () => ac.abort();
  }, [type, run, key]);
  return state;
}
