/**
 * Personnage articulé en 2D (squelette « fil de fer ») pour montrer chaque exercice.
 *
 * Une pose = des angles ABSOLUS en degrés : 0 = vers le bas, 90 = vers l'avant (droite de l'écran),
 * 180 = vers le haut, -90 = vers l'arrière. Le buste se donne en inclinaison : 0 = droit,
 * 90 = penché à l'horizontale vers l'avant, -90 = allongé tête en arrière.
 * En vue « profil », G = membre du fond (dessiné plus pâle), D = membre du devant.
 * En vue « face », G = côté gauche de l'écran, D = côté droit.
 */
export type Vue = 'profil' | 'face';
export type Membre = 'cuisseG' | 'tibiaG' | 'cuisseD' | 'tibiaD' | 'brasG' | 'avbrasG' | 'brasD' | 'avbrasD' | 'piedG' | 'piedD';
export type Pose = Partial<Record<Membre | 'buste' | 'tete', number>> & { ancre?: Ancre };
export type Point = 'hanche' | 'cou' | 'mainG' | 'mainD' | 'chevilleG' | 'chevilleD' | 'piedG' | 'piedD' | 'genouG' | 'genouD' | 'cheville' | 'main' | 'bas';
/** Point du corps placé à une position donnée (x et/ou y). « bas » = point le plus bas du corps. */
export interface Ancre { x?: [Point, number]; y?: [Point, number] }

export type Segment = 'tronc' | 'cuisseG' | 'tibiaG' | 'cuisseD' | 'tibiaD' | 'brasG' | 'avbrasG' | 'brasD' | 'avbrasD';
export interface Decor { type: 'chaise' | 'mur' | 'marche' | 'table' | 'tapis' | 'porte'; x: number; sens?: 1 | -1 }
export interface Animation {
  vue: Vue;
  poses: Pose[];
  /** Durée (s) de chaque transition pose i → i+1 (et de la dernière vers la première). */
  durees: number[];
  /** La dernière pose équivaut à la première (rotation) : on reboucle sans revenir en arrière. */
  cycle?: boolean;
  decor?: Decor[];
  /** Segments mis en couleur : là où l'effort doit se sentir. */
  zones?: Segment[];
  ancre?: Ancre;
}

export const SOL = 186;
export const LONG = { tronc: 50, cuisse: 40, tibia: 40, bras: 27, avbras: 25, pied: 11, tete: 10, cou: 15 };
/** Hauteurs des supports (pour placer les mains ou les pieds dessus). */
export const HAUTEUR = { chaise: 46, marche: 24, table: 74, dossier: 88 };

type XY = [number, number];
export interface Squelette {
  tete: XY; cou: XY; hanche: XY; epauleG: XY; epauleD: XY; hancheG: XY; hancheD: XY;
  coudeG: XY; mainG: XY; coudeD: XY; mainD: XY; genouG: XY; chevilleG: XY; piedG: XY; genouD: XY; chevilleD: XY; piedD: XY;
}

const RAD = Math.PI / 180;
const dir = (a: number): XY => [Math.sin(a * RAD), Math.cos(a * RAD)];
const plus = (p: XY, a: number, l: number): XY => { const [dx, dy] = dir(a); return [p[0] + dx * l, p[1] + dy * l]; };

const DEFAUT: Required<Omit<Pose, 'ancre'>> = {
  buste: 0, tete: 0, cuisseG: 0, tibiaG: 0, cuisseD: 0, tibiaD: 0, brasG: 0, avbrasG: 0, brasD: 0, avbrasD: 0, piedG: NaN, piedD: NaN,
};

/** Cinématique directe : angles → positions, hanche à l'origine. */
export function squelette(pose: Pose, vue: Vue): Squelette {
  const p = { ...DEFAUT, ...pose };
  const T = 180 - p.buste;
  const hanche: XY = [0, 0];
  const cou = plus(hanche, T, LONG.tronc);
  const tete = plus(cou, T + p.tete, LONG.cou);
  const face = vue === 'face';
  const ecartE = face ? 15 : 0, ecartH = face ? 9 : 0;
  // Face : G à gauche de l'écran (T + 90 pointe vers la gauche quand le buste est droit).
  const epauleG = plus(cou, T + 90, ecartE), epauleD = plus(cou, T - 90, ecartE);
  const hancheG = plus(hanche, T + 90, ecartH), hancheD = plus(hanche, T - 90, ecartH);
  const coudeG = plus(epauleG, p.brasG, LONG.bras), mainG = plus(coudeG, p.avbrasG, LONG.avbras);
  const coudeD = plus(epauleD, p.brasD, LONG.bras), mainD = plus(coudeD, p.avbrasD, LONG.avbras);
  const genouG = plus(hancheG, p.cuisseG, LONG.cuisse), chevilleG = plus(genouG, p.tibiaG, LONG.tibia);
  const genouD = plus(hancheD, p.cuisseD, LONG.cuisse), chevilleD = plus(genouD, p.tibiaD, LONG.tibia);
  // Pied : par défaut perpendiculaire au tibia vers l'avant (profil), vers l'extérieur (face).
  const angPied = (a: number, tibia: number, cote: 1 | -1) => (Number.isNaN(a) ? (face ? tibia + 90 * cote : tibia + 90) : a);
  const piedG = plus(chevilleG, angPied(p.piedG, p.tibiaG, -1), face ? 7 : LONG.pied);
  const piedD = plus(chevilleD, angPied(p.piedD, p.tibiaD, 1), face ? 7 : LONG.pied);
  return { tete, cou, hanche, epauleG, epauleD, hancheG, hancheD, coudeG, mainG, coudeD, mainD, genouG, chevilleG, piedG, genouD, chevilleD, piedD };
}

const CORPS: (keyof Squelette)[] = ['cou', 'hanche', 'coudeG', 'mainG', 'coudeD', 'mainD', 'genouG', 'chevilleG', 'piedG', 'genouD', 'chevilleD', 'piedD', 'epauleG', 'epauleD'];

function valeur(s: Squelette, pt: Point, axe: 0 | 1): number {
  if (pt === 'bas') return Math.max(...CORPS.map(k => s[k][1]), s.tete[1] + LONG.tete);
  if (pt === 'cheville') return (s.chevilleG[axe] + s.chevilleD[axe]) / 2;
  if (pt === 'main') return (s.mainG[axe] + s.mainD[axe]) / 2;
  return s[pt][axe];
}

/** Décalage pour placer la pose selon son ancre (par défaut : chevilles au centre, point le plus bas au sol). */
export function decalage(s: Squelette, ancre: Ancre = {}): XY {
  const ax = ancre.x ?? ['cheville', 100];
  const ay = ancre.y ?? ['bas', SOL];
  return [ax[1] - valeur(s, ax[0], 0), ay[1] - valeur(s, ay[0], 1)];
}

const lisse = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Image de l'animation au temps t (s) : squelette déjà placé dans la scène 200 × 200. */
export function image(anim: Animation, t: number): Squelette {
  const n = anim.poses.length;
  const durees = anim.poses.map((_, i) => anim.durees[i] ?? anim.durees[anim.durees.length - 1] ?? 1);
  // Cycle : la transition dernière → première n'existe pas (saut invisible).
  const etapes = anim.cycle ? n - 1 : n;
  const total = durees.slice(0, etapes).reduce((a, b) => a + b, 0) || 1;
  let r = ((t % total) + total) % total;
  let i = 0;
  while (i < etapes - 1 && r >= durees[i]!) { r -= durees[i]!; i++; }
  const a = anim.poses[i]!, b = anim.poses[(i + 1) % n]!;
  const k = n === 1 ? 0 : lisse(Math.min(1, r / durees[i]!));
  return interpoler(anim, a, b, k);
}

export function interpoler(anim: Animation, a: Pose, b: Pose, k: number): Squelette {
  const cles = Object.keys(DEFAUT) as (keyof typeof DEFAUT)[];
  const pose: Pose = {};
  for (const c of cles) {
    const va = a[c] ?? DEFAUT[c], vb = b[c] ?? DEFAUT[c];
    pose[c] = Number.isNaN(va) || Number.isNaN(vb) ? (k < 0.5 ? va : vb) : lerp(va, vb, k);
  }
  // Le placement aussi s'interpole : chaque pose clé a son propre appui (pieds, mains…).
  const ancA = a.ancre ?? anim.ancre ?? {}, ancB = b.ancre ?? anim.ancre ?? {};
  const sa = squelette(a, anim.vue), sb = squelette(b, anim.vue);
  const da = decalage(sa, ancA), db = decalage(sb, ancB);
  const s = squelette(pose, anim.vue);
  const d: XY = [lerp(da[0], db[0], k), lerp(da[1], db[1], k)];
  // Appui au sol par défaut : recalculé sur l'image intermédiaire (les pieds ne flottent ni ne s'enfoncent).
  if (!ancA.y && !ancB.y) d[1] = decalage(s, { x: ['hanche', 0], y: ['bas', SOL] })[1];
  for (const cle of Object.keys(s) as (keyof Squelette)[]) s[cle] = [s[cle][0] + d[0], s[cle][1] + d[1]];
  return s;
}

/** Durée d'un cycle complet (s). */
export function dureeCycle(anim: Animation): number {
  const n = anim.poses.length;
  const durees = anim.poses.map((_, i) => anim.durees[i] ?? anim.durees[anim.durees.length - 1] ?? 1);
  return durees.slice(0, anim.cycle ? n - 1 : n).reduce((x, y) => x + y, 0);
}
