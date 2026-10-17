import { useEffect, useState } from 'react';
import { anilist, ApiError, errorMessage } from '../api/anilist';
import type { MediaSnapshot, MediaType } from '../domain/types';

export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_MIN_CHARS = 2;

export interface SearchState {
  status: 'idle' | 'loading' | 'done' | 'error';
  items: MediaSnapshot[];
  stale: boolean;
  error: string | null;
}

/** Recherche AniList avec anti-rebond et annulation de la requête précédente. */
export function useSearch(type: MediaType, text: string): SearchState {
  const [state, setState] = useState<SearchState>({ status: 'idle', items: [], stale: false, error: null });
  const q = text.trim();

  useEffect(() => {
    if (q.length < SEARCH_MIN_CHARS) {
      setState({ status: 'idle', items: [], stale: false, error: null });
      return;
    }
    const ac = new AbortController();
    setState(s => ({ ...s, status: 'loading', error: null }));
    const t = setTimeout(() => {
      anilist.search(type, q, 1, ac.signal)
        .then(r => { if (!ac.signal.aborted) setState({ status: 'done', items: r.data.items, stale: r.stale, error: null }); })
        .catch(e => {
          if (ac.signal.aborted || (e instanceof ApiError && e.kind === 'aborted')) return;
          setState({ status: 'error', items: [], stale: false, error: errorMessage(e) });
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => { clearTimeout(t); ac.abort(); };
  }, [type, q]);

  return state;
}
