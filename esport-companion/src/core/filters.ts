import type { Match } from './model';
import type { Favorite, MatchFilters } from '../data/db';

export const DEFAULT_FILTERS: MatchFilters = { games: [], status: 'all', text: '', competition: null, favoritesOnly: false, days: 7 };

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function involvesFavorite(m: Match, favs: Favorite[]): boolean {
  const ids = new Set(favs.map(f => f.id));
  return m.sides.some(s => s.team && ids.has(s.team.id)) || (!!m.competition && ids.has(m.competition.id));
}

export function filterMatches(list: Match[], f: MatchFilters, favs: Favorite[], now = Date.now()): Match[] {
  const q = norm(f.text.trim());
  const span = f.days * 86_400_000;
  return list.filter(m => {
    if (f.games.length && !f.games.includes(m.game)) return false;
    if (f.status !== 'all' && m.status !== f.status) return false;
    if (f.competition && m.competition?.id !== f.competition) return false;
    if (f.favoritesOnly && !involvesFavorite(m, favs)) return false;
    if (m.status !== 'live' && m.startTime !== null && Math.abs(m.startTime - now) > span) return false;
    if (q && ![m.sides[0].team?.name, m.sides[1].team?.name, m.sides[0].team?.code, m.sides[1].team?.code, m.competition?.name, m.stage].some(x => norm(x).includes(q))) return false;
    return true;
  });
}

/** Tri : direct d'abord, puis à venir (plus proche d'abord), puis terminés (plus récent d'abord). */
export function sortMatches(list: Match[]): Match[] {
  const rank = (m: Match) => (m.status === 'live' ? 0 : m.status === 'upcoming' ? 1 : m.status === 'unknown' ? 2 : 3);
  return [...list].sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 ? (a.startTime ?? Infinity) - (b.startTime ?? Infinity) : (b.startTime ?? 0) - (a.startTime ?? 0)));
}

export interface Dashboard { live: Match[]; upcoming: Match[]; results: Match[]; favorites: Match[] }

export function dashboard(list: Match[], favs: Favorite[], now = Date.now()): Dashboard {
  const live = list.filter(m => m.status === 'live');
  const upcoming = list.filter(m => m.status === 'upcoming' && m.startTime !== null && m.startTime >= now - 3_600_000 && m.startTime - now < 3 * 86_400_000)
    .sort((a, b) => a.startTime! - b.startTime!);
  const results = list.filter(m => (m.status === 'finished' || m.status === 'unknown') && m.startTime !== null && now - m.startTime < 4 * 86_400_000)
    .sort((a, b) => b.startTime! - a.startTime!);
  const favorites = sortMatches(list.filter(m => involvesFavorite(m, favs) && (m.status === 'live' || (m.startTime !== null && Math.abs(m.startTime - now) < 7 * 86_400_000))));
  return { live, upcoming, results, favorites };
}

/** Regroupe par jour local. */
export function byDay(list: Match[]): { day: number; matches: Match[] }[] {
  const map = new Map<number, Match[]>();
  for (const m of list) {
    const d = m.startTime === null ? 0 : new Date(new Date(m.startTime).setHours(0, 0, 0, 0)).getTime();
    map.set(d, [...(map.get(d) ?? []), m]);
  }
  return [...map].map(([day, matches]) => ({ day, matches }));
}

/**
 * Colonnes d'un bracket à partir des liens « match précédent » publiés par la source.
 * Tour = 0 sans prédécesseur dans la section, sinon 1 + tour max des prédécesseurs.
 */
export function bracketRounds(list: Match[]): Match[][] | null {
  if (!list.some(m => m.previous?.length)) return null;
  const byId = new Map(list.map(m => [m.id, m]));
  const memo = new Map<string, number>();
  const round = (m: Match, seen = new Set<string>()): number => {
    if (memo.has(m.id)) return memo.get(m.id)!;
    if (seen.has(m.id)) return 0;
    seen.add(m.id);
    const prev = (m.previous ?? []).map(id => byId.get(id)).filter((x): x is Match => !!x);
    const r = prev.length ? 1 + Math.max(...prev.map(p => round(p, seen))) : 0;
    memo.set(m.id, r);
    return r;
  };
  const cols: Match[][] = [];
  for (const m of list) { const r = round(m); (cols[r] ??= []).push(m); }
  return cols.filter(Boolean);
}
