import { anilist } from '../api/anilist';
import { tmdb } from '../api/tmdb';
import * as store from './store';

export const REFRESH_AFTER_MS = 6 * 3600_000;
let running = false;

/**
 * Met à jour les infos des titres suivis dont la copie date de plus de 6 h :
 * AniList par lots de 50, TMDB titre par titre (séries pas encore terminées surtout).
 */
export async function refreshLibrary(force = false, now = Date.now()) {
  if (running) return { updated: 0 };
  running = true;
  try {
    const due = store.getState().entries.filter(e => force || now - e.media.fetchedAt > REFRESH_AFTER_MS);
    let updated = 0;
    const al = due.filter(e => e.source === 'anilist');
    if (al.length) {
      const fresh = await anilist.batch(al.map(e => e.mediaId));
      for (const m of fresh) {
        const e = al.find(d => d.mediaId === m.id && d.type === m.type);
        if (e) { await store.updateFields(e.id, { media: m }); updated++; }
      }
    }
    // TMDB : les séries en cours / à regarder d'abord (nouveaux épisodes), 25 au plus par passage.
    const tm = due.filter(e => e.source === 'tmdb' && (e.type === 'TV' ? e.status !== 'COMPLETED' || e.media.status !== 'FINISHED' : now - e.media.fetchedAt > 30 * 86_400_000))
      .sort((a, b) => Number(b.type === 'TV') - Number(a.type === 'TV') || a.media.fetchedAt - b.media.fetchedAt).slice(0, 25);
    for (const e of tm) {
      try {
        const r = await tmdb.details(e.type as 'MOVIE' | 'TV', e.mediaId, undefined, true);
        await store.updateFields(e.id, { media: r.data.media });
        updated++;
      } catch { /* hors-ligne ou titre retiré : on garde la copie actuelle */ }
    }
    return { updated };
  } finally {
    running = false;
  }
}
