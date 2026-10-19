import { MEDIA_TYPES, type HistoryEvent, type LibraryEntry, type MediaType, type Settings } from './types';

/**
 * Temps d'écran ESTIMÉ à partir de ce que tu marques comme vu / lu :
 * épisodes × durée d'un épisode, films × durée du film, chapitres × temps de lecture réglé.
 * Ce n'est pas le « Temps d'écran » du téléphone (inaccessible à une app web).
 */

/** Durées supposées quand la source ne donne pas la durée. */
export const DUREE_DEFAUT: Record<Exclude<MediaType, 'MANGA'>, number> = { ANIME: 24, TV: 40, MOVIE: 110 };

export function minutesParUnite(e: Pick<LibraryEntry, 'type' | 'media'>, s: Pick<Settings, 'minutesPerChapter'>): { minutes: number; supposee: boolean } {
  if (e.type === 'MANGA') return { minutes: s.minutesPerChapter, supposee: true };
  const d = e.media.duration;
  return d && d > 0 ? { minutes: d, supposee: false } : { minutes: DUREE_DEFAUT[e.type], supposee: true };
}

export interface Session {
  at: number;
  entryId: string;
  type: MediaType;
  unites: number;
  minutes: number;
}

const ACTIF = new Set(['CURRENT', 'REWATCH', 'PAUSED']);

/**
 * Sessions comptées à partir de l'historique (non annulé) :
 * - « progress » : chaque épisode / chapitre ajouté compte au moment où il est marqué ;
 * - « status » : un passage à « Terminé » qui fait avancer la progression compte si le titre
 *   était déjà en cours (fin de série), ou toujours pour un film (« vu aujourd'hui ») ;
 *   marquer « Terminé » un titre vu il y a longtemps (depuis « À regarder ») ne gonfle pas le temps du jour ;
 * - « add » : jamais (ajout de ce qu'on a déjà vu = rattrapage de bibliothèque).
 */
export function sessions(history: HistoryEvent[], entries: LibraryEntry[], s: Pick<Settings, 'minutesPerChapter'>): Session[] {
  const parId = new Map(entries.map(e => [e.id, e]));
  const out: Session[] = [];
  for (const h of history) {
    if (h.undone || (h.kind !== 'progress' && h.kind !== 'status')) continue;
    const delta = (h.after.progress ?? 0) - (h.before.progress ?? 0);
    if (h.after.progress === undefined || delta <= 0) continue;
    const e = parId.get(h.entryId) ?? h.snapshot;
    const type = (e?.type ?? (h.entryId.split(':')[1] as MediaType)) as MediaType;
    if (h.kind === 'status' && type !== 'MOVIE' && !ACTIF.has(String(h.before.status ?? ''))) continue;
    const m = e ? minutesParUnite(e, s).minutes : type === 'MANGA' ? s.minutesPerChapter : DUREE_DEFAUT[type];
    out.push({ at: h.at, entryId: h.entryId, type, unites: delta, minutes: delta * m });
  }
  return out.sort((a, b) => a.at - b.at);
}

export type Periode = 'jour' | 'semaine' | 'mois';

/** Début (inclus) et fin (exclue) de la période contenant `ref`, décalée de `decalage` périodes. Semaine = lundi → dimanche. */
export function bornes(periode: Periode, ref: Date, decalage = 0): { debut: Date; fin: Date } {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  if (periode === 'jour') {
    d.setDate(d.getDate() + decalage);
    const fin = new Date(d); fin.setDate(fin.getDate() + 1);
    return { debut: d, fin };
  }
  if (periode === 'semaine') {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7 * decalage);
    const fin = new Date(d); fin.setDate(fin.getDate() + 7);
    return { debut: d, fin };
  }
  d.setDate(1);
  d.setMonth(d.getMonth() + decalage);
  const fin = new Date(d); fin.setMonth(fin.getMonth() + 1);
  return { debut: d, fin };
}

export interface Bilan {
  total: number;
  parType: Record<MediaType, number>;
  unites: Record<MediaType, number>;
  /** Découpage pour le graphique : heures (jour), jours (semaine, mois). */
  tranches: { debut: number; minutes: number; parType: Record<MediaType, number> }[];
  titres: { entryId: string; minutes: number; unites: number }[];
  joursActifs: number;
}

const zero = () => Object.fromEntries(MEDIA_TYPES.map(t => [t, 0])) as Record<MediaType, number>;

export function bilan(liste: Session[], periode: Periode, debut: Date, fin: Date): Bilan {
  const b: Bilan = { total: 0, parType: zero(), unites: zero(), tranches: [], titres: [], joursActifs: 0 };
  // Tranches : 24 heures pour un jour, sinon un jour par tranche.
  const pas = periode === 'jour' ? 3600_000 : 86_400_000;
  const reperes: number[] = [];
  for (let t = new Date(debut); t < fin;) {
    reperes.push(t.getTime());
    if (periode === 'jour') t = new Date(t.getTime() + pas); else { t = new Date(t); t.setDate(t.getDate() + 1); }
  }
  b.tranches = reperes.map(r => ({ debut: r, minutes: 0, parType: zero() }));
  const titres = new Map<string, { minutes: number; unites: number }>();
  const jours = new Set<string>();
  for (const s of liste) {
    if (s.at < debut.getTime() || s.at >= fin.getTime()) continue;
    b.total += s.minutes;
    b.parType[s.type] += s.minutes;
    b.unites[s.type] += s.unites;
    let i = reperes.length - 1;
    while (i > 0 && reperes[i]! > s.at) i--;
    const tr = b.tranches[i]!;
    tr.minutes += s.minutes; tr.parType[s.type] += s.minutes;
    const t = titres.get(s.entryId) ?? { minutes: 0, unites: 0 };
    t.minutes += s.minutes; t.unites += s.unites;
    titres.set(s.entryId, t);
    const d = new Date(s.at); jours.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  b.titres = [...titres].map(([entryId, v]) => ({ entryId, ...v })).sort((x, y) => y.minutes - x.minutes);
  b.joursActifs = jours.size;
  return b;
}

/** Nombre de jours écoulés de la période (pour la moyenne par jour). */
export function joursEcoules(debut: Date, fin: Date, maintenant = new Date()): number {
  const limite = Math.min(fin.getTime(), maintenant.getTime());
  if (limite <= debut.getTime()) return 0;
  return Math.max(1, Math.ceil((limite - debut.getTime()) / 86_400_000));
}

/** Série de jours consécutifs (jusqu'à aujourd'hui ou hier) avec du temps d'écran. */
export function serie(liste: Session[], maintenant = new Date()): number {
  const jours = new Set(liste.map(s => { const d = new Date(s.at); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  const d = new Date(maintenant);
  const cle = () => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!jours.has(cle())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours.has(cle())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** « 12 h 40 », « 45 min », « 3 j 4 h ». */
export function duree(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 48) return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
  const j = Math.floor(h / 24);
  return `${j} j ${h % 24} h`;
}
