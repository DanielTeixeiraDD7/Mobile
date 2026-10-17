import { useEffect, useMemo, useState } from 'react';
import { anilist, ApiError, errorMessage, type AiringItem } from '../api/anilist';
import { useStore } from '../data/store';
import { followedForCalendar } from '../domain/calendar';
import type { LibraryEntry } from '../domain/types';

export interface AiringRow extends AiringItem {
  entry: LibraryEntry;
}

export interface AiringState {
  status: 'loading' | 'done' | 'error';
  rows: AiringRow[];
  /** 'api' = AniList ; 'cache' = réponse enregistrée ; 'local' = prochain épisode connu de la copie locale. */
  source: 'api' | 'cache' | 'local';
  error: string | null;
}

export const DAYS_BEFORE = 1;
export const DAYS_AFTER = 7;

export function useAiring(reloadKey = 0): AiringState {
  const entries = useStore(s => s.entries);
  const followed = useMemo(() => followedForCalendar(entries), [entries]);
  const idsKey = followed.map(e => e.mediaId).sort((a, b) => a - b).join(',');
  const [state, setState] = useState<AiringState>({ status: 'loading', rows: [], source: 'api', error: null });

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').map(Number) : [];
    const byId = new Map(followed.map(e => [e.mediaId, e]));
    const local = (): AiringRow[] => followed
      .filter(e => e.media.nextAiring)
      .map(e => ({ id: -e.mediaId, mediaId: e.mediaId, episode: e.media.nextAiring!.episode, airingAt: e.media.nextAiring!.airingAt, entry: e }));
    if (ids.length === 0) { setState({ status: 'done', rows: [], source: 'api', error: null }); return; }

    const ac = new AbortController();
    const now = Math.floor(Date.now() / 1000);
    // Fenêtre arrondie à l'heure pour profiter du cache.
    const from = Math.floor((now - DAYS_BEFORE * 86400) / 3600) * 3600;
    const to = from + (DAYS_BEFORE + DAYS_AFTER) * 86400 + 3600;
    setState(s => ({ ...s, status: 'loading' }));
    anilist.airing(ids, from, to, ac.signal, reloadKey > 0)
      .then(r => {
        if (ac.signal.aborted) return;
        const rows = r.data.filter(a => byId.has(a.mediaId)).map(a => ({ ...a, entry: byId.get(a.mediaId)! }));
        setState({ status: 'done', rows, source: r.stale ? 'cache' : 'api', error: null });
      })
      .catch(e => {
        if (ac.signal.aborted || (e instanceof ApiError && e.kind === 'aborted')) return;
        setState({ status: 'error', rows: local(), source: 'local', error: errorMessage(e) });
      });
    return () => ac.abort();
  }, [idsKey, reloadKey]);

  return state;
}
