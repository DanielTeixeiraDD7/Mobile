import type { Fetched, Match } from '../core/model';
import { errorText, isAbort } from '../core/errors';
import { dedupeMatches } from '../core/quality';
import { adapterOf } from '../games/registry';
import { getState } from './store';

export interface GameFeedStatus {
  game: string;
  ok: boolean;
  error: string | null;
  fetchedAt: number | null;
  stale: boolean;
  count: number;
}

/** Derniers matchs chargés (tous jeux) : pour retrouver horaire et phase depuis une fiche. */
const known = new Map<string, Match>();
export const knownMatch = (id: string) => known.get(id) ?? null;
export const knownMatches = () => [...known.values()];
export function remember(list: Match[]) { for (const m of list) known.set(m.id, m); }

export interface Feed {
  matches: Match[];
  status: GameFeedStatus[];
}

/**
 * Matchs de tous les jeux sélectionnés + résultats importés. Chaque jeu est isolé :
 * une source en panne n'empêche pas les autres de s'afficher.
 */
export async function loadFeed(games: string[], o: { signal: AbortSignal; force: boolean }): Promise<Fetched<Feed>> {
  const results = await Promise.allSettled(games.map(async g => {
    const a = adapterOf(g);
    if (!a) return { game: g, matches: [] as Match[], fetchedAt: null as number | null, stale: false, none: true };
    const [m, l] = await Promise.all([a.matches(o), a.live ? a.live(o).catch(e => { if (isAbort(e)) throw e; return null; }) : Promise.resolve(null)]);
    const live = new Map((l?.data ?? []).map(x => [x.id, x]));
    const merged = m.data.map(x => (live.has(x.id) ? { ...x, ...live.get(x.id)!, startTime: x.startTime ?? live.get(x.id)!.startTime } : x));
    for (const x of live.values()) if (!merged.some(y => y.id === x.id)) merged.push(x);
    return { game: g, matches: merged, fetchedAt: m.fetchedAt, stale: m.stale, none: false };
  }));
  if (o.signal.aborted) throw new DOMException('aborted', 'AbortError');
  const status: GameFeedStatus[] = [];
  const all: Match[] = [];
  results.forEach((r, i) => {
    const game = games[i]!;
    if (r.status === 'fulfilled') {
      all.push(...r.value.matches);
      status.push({ game, ok: !r.value.none, error: r.value.none ? null : null, fetchedAt: r.value.fetchedAt, stale: r.value.stale, count: r.value.matches.length });
    } else {
      if (isAbort(r.reason)) throw r.reason;
      status.push({ game, ok: false, error: errorText(r.reason), fetchedAt: null, stale: false, count: 0 });
    }
  });
  // Résultats importés : jeux affichés + jeux sans source (CS2, RL…), visibles seulement via l'import.
  const manual = getState().manual.filter(m => games.includes(m.match.game) || !adapterOf(m.match.game)).map(m => m.match);
  const { matches } = dedupeMatches([...all, ...manual]);
  remember(matches);
  const fetched = status.map(s => s.fetchedAt).filter((x): x is number => x !== null);
  return { data: { matches, status }, fetchedAt: fetched.length ? Math.min(...fetched) : Date.now(), stale: status.some(s => s.stale) };
}

export const liveRefresh = (f: Feed | null) => (f?.matches.some(m => m.status === 'live') ? 60_000 : 5 * 60_000);
