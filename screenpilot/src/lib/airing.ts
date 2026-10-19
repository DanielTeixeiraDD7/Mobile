import { anilist, ApiError, errorMessage, type AiringItem } from '../api/anilist';
import { followedForCalendar } from '../domain/calendar';
import type { LibraryEntry } from '../domain/types';

/** Une diffusion à venir (anime : planning AniList ; série : prochain épisode annoncé par TMDB). */
export interface AiringRow extends AiringItem {
  entry: LibraryEntry;
}

export const DAYS_BEFORE = 1;
export const DAYS_AFTER = 7;

export interface AiringState {
  status: 'loading' | 'done' | 'error';
  rows: AiringRow[];
  source: 'api' | 'cache' | 'local';
  error: string | null;
}

/** Séries suivies dont le prochain épisode est connu (TMDB). */
export function tvRows(entries: LibraryEntry[], nowSec = Date.now() / 1000): AiringRow[] {
  return entries
    .filter(e => e.type === 'TV' && ['CURRENT', 'PLANNING', 'PAUSED', 'REWATCH'].includes(e.status) && e.media.nextAiring)
    .filter(e => e.media.nextAiring!.airingAt > nowSec - DAYS_BEFORE * 86400 && e.media.nextAiring!.airingAt < nowSec + 30 * 86400)
    .map(e => ({ id: -e.mediaId, mediaId: e.mediaId, episode: e.media.nextAiring!.episode, airingAt: e.media.nextAiring!.airingAt, entry: e }));
}

/** Diffusions de la semaine : AniList pour les anime (avec repli local), TMDB pour les séries. */
export async function loadAiring(entries: LibraryEntry[], force = false, signal?: AbortSignal): Promise<AiringState> {
  const followed = followedForCalendar(entries);
  const byId = new Map(followed.map(e => [e.mediaId, e]));
  const series = tvRows(entries);
  const local = (): AiringRow[] => followed.filter(e => e.media.nextAiring)
    .map(e => ({ id: -e.mediaId, mediaId: e.mediaId, episode: e.media.nextAiring!.episode, airingAt: e.media.nextAiring!.airingAt, entry: e }));
  const trier = (r: AiringRow[]) => r.sort((a, b) => a.airingAt - b.airingAt);
  if (!followed.length) return { status: 'done', rows: trier(series), source: 'api', error: null };
  const now = Math.floor(Date.now() / 1000);
  const from = Math.floor((now - DAYS_BEFORE * 86400) / 3600) * 3600;
  const to = from + (DAYS_BEFORE + DAYS_AFTER) * 86400 + 3600;
  try {
    const r = await anilist.airing([...byId.keys()], from, to, signal, force);
    const rows = r.data.filter(a => byId.has(a.mediaId)).map(a => ({ ...a, entry: byId.get(a.mediaId)! }));
    return { status: 'done', rows: trier([...rows, ...series]), source: r.stale ? 'cache' : 'api', error: null };
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'aborted') throw e;
    return { status: 'error', rows: trier([...local(), ...series]), source: 'local', error: errorMessage(e) };
  }
}
