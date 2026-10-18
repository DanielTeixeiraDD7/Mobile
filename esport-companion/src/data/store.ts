import { useSyncExternalStore } from 'react';
import { http } from '../core/http';
import type { Match } from '../core/model';
import { setPrefs } from '../core/prefs';
import { DEFAULT_SETTINGS, idbCache, openDatabase, type EDB, type Favorite, type ManualMatch, type SavedView, type Settings, type Viewed } from './db';

export interface State {
  ready: boolean;
  error: string | null;
  settings: Settings;
  favorites: Favorite[];
  viewed: Viewed[];
  manual: ManualMatch[];
  views: SavedView[];
}

const initial: State = { ready: false, error: null, settings: DEFAULT_SETTINGS, favorites: [], viewed: [], manual: [], views: [] };
let state = initial;
let db: EDB | null = null;
const listeners = new Set<() => void>();

function set(p: Partial<State>) {
  state = { ...state, ...p };
  if (p.settings) setPrefs({ followed: state.settings.followed });
  listeners.forEach(l => l());
}

export const getState = () => state;
export const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
export const useStore = <T,>(sel: (s: State) => T): T => useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
export function getDb() {
  if (!db) throw new Error('Base non initialisée');
  return db;
}

export const VIEWED_MAX = 60;

export async function init(name?: string) {
  try {
    db = await openDatabase(name);
    http.setCache(idbCache(db));
    const [s, favorites, viewed, manual, views] = await Promise.all([
      db.get('settings', 'settings'), db.getAll('favorites'), db.getAllFromIndex('viewed', 'at'), db.getAll('manual'), db.getAll('views'),
    ]);
    const { key: _k, ...rest } = s ?? { key: 'settings' as const, ...DEFAULT_SETTINGS };
    set({ ready: true, error: null, settings: { ...DEFAULT_SETTINGS, ...rest }, favorites, viewed: viewed.reverse(), manual, views });
  } catch (e) {
    set({ ready: true, error: 'Stockage local indisponible (navigation privée ?) : rien ne sera conservé. ' + (e instanceof Error ? e.message : '') });
  }
}

export function reset() {
  db?.close();
  db = null;
  http.setCache(null);
  state = initial;
}

export async function updateSettings(p: Partial<Settings>) {
  const settings = { ...state.settings, ...p };
  set({ settings });
  await db?.put('settings', { ...settings, key: 'settings' });
}

export const isFavorite = (id: string) => state.favorites.some(f => f.id === id);

export async function toggleFavorite(f: Omit<Favorite, 'addedAt'>) {
  if (isFavorite(f.id)) {
    set({ favorites: state.favorites.filter(x => x.id !== f.id) });
    await db?.delete('favorites', f.id);
    return false;
  }
  const fav = { ...f, addedAt: Date.now() };
  set({ favorites: [...state.favorites, fav] });
  await db?.put('favorites', fav);
  return true;
}

export async function markViewed(match: Match) {
  const v: Viewed = { id: match.id, at: Date.now(), match };
  const viewed = [v, ...state.viewed.filter(x => x.id !== match.id)].slice(0, VIEWED_MAX);
  set({ viewed });
  if (!db) return;
  await db.put('viewed', v);
  const extra = state.viewed.length >= VIEWED_MAX ? await db.getAllKeysFromIndex('viewed', 'at') : [];
  for (const k of extra.slice(0, Math.max(0, extra.length - VIEWED_MAX))) await db.delete('viewed', k);
}

export async function saveManual(list: ManualMatch[]) {
  const ids = new Set(list.map(m => m.id));
  set({ manual: [...state.manual.filter(m => !ids.has(m.id)), ...list] });
  if (!db) return;
  const tx = db.transaction('manual', 'readwrite');
  for (const m of list) await tx.store.put(m);
  await tx.done;
}

export async function deleteManual(id: string) {
  set({ manual: state.manual.filter(m => m.id !== id) });
  await db?.delete('manual', id);
}

export async function saveView(v: SavedView) {
  set({ views: [...state.views.filter(x => x.id !== v.id), v] });
  await db?.put('views', v);
}

export async function deleteView(id: string) {
  set({ views: state.views.filter(x => x.id !== id) });
  await db?.delete('views', id);
}

/** Restauration complète (import d'une sauvegarde en mode remplacement). */
export async function restore(p: { settings?: Settings; favorites: Favorite[]; manual: ManualMatch[]; views: SavedView[] }) {
  const d = getDb();
  const tx = d.transaction(['favorites', 'manual', 'views', 'settings'], 'readwrite');
  await tx.objectStore('favorites').clear();
  await tx.objectStore('manual').clear();
  await tx.objectStore('views').clear();
  for (const f of p.favorites) await tx.objectStore('favorites').put(f);
  for (const m of p.manual) await tx.objectStore('manual').put(m);
  for (const v of p.views) await tx.objectStore('views').put(v);
  const settings = { ...state.settings, ...(p.settings ?? {}), onboarded: true };
  await tx.objectStore('settings').put({ ...settings, key: 'settings' });
  await tx.done;
  set({ favorites: p.favorites, manual: p.manual, views: p.views, settings });
}

export async function clearCache() {
  await db?.clear('cache');
}
