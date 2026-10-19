import * as store from '@/data/store';
import { formatNumber, mediaTitle, statusLabel, unitShort, episodeLabel } from '@/domain/labels';
import type { EntryStatus, LibraryEntry, MediaSnapshot } from '@/domain/types';
import { toast, vibrer } from '@/composables/useToast';
import { details } from './sources';

/** Actions de l'utilisateur : écriture + toast avec « Annuler ». */
const titre = (e: { media: MediaSnapshot }) => mediaTitle(e.media, store.getState().settings.titleLanguage);

function rapport(r: store.ActionResult, succes: (entry: LibraryEntry | null) => string) {
  if (!r.ok) {
    if (r.reason !== 'busy') toast(r.message, { type: 'danger' });
    return false;
  }
  if (!r.event) return true;
  const id = r.event.id;
  toast(succes(r.entry), { action: 'Annuler', onAction: () => void annuler(id) });
  return true;
}

export async function annuler(eventId: string) {
  const r = await store.undo(eventId);
  if (r.ok) toast('Action annulée.');
  else if (r.reason !== 'busy') toast(r.message, { type: 'danger' });
}

/** Libellé de l'unité n : « S2 É5 » pour une série, « ép. 12 », « ch. 40 ». */
export function uniteLabel(e: Pick<LibraryEntry, 'type' | 'media'>, n: number) {
  return (e.type === 'TV' ? episodeLabel(e.media, n) : null) ?? `${unitShort(e.type)} ${formatNumber(n)}`;
}

export async function plusUn(entry: LibraryEntry) {
  vibrer(12);
  const r = await store.increment(entry.id, entry.progress);
  rapport(r, e => e?.status === 'COMPLETED' && entry.status !== 'COMPLETED'
    ? `Terminé : ${titre(entry)} 🎉`
    : `${uniteLabel(entry, e?.progress ?? 0)} · ${titre(entry)}`);
}

export async function progression(entry: LibraryEntry, valeur: number) {
  rapport(await store.setProgress(entry.id, valeur), e => `Progression : ${formatNumber(e?.progress ?? 0)} · ${titre(entry)}`);
}

export async function statut(entry: LibraryEntry, s: EntryStatus) {
  rapport(await store.setStatus(entry.id, s), () => `${statusLabel(entry.type, s)} · ${titre(entry)}`);
}

export async function note(entry: LibraryEntry, score: number | null) {
  rapport(await store.setScore(entry.id, score), () => (score === null ? 'Note retirée' : `Note : ${formatNumber(score)}/10`));
}

export async function retirer(entry: LibraryEntry) {
  rapport(await store.remove(entry.id), () => `Retiré : ${titre(entry)}`);
}

/**
 * Les résultats de recherche TMDB n'ont ni durée ni saisons : la fiche complète est chargée
 * avant l'ajout (sinon le temps d'écran utiliserait une durée par défaut). Hors-ligne : ajout tel quel.
 */
async function complet(media: MediaSnapshot): Promise<MediaSnapshot> {
  if ((media.type !== 'MOVIE' && media.type !== 'TV') || (media.duration && (media.type === 'MOVIE' || media.seasons))) return media;
  try {
    return (await Promise.race([details(media.type, media.id), new Promise<never>((_, k) => setTimeout(() => k(new Error('délai')), 6000))])).data.media;
  } catch { return media; }
}

export async function ajouter(media: MediaSnapshot, s: EntryStatus) {
  const r = await store.addToLibrary(await complet(media), s);
  if (!r.created) return toast('Déjà dans ta bibliothèque.');
  vibrer(12);
  const id = r.event!.id;
  toast(`Ajouté (${statusLabel(media.type, s)}) : ${titre({ media })}`, { action: 'Annuler', onAction: () => void annuler(id) });
}

/**
 * Film « vu aujourd'hui » : passe en Terminé (compte dans le temps d'écran du jour).
 * Si le film n'est pas encore dans la bibliothèque, il est ajouté en « En cours » puis terminé.
 */
export async function filmVu(media: MediaSnapshot, entry?: LibraryEntry) {
  if (!entry) {
    const r = await store.addToLibrary(await complet(media), 'CURRENT');
    entry = r.entry;
  }
  await statut(entry, 'COMPLETED');
}
