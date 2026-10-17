import type { APDB } from './db';
import { diff, type Patch, type TrackedFields } from '../domain/progress';
import { DEFAULT_SETTINGS, entryId, type EntryStatus, type HistoryEvent, type HistoryKind, type LibraryEntry, type MediaSnapshot, type Settings } from '../domain/types';

/** La valeur en base n'est plus celle attendue (double appui, autre onglet, annulation périmée). */
export class ConflictError extends Error {
  constructor(message = 'La donnée a changé entre-temps.') {
    super(message);
    this.name = 'ConflictError';
  }
}

export const HISTORY_LIMIT = 2000;

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export async function loadAll(db: APDB) {
  const [entries, history, settings] = await Promise.all([
    db.getAll('entries'),
    db.getAllFromIndex('history', 'at'),
    db.get('settings', 'settings'),
  ]);
  const { key: _key, ...s } = settings ?? { key: 'settings' as const, ...DEFAULT_SETTINGS };
  return { entries, history: history.reverse(), settings: { ...DEFAULT_SETTINGS, ...s } as Settings };
}

export async function saveSettings(db: APDB, settings: Settings) {
  await db.put('settings', { ...settings, key: 'settings' });
}

export function newEntry(media: MediaSnapshot, status: EntryStatus, now = Date.now()): LibraryEntry {
  return {
    id: entryId(media.type, media.id),
    source: 'anilist',
    mediaId: media.id,
    type: media.type,
    status,
    progress: 0,
    volumes: 0,
    score: null,
    repeatCount: 0,
    notes: '',
    startedAt: null,
    completedAt: null,
    addedAt: now,
    updatedAt: now,
    media,
  };
}

function makeEvent(entryIdValue: string, kind: HistoryKind, before: Patch, after: Patch, now: number, snapshot?: LibraryEntry): HistoryEvent {
  const ev: HistoryEvent = { id: newId(), entryId: entryIdValue, at: now, kind, before, after, undone: false };
  if (snapshot) ev.snapshot = snapshot;
  return ev;
}

/** Ajoute un titre ; s'il est déjà dans la bibliothèque, renvoie l'existant sans doublon. */
export async function addEntry(db: APDB, media: MediaSnapshot, status: EntryStatus, now = Date.now()) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  const id = entryId(media.type, media.id);
  const existing = await tx.objectStore('entries').get(id);
  if (existing) {
    await tx.done;
    return { entry: existing, event: null, created: false };
  }
  const entry = newEntry(media, status, now);
  const event = makeEvent(id, 'add', {}, { status }, now);
  await Promise.all([tx.objectStore('entries').put(entry), tx.objectStore('history').put(event), tx.done]);
  return { entry, event, created: true };
}

/**
 * Modification « comparer-et-écrire » : `expected` doit correspondre à la base,
 * sinon ConflictError. Entrée et historique sont écrits dans la même transaction.
 */
export async function applyPatch(db: APDB, id: string, expected: Patch, patch: Patch, kind: HistoryKind, now = Date.now()) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  const entries = tx.objectStore('entries');
  const entry = await entries.get(id);
  if (!entry) { tx.abort(); await tx.done.catch(() => {}); throw new ConflictError('Titre introuvable.'); }
  for (const k of Object.keys(expected) as (keyof TrackedFields)[]) {
    if (entry[k] !== expected[k]) { tx.abort(); await tx.done.catch(() => {}); throw new ConflictError(); }
  }
  const { before, after } = diff(entry, patch);
  if (Object.keys(after).length === 0) { await tx.done; return { entry, event: null }; }
  const updated: LibraryEntry = { ...entry, ...after, updatedAt: now };
  const event = makeEvent(id, kind, before, after, now);
  await Promise.all([entries.put(updated), tx.objectStore('history').put(event), tx.done]);
  await trimHistory(db);
  return { entry: updated, event };
}

/** Supprime un titre ; l'historique garde une copie pour pouvoir annuler. */
export async function removeEntry(db: APDB, id: string, now = Date.now()) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  const entry = await tx.objectStore('entries').get(id);
  if (!entry) { await tx.done; return null; }
  const event = makeEvent(id, 'remove', { status: entry.status }, {}, now, entry);
  await Promise.all([tx.objectStore('entries').delete(id), tx.objectStore('history').put(event), tx.done]);
  return event;
}

/** Annule un événement si l'état actuel correspond toujours à son « après ». */
export async function undoEvent(db: APDB, eventId: string, now = Date.now()) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  const history = tx.objectStore('history');
  const entries = tx.objectStore('entries');
  const fail = async (msg: string) => { tx.abort(); await tx.done.catch(() => {}); throw new ConflictError(msg); };

  const ev = await history.get(eventId);
  if (!ev) return fail('Action introuvable.');
  if (ev.undone) return fail('Action déjà annulée.');
  const entry = await entries.get(ev.entryId);
  let result: LibraryEntry | null = null;

  if (ev.kind === 'add') {
    if (!entry) return fail('Titre déjà supprimé.');
    if (entry.progress !== 0 || entry.status !== ev.after.status) return fail('Le titre a été modifié depuis son ajout.');
    await entries.delete(ev.entryId);
  } else if (ev.kind === 'remove') {
    const snap = ev.snapshot;
    if (entry || !snap) return fail('Impossible de restaurer ce titre.');
    result = { ...snap, updatedAt: now };
    await entries.put(result);
  } else {
    if (!entry) return fail('Titre introuvable.');
    for (const k of Object.keys(ev.after) as (keyof TrackedFields)[]) {
      if (entry[k] !== ev.after[k]) return fail('Le titre a été modifié depuis.');
    }
    result = { ...entry, ...ev.before, updatedAt: now };
    await entries.put(result);
  }
  const updatedEvent = { ...ev, undone: true };
  await Promise.all([history.put(updatedEvent), tx.done]);
  return { entry: result, entryId: ev.entryId, event: updatedEvent };
}

/** Champs non suivis dans l'historique (notes, volumes, infos AniList rafraîchies). */
export async function updateEntryFields(db: APDB, id: string, fields: Partial<Pick<LibraryEntry, 'notes' | 'volumes' | 'media'>>, now = Date.now()) {
  const tx = db.transaction('entries', 'readwrite');
  const entry = await tx.store.get(id);
  if (!entry) { await tx.done; return null; }
  const updated = { ...entry, ...fields, updatedAt: fields.media && Object.keys(fields).length === 1 ? entry.updatedAt : now };
  await Promise.all([tx.store.put(updated), tx.done]);
  return updated;
}

/** Garde les HISTORY_LIMIT événements les plus récents. */
export async function trimHistory(db: APDB, limit = HISTORY_LIMIT) {
  const count = await db.count('history');
  if (count <= limit) return;
  const tx = db.transaction('history', 'readwrite');
  let cursor = await tx.store.index('at').openCursor();
  let toDelete = count - limit;
  while (cursor && toDelete-- > 0) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Remplace tout (import en mode remplacement, réinitialisation). */
export async function replaceAll(db: APDB, entries: LibraryEntry[], history: HistoryEvent[]) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  await tx.objectStore('entries').clear();
  await tx.objectStore('history').clear();
  for (const e of entries) await tx.objectStore('entries').put(e);
  for (const h of history) await tx.objectStore('history').put(h);
  await tx.done;
}

/** Écrit des entrées en lot (import en fusion). */
export async function putEntries(db: APDB, entries: LibraryEntry[], history: HistoryEvent[] = []) {
  const tx = db.transaction(['entries', 'history'], 'readwrite');
  for (const e of entries) await tx.objectStore('entries').put(e);
  for (const h of history) await tx.objectStore('history').put(h);
  await tx.done;
}
