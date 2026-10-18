import { useCallback, useEffect, useRef, useState } from 'react';
import { errorText, isAbort } from '../core/errors';
import type { Fetched } from '../core/model';

export interface Resource<T> {
  data: T | null;
  fetchedAt: number | null;
  stale: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Dernières valeurs en mémoire : retour instantané sur un écran déjà vu. */
const memory = new Map<string, Fetched<unknown>>();
export const clearMemory = () => memory.clear();

/**
 * Charge une ressource (adaptateur) : affiche d'abord la dernière valeur connue,
 * annule au démontage, actualise périodiquement seulement quand l'app est visible.
 */
export function useResource<T>(
  key: string | null,
  load: (o: { signal: AbortSignal; force: boolean }) => Promise<Fetched<T>>,
  refreshMs?: number | ((data: T | null) => number | undefined),
): Resource<T> {
  const cached = key ? (memory.get(key) as Fetched<T> | undefined) : undefined;
  const [state, setState] = useState<Omit<Resource<T>, 'refresh'>>({
    data: cached?.data ?? null, fetchedAt: cached?.fetchedAt ?? null, stale: cached?.stale ?? false, loading: !!key, error: null,
  });
  const [tick, setTick] = useState(0);
  const force = useRef(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!key) return;
    const ac = new AbortController();
    const f = force.current;
    force.current = false;
    setState(s => ({ ...s, loading: true, error: null, ...(memory.has(key) && s.data === null ? { data: (memory.get(key) as Fetched<T>).data } : {}) }));
    loadRef.current({ signal: ac.signal, force: f })
      .then(r => {
        if (ac.signal.aborted) return;
        memory.set(key, r);
        setState({ data: r.data, fetchedAt: r.fetchedAt, stale: r.stale, loading: false, error: null });
      })
      .catch(e => {
        if (ac.signal.aborted || isAbort(e)) return;
        setState(s => ({ ...s, loading: false, error: errorText(e) }));
      });
    return () => ac.abort();
  }, [key, tick]);

  // Actualisation périodique (en pause quand l'app est en arrière-plan).
  const interval = typeof refreshMs === 'function' ? refreshMs(state.data) : refreshMs;
  useEffect(() => {
    if (!key || !interval) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') setTick(x => x + 1); }, interval);
    return () => clearInterval(t);
  }, [key, interval]);

  const refresh = useCallback(() => { force.current = true; setTick(x => x + 1); }, []);
  return { ...state, refresh };
}
