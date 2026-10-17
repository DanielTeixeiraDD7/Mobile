import { totalUnits } from './labels';
import type { EntryStatus, LibraryEntry } from './types';

export type TrackedFields = Pick<LibraryEntry, 'progress' | 'status' | 'score' | 'startedAt' | 'completedAt' | 'repeatCount'>;
export type Patch = Partial<TrackedFields>;

export const todayIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Normalise une valeur de progression :
 * anime = épisodes entiers, manga = chapitres au dixième (10.5) ; jamais négatif ;
 * jamais au-delà du total quand il est connu.
 */
export function normalizeProgress(entry: Pick<LibraryEntry, 'type' | 'media'>, value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  let v = entry.type === 'ANIME' ? Math.floor(value) : Math.round(value * 10) / 10;
  const total = totalUnits(entry.media);
  if (total && v > total) v = total;
  return v;
}

/** Valeur après « +1 » : épisode suivant, ou chapitre entier suivant (10.5 → 11). */
export function nextUnit(entry: Pick<LibraryEntry, 'type' | 'progress'>): number {
  return entry.type === 'ANIME' ? Math.floor(entry.progress) + 1 : Math.floor(entry.progress + 1e-9) + 1;
}

export function canIncrement(entry: Pick<LibraryEntry, 'type' | 'progress' | 'media'>): boolean {
  const total = totalUnits(entry.media);
  return !total || entry.progress < total;
}

/** Changements induits par une nouvelle progression (statut, dates, nombre de revisionnages). */
export function planProgress(entry: LibraryEntry, value: number, today = todayIso()): Patch {
  const progress = normalizeProgress(entry, value);
  const patch: Patch = { progress };
  if (progress === entry.progress) return patch;
  const total = totalUnits(entry.media);
  const forward = progress > entry.progress;

  if (forward && (entry.status === 'PLANNING' || entry.status === 'PAUSED' || entry.status === 'DROPPED')) patch.status = 'CURRENT';
  if (forward && !entry.startedAt) patch.startedAt = today;

  if (total && progress >= total && entry.status !== 'COMPLETED') {
    patch.status = 'COMPLETED';
    patch.completedAt = today;
    if (entry.status === 'REWATCH') patch.repeatCount = entry.repeatCount + 1;
  } else if (entry.status === 'COMPLETED' && total && progress < total) {
    patch.status = 'CURRENT';
    patch.completedAt = null;
  }
  return patch;
}

/** Changements induits par un nouveau statut. */
export function planStatus(entry: LibraryEntry, status: EntryStatus, today = todayIso()): Patch {
  const patch: Patch = { status };
  if (status === entry.status) return patch;
  const total = totalUnits(entry.media);
  if (status === 'COMPLETED') {
    if (total) patch.progress = total;
    patch.completedAt = today;
    if (!entry.startedAt) patch.startedAt = today;
    if (entry.status === 'REWATCH') patch.repeatCount = entry.repeatCount + 1;
  } else if (status === 'REWATCH') {
    patch.progress = 0;
  } else if (status === 'CURRENT' && !entry.startedAt) {
    patch.startedAt = today;
  }
  if (entry.status === 'COMPLETED' && status !== 'COMPLETED' && status !== 'REWATCH') patch.completedAt = null;
  return patch;
}

/** Note personnelle : 0 à 10 par pas de 0,5, ou null. */
export function normalizeScore(v: number | null): number | null {
  if (v === null || !Number.isFinite(v)) return null;
  return Math.min(10, Math.max(0, Math.round(v * 2) / 2));
}

/** Ne garde que les champs qui changent réellement. */
export function diff(entry: TrackedFields, patch: Patch): { before: Patch; after: Patch } {
  const before: Patch = {};
  const after: Patch = {};
  for (const k of Object.keys(patch) as (keyof TrackedFields)[]) {
    if (patch[k] === undefined || patch[k] === entry[k]) continue;
    (before as Record<string, unknown>)[k] = entry[k];
    (after as Record<string, unknown>)[k] = patch[k];
  }
  return { before, after };
}
