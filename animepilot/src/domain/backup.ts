import { ENTRY_STATUSES, entryId, type HistoryEvent, type LibraryEntry, type MediaSnapshot, type Settings } from './types';

export const BACKUP_FORMAT = 'animepilot-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  entries: LibraryEntry[];
  history: HistoryEvent[];
  settings?: Partial<Settings>;
}

export function createBackup(entries: LibraryEntry[], history: HistoryEvent[], settings: Settings, now = new Date()): Backup {
  const { onboarded: _o, ...prefs } = settings;
  return { format: BACKUP_FORMAT, schemaVersion: BACKUP_VERSION, exportedAt: now.toISOString(), entries, history, settings: prefs };
}

export const backupFileName = (d = new Date()) => `animepilot-${d.toISOString().slice(0, 10)}.json`;

export class BackupError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, min = 0) => typeof v === 'number' && Number.isFinite(v) && v >= min;
const strOrNull = (v: unknown) => v === null || v === undefined || typeof v === 'string';
const numOrNull = (v: unknown) => v === null || v === undefined || num(v);

/** Migrations : schemaVersion n → n+1. Vide tant qu'il n'existe que la v1. */
const MIGRATIONS: Record<number, (b: Record<string, unknown>) => Record<string, unknown>> = {};

function validMedia(m: unknown): m is MediaSnapshot {
  if (!isObj(m) || !num(m.id, 1) || (m.type !== 'ANIME' && m.type !== 'MANGA') || !isObj(m.title)) return false;
  const t = m.title;
  return strOrNull(t.romaji) && strOrNull(t.english) && strOrNull(t.native) && !!(t.romaji || t.english || t.native)
    && strOrNull(m.cover) && numOrNull(m.episodes) && numOrNull(m.chapters) && numOrNull(m.duration);
}

/** Valide et complète une entrée ; renvoie null si inutilisable. */
export function sanitizeEntry(raw: unknown): LibraryEntry | null {
  if (!isObj(raw) || !validMedia(raw.media)) return null;
  const media = raw.media as MediaSnapshot;
  if (raw.type !== media.type || raw.mediaId !== media.id) return null;
  if (!ENTRY_STATUSES.includes(raw.status as never) || !num(raw.progress)) return null;
  if (!(raw.score === null || raw.score === undefined || (num(raw.score) && (raw.score as number) <= 10))) return null;
  const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const total = media.type === 'ANIME' ? media.episodes : media.chapters;
  const progress = media.type === 'ANIME' ? Math.floor(raw.progress as number) : Math.round((raw.progress as number) * 10) / 10;
  return {
    id: entryId(media.type, media.id),
    source: 'anilist',
    mediaId: media.id,
    type: media.type,
    status: raw.status as LibraryEntry['status'],
    progress: total ? Math.min(progress, total) : progress,
    volumes: num(raw.volumes) ? (raw.volumes as number) : 0,
    score: num(raw.score) ? (raw.score as number) : null,
    repeatCount: num(raw.repeatCount) ? Math.floor(raw.repeatCount as number) : 0,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 2000) : '',
    startedAt: date(raw.startedAt),
    completedAt: date(raw.completedAt),
    addedAt: num(raw.addedAt) ? (raw.addedAt as number) : Date.now(),
    updatedAt: num(raw.updatedAt) ? (raw.updatedAt as number) : Date.now(),
    media: {
      ...media,
      genres: Array.isArray(media.genres) ? media.genres.filter(g => typeof g === 'string') : [],
      tags: Array.isArray(media.tags) ? media.tags.filter(t => isObj(t) && typeof t.name === 'string' && num(t.rank)) : [],
      isAdult: !!media.isAdult,
      fetchedAt: num(media.fetchedAt) ? media.fetchedAt : 0,
    },
  };
}

function sanitizeEvent(raw: unknown): HistoryEvent | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.entryId !== 'string' || !num(raw.at)) return null;
  if (!['add', 'progress', 'status', 'score', 'remove'].includes(raw.kind as string) || !isObj(raw.before) || !isObj(raw.after)) return null;
  const { snapshot: _s, ...rest } = raw;
  return { ...(rest as unknown as HistoryEvent), undone: !!raw.undone };
}

export interface ParsedBackup {
  schemaVersion: number;
  exportedAt: string | null;
  entries: LibraryEntry[];
  history: HistoryEvent[];
  settings: Partial<Settings>;
  invalid: number;
  duplicatesInFile: number;
}

export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try { data = JSON.parse(text.replace(/^﻿/, '')); } catch { throw new BackupError("Ce fichier n'est pas un JSON valide."); }
  if (!isObj(data) || data.format !== BACKUP_FORMAT) throw new BackupError("Ce fichier n'est pas une sauvegarde AnimePilot.");
  let version = data.schemaVersion;
  if (!num(version, 1) || !Number.isInteger(version)) throw new BackupError('Version de sauvegarde inconnue.');
  if ((version as number) > BACKUP_VERSION) throw new BackupError(`Sauvegarde créée par une version plus récente d'AnimePilot (v${version}). Mets l'app à jour.`);
  while ((version as number) < BACKUP_VERSION) {
    const m = MIGRATIONS[version as number];
    if (!m) throw new BackupError(`Migration impossible depuis la v${version}.`);
    data = m(data as Record<string, unknown>);
    version = (version as number) + 1;
  }
  const b = data as Record<string, unknown>;
  if (!Array.isArray(b.entries)) throw new BackupError('Sauvegarde incomplète : pas de liste de titres.');
  const seen = new Map<string, LibraryEntry>();
  let invalid = 0, dup = 0;
  for (const raw of b.entries) {
    const e = sanitizeEntry(raw);
    if (!e) { invalid++; continue; }
    const prev = seen.get(e.id);
    if (prev) { dup++; if (e.updatedAt <= prev.updatedAt) continue; }
    seen.set(e.id, e);
  }
  const history = (Array.isArray(b.history) ? b.history : []).map(sanitizeEvent).filter((h): h is HistoryEvent => !!h);
  const s = isObj(b.settings) ? b.settings : {};
  const settings: Partial<Settings> = {};
  if (s.titleLanguage === 'romaji' || s.titleLanguage === 'english' || s.titleLanguage === 'native') settings.titleLanguage = s.titleLanguage;
  if (num(s.reminderMinutes) && (s.reminderMinutes as number) <= 1440) settings.reminderMinutes = s.reminderMinutes as number;
  return { schemaVersion: BACKUP_VERSION, exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : null, entries: [...seen.values()], history, settings, invalid, duplicatesInFile: dup };
}

const normTitle = (s: string | null) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export interface ImportPreview {
  added: LibraryEntry[];
  identical: LibraryEntry[];
  conflicts: { mine: LibraryEntry; theirs: LibraryEntry }[];
  /** Même type et même titre qu'un titre existant mais id AniList différent (doublon probable). */
  similar: { mine: LibraryEntry; theirs: LibraryEntry }[];
}

const sameTracking = (a: LibraryEntry, b: LibraryEntry) =>
  a.status === b.status && a.progress === b.progress && a.score === b.score && a.notes === b.notes && a.repeatCount === b.repeatCount;

export function previewImport(current: LibraryEntry[], incoming: LibraryEntry[]): ImportPreview {
  const byId = new Map(current.map(e => [e.id, e]));
  const byTitle = new Map<string, LibraryEntry>();
  for (const e of current) for (const t of [e.media.title.romaji, e.media.title.english]) if (t) byTitle.set(e.type + ':' + normTitle(t), e);
  const p: ImportPreview = { added: [], identical: [], conflicts: [], similar: [] };
  for (const theirs of incoming) {
    const mine = byId.get(theirs.id);
    if (!mine) {
      p.added.push(theirs);
      const twin = [theirs.media.title.romaji, theirs.media.title.english].map(t => t && byTitle.get(theirs.type + ':' + normTitle(t))).find(Boolean);
      if (twin) p.similar.push({ mine: twin, theirs });
    } else if (sameTracking(mine, theirs)) p.identical.push(theirs);
    else p.conflicts.push({ mine, theirs });
  }
  return p;
}

export type Strategy = 'advanced' | 'theirs' | 'mine';

/** Entrées à écrire selon la stratégie choisie pour les conflits. */
export function resolveImport(p: ImportPreview, strategy: Strategy): LibraryEntry[] {
  const out = [...p.added];
  for (const { mine, theirs } of p.conflicts) {
    if (strategy === 'theirs') out.push(theirs);
    else if (strategy === 'advanced') {
      const pick = theirs.progress > mine.progress || (theirs.progress === mine.progress && theirs.updatedAt > mine.updatedAt) ? theirs : null;
      if (pick) out.push({ ...pick, notes: pick.notes || mine.notes, score: pick.score ?? mine.score });
    }
  }
  return out;
}
