import { totalUnits } from './labels';
import { ENTRY_STATUSES, type EntryStatus, type HistoryEvent, type LibraryEntry, type MediaType, type Settings } from './types';
import { minutesParUnite } from './screentime';

/** Hypothèses des estimations, affichées à l'utilisateur. */
export const DEFAULT_EPISODE_MIN = 24;
export const MINUTES_PER_CHAPTER = 5;

export interface Stat {
  value: number;
  /** false = calcul exact à partir de tes données ; true = estimation (hypothèse indiquée). */
  estimate: boolean;
  note?: string;
}

export interface TypeStats {
  total: number;
  byStatus: Record<EntryStatus, number>;
  units: Stat; // épisodes vus / chapitres lus (progression enregistrée)
  minutes: Stat; // temps passé
  remainingMinutes: Stat; // reste à voir sur en cours + à regarder (totaux connus)
  meanScore: Stat | null;
  scored: number;
  completedThisYear: number;
  rewatches: number;
}

export function typeStats(entries: LibraryEntry[], type: MediaType, now = new Date(), reglages: Pick<Settings, 'minutesPerChapter'> = { minutesPerChapter: MINUTES_PER_CHAPTER }): TypeStats {
  const list = entries.filter(e => e.type === type);
  const byStatus = Object.fromEntries(ENTRY_STATUSES.map(s => [s, 0])) as Record<EntryStatus, number>;
  let units = 0, minutes = 0, guessed = 0, remaining = 0, unknownTotals = 0, scoreSum = 0, scored = 0, done = 0, rewatches = 0;
  const year = String(now.getFullYear());

  for (const e of list) {
    byStatus[e.status]++;
    units += e.progress;
    rewatches += e.repeatCount;
    if (e.score !== null) { scoreSum += e.score; scored++; }
    if (e.completedAt?.startsWith(year)) done++;
    const { minutes: d, supposee } = minutesParUnite(e, reglages);
    if (supposee && type !== 'MANGA' && e.progress > 0) guessed++;
    minutes += e.progress * d;
    if (type !== 'MANGA' && (e.status === 'CURRENT' || e.status === 'PLANNING' || e.status === 'REWATCH')) {
      const total = totalUnits(e.media);
      if (total) remaining += Math.max(0, total - e.progress) * d;
      else unknownTotals++;
    }
  }
  return {
    total: list.length,
    byStatus,
    units: { value: units, estimate: false, note: 'Somme des progressions enregistrées (hors revisionnages).' },
    minutes: type === 'MANGA'
      ? { value: minutes, estimate: true, note: `Hypothèse : ${reglages.minutesPerChapter} min par chapitre.` }
      : { value: minutes, estimate: true, note: `${type === 'MOVIE' ? 'Films' : 'Épisodes'} × durée indiquée par la source${guessed ? ` (${guessed} titre(s) sans durée : durée moyenne supposée)` : ''}.` },
    remainingMinutes: { value: remaining, estimate: true, note: unknownTotals ? `${unknownTotals} série(s) sans total connu non comptée(s).` : 'Titres en cours et à regarder.' },
    meanScore: scored ? { value: scoreSum / scored, estimate: false, note: `Sur ${scored} titre(s) noté(s).` } : null,
    scored,
    completedThisYear: done,
    rewatches,
  };
}

/** Unités enregistrées par jour (exact, d'après l'historique non annulé). */
export function activity(history: HistoryEvent[], entries: LibraryEntry[], days: number, now = Date.now()): { day: number; anime: number; manga: number }[] {
  const types = new Map(entries.map(e => [e.id, e.type]));
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * 86_400_000;
  const out = Array.from({ length: days }, (_, i) => ({ day: first + i * 86_400_000, anime: 0, manga: 0 }));
  for (const h of history) {
    if (h.undone || (h.kind !== 'progress' && h.kind !== 'status') || h.at < first) continue;
    const delta = (h.after.progress ?? 0) - (h.before.progress ?? 0);
    if (delta <= 0) continue;
    const i = Math.floor((h.at - first) / 86_400_000);
    const type = types.get(h.entryId) ?? (h.entryId.includes(':MANGA:') ? 'MANGA' : 'ANIME');
    if (out[i]) out[i][type === 'ANIME' ? 'anime' : 'manga'] += delta;
  }
  return out;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 48) return `${Math.round(h)} h`;
  const d = Math.floor(h / 24);
  return `${d} j ${Math.round(h - d * 24)} h`;
}
