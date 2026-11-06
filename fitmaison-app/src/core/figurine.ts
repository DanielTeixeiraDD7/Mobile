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
export interface Decor {
  type: 'chaise' | 'mur' | 'marche' | 'table' | 'tapis' | 'porte' | 'ballon' | 'plot' | 'bureau';
  x: number;
  sens?: 1 | -1;
  /** Objet mobile (ballon) : position par pose clé, interpolée comme le corps. y = centre (défaut : posé au sol). */
  xs?: number[];
  ys?: number[];
}
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

/** Où en est l'animation au temps t : transition de la pose i vers la pose j, avancement k (déjà adouci). */
export interface Instant { i: number; j: number; k: number }
export function instant(anim: Animation, t: number): Instant {
  const n = anim.poses.length;
  const durees = anim.poses.map((_, i) => anim.durees[i] ?? anim.durees[anim.durees.length - 1] ?? 1);
  // Cycle : la transition dernière → première n'existe pas (saut invisible).
  const etapes = anim.cycle ? n - 1 : n;
  const total = durees.slice(0, etapes).reduce((a, b) => a + b, 0) || 1;
  let r = ((t % total) + total) % total;
  let i = 0;
  while (i < etapes - 1 && r >= durees[i]!) { r -= durees[i]!; i++; }
  const k = n <= 1 ? 0 : lisse(Math.min(1, r / durees[i]!));
  return { i, j: n <= 1 ? 0 : (i + 1) % n, k };
}

/** Image de l'animation au temps t (s) : squelette déjà placé dans la scène 200 × 200. */
export function image(anim: Animation, t: number): Squelette {
  const { i, j, k } = instant(anim, t);
  return interpoler(anim, anim.poses[i]!, anim.poses[j]!, k);
}

/** Rayon du ballon (unités de scène). */
export const BALLON_R = 7;
export interface PlaceDecor { x: number; y: number; /** Rotation (degrés) : le ballon roule quand il avance. */ angle: number }
/**
 * Position d'un objet du décor au temps t : xs/ys (une valeur par pose clé) interpolés avec la même
 * chronologie et le même adoucissement que le corps. y = centre de l'objet (défaut : posé au sol).
 */
export function placeDecor(anim: Animation, d: Decor, t: number): PlaceDecor {
  const { i, j, k } = instant(anim, t);
  const yDefaut = d.type === 'ballon' ? SOL - BALLON_R : SOL;
  const x = lerp(d.xs?.[i] ?? d.x, d.xs?.[j] ?? d.x, k);
  const y = lerp(d.ys?.[i] ?? yDefaut, d.ys?.[j] ?? yDefaut, k);
  // Roulement sans glisser : avancer de 2πr = un tour complet.
  const angle = d.type === 'ballon' ? ((x - (d.xs?.[0] ?? d.x)) / BALLON_R) * (180 / Math.PI) : 0;
  return { x, y, angle };
}

/** Rectangle [x, y, largeur, hauteur] qui contient le corps pendant tout le mouvement (pour cadrer la caméra). */
export function emprise(anim: Animation, avecDecor = false): [number, number, number, number] {
  const c = dureeCycle(anim) || 1;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const prendre = (x: number, y: number) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  for (let n = 0; n <= 64; n++) {
    const s = image(anim, (c * n) / 64);
    for (const [x, y] of Object.values(s)) prendre(x, y);
    prendre(s.tete[0] - 12, s.tete[1] - 12); prendre(s.tete[0] + 12, s.tete[1] + 12);
  }
  if (avecDecor) {
    for (const d of anim.decor ?? []) {
      const h = { chaise: HAUTEUR.dossier, table: HAUTEUR.table + 4, bureau: HAUTEUR.table + 34, marche: HAUTEUR.marche, plot: 16, ballon: BALLON_R * 2, mur: 0, porte: 0, tapis: 0 }[d.type];
      const l = { chaise: 18, table: 28, bureau: 30, marche: 22, plot: 8, ballon: BALLON_R, mur: 0, porte: 0, tapis: 0 }[d.type];
      for (const x of d.xs ?? [d.x]) { prendre(x - l, SOL - h); prendre(x + l, SOL); }
    }
  }
  prendre(x0, SOL + 2);
  // 1 unité de marge : entre deux échantillons le mouvement peut dépasser très légèrement.
  return [x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2];
}

// =====================================================================================
// Rendu « humain » : contours du corps calculés à partir du squelette (pur, testable).
// =====================================================================================

export type Silhouette = 'standard' | 'robuste';
/** Peintures (dégradés définis par le composant). « F » = membre du fond, plus sombre. */
export type Peinture = 'peau' | 'peauF' | 'maillot' | 'maillotF' | 'short' | 'shortF' | 'chaussette' | 'chaussetteF'
  | 'basket' | 'basketF' | 'semelle' | 'accent' | 'zone' | 'halo' | 'aucune';
export interface Calque { d: string; p: Peinture; c?: string }

const f1 = (v: number) => Math.round(v * 10) / 10;
const pt = (p: XY) => `${f1(p[0])} ${f1(p[1])}`;
const ajoute = (a: XY, b: XY, k = 1): XY => [a[0] + b[0] * k, a[1] + b[1] * k];
const unit = (a: XY, b: XY): XY => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return l < 1e-6 ? [0, 1] : [dx / l, dy / l]; };

/** Courbe lisse qui passe par les points (milieux comme points de passage, sommets comme contrôles). */
function trace(points: XY[], depart = true): string {
  if (points.length < 3) return (depart ? 'M' : 'L') + points.map(pt).join(' L');
  let d = (depart ? 'M' : 'L') + pt(points[0]!);
  for (let i = 1; i < points.length - 1; i++) {
    const m: XY = [(points[i]![0] + points[i + 1]![0]) / 2, (points[i]![1] + points[i + 1]![1]) / 2];
    d += ` Q${pt(points[i]!)} ${i === points.length - 2 ? pt(points[i + 1]!) : pt(m)}`;
  }
  return d;
}

/** Contour fermé lisse (Catmull-Rom → Bézier) : silhouettes du tronc, de la tête, des cheveux. */
export function fermee(p: XY[], tension = 1): string {
  const n = p.length;
  let d = `M${pt(p[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n]!, p1 = p[i]!, p2 = p[(i + 1) % n]!, p3 = p[(i + 2) % n]!;
    const c1: XY = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: XY = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + 'Z';
}

/** Profil d'un segment : rayons aux deux bouts + galbe musculaire de chaque côté (n = côté gauche du sens A→B). */
interface Galbe { ra: number; rb: number; n: number; s: number; pos: number }
const bosse = (f: number, pos: number) => Math.sin(Math.PI * (f < pos ? (f / pos) * 0.5 : 0.5 + ((f - pos) / (1 - pos)) * 0.5));

/**
 * Membre « en chair » : tube effilé A → B avec galbe, bouts arrondis (les articulations se recouvrent : pas de trou au genou).
 * f0..f1 = portion (vêtements), extra = épaisseur du tissu, bouts : arrondi ou coupé net (ourlet).
 */
export function membre(A: XY, B: XY, g: Galbe, o: { f0?: number; f1?: number; extra?: number; capA?: boolean; capB?: boolean } = {}): string {
  const { f0 = 0, f1: fin = 1, extra = 0, capA = true, capB = true } = o;
  const d = unit(A, B), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const n: XY = [-d[1], d[0]];
  const N = 7, cote1: XY[] = [], cote2: XY[] = [];
  for (let q = 0; q <= N; q++) {
    const f = f0 + ((fin - f0) * q) / N;
    const r = lerp(g.ra, g.rb, f), b = bosse(f, g.pos);
    const c = ajoute(A, d, L * f);
    cote1.push(ajoute(c, n, r + g.n * b + extra));
    cote2.push(ajoute(c, n, -(r + g.s * b + extra)));
  }
  cote2.reverse();
  const rB = (lerp(g.ra, g.rb, fin) * 2 + (g.n + g.s) * bosse(fin, g.pos)) / 2 + extra;
  const rA = (lerp(g.ra, g.rb, f0) * 2 + (g.n + g.s) * bosse(f0, g.pos)) / 2 + extra;
  let s = trace(cote1);
  s += capB ? ` A${f1(rB)} ${f1(rB)} 0 0 0 ${pt(cote2[0]!)}` : ` L${pt(cote2[0]!)}`;
  s += ' ' + trace(cote2, false).slice(1).replace(/^/, 'L');
  s += capA ? ` A${f1(rA)} ${f1(rA)} 0 0 0 ${pt(cote1[0]!)}Z` : 'Z';
  return s;
}

function ellipse(c: XY, axe: XY, rx: number, ry: number): string {
  const a = Math.atan2(axe[1], axe[0]) * (180 / Math.PI);
  const p1 = ajoute(c, axe, -rx), p2 = ajoute(c, axe, rx);
  return `M${pt(p1)} A${f1(rx)} ${f1(ry)} ${f1(a)} 0 1 ${pt(p2)} A${f1(rx)} ${f1(ry)} ${f1(a)} 0 1 ${pt(p1)}Z`;
}

interface Gabarit { cuisse: Galbe; tibia: Galbe; bras: Galbe; avbras: Galbe; main: [number, number]; cou: number }
const GABARIT: Record<Silhouette, Gabarit> = {
  standard: {
    cuisse: { ra: 8.4, rb: 5.2, n: 0.9, s: 1.5, pos: 0.38 },
    tibia: { ra: 5.0, rb: 3.1, n: 1.7, s: 0.3, pos: 0.3 },
    bras: { ra: 4.9, rb: 3.4, n: 0.6, s: 0.9, pos: 0.42 },
    avbras: { ra: 3.6, rb: 2.4, n: 0.7, s: 0.7, pos: 0.22 },
    main: [3.3, 2.5], cou: 4.3,
  },
  robuste: {
    cuisse: { ra: 10.2, rb: 6.1, n: 1.2, s: 1.8, pos: 0.36 },
    tibia: { ra: 5.9, rb: 3.7, n: 2.0, s: 0.4, pos: 0.3 },
    bras: { ra: 6.0, rb: 4.2, n: 0.8, s: 1.1, pos: 0.42 },
    avbras: { ra: 4.3, rb: 2.9, n: 0.8, s: 0.8, pos: 0.22 },
    main: [3.7, 2.9], cou: 5.4,
  },
};
/** Vue de face : galbe symétrique, cuisses un peu moins larges (le bassin les englobe). */
const deFace = (g: Galbe, k = 1): Galbe => ({ ...g, ra: g.ra * k, n: (g.n + g.s) / 2, s: (g.n + g.s) / 2 });

/** Chaussure dans le repère du pied (u : talon → pointe, v : vers le tibia). */
const BASKET_PROFIL = (L: number): XY[] => [[-3.9, -1.3], [L + 0.4, -1.3], [L + 2.1, 0.3], [L + 1.4, 2.5], [L - 2.6, 3.7], [3.2, 5.4], [2.2, 7.6], [-2.4, 7.6], [-4.4, 4.2], [-4.6, 0.6]];
const SEMELLE_PROFIL = (L: number): XY[] => [[-4.6, -1.4], [L + 0.6, -1.4], [L + 2.2, 0.2], [L + 1.6, 0.9], [-4.6, 0.9]];
const BASKET_FACE: XY[] = [[-4.4, -1.3], [6.4, -1.3], [7.4, 0.8], [6.2, 3.8], [3, 5.8], [-1.8, 6.6], [-4.6, 4.6], [-5.2, 1]];

function chaussure(cheville: XY, pied: XY, genou: XY, face: boolean, fond: boolean): Calque[] {
  const u = unit(cheville, pied);
  const vers = unit(cheville, genou);
  // v = perpendiculaire au pied, du côté du tibia (le dessus de la chaussure).
  let v: XY = [-u[1], u[0]];
  const devantTibia: XY = [vers[1], -vers[0]];
  if (v[0] * (vers[0] - devantTibia[0] * 0.3) + v[1] * (vers[1] - devantTibia[1] * 0.3) < 0) v = [-v[0], -v[1]];
  const L = Math.hypot(pied[0] - cheville[0], pied[1] - cheville[1]);
  const monde = (q: XY): XY => [cheville[0] + u[0] * q[0] + v[0] * q[1], cheville[1] + u[1] * q[0] + v[1] * q[1]];
  if (face) {
    const corps = BASKET_FACE.map(monde);
    return [
      { d: fermee(corps), p: fond ? 'basketF' : 'basket', c: 'trait' },
      { d: `M${pt(monde([-4.6, 0]))} L${pt(monde([7, 0]))}`, p: 'aucune', c: 'semelle-l' },
    ];
  }
  return [
    { d: fermee(BASKET_PROFIL(L).map(monde)), p: fond ? 'basketF' : 'basket', c: 'trait' },
    { d: fermee(SEMELLE_PROFIL(L).map(monde), 0.4), p: 'semelle' },
    { d: `M${pt(monde([-2.6, 2.6]))} Q${pt(monde([1.5, 2.2]))} ${pt(monde([L - 3.5, 3.1]))}`, p: 'aucune', c: fond ? 'accent-l fond' : 'accent-l' },
    { d: `M${pt(monde([2.6, 4.9]))} L${pt(monde([L - 2.6, 3.4]))}`, p: 'aucune', c: 'lacets' },
  ];
}

function jambe(s: Squelette, cote: 'G' | 'D', g: Gabarit, face: boolean, fond: boolean, zones: Segment[]): Calque[] {
  const H = cote === 'G' ? s.hancheG : s.hancheD, K = cote === 'G' ? s.genouG : s.genouD;
  const C = cote === 'G' ? s.chevilleG : s.chevilleD, P = cote === 'G' ? s.piedG : s.piedD;
  const gc = face ? deFace(g.cuisse, 0.88) : g.cuisse, gt = face ? deFace(g.tibia) : g.tibia;
  // Le tibia s'arrête un peu au-dessus de la cheville : la chaussure prend le relais (rien sous la semelle).
  const dT = unit(K, C);
  const C2 = ajoute(C, dT, -gt.rb * 0.9);
  const F = fond ? 'F' : '';
  const peau = `peau${F}` as Peinture;
  const cuisse = membre(H, K, gc), tibia = membre(K, C2, gt);
  const calques: Calque[] = [
    { d: cuisse, p: peau, c: 'contour' }, { d: tibia, p: peau, c: 'contour' },
    { d: cuisse, p: peau }, { d: tibia, p: peau },
    { d: membre(K, C2, gt, { f0: 0.62, extra: 0.35, capA: false }), p: `chaussette${F}` as Peinture, c: 'trait' },
  ];
  calques.push(...chaussure(C, P, K, face, fond));
  // Short : haut de la cuisse, ourlet net.
  calques.push({ d: membre(H, K, gc, { f1: 0.44, extra: 0.9, capB: false }), p: `short${F}` as Peinture, c: 'trait' });
  if (!fond && !face) {
    const a = ajoute(H, unit(H, K), 3), b = ajoute(H, unit(H, K), 17);
    calques.push({ d: `M${pt(a)} L${pt(b)}`, p: 'aucune', c: 'bande' });
  }
  calques.push(...zone(zones, `cuisse${cote}`, H, K, gc), ...zone(zones, `tibia${cote}`, K, C2, gt));
  return calques;
}

function bras(s: Squelette, cote: 'G' | 'D', g: Gabarit, face: boolean, fond: boolean, zones: Segment[]): Calque[] {
  const E0 = cote === 'G' ? s.epauleG : s.epauleD, Co = cote === 'G' ? s.coudeG : s.coudeD, M = cote === 'G' ? s.mainG : s.mainD;
  // L'articulation de l'épaule est un peu sous la ligne du trapèze (rendu seulement : coude et main ne bougent pas).
  const E = ajoute(E0, unit(s.cou, s.hanche), face ? 2.5 : 4);
  const gb = face ? deFace(g.bras) : g.bras, ga = face ? deFace(g.avbras) : g.avbras;
  const F = fond ? 'F' : '';
  const peau = `peau${F}` as Peinture;
  const dM = unit(Co, M);
  // Main en appui au sol : posée à plat, doigts vers l'avant (rien ne passe sous le sol).
  const auSol = M[1] > SOL - 5 && dM[1] > 0.5;
  const M2 = auSol ? ajoute(M, dM, -ga.rb * 0.8) : M;
  const haut = membre(E, Co, gb), bas = membre(Co, M2, ga);
  const main = auSol
    ? ellipse([M[0] + 2, Math.min(M[1], SOL) - g.main[1] * 0.85], [1, 0], g.main[0] * 1.1, g.main[1] * 0.85)
    : ellipse(ajoute(M, dM, 1.3), dM, g.main[0], g.main[1]);
  return [
    { d: haut, p: peau, c: 'contour' }, { d: bas, p: peau, c: 'contour' }, { d: main, p: peau, c: 'contour' },
    { d: haut, p: peau }, { d: bas, p: peau }, { d: main, p: peau },
    // Manche courte du t-shirt.
    { d: membre(E, Co, gb, { f1: 0.42, extra: 0.8, capB: false }), p: `maillot${F}` as Peinture, c: 'trait' },
    ...zone(zones, `bras${cote}`, E, Co, gb), ...zone(zones, `avbras${cote}`, Co, M2, ga),
  ];
}

/** Zone d'effort : halo + muscle qui s'illumine (par-dessus les vêtements). */
function zone(zones: Segment[], seg: Segment, A: XY, B: XY, g: Galbe): Calque[] {
  if (!zones.includes(seg)) return [];
  const coeur = { ...g, ra: g.ra * 0.78, rb: g.rb * 0.78, n: g.n * 0.8, s: g.s * 0.8 };
  return [
    { d: membre(A, B, g, { f0: 0.08, f1: 0.92, extra: 2.6 }), p: 'halo', c: 'zone-halo' },
    { d: membre(A, B, coeur, { f0: 0.12, f1: 0.88 }), p: 'zone', c: 'zone-coeur' },
  ];
}

/** Corps complet, en calques ordonnés. Le tronc et la tête sont dessinés à part (repère local, voir troncLocal/teteLocal). */
export function corps(s: Squelette, vue: Vue, sil: Silhouette = 'standard', zones: Segment[] = []): { arriere: Calque[]; cou: Calque[]; avant: Calque[] } {
  const g = GABARIT[sil], face = vue === 'face';
  const axe = unit(s.cou, s.tete);
  const avantCou: XY = face ? [0, 0] : [-axe[1], axe[0]];
  const base = ajoute(s.cou, avantCou, 1.2), haut = ajoute(ajoute(s.cou, axe, 11), avantCou, 1.6);
  const cou: Calque[] = [{ d: membre(base, haut, { ra: g.cou, rb: g.cou * 0.92, n: 0, s: 0, pos: 0.5 }), p: 'peau', c: 'contour' }];
  if (face) {
    return {
      arriere: [...jambe(s, 'G', g, true, false, zones), ...jambe(s, 'D', g, true, false, zones)],
      cou,
      avant: [...bras(s, 'G', g, true, false, zones), ...bras(s, 'D', g, true, false, zones)],
    };
  }
  return {
    arriere: [...bras(s, 'G', g, false, true, zones), ...jambe(s, 'G', g, false, true, zones)],
    cou,
    avant: [...jambe(s, 'D', g, false, false, zones), ...bras(s, 'D', g, false, false, zones)],
  };
}

/** Rotation (degrés SVG) du tronc et de la tête, pour dessiner dans leur repère local. */
export function orientation(pose: Squelette): { tronc: number; tete: number } {
  const t = unit(pose.hanche, pose.cou), h = unit(pose.cou, pose.tete);
  const deg = (v: XY) => Math.atan2(v[0], -v[1]) * (180 / Math.PI);
  return { tronc: deg(t), tete: deg(h) };
}

/**
 * Silhouette du tronc dans son repère : hanche en (0, 0), cou en (0, −50), avant vers +x (profil).
 * La version « robuste » a un ventre et un dos plus épais (un coach qui peut te ressembler).
 */
export function troncLocal(vue: Vue, sil: Silhouette = 'standard'): { contour: string; tshirt: string; logo: XY } {
  const r = sil === 'robuste';
  if (vue === 'face') {
    const k = r ? 1 : 0;
    const droite: XY[] = [[4.8 + k * 0.6, -55.5], [9.5, -53.6], [14 + k, -51], [15.5 + k * 1.4, -46.5], [14 + k * 1.8, -40], [13.6 + k * 2.4, -33],
      [12.2 + k * 3.4, -25], [12.4 + k * 3.6, -17], [14 + k * 2.6, -9], [15.2 + k * 2.2, -2], [14.6 + k * 2, 3.6], [6, 6.4]];
    const pts: XY[] = [...droite, [0, 5.2], ...droite.slice().reverse().map(([x, y]): XY => [-x, y])];
    return { contour: fermee(pts), tshirt: 'M-30 -70 H30 V-7 H-30Z', logo: [-7, -41] };
  }
  const ventre = r ? [0, 1.5, 2.2, 3.8, 5.2, 4.6, 2.6, 1, 0.5] : [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const dos = r ? 1.3 : 0;
  const avant: XY[] = [[4.6, -53.4], [8.6, -49.6], [10.6, -42], [10.1, -34], [8.4, -26], [8.7, -17], [8.5, -9], [6.6, -2], [3, 4.6]];
  const arriere: XY[] = [[-3, 6.6], [-8.8, 3.6], [-10.7, -3], [-9.2, -10], [-6.6, -17.5], [-7.5, -26], [-9.5, -36], [-9.4, -44], [-6.8, -50.6], [-3.4, -53.8]];
  // Un peu plus d'épaisseur que le squelette « fil de fer » : cage thoracique et bassin crédibles de profil.
  const pts: XY[] = [...avant.map(([x, y], i): XY => [x * 1.12 + ventre[i]!, y]), ...arriere.map(([x, y]): XY => [x * 1.08 - dos, y])];
  return { contour: fermee(pts), tshirt: 'M-30 -70 H30 V-7 H-30Z', logo: [6.4 + (r ? 1 : 0), -42] };
}

/** Visage : profil (regard vers +x) ou face. Centre de la tête en (0, 0), haut vers −y. */
export function teteLocal(vue: Vue): { oreilles: string; tete: string; cheveux: string; yeux: string; sourcils: string; bouche: string; nez: string } {
  if (vue === 'face') {
    const d: XY[] = [[0, -10.4], [6.4, -8.4], [8.7, -3], [8.3, 2.6], [6.2, 7.2], [2.8, 9.6], [0, 10.1]];
    const tete = fermee([...d, ...d.slice(1, -1).reverse().map(([x, y]): XY => [-x, y])]);
    const ch: XY[] = [[-9, -1.4], [-8.9, -6.6], [-5.4, -10.4], [0, -11.6], [5.4, -10.4], [8.9, -6.6], [9, -1.4], [8, -4.6], [4.4, -7], [0, -7.4], [-4.4, -7], [-8, -4.6]];
    return {
      oreilles: `${ellipse([-8.6, 0.6], [0, 1], 2.9, 1.8)} ${ellipse([8.6, 0.6], [0, 1], 2.9, 1.8)}`,
      tete, cheveux: fermee(ch),
      yeux: `${ellipse([-3.3, -0.6], [1, 0], 1.05, 1.15)} ${ellipse([3.3, -0.6], [1, 0], 1.05, 1.15)}`,
      sourcils: 'M-5.1 -3.4 Q-3.4 -4.4 -1.7 -3.6 M1.7 -3.6 Q3.4 -4.4 5.1 -3.4',
      bouche: 'M-2.3 5.2 Q0 6.6 2.3 5.2',
      nez: 'M0.2 -0.2 Q1.1 2.4 0.9 2.9 Q0.2 3.3 -0.6 3',
    };
  }
  const tete = fermee([[-9.3, -1], [-8, -6.6], [-4.4, -9.8], [1.2, -10.4], [5.9, -8.6], [8.6, -5], [9.3, -2.2], [9, -0.6], [10.9, 2.2], [9.4, 3.2], [9.7, 4.7], [9, 6.1], [8.7, 7.7], [6.4, 9.1], [2.4, 8.4], [-0.6, 6.6], [-3.8, 6], [-7.6, 3.6]]);
  const cheveux = fermee([[7.8, -6.4], [6, -9.6], [1, -11.3], [-5.2, -10.3], [-9.3, -6.3], [-10.2, -0.6], [-8.7, 3.6], [-6.8, 2.6], [-6.6, -1.4], [-4.2, -3.6], [-1.4, -4.4], [0.6, -3], [2.4, -6], [5, -6.8]]);
  return {
    oreilles: ellipse([-1.4, 0.9], [0, 1], 2.5, 1.7), tete, cheveux,
    yeux: ellipse([6.3, -1.4], [0, 1], 1.15, 0.9),
    sourcils: 'M4.6 -3.9 Q6.6 -4.9 8.6 -4',
    bouche: 'M8.1 4.9 L9.3 4.7',
    nez: 'M-1.6 -0.4 Q-0.6 0.9 -1.4 2.2',
  };
}

/** Ombre portée : ellipse au sol sous les appuis (plus nette quand le corps est près du sol). */
export function ombre(s: Squelette): { cx: number; rx: number; o: number } | null {
  let x0 = Infinity, x1 = -Infinity, o = 0;
  for (const [x, y] of Object.values(s)) {
    const proche = 1 - (SOL - y) / 40;
    if (proche <= 0) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); o = Math.max(o, proche);
  }
  if (!Number.isFinite(x0)) return null;
  return { cx: (x0 + x1) / 2, rx: (x1 - x0) / 2 + 12, o: Math.min(1, o) };
}

/** Décor d'arrière-plan du lecteur. */
export type Scene = 'salon' | 'jardin' | 'bureau';
/** Arrière-plan adapté à l'exercice : jardin pour le foot et la marche, bureau pour les pauses actives. */
export function sceneConseillee(anim: Animation, cat = ''): Scene {
  const types = new Set((anim.decor ?? []).map(d => d.type));
  if (cat === 'Football' || types.has('ballon') || types.has('plot')) return 'jardin';
  if (cat === 'Bureau' || types.has('bureau')) return 'bureau';
  return 'salon';
}

// Préférence locale « corpulence du coach » (clé à part : le format des données fitmaison_v1 ne change pas).
const CLE_COACH = 'fitmaison_coach';
export function lireSilhouette(): Silhouette {
  try { return localStorage.getItem(CLE_COACH) === 'robuste' ? 'robuste' : 'standard'; } catch { return 'standard'; }
}
export function ecrireSilhouette(s: Silhouette) { try { localStorage.setItem(CLE_COACH, s); } catch { /* stockage indisponible */ } }

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
