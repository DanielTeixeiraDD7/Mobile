import type { Carte } from './types';

/** Texte sans accents ni ponctuation, en minuscules. */
export const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9/]+/g, ' ').trim();

/**
 * Recherche par nom, numéro (« 010 », « 010/298 », « OGN 10 ») ou extension.
 * Tous les mots doivent être présents ; un numéro seul correspond au numéro de collection.
 */
export function rechercher(cartes: Carte[], q: string): Carte[] {
  const mots = normal(q).split(' ').filter(Boolean);
  if (!mots.length) return [];
  return cartes.filter(c => {
    const num = c.no.split('/')[0]!.replace(/^0+/, '');
    const texte = normal(`${c.n} ${c.s} ${c.sn} ${c.no} ${c.r} ${c.t}`);
    return mots.every(m => (/^\d+$/.test(m) ? num === m.replace(/^0+/, '') || texte.includes(m) : texte.includes(m)));
  });
}
