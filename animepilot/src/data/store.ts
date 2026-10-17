import { useSyncExternalStore } from 'react';
import { openDatabase, type APDB } from './db';
import * as repo from './repo';
import { ConflictError } from './repo';
import { nextUnit, normalizeScore, planProgress, planStatus, todayIso, type Patch } from '../domain/progress';
import { DEFAULT_SETTINGS, type EntryStatus, type HistoryEvent, type LibraryEntry, type MediaSnapshot, type Settings } from '../domain/types';

export interface State {
  ready: boolean;
  error: string | null;
  entries: LibraryEntry[];
  history: HistoryEvent[];
  settings: Settings;
}

let state: State = { ready: false, error: null, entries: [], history: [], settings: DEFAULT_SETTINGS };
let db: APDB | null = null;
const listeners = new Set<() => void>();
/** Titres en cours d'écriture : un second appui pendant l'écriture est ignoré. */
const pending = new Set<string>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

export const getState = () => state;
export const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
export const getDb = () => {
  if (!db) throw new Error('Base non initialisée');
  return db;
};

export async function init(name?: string) {
  try {
    db = await openDatabase(name);
    await reload();
  } catch (e) {
    set({ ready: true, error: 'Stockage local indisponible (navigation privée ?). ' + (e instanceof Error ? e.message : '') });
  }
}

export async function reload() {
  const data = await repo.loadAll(getDb());
  set({ ready: true, error: null, ...data });
}

/** Pour les tests : ferme la base et remet l'état à zéro. */
export function reset() {
  db?.close();
  db = null;
  pending.clear();
  lastIncrement.clear();
  state = { ready: false, error: null, entries: [], history: [], settings: DEFAULT_SETTINGS };
}

const upsertLocal = (entry: LibraryEntry) => {
  const i = state.entries.findIndex(e => e.id === entry.id);
  return i === -1 ? [...state.entries, entry] : state.entries.map(e => (e.id === entry.id ? entry : e));
};

function pushEvent(ev: HistoryEvent | null) {
  return ev ? [ev, ...state.history].slice(0, repo.HISTORY_LIMIT) : state.history;
}

export const findEntry = (id: string) => state.entries.find(e => e.id === id);

export type ActionResult = { ok: true; event: HistoryEvent | null; entry: LibraryEntry | null } | { ok: false; reason: 'busy' | 'conflict' | 'missing'; message: string };

async function guarded(id: string, run: () => Promise<{ event: HistoryEvent | null; entry: LibraryEntry | null }>): Promise<ActionResult> {
  if (pending.has(id)) return { ok: false, reason: 'busy', message: 'Action déjà en cours.' };
  pending.add(id);
  try {
    const r = await run();
    return { ok: true, ...r };
  } catch (e) {
    if (e instanceof ConflictError) {
      await reload();
      return { ok: false, reason: 'conflict', message: e.message };
    }
    throw e;
  } finally {
    pending.delete(id);
  }
}

export async function addToLibrary(media: MediaSnapshot, status: EntryStatus = 'PLANNING') {
  const r = await repo.addEntry(getDb(), media, status);
  if (r.created) set({ entries: upsertLocal(r.entry), history: pushEvent(r.event) });
  return r;
}

async function change(entry: LibraryEntry, patch: Patch, kind: HistoryEvent['kind']) {
  // Valeurs attendues = état affiché ; si la base diffère, l'écriture est refusée.
  const expected: Patch = {};
  for (const k of Object.keys(patch) as (keyof Patch)[]) (expected as Record<string, unknown>)[k] = entry[k];
  expected.progress = entry.progress;
  expected.status = entry.status;
  const r = await repo.applyPatch(getDb(), entry.id, expected, patch, kind);
  set({ entries: upsertLocal(r.entry), history: pushEvent(r.event) });
  return r;
}

export function setProgress(id: string, value: number) {
  return guarded(id, async () => {
    const entry = findEntry(id);
    if (!entry) throw new ConflictError('Titre introuvable.');
    return change(entry, planProgress(entry, value, todayIso()), 'progress');
  });
}

const lastIncrement = new Map<string, number>();
export const INCREMENT_COOLDOWN_MS = 300;

/**
 * « +1 ». `seen` = progression affichée au moment de l'appui : si elle ne correspond
 * plus (événement reçu deux fois, rendu périmé), l'appui est ignoré. Un délai minimal
 * entre deux +1 sur le même titre absorbe les rebonds de doigt.
 */
export function increment(id: string, seen?: number, now = Date.now()) {
  const entry = findEntry(id);
  if (!entry) return Promise.resolve<ActionResult>({ ok: false, reason: 'missing', message: 'Titre introuvable.' });
  if (seen !== undefined && seen !== entry.progress) return Promise.resolve<ActionResult>({ ok: false, reason: 'busy', message: 'Déjà compté.' });
  if (now - (lastIncrement.get(id) ?? 0) < INCREMENT_COOLDOWN_MS) return Promise.resolve<ActionResult>({ ok: false, reason: 'busy', message: 'Déjà compté.' });
  lastIncrement.set(id, now);
  return setProgress(id, nextUnit(entry));
}

export function setStatus(id: string, status: EntryStatus) {
  return guarded(id, async () => {
    const entry = findEntry(id);
    if (!entry) throw new ConflictError('Titre introuvable.');
    return change(entry, planStatus(entry, status, todayIso()), 'status');
  });
}

export function setScore(id: string, score: number | null) {
  return guarded(id, async () => {
    const entry = findEntry(id);
    if (!entry) throw new ConflictError('Titre introuvable.');
    return change(entry, { score: normalizeScore(score) }, 'score');
  });
}

export async function updateFields(id: string, fields: Parameters<typeof repo.updateEntryFields>[2]) {
  const entry = await repo.updateEntryFields(getDb(), id, fields);
  if (entry) set({ entries: upsertLocal(entry) });
  return entry;
}

export function remove(id: string) {
  return guarded(id, async () => {
    const event = await repo.removeEntry(getDb(), id);
    set({ entries: state.entries.filter(e => e.id !== id), history: pushEvent(event) });
    return { event, entry: null };
  });
}

export function undo(eventId: string) {
  const ev = state.history.find(h => h.id === eventId);
  return guarded(ev?.entryId ?? eventId, async () => {
    const r = await repo.undoEvent(getDb(), eventId);
    set({
      entries: r.entry ? upsertLocal(r.entry) : state.entries.filter(e => e.id !== r.entryId),
      history: state.history.map(h => (h.id === eventId ? r.event : h)),
    });
    return { event: r.event, entry: r.entry };
  });
}

export async function updateSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  await repo.saveSettings(getDb(), settings);
  set({ settings });
}
