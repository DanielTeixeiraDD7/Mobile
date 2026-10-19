import type { LibraryEntry, MediaType } from './types';

/** Classement et comparaisons entre amis (calculs purs, testés). */
export type Critere = 'TOTAL' | MediaType;
export interface Ligne { utilisateur: string; jour: string; categorie: MediaType; minutes: number; unites: number }
export interface Personne { id: string; pseudo: string; couleur: string; partage_temps: boolean }
export interface Rang { personne: Personne; valeur: number; moi: boolean; partage: boolean }

/** Valeur d'une ligne selon le critère : minutes, ou chapitres pour le manga (qui n'a pas de temps). */
const valeurDe = (l: Ligne, c: Critere) => (c === 'TOTAL' ? l.minutes : l.categorie !== c ? 0 : c === 'MANGA' ? Number(l.unites) : l.minutes);

/** Classement sur [debut, fin) (jours AAAA-MM-JJ) ; ceux qui ne partagent pas leur temps sont en bas, sans valeur. */
export function classement(lignes: Ligne[], personnes: Personne[], moi: string, debut: string, fin: string, critere: Critere = 'TOTAL'): Rang[] {
  const somme = new Map<string, number>();
  for (const l of lignes) {
    if (l.jour < debut || l.jour >= fin) continue;
    somme.set(l.utilisateur, (somme.get(l.utilisateur) ?? 0) + valeurDe(l, critere));
  }
  return personnes
    .map(p => ({ personne: p, valeur: somme.get(p.id) ?? 0, moi: p.id === moi, partage: p.id === moi || p.partage_temps }))
    .sort((a, b) => Number(b.partage) - Number(a.partage) || b.valeur - a.valeur || a.personne.pseudo.localeCompare(b.personne.pseudo, 'fr'));
}

/** Minutes par jour (7 valeurs à partir du lundi `debut`) et par catégorie pour une personne. */
export function semaineDe(lignes: Ligne[], utilisateur: string, debut: Date): { jours: { jour: string; parType: Record<MediaType, number>; total: number }[]; parType: Record<MediaType, number>; chapitres: number } {
  const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const zero = (): Record<MediaType, number> => ({ MOVIE: 0, TV: 0, ANIME: 0, MANGA: 0 });
  const jours = Array.from({ length: 7 }, (_, i) => { const d = new Date(debut); d.setDate(d.getDate() + i); return { jour: cle(d), parType: zero(), total: 0 }; });
  const index = new Map(jours.map((j, i) => [j.jour, i]));
  const parType = zero();
  let chapitres = 0;
  for (const l of lignes) {
    const i = index.get(l.jour);
    if (l.utilisateur !== utilisateur || i === undefined) continue;
    jours[i]!.parType[l.categorie] += l.minutes;
    jours[i]!.total += l.minutes;
    parType[l.categorie] += l.minutes;
    if (l.categorie === 'MANGA') chapitres += Number(l.unites);
  }
  return { jours, parType, chapitres };
}

export interface TitreAmi { id: string; categorie: MediaType; titre: string; affiche: string | null; statut: string; progression: number; total: number | null; note: number | null }
export interface EnCommun { titre: TitreAmi; mien: LibraryEntry }

/**
 * Titres en commun (vus, en cours ou à voir des deux côtés, hors abandons) et compatibilité :
 * avec au moins 3 titres notés par les deux, 100 % moins 10 points par point d'écart moyen ;
 * sinon, part des titres de l'ami que tu as aussi (indicatif).
 */
export function affinite(mes: LibraryEntry[], siens: TitreAmi[]): { communs: EnCommun[]; compatibilite: number | null; methode: 'notes' | 'titres' | null; notesCommunes: number } {
  const parId = new Map(mes.filter(e => e.status !== 'DROPPED').map(e => [e.id, e]));
  const communs = siens.filter(t => t.statut !== 'DROPPED' && parId.has(t.id)).map(t => ({ titre: t, mien: parId.get(t.id)! }));
  const notes = communs.filter(c => c.titre.note !== null && c.mien.score !== null);
  if (notes.length >= 3) {
    const ecart = notes.reduce((s, c) => s + Math.abs(Number(c.titre.note) - c.mien.score!), 0) / notes.length;
    return { communs, compatibilite: Math.max(0, Math.round(100 - ecart * 10)), methode: 'notes', notesCommunes: notes.length };
  }
  const vus = siens.filter(t => t.statut !== 'DROPPED' && t.statut !== 'PLANNING');
  if (vus.length >= 5) {
    const partages = vus.filter(t => parId.has(t.id)).length;
    return { communs, compatibilite: Math.round((partages / vus.length) * 100), methode: 'titres', notesCommunes: notes.length };
  }
  return { communs, compatibilite: null, methode: null, notesCommunes: notes.length };
}
