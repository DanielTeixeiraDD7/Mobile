/**
 * Repas adaptés aux goûts : aliments exclus, fruits aimés, portions calculées pour l'objectif calorique.
 *
 * Valeurs nutritionnelles : moyennes arrondies pour 100 g d'aliment PRÊT À MANGER (cuit pour le riz, les pâtes,
 * la viande), d'après les ordres de grandeur de la table Ciqual (Anses) et d'étiquettes courantes. Elles varient
 * selon les marques et la cuisson : ce sont des repères, pas des valeurs exactes.
 */
import { CONSEILS, HABITUDES } from './programmes';

export type Exclusion = 'oeufs' | 'legumes' | 'poisson' | 'laitages' | 'viande_rouge' | 'tomate';
export type Fruit = 'pomme' | 'banane' | 'clementine' | 'orange' | 'poire' | 'fraise' | 'raisin' | 'kiwi';
export interface Gouts {
  exclus: Exclusion[];
  fruits: Fruit[];
}
export type Moment = 'petitdej' | 'dejeuner' | 'collation' | 'diner';

export const EXCLUSIONS: { id: Exclusion; label: string; icone: string }[] = [
  { id: 'oeufs', label: 'Œufs', icone: '🥚' },
  { id: 'legumes', label: 'Légumes', icone: '🥦' },
  { id: 'poisson', label: 'Poisson', icone: '🐟' },
  { id: 'laitages', label: 'Laitages', icone: '🥛' },
  { id: 'viande_rouge', label: 'Viande rouge', icone: '🥩' },
  { id: 'tomate', label: 'Sauce tomate', icone: '🍅' },
];
export const FRUITS: { id: Fruit; label: string; icone: string }[] = [
  { id: 'pomme', label: 'Pomme', icone: '🍎' },
  { id: 'banane', label: 'Banane', icone: '🍌' },
  { id: 'clementine', label: 'Clémentine', icone: '🍊' },
  { id: 'orange', label: 'Orange', icone: '🍊' },
  { id: 'poire', label: 'Poire', icone: '🍐' },
  { id: 'fraise', label: 'Fraises', icone: '🍓' },
  { id: 'raisin', label: 'Raisin', icone: '🍇' },
  { id: 'kiwi', label: 'Kiwi', icone: '🥝' },
];
/** Par défaut : rien d'exclu, tous les fruits. */
export const GOUTS_DEFAUT: Gouts = { exclus: [], fruits: FRUITS.map(f => f.id) };
export const MOMENTS: { id: Moment; nom: string; part: number; icone: string }[] = [
  { id: 'petitdej', nom: 'Petit-déjeuner', part: 0.25, icone: '☕' },
  { id: 'dejeuner', nom: 'Déjeuner', part: 0.35, icone: '🍽️' },
  { id: 'collation', nom: 'Collation', part: 0.1, icone: '🍏' },
  { id: 'diner', nom: 'Dîner', part: 0.3, icone: '🌙' },
];

interface Aliment {
  nom: string;
  /** kcal et protéines (g) pour 100 g. */
  kcal: number;
  prot: number;
  /** Ce qui rend l'aliment incompatible avec un goût. */
  tag?: Exclusion;
  fruit?: Fruit;
  /** Unité parlante (ex. « 1 banane ≈ 120 g »). */
  unite?: { nom: string; g: number };
}

export const ALIMENTS = {
  poulet: { nom: 'Filet de poulet grillé', kcal: 140, prot: 30 },
  dinde: { nom: 'Escalope de dinde grillée', kcal: 135, prot: 29 },
  blancDinde: { nom: 'Blanc de dinde (tranches)', kcal: 105, prot: 20, unite: { nom: 'tranche', g: 30 } },
  steak: { nom: 'Steak haché 5 % cuit', kcal: 160, prot: 26, tag: 'viande_rouge' },
  thon: { nom: 'Thon au naturel', kcal: 110, prot: 25, tag: 'poisson' },
  oeuf: { nom: 'Œufs', kcal: 140, prot: 12.5, tag: 'oeufs', unite: { nom: 'œuf', g: 55 } },
  riz: { nom: 'Riz cuit', kcal: 130, prot: 2.7 },
  pates: { nom: 'Pâtes cuites', kcal: 135, prot: 5 },
  fritesFour: { nom: 'Frites au four / air fryer', kcal: 200, prot: 3 },
  pdt: { nom: 'Pommes de terre vapeur ou au four', kcal: 85, prot: 2 },
  painComplet: { nom: 'Pain complet', kcal: 240, prot: 9, unite: { nom: 'tranche', g: 40 } },
  tortilla: { nom: 'Tortilla de blé', kcal: 310, prot: 8.5, unite: { nom: 'tortilla', g: 60 } },
  avoine: { nom: 'Flocons d’avoine', kcal: 370, prot: 13 },
  cereales: { nom: 'Céréales peu sucrées (type pétales de maïs)', kcal: 375, prot: 7 },
  skyr: { nom: 'Skyr nature', kcal: 62, prot: 10.5, tag: 'laitages' },
  fromageBlanc: { nom: 'Fromage blanc 0 %', kcal: 47, prot: 7.5, tag: 'laitages' },
  yaourt: { nom: 'Yaourt nature', kcal: 55, prot: 4, tag: 'laitages', unite: { nom: 'pot', g: 125 } },
  lait: { nom: 'Lait demi-écrémé', kcal: 46, prot: 3.3, tag: 'laitages' },
  emmental: { nom: 'Emmental râpé', kcal: 380, prot: 28, tag: 'laitages' },
  creme: { nom: 'Crème légère 15 %', kcal: 170, prot: 2.8, tag: 'laitages' },
  huile: { nom: 'Huile d’olive', kcal: 900, prot: 0, unite: { nom: 'c. à soupe', g: 10 } },
  ketchup: { nom: 'Ketchup', kcal: 110, prot: 1.2, tag: 'tomate' },
  sauceTomate: { nom: 'Sauce tomate nature', kcal: 45, prot: 1.5, tag: 'tomate' },
  haricots: { nom: 'Haricots verts', kcal: 30, prot: 2, tag: 'legumes' },
  amandes: { nom: 'Amandes', kcal: 600, prot: 21 },
  pomme: { nom: 'Pomme', kcal: 54, prot: 0.3, fruit: 'pomme', unite: { nom: 'pomme', g: 150 } },
  compote: { nom: 'Compote de pomme sans sucre ajouté', kcal: 60, prot: 0.3, fruit: 'pomme', unite: { nom: 'gourde', g: 90 } },
  banane: { nom: 'Banane', kcal: 90, prot: 1.1, fruit: 'banane', unite: { nom: 'banane', g: 120 } },
  clementine: { nom: 'Clémentines', kcal: 45, prot: 0.8, fruit: 'clementine', unite: { nom: 'clémentine', g: 70 } },
  orange: { nom: 'Orange', kcal: 45, prot: 0.9, fruit: 'orange', unite: { nom: 'orange', g: 150 } },
  poire: { nom: 'Poire', kcal: 55, prot: 0.4, fruit: 'poire', unite: { nom: 'poire', g: 150 } },
} satisfies Record<string, Aliment>;
export type CleAliment = keyof typeof ALIMENTS;

interface Composant {
  a: CleAliment;
  g: number;
  /** Portion qui s'ajuste à l'objectif calorique (féculent du repas). */
  ajuste?: { min: number; max: number };
}
export interface Repas {
  id: string;
  moment: Moment;
  nom: string;
  icone: string;
  composants: Composant[];
  astuce?: string;
}

export const REPAS: Repas[] = [
  // ----- Petit-déjeuner -----
  { id: 'pd_skyr', moment: 'petitdej', nom: 'Bol skyr, avoine et banane', icone: '🥣', composants: [{ a: 'skyr', g: 200 }, { a: 'avoine', g: 50, ajuste: { min: 30, max: 90 } }, { a: 'banane', g: 120 }], astuce: 'Prépare-le la veille au frigo : prêt en 10 secondes le matin.' },
  { id: 'pd_tartines', moment: 'petitdej', nom: 'Tartines au blanc de dinde', icone: '🥪', composants: [{ a: 'painComplet', g: 80, ajuste: { min: 40, max: 160 } }, { a: 'blancDinde', g: 90 }, { a: 'clementine', g: 140 }], astuce: 'Salé et rassasiant, sans œuf ni laitage.' },
  { id: 'pd_cereales', moment: 'petitdej', nom: 'Céréales, lait et fromage blanc', icone: '🥛', composants: [{ a: 'lait', g: 250 }, { a: 'cereales', g: 50, ajuste: { min: 30, max: 90 } }, { a: 'fromageBlanc', g: 150 }, { a: 'pomme', g: 150 }] },
  { id: 'pd_oeufs', moment: 'petitdej', nom: 'Œufs brouillés et pain complet', icone: '🍳', composants: [{ a: 'oeuf', g: 110 }, { a: 'painComplet', g: 80, ajuste: { min: 40, max: 160 } }, { a: 'orange', g: 150 }] },
  // ----- Déjeuner -----
  { id: 'dj_poulet_riz', moment: 'dejeuner', nom: 'Poulet grillé et riz', icone: '🍗', composants: [{ a: 'poulet', g: 160 }, { a: 'riz', g: 250, ajuste: { min: 120, max: 400 } }, { a: 'huile', g: 10 }], astuce: 'Pèse le riz cuit une ou deux fois : après, tu sauras à l’œil.' },
  { id: 'dj_dinde_pates', moment: 'dejeuner', nom: 'Dinde et pâtes à l’emmental', icone: '🍝', composants: [{ a: 'dinde', g: 160 }, { a: 'pates', g: 250, ajuste: { min: 120, max: 400 } }, { a: 'emmental', g: 15 }, { a: 'huile', g: 5 }] },
  { id: 'dj_wraps', moment: 'dejeuner', nom: 'Wraps de poulet sauce fromage blanc', icone: '🌯', composants: [{ a: 'tortilla', g: 120, ajuste: { min: 60, max: 180 } }, { a: 'poulet', g: 150 }, { a: 'fromageBlanc', g: 60 }], astuce: 'Sauce : fromage blanc, sel, poivre, ail ou curry. Se mange froid au bureau.' },
  { id: 'dj_poulet_pdt', moment: 'dejeuner', nom: 'Poulet et pommes de terre au four', icone: '🥔', composants: [{ a: 'poulet', g: 160 }, { a: 'pdt', g: 350, ajuste: { min: 200, max: 600 } }, { a: 'huile', g: 10 }], astuce: 'La pomme de terre cale beaucoup pour peu de calories (sans friture).' },
  { id: 'dj_pates_tomate', moment: 'dejeuner', nom: 'Pâtes au poulet, sauce tomate', icone: '🍅', composants: [{ a: 'poulet', g: 150 }, { a: 'pates', g: 250, ajuste: { min: 120, max: 400 } }, { a: 'sauceTomate', g: 100 }, { a: 'emmental', g: 10 }] },
  { id: 'dj_steak', moment: 'dejeuner', nom: 'Steak haché 5 % et pâtes', icone: '🥩', composants: [{ a: 'steak', g: 125 }, { a: 'pates', g: 250, ajuste: { min: 120, max: 400 } }, { a: 'huile', g: 5 }] },
  { id: 'dj_thon', moment: 'dejeuner', nom: 'Riz au thon et haricots verts', icone: '🐟', composants: [{ a: 'thon', g: 140 }, { a: 'riz', g: 220, ajuste: { min: 120, max: 400 } }, { a: 'haricots', g: 200 }, { a: 'huile', g: 10 }] },
  // ----- Collation -----
  { id: 'co_skyr_pomme', moment: 'collation', nom: 'Skyr et pomme', icone: '🍎', composants: [{ a: 'skyr', g: 150 }, { a: 'pomme', g: 150 }] },
  { id: 'co_banane_amandes', moment: 'collation', nom: 'Banane et quelques amandes', icone: '🍌', composants: [{ a: 'banane', g: 120 }, { a: 'amandes', g: 15 }] },
  { id: 'co_clementines', moment: 'collation', nom: 'Clémentines et yaourt', icone: '🍊', composants: [{ a: 'clementine', g: 140 }, { a: 'yaourt', g: 125 }] },
  { id: 'co_dinde', moment: 'collation', nom: 'Roulés de blanc de dinde et compote', icone: '🥓', composants: [{ a: 'blancDinde', g: 90 }, { a: 'compote', g: 90 }], astuce: 'Collation salée, sans laitage.' },
  // ----- Dîner -----
  { id: 'di_frites', moment: 'diner', nom: 'Poulet grillé et frites au four', icone: '🍟', composants: [{ a: 'poulet', g: 160 }, { a: 'fritesFour', g: 150, ajuste: { min: 100, max: 250 } }, { a: 'ketchup', g: 15 }], astuce: 'Frites au four ou à l’air fryer plutôt qu’à la friteuse, 1 à 2 fois par semaine : c’est le même plaisir avec nettement moins d’huile.' },
  { id: 'di_dinde_creme', moment: 'diner', nom: 'Dinde à la crème légère et riz', icone: '🍛', composants: [{ a: 'dinde', g: 160 }, { a: 'creme', g: 30 }, { a: 'riz', g: 220, ajuste: { min: 120, max: 400 } }] },
  { id: 'di_riz_saute', moment: 'diner', nom: 'Riz sauté au poulet', icone: '🥘', composants: [{ a: 'poulet', g: 150 }, { a: 'riz', g: 220, ajuste: { min: 120, max: 400 } }, { a: 'huile', g: 10 }], astuce: 'Une poêle bien chaude, un peu de sauce soja et d’épices : façon riz cantonais, sans légumes.' },
  { id: 'di_pates_dinde', moment: 'diner', nom: 'Pâtes à la dinde et à l’emmental', icone: '🍝', composants: [{ a: 'dinde', g: 150 }, { a: 'pates', g: 220, ajuste: { min: 120, max: 400 } }, { a: 'emmental', g: 15 }] },
  { id: 'di_wraps', moment: 'diner', nom: 'Wraps de dinde grillée', icone: '🌯', composants: [{ a: 'tortilla', g: 120, ajuste: { min: 60, max: 180 } }, { a: 'dinde', g: 150 }, { a: 'huile', g: 5 }] },
];

const arrondi10 = (n: number) => Math.round(n / 10) * 10;

/** Un aliment est-il compatible avec les goûts ? */
export function alimentOk(a: CleAliment, g: Gouts): boolean {
  const x: Aliment = ALIMENTS[a];
  if (x.tag && g.exclus.includes(x.tag)) return false;
  if (x.fruit && !g.fruits.includes(x.fruit)) return false;
  return true;
}
export const repasOk = (r: Repas, g: Gouts) => r.composants.every(c => alimentOk(c.a, g));

export interface Ligne { a: CleAliment; nom: string; g: number; quantite: string; kcal: number; prot: number }
export interface RepasCalcule { repas: Repas; lignes: Ligne[]; kcal: number; prot: number }

function quantite(a: CleAliment, g: number): string {
  const u: Aliment['unite'] = (ALIMENTS[a] as Aliment).unite;
  if (!u) return `${g} g`;
  const n = Math.round((g / u.g) * 2) / 2;
  const nb = String(n).replace('.', ',');
  return `${nb} ${u.nom}${n > 1 && !u.nom.includes(' ') ? 's' : ''} (${g} g)`;
}

/** Portions du repas ajustées pour viser `cible` kcal (seul le féculent marqué « ajuste » change, arrondi à 10 g). */
export function calculer(r: Repas, cible?: number): RepasCalcule {
  const kcalDe = (a: CleAliment, g: number) => (ALIMENTS[a].kcal * g) / 100;
  const grammes = r.composants.map(c => c.g);
  const i = r.composants.findIndex(c => c.ajuste);
  if (cible && i >= 0) {
    const c = r.composants[i]!;
    const fixe = r.composants.reduce((t, x, k) => (k === i ? t : t + kcalDe(x.a, x.g)), 0);
    const g = ((cible - fixe) / ALIMENTS[c.a].kcal) * 100;
    grammes[i] = Math.min(c.ajuste!.max, Math.max(c.ajuste!.min, arrondi10(g)));
  }
  const lignes = r.composants.map((c, k) => {
    const g = grammes[k]!;
    return { a: c.a, nom: ALIMENTS[c.a].nom, g, quantite: quantite(c.a, g), kcal: Math.round(kcalDe(c.a, g)), prot: Math.round((ALIMENTS[c.a].prot * g) / 10) / 10 };
  });
  return { repas: r, lignes, kcal: lignes.reduce((t, l) => t + l.kcal, 0), prot: Math.round(lignes.reduce((t, l) => t + l.prot, 0)) };
}

/** Repas compatibles pour un moment, portions calculées pour la part de l'objectif du jour. */
export function repasPour(moment: Moment, g: Gouts, cibleJour: number): RepasCalcule[] {
  const part = MOMENTS.find(m => m.id === moment)!.part;
  return REPAS.filter(r => r.moment === moment && repasOk(r, g)).map(r => calculer(r, cibleJour * part));
}

/** Exemple de journée (change chaque jour : `jour` = numéro du jour). */
export function journeeType(g: Gouts, cibleJour: number, jour = 0) {
  const repas = MOMENTS.map(m => {
    const options = repasPour(m.id, g, cibleJour);
    return { moment: m, choix: options.length ? options[jour % options.length]! : null };
  });
  const kcal = repas.reduce((t, r) => t + (r.choix?.kcal ?? 0), 0);
  const prot = repas.reduce((t, r) => t + (r.choix?.prot ?? 0), 0);
  return { repas, kcal, prot };
}

/** Habitudes du jour adaptées : sans légumes, on vise des féculents complets et un fruit. */
export function habitudesPour(g: Gouts) {
  const fruits = FRUITS.filter(f => g.fruits.includes(f.id)).map(f => f.label.toLowerCase());
  return HABITUDES.map(h => {
    if (h.id !== 'legumes' || !g.exclus.includes('legumes')) return h;
    return fruits.length
      ? { id: 'fruit', label: `1 fruit dans la journée (${fruits.slice(0, 3).join(', ')})`, icone: '🍎' }
      : { id: 'complet', label: 'Pain, riz ou pâtes complets', icone: '🌾' };
  });
}

/** Conseils du jour sans ceux qui parlent d'aliments exclus. */
export function conseilsPour(g: Gouts): string[] {
  const motsExclus: Record<Exclusion, RegExp> = {
    oeufs: /œuf/i, legumes: /légume/i, poisson: /poisson/i, laitages: /yaourt|skyr|fromage|lait/i, viande_rouge: /bœuf|steak/i, tomate: /tomate/i,
  };
  return CONSEILS.filter(c => !g.exclus.some(x => motsExclus[x].test(c)));
}
