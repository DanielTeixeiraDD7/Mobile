import { useSyncExternalStore } from 'react';
import type { MediaType } from './domain/types';

export type Tab = 'home' | 'anime' | 'manga' | 'calendar' | 'profile';
export const TABS: Tab[] = ['home', 'anime', 'manga', 'calendar', 'profile'];

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'media'; type: MediaType; id: number }
  | { name: 'search'; type: MediaType }
  | { name: 'data' }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [a, b, c] = parts;
  if (a === 'media' && (b === 'ANIME' || b === 'MANGA') && c && /^\d+$/.test(c)) return { name: 'media', type: b, id: Number(c) };
  if (a === 'search' && (b === 'ANIME' || b === 'MANGA')) return { name: 'search', type: b };
  if (a === 'data') return { name: 'data' };
  if (a === 'settings') return { name: 'settings' };
  if (a && (TABS as string[]).includes(a)) return { name: 'tab', tab: a as Tab };
  return { name: 'tab', tab: 'home' };
}

export function routeHash(r: Route): string {
  switch (r.name) {
    case 'tab': return `#/${r.tab}`;
    case 'media': return `#/media/${r.type}/${r.id}`;
    case 'search': return `#/search/${r.type}`;
    default: return `#/${r.name}`;
  }
}

/** Onglet actif pour une route (les écrans secondaires restent rattachés à un onglet). */
export function tabOf(r: Route): Tab {
  if (r.name === 'tab') return r.tab;
  if (r.name === 'media' || r.name === 'search') return r.type === 'ANIME' ? 'anime' : 'manga';
  return 'profile';
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  return parseRoute(hash);
}

// Nombre d'écrans empilés dans cette session, pour savoir si « retour » peut utiliser l'historique.
let depth = 0;

export function navigate(r: Route, replace = false) {
  const h = routeHash(r);
  if (replace) {
    history.replaceState(null, '', h);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    depth++;
    location.hash = h;
  }
  window.scrollTo(0, 0);
}

export function goBack(fallback: Route) {
  if (depth > 0) {
    depth--;
    history.back();
  } else navigate(fallback, true);
}
