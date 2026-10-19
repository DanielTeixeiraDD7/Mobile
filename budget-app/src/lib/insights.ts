import type { Transaction } from '@/core/types';
import { txOfMonth, byCategory, totals } from '@/core/calc.js';
import { addMonths, currentMonth, daysInMonth, parseIso, today } from '@/core/format.js';
import { categoryById } from '@/core/store.js';

/** Analyses calculées à partir des opérations (aucune donnée nouvelle n'est stockée). */

const jourDuMois = (iso: string) => Number(iso.slice(8, 10));

/** Jours écoulés dans le mois `ym` (mois passé : tout le mois ; futur : 0). */
export function joursEcoules(ym: string, aujourdHui = today()): number {
  const courant = aujourdHui.slice(0, 7);
  if (ym < courant) return daysInMonth(ym);
  if (ym > courant) return 0;
  return jourDuMois(aujourdHui);
}

/** Dépenses cumulées jour par jour (index 0 = jour 1), jusqu'à `jusqua` jours. */
export function cumul(ym: string, type: 'expense' | 'income' = 'expense', jusqua = daysInMonth(ym)): number[] {
  const parJour = new Array<number>(daysInMonth(ym)).fill(0);
  for (const t of txOfMonth(ym)) if (t.type === type) parJour[jourDuMois(t.date) - 1]! += t.amount;
  const out: number[] = [];
  let s = 0;
  for (let i = 0; i < jusqua; i++) { s += parJour[i] ?? 0; out.push(s); }
  return out;
}

export interface Rythme {
  depense: number;
  jours: number; // écoulés
  joursMois: number;
  moyenne: number; // par jour écoulé
  projection: number | null; // fin de mois, mois en cours seulement
  resteParJour: number | null;
  memeDateAvant: number; // dépensé le mois précédent à la même date
  ecartMemeDate: number | null; // ratio vs mois précédent à la même date
}

export function rythme(ym: string, cap: number | null, aujourdHui = today()): Rythme {
  const jours = joursEcoules(ym, aujourdHui);
  const joursMois = daysInMonth(ym);
  const depense = totals(ym).expense;
  const enCours = ym === aujourdHui.slice(0, 7);
  const moyenne = jours ? depense / jours : 0;
  // Projection : rythme des dépenses courantes appliqué aux jours restants (au moins 3 jours écoulés).
  // Les grosses dépenses ponctuelles (loyer…) ne se répètent pas chaque jour : exclues du rythme.
  const ponctuelles = txOfMonth(ym).filter(t => t.type === 'expense' && t.amount >= 10000 && t.amount >= depense * 0.25).reduce((s, t) => s + t.amount, 0);
  const projection = enCours && jours >= 3 ? Math.round(depense + ((depense - ponctuelles) / jours) * (joursMois - jours)) : null;
  const joursRestants = enCours ? joursMois - jours + 1 : 0;
  const resteParJour = enCours && cap != null && joursRestants > 0 ? Math.floor((cap - depense) / joursRestants) : null;
  const avant = addMonths(ym, -1);
  const memeDateAvant = cumul(avant, 'expense', Math.min(jours, daysInMonth(avant))).at(-1) ?? 0;
  const ecartMemeDate = memeDateAvant ? (depense - memeDateAvant) / memeDateAvant : null;
  return { depense, jours, joursMois, moyenne, projection, resteParJour, memeDateAvant, ecartMemeDate };
}

export function plusGrosse(ym: string, type: 'expense' | 'income' = 'expense'): Transaction | null {
  return txOfMonth(ym).filter(t => t.type === type).sort((a, b) => b.amount - a.amount)[0] ?? null;
}

/** Jours sans aucune dépense parmi les jours écoulés. */
export function joursSansDepense(ym: string, aujourdHui = today()): number {
  const jours = joursEcoules(ym, aujourdHui);
  const avec = new Set(txOfMonth(ym).filter(t => t.type === 'expense').map(t => jourDuMois(t.date)));
  let n = 0;
  for (let j = 1; j <= jours; j++) if (!avec.has(j)) n++;
  return n;
}

/** Dépenses par jour de la semaine (0 = lundi), sur le mois. */
export function parJourSemaine(ym: string): number[] {
  const out = new Array<number>(7).fill(0);
  for (const t of txOfMonth(ym)) if (t.type === 'expense') out[(parseIso(t.date).getDay() + 6) % 7]! += t.amount;
  return out;
}

/** Dépenses par jour du mois (heatmap). */
export function parJour(ym: string): number[] {
  const out = new Array<number>(daysInMonth(ym)).fill(0);
  for (const t of txOfMonth(ym)) if (t.type === 'expense') out[jourDuMois(t.date) - 1]! += t.amount;
  return out;
}

/**
 * Catégorie qui varie le plus par rapport au mois précédent.
 * Mois en cours : comparaison à la même date du mois précédent (équitable).
 */
export function variationCategorie(ym: string, aujourdHui = today()) {
  const avant = addMonths(ym, -1);
  const jours = joursEcoules(ym, aujourdHui);
  const maintenant = byCategory(ym);
  const passe = new Map<string, number>();
  for (const t of txOfMonth(avant)) if (t.type === 'expense' && jourDuMois(t.date) <= jours) passe.set(t.categoryId, (passe.get(t.categoryId) ?? 0) + t.amount);
  const ids = new Set([...maintenant.keys(), ...passe.keys()]);
  const lignes = [...ids].map(id => ({ cat: categoryById(id), maintenant: maintenant.get(id) ?? 0, avant: passe.get(id) ?? 0 }))
    .map(l => ({ ...l, ecart: l.maintenant - l.avant }))
    .filter(l => l.avant > 0 && Math.abs(l.ecart) >= 1000); // au moins 10 € d'écart
  return lignes.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))[0] ?? null;
}

/**
 * Dépenses régulières : même catégorie + même note (+ montant proche) présentes
 * dans au moins 2 des 3 derniers mois complets.
 */
export function regulieres(ym = currentMonth()) {
  const mois = [1, 2, 3].map(i => addMonths(ym, -i));
  const groupes = new Map<string, { note: string; categoryId: string; mois: Set<string>; montants: number[] }>();
  for (const m of mois) for (const t of txOfMonth(m)) {
    if (t.type !== 'expense' || !t.note) continue;
    const k = `${t.categoryId}|${t.note.trim().toLowerCase()}`;
    const g = groupes.get(k) ?? { note: t.note, categoryId: t.categoryId, mois: new Set(), montants: [] };
    g.mois.add(m); g.montants.push(t.amount);
    groupes.set(k, g);
  }
  return [...groupes.values()]
    .filter(g => g.mois.size >= 2)
    .map(g => ({ note: g.note, cat: categoryById(g.categoryId), montant: Math.round(g.montants.reduce((a, b) => a + b, 0) / g.montants.length), mois: g.mois.size }))
    .sort((a, b) => b.montant - a.montant);
}
