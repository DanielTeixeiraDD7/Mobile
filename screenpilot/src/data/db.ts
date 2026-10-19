import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { HistoryEvent, LibraryEntry, Settings } from '../domain/types';

export const DB_VERSION = 1;

export interface CacheRecord {
  key: string;
  data: unknown;
  at: number;
}

export interface APSchema extends DBSchema {
  entries: { key: string; value: LibraryEntry; indexes: { type: string; updatedAt: number } };
  history: { key: string; value: HistoryEvent; indexes: { entryId: string; at: number } };
  settings: { key: string; value: Settings & { key: 'settings' } };
  cache: { key: string; value: CacheRecord; indexes: { at: number } };
}

export type APDB = IDBPDatabase<APSchema>;

/** Ouvre la base ; chaque nouvelle version ajoute un bloc `if (oldVersion < n)`. */
export function openDatabase(name = 'animepilot'): Promise<APDB> {
  return openDB<APSchema>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const entries = db.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('type', 'type');
        entries.createIndex('updatedAt', 'updatedAt');
        const history = db.createObjectStore('history', { keyPath: 'id' });
        history.createIndex('entryId', 'entryId');
        history.createIndex('at', 'at');
        db.createObjectStore('settings', { keyPath: 'key' });
        const cache = db.createObjectStore('cache', { keyPath: 'key' });
        cache.createIndex('at', 'at');
      }
    },
  });
}
