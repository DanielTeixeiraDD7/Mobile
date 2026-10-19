import type { APDB } from '../data/db';
import type { CacheStore } from './anilist';

export const CACHE_MAX = 300;

/** Cache des réponses AniList dans IndexedDB, borné à CACHE_MAX entrées (les plus anciennes partent). */
export function idbCache(db: APDB, max = CACHE_MAX): CacheStore {
  let writes = 0;
  return {
    async get(key) {
      const r = await db.get('cache', key);
      return r ? { data: r.data, at: r.at } : undefined;
    },
    async put(key, data, at) {
      await db.put('cache', { key, data, at });
      if (++writes % 20 === 0) await trimCache(db, max);
    },
  };
}

export async function trimCache(db: APDB, max = CACHE_MAX) {
  const count = await db.count('cache');
  if (count <= max) return;
  const tx = db.transaction('cache', 'readwrite');
  let cursor = await tx.store.index('at').openCursor();
  let n = count - max;
  while (cursor && n-- > 0) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function clearCache(db: APDB) {
  await db.clear('cache');
}
