import * as store from '../data/store';
import { formatNumber, mediaTitle, statusLabel, unitShort } from '../domain/labels';
import type { EntryStatus, LibraryEntry, MediaSnapshot } from '../domain/types';
import { toast } from './toast';

const title = (e: { media: MediaSnapshot }) => mediaTitle(e.media, store.getState().settings.titleLanguage);

function report(r: store.ActionResult, success: (entry: LibraryEntry | null) => string) {
  if (!r.ok) {
    if (r.reason !== 'busy') toast(r.message, { kind: 'error' });
    return;
  }
  if (!r.event) return;
  const eventId = r.event.id;
  toast(success(r.entry), { action: { label: 'Annuler', run: () => void undo(eventId) } });
}

export async function undo(eventId: string) {
  const r = await store.undo(eventId);
  if (r.ok) toast('Action annulée.');
  else if (r.reason !== 'busy') toast(r.message, { kind: 'error' });
}

export async function plusOne(entry: LibraryEntry) {
  const r = await store.increment(entry.id, entry.progress);
  report(r, e => e?.status === 'COMPLETED' && entry.status !== 'COMPLETED'
    ? `Terminé : ${title(entry)} 🎉`
    : `${unitShort(entry.type)} ${formatNumber(e?.progress ?? 0)} · ${title(entry)}`);
}

export async function setProgress(entry: LibraryEntry, value: number) {
  report(await store.setProgress(entry.id, value), e => `Progression : ${formatNumber(e?.progress ?? 0)} · ${title(entry)}`);
}

export async function setStatus(entry: LibraryEntry, status: EntryStatus) {
  report(await store.setStatus(entry.id, status), () => `${statusLabel(entry.type, status)} · ${title(entry)}`);
}

export async function setScore(entry: LibraryEntry, score: number | null) {
  report(await store.setScore(entry.id, score), () => (score === null ? 'Note retirée' : `Note : ${formatNumber(score)}/10`));
}

export async function remove(entry: LibraryEntry) {
  report(await store.remove(entry.id), () => `Retiré : ${title(entry)}`);
}

export async function add(media: MediaSnapshot, status: EntryStatus) {
  const r = await store.addToLibrary(media, status);
  if (!r.created) return toast('Déjà dans ta bibliothèque.');
  const eventId = r.event!.id;
  toast(`Ajouté (${statusLabel(media.type, status)}) : ${title({ media })}`, { action: { label: 'Annuler', run: () => void undo(eventId) } });
}
