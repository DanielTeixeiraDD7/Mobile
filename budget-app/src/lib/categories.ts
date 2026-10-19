import type { Category } from '@/core/types';

/** Icône d'une catégorie : par clé pour les catégories d'origine, par mots-clés (FR/PT) sinon. */
const PAR_CLE: Record<string, string> = {
  'cat.groceries': 'panier', 'cat.transport': 'voiture', 'cat.rent': 'maison', 'cat.leisure': 'sourire',
  'cat.health': 'pilule', 'cat.other': 'boite', 'cat.salary': 'portefeuille', 'cat.otherIncome': 'pieces',
};
const MOTS: [RegExp, string][] = [
  [/loyer|renda|maison|casa|logement|habita/i, 'maison'],
  [/voit|carro|essence|gasol|combust|transp|uber|bus|m[ée]tro|comboio|train|parking|estacion|portag/i, 'voiture'],
  [/course|super|compra|mercado|aliment|march[ée]/i, 'panier'],
  [/sant[ée]|sa[uú]de|pharm|farm|m[ée]dic|dent|h[oô]pi/i, 'pilule'],
  [/cadeau|presente|b[ée]b[ée]|enfant|crian|famil|amour/i, 'coeur'],
  [/salai|sal[aá]rio|ordenado|paie|pr[ée]mio|prime/i, 'portefeuille'],
  [/vacance|f[ée]rias|voyage|viagem|h[oô]tel/i, 'etoile'],
  [/factur|eau|[aá]gua|[ée]lectric|eletric|internet|t[ée]l[ée]phone|telefone|gaz|g[aá]s|luz|abonn|assinat/i, 'eclair'],
  [/resto|restau|caf[ée]|bar|sortie|sa[ií]da|loisir|lazer|cin[ée]/i, 'sourire'],
  [/[ée]pargne|poupan|invest/i, 'tirelire'],
];

export function iconeCategorie(c: Pick<Category, 'key' | 'name'>): string | null {
  if (c.key && !c.name && PAR_CLE[c.key]) return PAR_CLE[c.key]!;
  const nom = c.name ?? '';
  for (const [re, ic] of MOTS) if (re.test(nom)) return ic;
  return c.key ? PAR_CLE[c.key] ?? null : null;
}
