import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CacheStore } from '../core/http';
import type { Match } from '../core/model';

export interface Favorite {
  id: string; // identifiant global de l'entité (équipe, joueur, compétition, jeu)
  kind: 'team' | 'player' | 'competition' | 'game';
  game: string;
  name: string;
  image: string | null;
  addedAt: number;
  /** Écran à ouvrir (hash), pour les entités sans fiche propre (joueurs). */
  link?: string;
}

export interface Viewed {
  id: string; // id du match
  at: number;
  match: Match;
}

/** Résultat ajouté à la main ou importé (toujours marqué comme tel). */
export interface ManualMatch {
  id: string;
  match: Match;
  importedAt: number;
  origin: string; // nom du fichier ou « saisie manuelle »
}

export interface SavedView {
  id: string;
  name: string;
  filters: MatchFilters;
}

export interface MatchFilters {
  games: string[];
  status: 'all' | 'live' | 'upcoming' | 'finished';
  text: string;
  competition: string | null;
  favoritesOnly: boolean;
  days: number; // fenêtre autour d'aujourd'hui
}

export const SECTIONS = ['live', 'favorites', 'upcoming', 'results'] as const;
export type Section = (typeof SECTIONS)[number];

export interface Settings {
  games: string[]; // jeux affichés, dans l'ordre
  sections: Section[];
  followed: Record<string, string[]>; // compétitions suivies par jeu (slugs/ids de source)
  theme: 'dark' | 'light';
  notify: boolean;
  reminderMinutes: number;
  hideSpoilers: boolean;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  games: ['lol', 'dota2', 'valorant'],
  sections: [...SECTIONS],
  followed: {},
  theme: 'dark',
  notify: false,
  reminderMinutes: 10,
  hideSpoilers: false,
  onboarded: false,
};

interface Schema extends DBSchema {
  cache: { key: string; value: { key: string; data: unknown; at: number }; indexes: { at: number } };
  favorites: { key: string; value: Favorite };
  viewed: { key: string; value: Viewed; indexes: { at: number } };
  manual: { key: string; value: ManualMatch };
  views: { key: string; value: SavedView };
  settings: { key: string; value: Settings & { key: 'settings' } };
}

export type EDB = IDBPDatabase<Schema>;
export const DB_VERSION = 1;

export function openDatabase(name = 'esport-companion'): Promise<EDB> {
  return openDB<Schema>(name, DB_VERSION, {
    upgrade(db, old) {
      if (old < 1) {
        db.createObjectStore('cache', { keyPath: 'key' }).createIndex('at', 'at');
        db.createObjectStore('favorites', { keyPath: 'id' });
        db.createObjectStore('viewed', { keyPath: 'id' }).createIndex('at', 'at');
        db.createObjectStore('manual', { keyPath: 'id' });
        db.createObjectStore('views', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

export const CACHE_MAX = 600;

/** Cache HTTP persistant ; les entrées les plus anciennes partent au-delà de CACHE_MAX. */
export function idbCache(db: EDB, max = CACHE_MAX): CacheStore {
  let writes = 0;
  return {
    async get(key) {
      const r = await db.get('cache', key);
      return r ? { data: r.data, at: r.at } : undefined;
    },
    async put(key, data, at) {
      await db.put('cache', { key, data, at });
      if (++writes % 25 === 0) await trimCache(db, max);
    },
  };
}

export async function trimCache(db: EDB, max = CACHE_MAX) {
  const n = await db.count('cache');
  if (n <= max) return;
  const tx = db.transaction('cache', 'readwrite');
  let c = await tx.store.index('at').openCursor();
  let k = n - max;
  while (c && k-- > 0) { await c.delete(); c = await c.continue(); }
  await tx.done;
}

export async function cacheInfo(db: EDB) {
  const n = await db.count('cache');
  let bytes = 0;
  let oldest: number | null = null;
  let c = await db.transaction('cache').store.openCursor();
  while (c) {
    bytes += JSON.stringify(c.value.data).length;
    oldest = oldest === null ? c.value.at : Math.min(oldest, c.value.at);
    c = await c.continue();
  }
  return { entries: n, bytes, oldest };
}
