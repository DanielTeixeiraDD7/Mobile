import { useEffect, useState } from 'react';
import { anilist, ApiError, errorMessage, type MediaDetails } from '../api/anilist';
import * as store from '../data/store';
import { entryId, type MediaType } from '../domain/types';

export interface DetailsState {
  status: 'loading' | 'done' | 'error';
  data: MediaDetails | null;
  stale: boolean;
  error: string | null;
}

/** Fiche AniList ; met à jour au passage la copie locale si le titre est dans la bibliothèque. */
export function useDetails(type: MediaType, id: number): DetailsState {
  const [state, setState] = useState<DetailsState>({ status: 'loading', data: null, stale: false, error: null });
  useEffect(() => {
    const ac = new AbortController();
    setState({ status: 'loading', data: null, stale: false, error: null });
    anilist.details(id, ac.signal)
      .then(r => {
        if (ac.signal.aborted) return;
        setState({ status: 'done', data: r.data, stale: r.stale, error: null });
        const entry = store.findEntry(entryId(type, id));
        if (entry && !r.stale && r.data.media.fetchedAt > entry.media.fetchedAt) void store.updateFields(entry.id, { media: r.data.media });
      })
      .catch(e => {
        if (ac.signal.aborted || (e instanceof ApiError && e.kind === 'aborted')) return;
        setState({ status: 'error', data: null, stale: false, error: errorMessage(e) });
      });
    return () => ac.abort();
  }, [type, id]);
  return state;
}
