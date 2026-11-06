import type { Finition, Historique, Prix } from './types';

export const FINITIONS: Record<Finition, string> = { N: 'Normale', F: 'Foil' };

/** Dollars → euros au taux BCE du jour (arrondi au centime). */
export const enEuros = (usd: number, prix: Pick<Prix, 'usdParEur'>) => Math.round((usd / prix.usdParEur) * 100) / 100;

export function formatEuros(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function formatDollars(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Valeur de référence d'une carte : prix du marché, sinon prix le plus bas proposé. */
export function valeurUsd(prix: Prix, id: string, f: Finition): number | null {
  const l = prix.p[id]?.[f];
  if (!l) return null;
  return l[0] ?? l[1] ?? null;
}

/** Finitions qui ont un prix (la plus chère d'abord n'est pas imposée : normale puis foil). */
export const finitionsDispo = (prix: Prix, id: string): Finition[] => (['N', 'F'] as const).filter(f => prix.p[id]?.[f]);

/** Variation du prix du marché sur la période de l'historique (en %), si au moins deux points. */
export function variation(h: Historique, id: string, f: Finition): { pct: number; jours: number } | null {
  const s = h.p[id]?.[f];
  if (!s) return null;
  const i = s.findIndex(v => v != null);
  let j = s.length - 1;
  while (j >= 0 && s[j] == null) j--;
  if (i < 0 || j <= i) return null;
  const a = s[i]!, b = s[j]!;
  if (a <= 0) return null;
  return { pct: Math.round(((b - a) / a) * 1000) / 10, jours: j - i };
}

/** Lien de recherche Cardmarket (via un moteur de recherche : pas d'accès direct à leurs données). */
export const lienCardmarket = (nom: string) => `https://www.google.com/search?q=${encodeURIComponent(`cardmarket riftbound ${nom}`)}`;
