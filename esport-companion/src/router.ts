import { useSyncExternalStore } from 'react';

export type Tab = 'home' | 'matches' | 'competitions' | 'favorites' | 'more';
export const TABS: Tab[] = ['home', 'matches', 'competitions', 'favorites', 'more'];

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'match'; id: string }
  | { name: 'competition'; id: string; tournament: string | null }
  | { name: 'team'; id: string }
  | { name: 'player'; id: string }
  | { name: 'game'; id: string }
  | { name: 'search' }
  | { name: 'sources' }
  | { name: 'settings' }
  | { name: 'data' };

const enc = encodeURIComponent;
const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export function parseRoute(hash: string): Route {
  const [a, b, c] = hash.replace(/^#\/?/, '').split('/');
  if (a === 'match' && b) return { name: 'match', id: dec(b) };
  if (a === 'competition' && b) return { name: 'competition', id: dec(b), tournament: c ? dec(c) : null };
  if (a === 'team' && b) return { name: 'team', id: dec(b) };
  if (a === 'player' && b) return { name: 'player', id: dec(b) };
  if (a === 'game' && b) return { name: 'game', id: dec(b) };
  if (a === 'search' || a === 'sources' || a === 'settings' || a === 'data') return { name: a };
  if (a && (TABS as string[]).includes(a)) return { name: 'tab', tab: a as Tab };
  return { name: 'tab', tab: 'home' };
}

export function routeHash(r: Route): string {
  switch (r.name) {
    case 'tab': return `#/${r.tab}`;
    case 'match': return `#/match/${enc(r.id)}`;
    case 'competition': return `#/competition/${enc(r.id)}${r.tournament ? '/' + enc(r.tournament) : ''}`;
    case 'team': return `#/team/${enc(r.id)}`;
    case 'player': return `#/player/${enc(r.id)}`;
    case 'game': return `#/game/${enc(r.id)}`;
    default: return `#/${r.name}`;
  }
}

export function tabOf(r: Route): Tab {
  if (r.name === 'tab') return r.tab;
  if (r.name === 'match') return 'matches';
  if (r.name === 'competition') return 'competitions';
  if (r.name === 'team' || r.name === 'player') return 'favorites';
  return 'more';
}

const sub = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); };
export const useRoute = () => parseRoute(useSyncExternalStore(sub, () => location.hash, () => ''));

let depth = 0;
export function navigate(r: Route, replace = false) {
  const h = routeHash(r);
  if (replace) { history.replaceState(null, '', h); window.dispatchEvent(new HashChangeEvent('hashchange')); }
  else { depth++; location.hash = h; }
  window.scrollTo(0, 0);
}
export function goBack(fallback: Route) {
  if (depth > 0) { depth--; history.back(); } else navigate(fallback, true);
}
