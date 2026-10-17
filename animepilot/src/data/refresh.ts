import { anilist } from '../api/anilist';
import * as store from './store';

export const REFRESH_AFTER_MS = 6 * 3600_000;
let running = false;

/**
 * Met à jour les infos AniList (épisodes sortis, prochain épisode, totaux) des titres
 * suivis dont la copie date de plus de 6 h. Une requête par lot de 50 titres.
 */
export async function refreshLibrary(force = false, now = Date.now()) {
  if (running) return { updated: 0 };
  running = true;
  try {
    const due = store.getState().entries.filter(e => force || now - e.media.fetchedAt > REFRESH_AFTER_MS);
    if (due.length === 0) return { updated: 0 };
    const fresh = await anilist.batch(due.map(e => e.mediaId));
    let updated = 0;
    for (const m of fresh) {
      const e = due.find(d => d.mediaId === m.id && d.type === m.type);
      if (e) { await store.updateFields(e.id, { media: m }); updated++; }
    }
    return { updated };
  } finally {
    running = false;
  }
}
