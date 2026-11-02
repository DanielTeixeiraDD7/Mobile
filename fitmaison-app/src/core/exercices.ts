import { HAUTEUR, SOL, decalage, squelette, type Animation, type Point, type Pose, type Squelette, type Vue } from './figurine';

/**
 * Bibliothèque d'exercices : guide complet (comment faire, quoi sentir, erreurs à éviter)
 * + animation. Les identifiants sont ceux de FitMaison v1 (historique compatible).
 * MET = équivalent métabolique, sert à estimer les calories.
 */
export type Categorie = 'Échauffement' | 'Cardio' | 'Jambes' | 'Fessiers' | 'Haut du corps' | 'Dos' | 'Gainage' | 'Étirement' | 'Bureau' | 'Football';
export type Materiel = 'chaise' | 'mur' | 'marche' | 'support' | 'tapis' | 'porte' | 'ballon' | 'plots';

export interface Exercice {
  id: string;
  nom: string;
  icone: string;
  met: number;
  cat: Categorie;
  /** Résumé en une phrase (ancienne description). */
  resume: string;
  muscles: string;
  materiel: Materiel[];
  depart: string;
  etapes: string[];
  respiration: string;
  cles: string[];
  erreurs: string[];
  /** Où l'effort doit se sentir (et où il ne doit PAS se sentir). */
  sensation: string;
  facile?: string;
  /** Exercice de remplacement plus facile (bouton « Trop dur » pendant la séance). */
  versionFacile?: string;
  difficile?: string;
  securite?: string;
  /** Un côté puis l'autre : la voix annonce le changement à mi-temps. */
  unilateral?: boolean;
  /** Position tenue (pas de répétitions). */
  tenue?: boolean;
  /** Rythme conseillé. */
  tempo?: string;
  anim: Animation;
}

export const MATERIEL: Record<Materiel, { nom: string; icone: string; aide: string }> = {
  chaise: { nom: 'Une chaise stable', icone: '🪑', aide: 'Sans roulettes, calée contre un mur si possible.' },
  mur: { nom: 'Un mur libre', icone: '🧱', aide: 'Un pan de mur dégagé d’environ 1 m.' },
  marche: { nom: 'Une marche', icone: '🪜', aide: 'Première marche d’escalier, seuil de terrasse ou banc bas (15 à 25 cm).' },
  support: { nom: 'Un support à hauteur de hanches', icone: '🛋️', aide: 'Table, plan de travail, dossier de canapé ou muret, bien stable.' },
  tapis: { nom: 'Un tapis ou une serviette', icone: '🧘', aide: 'Pour le dos et les genoux au sol.' },
  porte: { nom: 'Un encadrement de porte', icone: '🚪', aide: 'Pour l’étirement des pectoraux.' },
  ballon: { nom: 'Un ballon', icone: '⚽', aide: 'Ballon de foot (taille 5, ou 4 plus léger). Un peu dégonflé au début : il roule moins vite et reste mieux sous le pied.' },
  plots: { nom: 'Des plots', icone: '🔶', aide: 'Plots de foot, ou à défaut des bouteilles d’eau, des chaussures ou des boîtes posées au sol.' },
};

// ---------- Poses de base ----------
const debout: Pose = {};
const mainsHanches: Pose = { brasG: -25, avbrasG: 60, brasD: -25, avbrasD: 60 };

const ex = (e: Exercice) => e;
/** Planche inclinée mains sur une table (bras à 41° : mains sur le plateau, pointes de pieds au sol). */
const climber = (): Pose => ({ buste: 38, cuisseG: -38, tibiaG: -38, cuisseD: -38, tibiaD: -38, brasG: 41, avbrasG: 41, brasD: 41, avbrasD: 41, piedG: 10, piedD: 10 });

// ---------- Outils d'animation (v3 : bureau, football, pas latéraux) ----------
type Cote = 'G' | 'D';
type Angle = Exclude<keyof Pose, 'ancre'>;
const ANGLES: Angle[] = ['buste', 'tete', 'cuisseG', 'tibiaG', 'cuisseD', 'tibiaD', 'brasG', 'avbrasG', 'brasD', 'avbrasD', 'piedG', 'piedD'];
const PAIRES: [Angle, Angle][] = [['cuisseG', 'cuisseD'], ['tibiaG', 'tibiaD'], ['brasG', 'brasD'], ['avbrasG', 'avbrasD'], ['piedG', 'piedD']];
const POINT_OPPOSE: Partial<Record<Point, Point>> = {
  mainG: 'mainD', mainD: 'mainG', chevilleG: 'chevilleD', chevilleD: 'chevilleG', piedG: 'piedD', piedD: 'piedG', genouG: 'genouD', genouD: 'genouG',
};
/** Jambes : `av` = angles (cuisse, tibia) de la jambe du côté donné, `ar` = ceux de l'autre jambe. */
const jambes = (c: Cote, av: [number, number], ar: [number, number]): Pose => c === 'D'
  ? { cuisseD: av[0], tibiaD: av[1], cuisseG: ar[0], tibiaG: ar[1] }
  : { cuisseG: av[0], tibiaG: av[1], cuisseD: ar[0], tibiaD: ar[1] };
/** Bras : `av` = angles (bras, avant-bras) du bras du côté donné, `ar` = ceux de l'autre bras. */
const bras = (c: Cote, av: [number, number], ar: [number, number]): Pose => c === 'D'
  ? { brasD: av[0], avbrasD: av[1], brasG: ar[0], avbrasG: ar[1] }
  : { brasG: av[0], avbrasG: av[1], brasD: ar[0], avbrasD: ar[1] };
/** Position d'un point du corps dans la scène pour une pose clé (avec son ancre). */
function position(p: Pose, pt: keyof Squelette, vue: Vue = 'profil'): [number, number] {
  const s = squelette(p, vue);
  const [dx, dy] = decalage(s, p.ancre);
  return [s[pt][0] + dx, s[pt][1] + dy];
}
/** Profil : la même pose vue en miroir (le personnage regarde vers la gauche), placée en 200 − x. */
function miroirProfil(p: Pose): Pose {
  const m: Pose = {};
  for (const k of ANGLES) { const v = p[k]; if (v !== undefined) m[k] = -v; }
  m.piedG = -(p.piedG ?? (p.tibiaG ?? 0) + 90);
  m.piedD = -(p.piedD ?? (p.tibiaD ?? 0) + 90);
  if (p.ancre) m.ancre = p.ancre.x ? { ...p.ancre, x: [p.ancre.x[0], 200 - p.ancre.x[1]] } : { ...p.ancre };
  return m;
}
/** Face : la même pose en miroir (gauche ↔ droite), placée en 200 − x. */
function miroirFace(p: Pose): Pose {
  const m: Pose = {};
  if (p.buste !== undefined) m.buste = -p.buste;
  if (p.tete !== undefined) m.tete = -p.tete;
  for (const [g, d] of PAIRES) {
    const vg = p[g], vd = p[d];
    if (vd !== undefined) m[g] = -vd;
    if (vg !== undefined) m[d] = -vg;
  }
  if (p.ancre) m.ancre = p.ancre.x ? { ...p.ancre, x: [POINT_OPPOSE[p.ancre.x[0]] ?? p.ancre.x[0], 200 - p.ancre.x[1]] } : { ...p.ancre };
  return m;
}

/** Assis sur une chaise (profil, chaise vers la droite) : cuisses presque horizontales, pieds à plat. */
const CHAISE = 62;
const assis = (p: Pose = {}, hanche = CHAISE + 6): Pose => ({
  cuisseG: 80, tibiaG: 4, cuisseD: 80, tibiaD: 4, brasG: 15, avbrasG: 40, brasD: 15, avbrasD: 40, ...p, ancre: { x: ['hanche', hanche] },
});

/**
 * Pas latéraux vus de face (sans saut, pieds qui glissent) : n pas vers la droite puis n pas retour.
 * Chaque pose clé est ancrée sur le pied qui ne bouge pas : pas de glissement visible.
 */
function pasLateraux(o: { ferme: number; ouvert: number; n: number; haut: Pose }): Pose[] {
  const pose = (a: number, pt: Point, x: number): Pose => ({ ...o.haut, cuisseG: -a, tibiaG: -a, cuisseD: a, tibiaD: a, ancre: { x: [pt, x] } });
  const largeur = (a: number) => { const s = squelette(pose(a, 'hanche', 0), 'face'); return s.chevilleD[0] - s.chevilleG[0]; };
  const lF = largeur(o.ferme), lO = largeur(o.ouvert), pas = lO - lF;
  const g0 = (200 - lF - o.n * pas) / 2;
  const aller: Pose[] = [];
  for (let k = 0; k < o.n; k++) {
    aller.push(pose(o.ferme, 'chevilleG', g0 + k * pas));
    aller.push(pose(o.ouvert, 'chevilleG', g0 + k * pas));
  }
  // La pose serrée finale est le miroir de la première : la boucle repart sans à-coup.
  return [...aller, ...aller.map(miroirFace)];
}

/** Conduite de balle en marchant (profil) : regard vers le ballon, petits pas. */
const REGARD: Pose = { buste: 6, tete: 14 };
/** Pied `c` devant, posé ; l'autre derrière, sur l'avant du pied. Bras opposés. */
const pasAvant = (c: Cote): Pose => ({ ...REGARD, ...jambes(c, [12, 2], [-7, -11]), ...bras(c, [-16, 15], [22, 55]) });
/** Milieu du pas : appui sur la jambe `c`, l'autre passe genou plié. */
const pasMilieu = (c: Cote): Pose => ({ ...REGARD, ...jambes(c, [3, -1], [14, -28]), brasG: 3, avbrasG: 30, brasD: 3, avbrasD: 30 });
/** Appui sur la jambe gauche, semelle droite posée sur le dessus du ballon. */
const SEMELLE: Pose = { ...REGARD, cuisseG: 6, tibiaG: 0, cuisseD: 50, tibiaD: -15, piedD: 92, brasG: 25, avbrasG: 45, brasD: -15, avbrasD: 10 };
const R_BALLON = 7;

/**
 * Aller-retour ballon au pied : semelle sur le ballon, 4 pas en poussant le ballon,
 * arrêt semelle, demi-tour en tirant le ballon vers l'arrière, et retour (miroir).
 * `chaquePas` : une touche à chaque pas, pied droit puis gauche (slalom) ; sinon une touche tous les deux pas.
 */
function allerRetourBallon(chaquePas: boolean): { poses: Pose[]; durees: number[]; xs: number[] } {
  const s = squelette(pasAvant('D'), 'profil');
  const pas = s.chevilleD[0] - s.chevilleG[0];
  const pointe = s.piedD[0] - s.chevilleD[0] + R_BALLON;
  const sem = squelette(SEMELLE, 'profil');
  const sousSemelle = sem.chevilleD[0] + 6 - sem.chevilleG[0];
  const a = (200 - 4 * pas) / 2;
  const poses: Pose[] = [
    { ...SEMELLE, ancre: { x: ['chevilleG', a] } },
    { ...pasAvant('D'), ancre: { x: ['chevilleG', a] } },
    { ...pasMilieu('D'), ancre: { x: ['chevilleD', a + pas] } },
    { ...pasAvant('G'), ancre: { x: ['chevilleD', a + pas] } },
    { ...pasMilieu('G'), ancre: { x: ['chevilleG', a + 2 * pas] } },
    { ...pasAvant('D'), ancre: { x: ['chevilleG', a + 2 * pas] } },
    { ...pasMilieu('D'), ancre: { x: ['chevilleD', a + 3 * pas] } },
    { ...pasAvant('G'), ancre: { x: ['chevilleD', a + 3 * pas] } },
    { ...SEMELLE, ancre: { x: ['chevilleG', a + 4 * pas] } },
  ];
  // Contact : ballon juste devant la pointe du pied avant.
  const contact = (k: number) => a + k * pas + pointe;
  const debut = a + sousSemelle, fin = a + 4 * pas + sousSemelle;
  let xs: number[];
  if (chaquePas) {
    const c = [contact(1), contact(2), contact(3), contact(4)];
    xs = [debut, c[0]!, (c[0]! + c[1]!) / 2 + 3, c[1]!, (c[1]! + c[2]!) / 2 + 3, c[2]!, (c[2]! + c[3]!) / 2 + 3, c[3]!, fin];
  } else {
    // Touche au départ (semelle) puis au 3e pas ; le ballon ralentit entre deux touches.
    const x1 = contact(1) + 16, c5 = contact(3), d = c5 - x1;
    xs = [debut, x1, x1 + 0.45 * d, x1 + 0.75 * d, x1 + 0.92 * d, c5, c5 + 0.5 * (fin - c5), c5 + 0.85 * (fin - c5), fin];
  }
  const t = chaquePas ? 0.5 : 0.45;
  const durees = [0.55, t, t, t, t, t, t, t, 1.1];
  return { poses: [...poses, ...poses.map(miroirProfil)], durees: [...durees, ...durees], xs: [...xs, ...xs.map(x => 200 - x)] };
}
const CONDUITE = allerRetourBallon(false);
const SLALOM = allerRetourBallon(true);

/** Jambe gauche d'appui, pied droit qui touche le dessus du ballon (pointe de la semelle). */
const TOUCHE_X = 84;
const touche = (c: Cote): Pose => ({ buste: 4, tete: 12, ...jambes(c, [45, 0], [4, 0]), ...(c === 'D' ? { piedD: 105 } : { piedG: 105 }),...bras(c, [-22, 25], [28, 60]), ancre: { x: ['hanche', TOUCHE_X] } });
const TOUCHE_BALLON = position(touche('D'), 'piedD')[0] - 1;

/** Semelle sur le ballon, en équilibre sur la jambe gauche : milieu, roulé vers l'avant, ramené vers soi. */
const SEMELLE_X = 82;
const semelle = (cuisse: number, tibia: number): Pose => ({ ...SEMELLE, cuisseD: cuisse, tibiaD: tibia, ancre: { x: ['chevilleG', SEMELLE_X] } });
const SOUS_SEMELLE = [semelle(50, -15), semelle(51, 2), semelle(50, -15), semelle(48, -25)];

/** Passe / frappe du plat du pied (profil) : appui gauche à côté du ballon, jambe droite qui frappe. */
const FRAPPE_X = 76;
const appuiFrappe = (p: Pose): Pose => ({ buste: 8, tete: 14, cuisseG: 8, tibiaG: 0, ...p, ancre: { x: ['chevilleG', FRAPPE_X] } });
const BALLON_FRAPPE = FRAPPE_X + 27;

export const EXERCICES: Record<string, Exercice> = Object.fromEntries([
  // ===== Échauffement =====
  ex({
    id: 'rotation_bras', nom: 'Rotations des bras', icone: '🔄', met: 2.5, cat: 'Échauffement',
    resume: 'Grands cercles avec les bras tendus, vers l’avant puis vers l’arrière.',
    muscles: 'Épaules (échauffement)', materiel: [],
    depart: 'Debout, pieds largeur de hanches, bras tendus le long du corps.',
    etapes: ['Lève les bras tendus devant toi, puis au-dessus de la tête.', 'Continue vers l’arrière et redescends : tu dessines un grand cercle.', 'À mi-temps, change de sens (vers l’arrière).'],
    respiration: 'Respire librement, calmement.',
    cles: ['Bras tendus, cercles amples et lents', 'Épaules basses, loin des oreilles', 'Ventre légèrement serré'],
    erreurs: ['Faire de petits cercles rapides', 'Cambrer le bas du dos quand les bras passent en haut'],
    sensation: 'Les épaules se réchauffent et se dénouent. Aucun pincement.',
    facile: 'Cercles plus petits, un bras après l’autre.',
    unilateral: true,
    anim: { vue: 'profil', cycle: true, durees: [0.55], poses: [
      { brasG: 0, avbrasG: 0, brasD: 0, avbrasD: 0 }, { brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90 },
      { brasG: 180, avbrasG: 180, brasD: 180, avbrasD: 180 }, { brasG: 270, avbrasG: 270, brasD: 270, avbrasD: 270 },
      { brasG: 360, avbrasG: 360, brasD: 360, avbrasD: 360 },
    ], zones: ['brasG', 'brasD'] },
  }),
  ex({
    id: 'rotation_bassin', nom: 'Rotations du bassin', icone: '⭕', met: 2.5, cat: 'Échauffement',
    resume: 'Mains sur les hanches, dessine des cercles avec le bassin.',
    muscles: 'Bas du dos, hanches (échauffement)', materiel: [],
    depart: 'Debout, pieds un peu plus larges que les hanches, genoux souples, mains sur les hanches.',
    etapes: ['Pousse le bassin vers la droite, puis vers l’avant.', 'Continue vers la gauche, puis vers l’arrière : un cercle complet.', 'Change de sens à mi-temps.'],
    respiration: 'Respire lentement, sans bloquer.',
    cles: ['Le haut du corps reste presque immobile', 'Genoux légèrement fléchis', 'Mouvement lent et rond'],
    erreurs: ['Bouger les épaules au lieu du bassin', 'Aller trop vite'],
    sensation: 'Le bas du dos et les hanches se délient doucement.',
    unilateral: true,
    anim: { vue: 'face', durees: [0.7], ancre: { x: ['hanche', 100] }, poses: [
      { ...mainsHanches, brasG: -30, avbrasG: 50, brasD: 30, avbrasD: -50, cuisseG: -7, tibiaG: -7, cuisseD: -7, tibiaD: -7, buste: 6 },
      { brasG: -30, avbrasG: 50, brasD: 30, avbrasD: -50, cuisseG: 6, tibiaG: -6, cuisseD: -6, tibiaD: 6 },
      { brasG: -30, avbrasG: 50, brasD: 30, avbrasD: -50, cuisseG: 7, tibiaG: 7, cuisseD: 7, tibiaD: 7, buste: -6 },
      { brasG: -30, avbrasG: 50, brasD: 30, avbrasD: -50, cuisseG: 2, tibiaG: -2, cuisseD: -2, tibiaD: 2 },
    ], zones: ['tronc'] },
  }),
  ex({
    id: 'marche', nom: 'Marche sur place', icone: '🚶', met: 3.5, cat: 'Cardio',
    resume: 'Marche sur place en balançant les bras, genoux un peu levés.',
    muscles: 'Cœur, jambes', materiel: [],
    depart: 'Debout, bien droit, regard devant toi.',
    etapes: ['Lève un genou, pose le pied, puis l’autre, sans avancer.', 'Balance le bras opposé à la jambe qui monte.', 'Garde un rythme régulier, comme une marche tranquille.'],
    respiration: 'Respire par le nez si tu peux, calmement.',
    cles: ['Pose l’avant du pied en premier, en douceur', 'Bras pliés qui accompagnent', 'Dos droit'],
    erreurs: ['Taper les pieds au sol', 'Se pencher en avant'],
    sensation: 'Le corps se réchauffe, la respiration s’accélère un peu.',
    anim: { vue: 'profil', durees: [0.28], poses: [
      { cuisseD: 40, tibiaD: 0, brasG: 30, avbrasG: 70, brasD: -20, avbrasD: 20 },
      { brasG: 5, avbrasG: 40, brasD: 5, avbrasD: 40 },
      { cuisseG: 40, tibiaG: 0, brasD: 30, avbrasD: 70, brasG: -20, avbrasG: 20 },
      { brasG: 5, avbrasG: 40, brasD: 5, avbrasD: 40 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),

  // ===== Cardio sans saut =====
  ex({
    id: 'marche_genoux', nom: 'Montées de genoux marchées', icone: '🦵', met: 4.5, cat: 'Cardio',
    resume: 'Monte un genou vers la hanche puis l’autre, en rythme, sans sauter.',
    muscles: 'Cœur, cuisses, abdos', materiel: [],
    depart: 'Debout, pieds largeur de hanches, bras pliés à 90°.',
    etapes: ['Monte le genou droit le plus haut possible (idéal : hauteur de hanche).', 'Repose le pied en douceur, puis monte le genou gauche.', 'Le bras opposé part vers l’avant à chaque genou.', 'Accélère si tu te sens bien, sans jamais sauter.'],
    respiration: 'Souffle à chaque montée de genou, inspire entre deux.',
    cles: ['Buste droit, ne te penche pas en arrière', 'Ventre serré quand le genou monte', 'Toujours un pied au sol'],
    erreurs: ['Se pencher en arrière pour monter plus haut', 'Retomber lourdement sur le talon'],
    sensation: 'Le cœur monte, les cuisses et le bas du ventre travaillent.',
    facile: 'Monte moins haut, plus lentement, en te tenant à un mur.', versionFacile: 'marche',
    difficile: 'Monte plus vite et plus haut, bras qui poussent fort.',
    anim: { vue: 'profil', durees: [0.24], poses: [
      { cuisseD: 85, tibiaD: 0, brasG: 50, avbrasG: 120, brasD: -30, avbrasD: 30 },
      { brasG: 10, avbrasG: 80, brasD: 10, avbrasD: 80 },
      { cuisseG: 85, tibiaG: 0, brasD: 50, avbrasD: 120, brasG: -30, avbrasG: 30 },
      { brasG: 10, avbrasG: 80, brasD: 10, avbrasD: 80 },
    ], zones: ['cuisseG', 'cuisseD', 'tronc'] },
  }),
  ex({
    id: 'step_jack', nom: 'Jumping jacks sans saut', icone: '⭐', met: 4.5, cat: 'Cardio',
    resume: 'Écarte une jambe sur le côté en levant les bras, reviens, puis l’autre jambe.',
    muscles: 'Cœur, épaules, cuisses', materiel: [],
    depart: 'Debout, pieds serrés, bras le long du corps.',
    etapes: ['Pose le pied droit sur le côté (sans sauter) en levant les deux bras au-dessus de la tête.', 'Ramène le pied et baisse les bras.', 'Recommence avec le pied gauche.', 'Garde un rythme dynamique.'],
    respiration: 'Inspire quand les bras montent, souffle quand ils descendent.',
    cles: ['Zéro saut : un pied reste toujours au sol', 'Bras tendus mais pas verrouillés', 'Pointe du pied qui touche le sol en douceur'],
    erreurs: ['Hausser les épaules', 'Plier le dos en arrière quand les bras montent'],
    sensation: 'Le cœur accélère, les épaules chauffent.',
    facile: 'Lève les bras seulement à hauteur d’épaules.', versionFacile: 'marche',
    anim: { vue: 'face', durees: [0.45], ancre: { x: ['hanche', 100] }, poses: [
      { brasG: -12, avbrasG: -8, brasD: 12, avbrasD: 8 },
      { brasG: -150, avbrasG: -165, brasD: 150, avbrasD: 165, cuisseD: 28, tibiaD: 28 },
      { brasG: -12, avbrasG: -8, brasD: 12, avbrasD: 8 },
      { brasG: -150, avbrasG: -165, brasD: 150, avbrasD: 165, cuisseG: -28, tibiaG: -28 },
    ], zones: ['brasG', 'brasD', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'boxe', nom: 'Shadow boxing', icone: '🥊', met: 5.5, cat: 'Cardio',
    resume: 'Garde haute, enchaîne directs et crochets dans le vide.',
    muscles: 'Cœur, épaules, bras, abdos', materiel: [],
    depart: 'Pieds décalés (gauche devant), genoux souples, poings devant le menton.',
    etapes: ['Lance le poing avant droit devant toi (un « direct »), bras presque tendu.', 'Ramène-le tout de suite devant le menton.', 'Lance l’autre poing en pivotant le pied arrière.', 'Enchaîne : direct, direct, crochet… en restant léger.'],
    respiration: 'Souffle par la bouche à chaque coup (« tss »).',
    cles: ['Les poings reviennent toujours protéger le visage', 'Ne verrouille jamais le coude', 'Le buste tourne avec le coup'],
    erreurs: ['Bras tendu à fond (coude qui claque)', 'Rester raide sur les jambes'],
    sensation: 'Épaules et bras qui brûlent, cœur qui monte.',
    facile: 'Coups plus lents, sans pivoter.',
    anim: { vue: 'profil', durees: [0.3, 0.3, 0.3, 0.3], poses: [
      { cuisseD: 12, tibiaD: -10, cuisseG: -10, tibiaG: -12, brasG: 55, avbrasG: 160, brasD: 50, avbrasD: 165, buste: 5 },
      { cuisseD: 12, tibiaD: -10, cuisseG: -10, tibiaG: -12, brasG: 55, avbrasG: 160, brasD: 95, avbrasD: 92, buste: 12 },
      { cuisseD: 12, tibiaD: -10, cuisseG: -10, tibiaG: -12, brasG: 55, avbrasG: 160, brasD: 50, avbrasD: 165, buste: 5 },
      { cuisseD: 12, tibiaD: -10, cuisseG: -10, tibiaG: -12, brasG: 95, avbrasG: 92, brasD: 50, avbrasD: 165, buste: 12 },
    ], zones: ['brasG', 'avbrasG', 'brasD', 'avbrasD'] },
  }),
  ex({
    id: 'talons_fesses', nom: 'Talons-fesses marchés', icone: '🦶', met: 4, cat: 'Cardio',
    resume: 'Ramène un talon vers la fesse puis l’autre, sans sauter.',
    muscles: 'Cœur, arrière des cuisses', materiel: [],
    depart: 'Debout, pieds largeur de hanches, mains sur les hanches ou bras pliés.',
    etapes: ['Plie le genou droit pour amener le talon vers la fesse.', 'Repose le pied, puis fais pareil avec la jambe gauche.', 'Alterne vite, comme une marche sur place très dynamique.'],
    respiration: 'Respiration rythmée, souffle toutes les deux répétitions.',
    cles: ['Les genoux restent pointés vers le sol', 'Buste droit', 'Toujours un pied au sol'],
    erreurs: ['Pencher le buste en avant', 'Écarter le genou sur le côté'],
    sensation: 'L’arrière des cuisses travaille, le cœur accélère.',
    facile: 'Plus lentement, en te tenant à un mur.', versionFacile: 'marche',
    anim: { vue: 'profil', durees: [0.24], poses: [
      { cuisseD: -8, tibiaD: -150, brasG: 35, avbrasG: 90, brasD: -25, avbrasD: 40 },
      { brasG: 5, avbrasG: 60, brasD: 5, avbrasD: 60 },
      { cuisseG: -8, tibiaG: -150, brasD: 35, avbrasD: 90, brasG: -25, avbrasG: 40 },
      { brasG: 5, avbrasG: 60, brasD: 5, avbrasD: 60 },
    ], zones: ['cuisseG', 'cuisseD', 'tibiaG', 'tibiaD'] },
  }),
  ex({
    id: 'climber_incline', nom: 'Mountain climbers inclinés', icone: '⛰️', met: 6, cat: 'Cardio',
    resume: 'Mains sur un support, corps gainé, ramène un genou puis l’autre vers la poitrine.',
    muscles: 'Cœur, abdos, épaules, cuisses', materiel: ['support'],
    depart: 'Mains sur le bord d’une table (ou banc, muret), bras tendus sous les épaules. Recule les pieds : ton corps fait une ligne droite de la tête aux talons.',
    etapes: ['Ramène le genou droit vers la poitrine.', 'Remets le pied en arrière et ramène le genou gauche.', 'Alterne à un rythme régulier, sans sauter : pose le pied à chaque fois.'],
    respiration: 'Souffle à chaque genou qui monte.',
    cles: ['Les épaules restent au-dessus des mains', 'Fesses alignées : ni en l’air, ni affaissées', 'Ventre serré pendant tout l’exercice'],
    erreurs: ['Lever les fesses très haut', 'Laisser le dos se creuser', 'Support qui glisse (vérifie qu’il est stable)'],
    sensation: 'Le ventre et les épaules travaillent, le cœur monte vite.',
    facile: 'Mains contre un mur, mouvement lent.', versionFacile: 'marche_genoux',
    difficile: 'Support plus bas (banc, marche) et rythme plus rapide.',
    securite: 'Vérifie que le support ne bouge pas avant de commencer.',
    anim: { vue: 'profil', durees: [0.16], decor: [{ type: 'table', x: 152 }], ancre: { x: ['main', 152], y: ['main', SOL - HAUTEUR.table] }, poses: [
      { ...climber() },
      { ...climber(), cuisseD: -8, tibiaD: -95 },
      { ...climber(), cuisseD: 55, tibiaD: -35 },
      { ...climber(), cuisseD: -8, tibiaD: -95 },
      { ...climber() },
      { ...climber(), cuisseG: -8, tibiaG: -95 },
      { ...climber(), cuisseG: 55, tibiaG: -35 },
      { ...climber(), cuisseG: -8, tibiaG: -95 },
    ], zones: ['tronc', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'marche_rapide', nom: 'Marche rapide', icone: '🏃', met: 4.3, cat: 'Cardio',
    resume: 'Marche à allure soutenue : tu peux parler mais pas chanter.',
    muscles: 'Cœur, jambes', materiel: [],
    depart: 'Dehors, dans le jardin ou sur place. Bras pliés à 90°.',
    etapes: ['Accélère jusqu’à une allure où tu peux parler mais plus chanter.', 'Fais des pas plus rapides plutôt que plus grands.', 'Les bras pliés balancent d’avant en arrière.'],
    respiration: 'Plus soutenue, mais tu dois pouvoir dire une phrase.',
    cles: ['Pose le talon puis déroule le pied', 'Regard loin devant, épaules relâchées', 'Bras actifs : ils donnent le rythme'],
    erreurs: ['Trop forcer au point de ne plus pouvoir parler', 'Se pencher en avant'],
    sensation: 'Tu as chaud, tu respires plus fort, mais tu tiens la durée.',
    facile: 'Ralentis un peu : la régularité compte plus que la vitesse.', versionFacile: 'marche_normale',
    anim: { vue: 'profil', durees: [0.36], poses: [
      { cuisseD: 35, tibiaD: 5, cuisseG: -15, tibiaG: -25, brasG: 45, avbrasG: 120, brasD: -35, avbrasD: 50 },
      { cuisseG: 35, tibiaG: 5, cuisseD: -15, tibiaD: -25, brasD: 45, avbrasD: 120, brasG: -35, avbrasG: 50 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'marche_normale', nom: 'Marche normale', icone: '🚶', met: 3.3, cat: 'Cardio',
    resume: 'Allure confortable pour récupérer ton souffle.',
    muscles: 'Récupération active', materiel: [],
    depart: 'Continue de marcher, sans t’arrêter.',
    etapes: ['Ralentis à une allure confortable.', 'Relâche les épaules et les bras.', 'Respire profondément pour récupérer.'],
    respiration: 'Longue et calme : tu dois pouvoir chanter.',
    cles: ['Ne t’arrête pas : tu récupères en marchant', 'Épaules relâchées'],
    erreurs: ['S’asseoir (la récupération active est plus efficace)'],
    sensation: 'Le souffle redescend, tu te sens prêt pour la suite.',
    anim: { vue: 'profil', durees: [0.55], poses: [
      { cuisseD: 25, tibiaD: 5, cuisseG: -10, tibiaG: -15, brasG: 20, avbrasG: 35, brasD: -18, avbrasD: -5 },
      { cuisseG: 25, tibiaG: 5, cuisseD: -10, tibiaD: -15, brasD: 20, avbrasD: 35, brasG: -18, avbrasG: -5 },
    ] },
  }),
  ex({
    id: 'burpee_sans_saut', nom: 'Burpees sans saut', icone: '💥', met: 7, cat: 'Cardio',
    resume: 'Accroupi, mains au sol, recule les jambes une par une en planche, reviens, relève-toi.',
    muscles: 'Tout le corps, cœur', materiel: ['tapis'],
    depart: 'Debout, pieds largeur d’épaules.',
    etapes: ['Accroupis-toi et pose les mains au sol devant tes pieds.', 'Recule une jambe, puis l’autre : tu es en planche, bras tendus.', 'Ramène une jambe, puis l’autre, près des mains.', 'Relève-toi en poussant dans les talons.'],
    respiration: 'Souffle en reculant les jambes, et en te relevant.',
    cles: ['En planche : corps droit, ventre serré', 'Mains sous les épaules', 'Tu peux poser les mains sur une chaise pour simplifier'],
    erreurs: ['Laisser le dos s’affaisser en planche', 'Se relever en arrondissant le dos'],
    sensation: 'Tout le corps travaille, le cœur monte fort : c’est normal d’être essoufflé.',
    facile: 'Mains sur une chaise ou un banc au lieu du sol.', versionFacile: 'squat_chaise',
    anim: { vue: 'profil', durees: [0.7, 0.55, 0.55, 0.55, 0.55, 0.7], poses: [
      { ancre: { x: ['cheville', 85] } },
      { buste: 62, cuisseG: 105, tibiaG: -30, cuisseD: 105, tibiaD: -30, brasG: 5, avbrasG: 5, brasD: 5, avbrasD: 5, ancre: { x: ['cheville', 85] } },
      { buste: 75, cuisseG: 105, tibiaG: -30, cuisseD: -75, tibiaD: -75, brasG: 3, avbrasG: 3, brasD: 3, avbrasD: 3, ancre: { x: ['main', 132] } },
      { buste: 78, cuisseG: -78, tibiaG: -78, cuisseD: -78, tibiaD: -78, brasG: 0, avbrasG: 0, brasD: 0, avbrasD: 0, ancre: { x: ['main', 132] } },
      { buste: 75, cuisseD: 105, tibiaD: -30, cuisseG: -75, tibiaG: -75, brasG: 3, avbrasG: 3, brasD: 3, avbrasD: 3, ancre: { x: ['main', 132] } },
      { buste: 62, cuisseG: 105, tibiaG: -30, cuisseD: 105, tibiaD: -30, brasG: 5, avbrasG: 5, brasD: 5, avbrasD: 5, ancre: { x: ['cheville', 85] } },
    ], zones: ['tronc', 'cuisseG', 'cuisseD', 'brasD'] },
  }),

  // ===== Jambes / fessiers =====
  ex({
    id: 'squat_chaise', nom: 'Squat sur chaise', icone: '🪑', met: 5, cat: 'Jambes',
    resume: 'Descends en poussant les fesses en arrière jusqu’à effleurer la chaise, remonte.',
    muscles: 'Cuisses, fessiers', materiel: ['chaise'],
    depart: 'Debout devant une chaise (elle est derrière toi), pieds largeur d’épaules, pointes légèrement vers l’extérieur.',
    etapes: ['Pousse les fesses en arrière comme pour t’asseoir, en pliant les genoux.', 'Tends les bras devant toi pour l’équilibre.', 'Effleure la chaise avec les fesses, sans t’y poser.', 'Remonte en poussant dans les talons.'],
    respiration: 'Inspire en descendant, souffle en remontant.',
    tempo: '2 secondes pour descendre, 1 seconde pour remonter.',
    cles: ['Genoux dans l’axe des pieds (ils ne rentrent pas vers l’intérieur)', 'Talons collés au sol', 'Poitrine fière, dos droit'],
    erreurs: ['Genoux qui se rapprochent en remontant', 'Talons qui décollent', 'S’effondrer sur la chaise'],
    sensation: 'Le devant des cuisses et les fesses chauffent. Pas de douleur dans les genoux.',
    facile: 'Assieds-toi vraiment sur la chaise puis relève-toi.',
    difficile: 'Squat sans chaise, ou pause de 2 secondes en bas.',
    securite: 'Chaise stable, calée contre un mur.',
    anim: { vue: 'profil', durees: [1.6, 1.0], decor: [{ type: 'chaise', x: 58, sens: -1 }], ancre: { x: ['cheville', 106] }, poses: [
      { brasG: 10, avbrasG: 10, brasD: 10, avbrasD: 10 },
      { buste: 38, cuisseG: 78, tibiaG: -18, cuisseD: 78, tibiaD: -18, brasG: 88, avbrasG: 88, brasD: 88, avbrasD: 88 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'squat', nom: 'Squat', icone: '🏋️', met: 5.5, cat: 'Jambes',
    resume: 'Descends comme pour t’asseoir, cuisses vers l’horizontale, remonte en poussant dans les talons.',
    muscles: 'Cuisses, fessiers', materiel: [],
    depart: 'Debout, pieds largeur d’épaules, pointes légèrement ouvertes.',
    etapes: ['Pousse les fesses en arrière et plie les genoux.', 'Descends jusqu’à ce que les cuisses soient presque à l’horizontale (ou moins bas si besoin).', 'Bras tendus devant pour l’équilibre.', 'Remonte en poussant dans les talons, en serrant les fesses en haut.'],
    respiration: 'Inspire en descendant, souffle en remontant.',
    tempo: '2 secondes pour descendre, 1 seconde pour remonter.',
    cles: ['Genoux dans l’axe des pieds', 'Talons au sol', 'Dos droit, regard devant'],
    erreurs: ['Genoux qui rentrent vers l’intérieur', 'Dos arrondi en bas', 'Descendre plus bas que ta souplesse le permet'],
    sensation: 'Cuisses et fessiers. Si tu sens le bas du dos, descends moins bas.',
    facile: 'Squat sur chaise.', versionFacile: 'squat_chaise',
    difficile: 'Pause de 2 secondes en bas, ou descente sur 4 secondes.',
    anim: { vue: 'profil', durees: [1.6, 1.0], ancre: { x: ['cheville', 100] }, poses: [
      { brasG: 10, avbrasG: 10, brasD: 10, avbrasD: 10 },
      { buste: 45, cuisseG: 88, tibiaG: -25, cuisseD: 88, tibiaD: -25, brasG: 92, avbrasG: 92, brasD: 92, avbrasD: 92 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'fente_arriere', nom: 'Fentes arrière assistées', icone: '🦿', met: 5, cat: 'Jambes',
    resume: 'En te tenant à une chaise, recule une jambe et fléchis les deux genoux, reviens. Alterne.',
    muscles: 'Cuisses, fessiers, équilibre', materiel: ['chaise'],
    depart: 'Debout, une main sur le dossier d’une chaise à côté de toi.',
    etapes: ['Fais un grand pas en arrière avec la jambe droite.', 'Plie les deux genoux : le genou arrière descend vers le sol (sans le poser).', 'Pousse dans le talon avant pour revenir debout.', 'Recommence avec la jambe gauche.'],
    respiration: 'Inspire en descendant, souffle en remontant.',
    cles: ['Le genou avant reste au-dessus de la cheville', 'Buste droit', 'Le poids est surtout sur la jambe avant'],
    erreurs: ['Pas trop court : le genou avant dépasse loin devant les orteils', 'Se pencher en avant'],
    sensation: 'La cuisse et la fesse de la jambe AVANT travaillent. Pas de douleur au genou.',
    facile: 'Petite amplitude : descends à peine.', versionFacile: 'squat_chaise',
    difficile: 'Sans te tenir.',
    anim: { vue: 'profil', durees: [1.1, 0.9], decor: [{ type: 'chaise', x: 152 }], poses: [
      { brasD: 40, avbrasD: 75, ancre: { x: ['chevilleD', 112] } },
      { buste: 6, cuisseD: 82, tibiaD: 0, cuisseG: -18, tibiaG: -100, brasD: 48, avbrasD: 80, ancre: { x: ['chevilleD', 112] } },
      { brasD: 40, avbrasD: 75, ancre: { x: ['chevilleD', 112] } },
      { buste: 6, cuisseG: 82, tibiaG: 0, cuisseD: -18, tibiaD: -100, brasD: 48, avbrasD: 80, ancre: { x: ['chevilleG', 112] } },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'chaise_mur', nom: 'Chaise contre le mur', icone: '🧱', met: 4, cat: 'Jambes',
    resume: 'Dos contre un mur, genoux fléchis comme assis sur une chaise invisible. Tiens.',
    muscles: 'Cuisses', materiel: ['mur'], tenue: true,
    depart: 'Dos collé au mur, pieds à environ 50 cm devant toi.',
    etapes: ['Glisse le dos le long du mur en pliant les genoux.', 'Arrête-toi quand les genoux sont pliés à 90° (ou plus haut si c’est dur).', 'Tiens la position, bras le long du corps.'],
    respiration: 'Respire lentement et régulièrement : ne bloque surtout pas ta respiration.',
    cles: ['Genoux au-dessus des chevilles', 'Tout le dos contre le mur', 'Plus tu es haut, plus c’est facile'],
    erreurs: ['Bloquer la respiration', 'Genoux qui dépassent les orteils (pieds trop près du mur)'],
    sensation: 'Les cuisses brûlent : c’est normal. Douleur dans le genou = remonte.',
    facile: 'Remonte plus haut (genoux moins pliés).',
    anim: { vue: 'profil', durees: [2, 2], decor: [{ type: 'mur', x: 52 }], poses: [
      { cuisseG: 88, tibiaG: 0, cuisseD: 88, tibiaD: 0, brasG: 5, avbrasG: 5, brasD: 5, avbrasD: 5, ancre: { x: ['hanche', 62] } },
      { cuisseG: 82, tibiaG: 0, cuisseD: 82, tibiaD: 0, brasG: 5, avbrasG: 5, brasD: 5, avbrasD: 5, ancre: { x: ['hanche', 62] } },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'pont', nom: 'Pont fessier', icone: '🌉', met: 3.5, cat: 'Fessiers',
    resume: 'Allongé sur le dos, genoux pliés : monte le bassin en serrant les fessiers, redescends.',
    muscles: 'Fessiers, arrière des cuisses, bas du dos', materiel: ['tapis'],
    depart: 'Allongé sur le dos, genoux pliés, pieds à plat au sol largeur de hanches, bras le long du corps.',
    etapes: ['Serre les fessiers et pousse dans les talons.', 'Monte le bassin jusqu’à former une ligne droite épaules-hanches-genoux.', 'Tiens 1 seconde en haut.', 'Redescends lentement, vertèbre par vertèbre.'],
    respiration: 'Souffle en montant, inspire en descendant.',
    tempo: '1 seconde pour monter, 1 seconde tenue, 2 secondes pour descendre.',
    cles: ['Pousse dans les TALONS (pas les pointes)', 'Serre fort les fessiers en haut', 'Ne monte pas trop haut : pas de cambrure'],
    erreurs: ['Cambrer le bas du dos en haut', 'Pieds trop loin des fesses'],
    sensation: 'Les fessiers doivent chauffer. Si tu sens surtout le bas du dos, monte moins haut.',
    difficile: 'Sur un seul pied, l’autre jambe tendue.',
    anim: { vue: 'profil', durees: [1.0, 0.9, 1.6], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['cheville', 140] }, poses: [
      { buste: -90, cuisseG: 135, tibiaG: 25, cuisseD: 135, tibiaD: 25, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, tete: 0 },
      { buste: -112, cuisseG: 118, tibiaG: 10, cuisseD: 118, tibiaD: 10, brasG: 92, avbrasG: 92, brasD: 92, avbrasD: 92 },
      { buste: -112, cuisseG: 118, tibiaG: 10, cuisseD: 118, tibiaD: 10, brasG: 92, avbrasG: 92, brasD: 92, avbrasD: 92 },
    ], zones: ['tronc', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'mollets', nom: 'Montées sur pointes', icone: '🦶', met: 3, cat: 'Jambes',
    resume: 'Monte sur la pointe des pieds, redescends lentement.',
    muscles: 'Mollets', materiel: ['mur'],
    depart: 'Debout face à un mur, mains posées dessus pour l’équilibre, pieds largeur de hanches.',
    etapes: ['Monte sur la pointe des pieds le plus haut possible.', 'Tiens 1 seconde en haut.', 'Redescends lentement jusqu’à poser les talons.'],
    respiration: 'Souffle en montant, inspire en descendant.',
    tempo: '1 seconde pour monter, 1 tenue, 2 pour descendre.',
    cles: ['Monte bien haut, sur le gros orteil', 'Corps droit, sans te pencher', 'Descente contrôlée'],
    erreurs: ['Rebondir en bas', 'Monter à moitié'],
    sensation: 'Les mollets chauffent après une quinzaine de répétitions.',
    difficile: 'Sur le bord d’une marche (talons dans le vide), ou sur un pied.',
    anim: { vue: 'profil', durees: [0.9, 0.6, 1.2], decor: [{ type: 'mur', x: 158 }], ancre: { x: ['cheville', 100] }, poses: [
      { buste: 6, brasG: 76, avbrasG: 82, brasD: 76, avbrasD: 82 },
      { buste: 6, brasG: 76, avbrasG: 80, brasD: 76, avbrasD: 80, piedG: 25, piedD: 25 },
      { buste: 6, brasG: 76, avbrasG: 80, brasD: 76, avbrasD: 80, piedG: 25, piedD: 25 },
    ], zones: ['tibiaG', 'tibiaD'] },
  }),
  ex({
    id: 'step_up', nom: 'Montées sur marche', icone: '🪜', met: 6, cat: 'Jambes',
    resume: 'Monte sur une marche un pied après l’autre, redescends. Change de jambe de départ à mi-temps.',
    muscles: 'Cuisses, fessiers, cœur', materiel: ['marche'], unilateral: true,
    depart: 'Debout face à une marche stable (escalier, terrasse, banc bas).',
    etapes: ['Pose TOUT le pied droit sur la marche.', 'Pousse dans ce pied pour monter, puis pose le pied gauche à côté.', 'Redescends le pied droit, puis le gauche.', 'À mi-temps, commence avec l’autre jambe.'],
    respiration: 'Souffle en montant.',
    cles: ['Tout le pied sur la marche, pas seulement la pointe', 'Le genou reste dans l’axe du pied', 'Pousse avec la jambe du haut, pas avec celle du bas'],
    erreurs: ['Marche trop haute ou instable', 'Se pencher très en avant'],
    sensation: 'Cuisse et fesse de la jambe qui monte.',
    facile: 'Marche plus basse, tiens-toi à une rampe.', versionFacile: 'marche_genoux',
    securite: 'Marche stable et non glissante ; tiens une rampe si besoin.',
    anim: { vue: 'profil', durees: [0.7, 0.6, 0.6, 0.7], decor: [{ type: 'marche', x: 128 }], poses: [
      { ancre: { x: ['cheville', 92] } },
      { cuisseD: 62, tibiaD: -8, buste: 10, brasG: 25, avbrasG: 70, ancre: { x: ['chevilleG', 92] } },
      { ancre: { x: ['cheville', 124], y: ['bas', SOL - HAUTEUR.marche] } },
      { cuisseG: -22, tibiaG: -22, buste: 8, cuisseD: 12, tibiaD: -10, ancre: { x: ['chevilleD', 128] } },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),

  // ===== Haut du corps =====
  ex({
    id: 'pompes_mur', nom: 'Pompes contre le mur', icone: '🧍', met: 3.8, cat: 'Haut du corps',
    resume: 'Face au mur, fléchis les coudes pour approcher la poitrine du mur, repousse.',
    muscles: 'Pectoraux, épaules, arrière des bras', materiel: ['mur'],
    depart: 'Face au mur, à un grand pas. Mains sur le mur à hauteur et largeur d’épaules, bras tendus.',
    etapes: ['Plie les coudes pour approcher la poitrine du mur.', 'Garde le corps droit comme une planche.', 'Repousse le mur jusqu’à tendre les bras.'],
    respiration: 'Inspire en approchant, souffle en repoussant.',
    tempo: '2 secondes vers le mur, 1 seconde pour repousser.',
    cles: ['Corps gainé, des talons à la tête', 'Coudes à environ 45° du corps (pas collés, pas écartés à fond)', 'Talons qui peuvent se soulever un peu'],
    erreurs: ['Plier le corps aux hanches', 'Avancer la tête vers le mur au lieu de la poitrine'],
    sensation: 'Poitrine et arrière des bras.',
    difficile: 'Recule les pieds, ou passe aux pompes inclinées.',
    anim: { vue: 'profil', durees: [1.4, 1.0], decor: [{ type: 'mur', x: 166 }], ancre: { x: ['main', 164] }, poses: [
      { buste: 20, cuisseG: -20, tibiaG: -20, cuisseD: -20, tibiaD: -20, brasG: 88, avbrasG: 88, brasD: 88, avbrasD: 88 },
      { buste: 28, cuisseG: -28, tibiaG: -28, cuisseD: -28, tibiaD: -28, brasG: 40, avbrasG: 125, brasD: 40, avbrasD: 125 },
    ], zones: ['brasG', 'avbrasG', 'brasD', 'avbrasD', 'tronc'] },
  }),
  ex({
    id: 'pompes_inclinees', nom: 'Pompes inclinées', icone: '💪', met: 4.5, cat: 'Haut du corps',
    resume: 'Mains sur une table ou un muret, descends la poitrine vers le support, repousse.',
    muscles: 'Pectoraux, épaules, arrière des bras, abdos', materiel: ['support'],
    depart: 'Mains sur le bord d’une table stable, un peu plus larges que les épaules. Recule les pieds : corps droit.',
    etapes: ['Plie les coudes pour descendre la poitrine vers le bord de la table.', 'Garde le corps en planche, ventre serré.', 'Repousse jusqu’à tendre les bras.'],
    respiration: 'Inspire en descendant, souffle en poussant.',
    tempo: '2 secondes pour descendre, 1 pour remonter.',
    cles: ['Corps droit de la tête aux talons', 'Poitrine (pas le menton) vers le support', 'Coudes à 45° du corps'],
    erreurs: ['Fesses en l’air ou dos creusé', 'Descendre à moitié'],
    sensation: 'Poitrine, épaules et arrière des bras.',
    facile: 'Pompes contre le mur.', versionFacile: 'pompes_mur',
    difficile: 'Support plus bas (banc, marche).',
    securite: 'Le support ne doit pas glisser.',
    anim: { vue: 'profil', durees: [1.4, 1.0], decor: [{ type: 'table', x: 156 }], ancre: { x: ['main', 154], y: ['main', SOL - HAUTEUR.table] }, poses: [
      { buste: 38, cuisseG: -38, tibiaG: -38, cuisseD: -38, tibiaD: -38, brasG: 41, avbrasG: 41, brasD: 41, avbrasD: 41, piedG: 10, piedD: 10 },
      { buste: 52, cuisseG: -52, tibiaG: -52, cuisseD: -52, tibiaD: -52, brasG: -25, avbrasG: 110, brasD: -25, avbrasD: 110, piedG: 10, piedD: 10 },
    ], zones: ['brasG', 'avbrasG', 'brasD', 'avbrasD', 'tronc'] },
  }),
  ex({
    id: 'pompes_genoux', nom: 'Pompes sur les genoux', icone: '💪', met: 5, cat: 'Haut du corps',
    resume: 'Genoux au sol, mains un peu plus larges que les épaules, descends et remonte.',
    muscles: 'Pectoraux, épaules, arrière des bras, abdos', materiel: ['tapis'],
    depart: 'À genoux sur un coussin, mains au sol un peu plus larges que les épaules, bras tendus. Ligne droite des genoux à la tête.',
    etapes: ['Plie les coudes pour descendre la poitrine vers le sol.', 'Arrête-toi à quelques centimètres du sol.', 'Repousse jusqu’à tendre les bras.'],
    respiration: 'Inspire en descendant, souffle en poussant.',
    cles: ['Ventre et fessiers serrés : pas de dos creusé', 'Mains sous les épaules, doigts vers l’avant', 'Genoux sur un coussin'],
    erreurs: ['Fesses en arrière (le corps fait un angle)', 'Tête qui descend avant la poitrine'],
    sensation: 'Poitrine et arrière des bras ; le ventre travaille pour rester droit.',
    facile: 'Pompes inclinées.', versionFacile: 'pompes_inclinees',
    anim: { vue: 'profil', durees: [1.4, 1.0], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['main', 140] }, poses: [
      { buste: 62, cuisseG: -62, tibiaG: -95, cuisseD: -62, tibiaD: -95, brasG: 4, avbrasG: 4, brasD: 4, avbrasD: 4, piedG: -60, piedD: -60 },
      { buste: 80, cuisseG: -80, tibiaG: -95, cuisseD: -80, tibiaD: -95, brasG: -95, avbrasG: 35, brasD: -95, avbrasD: 35, piedG: -60, piedD: -60 },
    ], zones: ['brasG', 'avbrasG', 'brasD', 'avbrasD', 'tronc'] },
  }),
  ex({
    id: 'superman', nom: 'Superman', icone: '🦸', met: 3, cat: 'Dos',
    resume: 'Allongé sur le ventre, décolle légèrement bras et jambes, tiens 2 s, repose.',
    muscles: 'Dos, fessiers', materiel: ['tapis'],
    depart: 'Allongé sur le ventre, bras tendus devant toi, jambes tendues, front vers le sol.',
    etapes: ['Décolle en même temps les bras, la poitrine et les jambes de quelques centimètres.', 'Tiens 2 secondes en serrant les fessiers.', 'Repose doucement et relâche.'],
    respiration: 'Souffle en montant, inspire en reposant.',
    cles: ['Regard vers le sol : la nuque reste dans l’alignement', 'Petite amplitude : quelques centimètres suffisent', 'Serre les fessiers'],
    erreurs: ['Lever la tête pour regarder devant', 'Monter trop haut en forçant sur le bas du dos'],
    sensation: 'Le long du dos et les fessiers. Aucune douleur dans les lombaires.',
    facile: 'Lève seulement les bras, puis seulement les jambes.',
    anim: { vue: 'profil', durees: [0.9, 1.4, 1.0], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 92] }, poses: [
      { buste: 90, cuisseG: -90, tibiaG: -90, cuisseD: -90, tibiaD: -90, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, piedG: -170, piedD: -170 },
      { buste: 80, cuisseG: -100, tibiaG: -101, cuisseD: -100, tibiaD: -101, brasG: 102, avbrasG: 102, brasD: 102, avbrasD: 102, piedG: -170, piedD: -170 },
      { buste: 80, cuisseG: -100, tibiaG: -101, cuisseD: -100, tibiaD: -101, brasG: 102, avbrasG: 102, brasD: 102, avbrasD: 102, piedG: -170, piedD: -170 },
    ], zones: ['tronc', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'dips_chaise', nom: 'Dips sur chaise', icone: '🪑', met: 4, cat: 'Haut du corps',
    resume: 'Mains sur le bord d’une chaise derrière toi, fléchis les coudes, remonte.',
    muscles: 'Arrière des bras (triceps), épaules', materiel: ['chaise'],
    depart: 'Assis au bord d’une chaise stable, mains de chaque côté des fesses, doigts vers l’avant. Avance les fesses dans le vide, genoux pliés à 90°.',
    etapes: ['Plie les coudes vers l’arrière pour descendre les fesses.', 'Descends jusqu’à ce que les coudes soient à environ 90°.', 'Pousse dans les mains pour remonter, bras presque tendus.'],
    respiration: 'Inspire en descendant, souffle en remontant.',
    cles: ['Dos près de la chaise', 'Épaules basses, loin des oreilles', 'Coudes qui pointent vers l’arrière, pas sur les côtés'],
    erreurs: ['Descendre trop bas (douleur à l’avant de l’épaule)', 'Pousser avec les jambes'],
    sensation: 'L’arrière des bras. Une douleur devant l’épaule = descends moins.',
    facile: 'Pieds plus proches de la chaise, petite amplitude.', versionFacile: 'pompes_mur',
    securite: 'Chaise stable, calée contre un mur, sans roulettes.',
    anim: { vue: 'profil', durees: [1.3, 1.0], decor: [{ type: 'chaise', x: 56, sens: -1 }], ancre: { x: ['main', 68], y: ['main', SOL - HAUTEUR.chaise] }, poses: [
      { buste: -4, cuisseG: 80, tibiaG: 10, cuisseD: 80, tibiaD: 10, brasG: -22, avbrasG: -8, brasD: -22, avbrasD: -8 },
      { buste: -4, cuisseG: 109, tibiaG: 12, cuisseD: 109, tibiaD: 12, brasG: -78, avbrasG: 12, brasD: -78, avbrasD: 12 },
    ], zones: ['brasG', 'brasD'] },
  }),

  // ===== Gainage =====
  ex({
    id: 'planche_genoux', nom: 'Planche sur les genoux', icone: '📏', met: 3.3, cat: 'Gainage',
    resume: 'Sur les avant-bras et les genoux, corps aligné des épaules aux genoux. Tiens.',
    muscles: 'Abdos (gainage), épaules', materiel: ['tapis'], tenue: true,
    depart: 'Avant-bras au sol, coudes sous les épaules, genoux posés au sol derrière toi.',
    etapes: ['Avance les hanches pour former une ligne droite des épaules aux genoux.', 'Serre le ventre (nombril vers la colonne) et les fessiers.', 'Tiens en respirant.'],
    respiration: 'Respire calmement, sans bloquer : petite inspiration, longue expiration.',
    cles: ['Coudes sous les épaules', 'Ligne droite épaules-hanches-genoux', 'Regard vers le sol'],
    erreurs: ['Fesses en l’air', 'Dos creusé', 'Bloquer sa respiration'],
    sensation: 'Le ventre tremble un peu : c’est le gainage qui travaille. Pas de douleur au dos.',
    difficile: 'Planche sur les pieds.',
    anim: { vue: 'profil', durees: [2, 2], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 92] }, poses: [
      { buste: 78, cuisseG: -78, tibiaG: -92, cuisseD: -78, tibiaD: -92, brasG: 0, avbrasG: 90, brasD: 0, avbrasD: 90, piedG: -150, piedD: -150 },
      { buste: 79, cuisseG: -79, tibiaG: -92, cuisseD: -79, tibiaD: -92, brasG: 0, avbrasG: 90, brasD: 0, avbrasD: 90, piedG: -150, piedD: -150 },
    ], zones: ['tronc'] },
  }),
  ex({
    id: 'planche', nom: 'Planche', icone: '📏', met: 3.8, cat: 'Gainage',
    resume: 'Sur les avant-bras et la pointe des pieds, corps aligné. Tiens.',
    muscles: 'Abdos (gainage), épaules, fessiers', materiel: ['tapis'], tenue: true,
    depart: 'Avant-bras au sol, coudes sous les épaules, jambes tendues en arrière sur la pointe des pieds.',
    etapes: ['Décolle les genoux : ton corps forme une ligne droite de la tête aux talons.', 'Serre le ventre, les fessiers et les cuisses.', 'Tiens en respirant.'],
    respiration: 'Respire calmement, sans bloquer.',
    cles: ['Ligne droite de la tête aux talons', 'Pousse le sol avec les avant-bras', 'Si le dos se creuse : repose les genoux'],
    erreurs: ['Dos qui se creuse (douleur lombaire)', 'Fesses trop hautes', 'Tête qui pend'],
    sensation: 'Le ventre et les épaules travaillent. Douleur dans le bas du dos = genoux au sol.',
    facile: 'Planche sur les genoux.', versionFacile: 'planche_genoux',
    anim: { vue: 'profil', durees: [2, 2], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 96] }, poses: [
      { buste: 80, cuisseG: -80, tibiaG: -80, cuisseD: -80, tibiaD: -80, brasG: 0, avbrasG: 90, brasD: 0, avbrasD: 90, piedG: 10, piedD: 10 },
      { buste: 81, cuisseG: -81, tibiaG: -81, cuisseD: -81, tibiaD: -81, brasG: 0, avbrasG: 90, brasD: 0, avbrasD: 90, piedG: 10, piedD: 10 },
    ], zones: ['tronc', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'bird_dog', nom: 'Bird dog', icone: '🐕', met: 3, cat: 'Gainage',
    resume: 'À quatre pattes, tends un bras et la jambe opposée, tiens 2 s, reviens. Alterne.',
    muscles: 'Abdos profonds, dos, fessiers, équilibre', materiel: ['tapis'],
    depart: 'À quatre pattes : mains sous les épaules, genoux sous les hanches, dos plat.',
    etapes: ['Tends le bras droit devant toi et la jambe gauche derrière toi, à l’horizontale.', 'Tiens 2 secondes sans bouger le dos.', 'Reviens à quatre pattes, puis bras gauche et jambe droite.'],
    respiration: 'Souffle en tendant, inspire en revenant.',
    cles: ['Le dos reste plat comme une table (imagine un verre d’eau posé dessus)', 'Bras et jambe à l’horizontale, pas plus haut', 'Regard vers le sol'],
    erreurs: ['Lever la jambe trop haut et cambrer', 'Bassin qui bascule sur le côté'],
    sensation: 'Le ventre et le bas du dos travaillent pour te stabiliser.',
    facile: 'Tends seulement le bras, puis seulement la jambe.',
    anim: { vue: 'profil', durees: [0.9, 1.0, 0.9, 1.0], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 86] }, poses: [
      { buste: 90, cuisseG: 0, tibiaG: -90, cuisseD: 0, tibiaD: -90, brasG: 0, avbrasG: 0, brasD: 0, avbrasD: 0, piedG: -170, piedD: -170 },
      { buste: 90, cuisseG: -92, tibiaG: -92, cuisseD: 0, tibiaD: -90, brasG: 0, avbrasG: 0, brasD: 92, avbrasD: 92, piedG: -170, piedD: -170 },
      { buste: 90, cuisseG: 0, tibiaG: -90, cuisseD: 0, tibiaD: -90, brasG: 0, avbrasG: 0, brasD: 0, avbrasD: 0, piedG: -170, piedD: -170 },
      { buste: 90, cuisseD: -92, tibiaD: -92, cuisseG: 0, tibiaG: -90, brasD: 0, avbrasD: 0, brasG: 92, avbrasG: 92, piedG: -170, piedD: -170 },
    ], zones: ['tronc'] },
  }),
  ex({
    id: 'dead_bug', nom: 'Dead bug', icone: '🪲', met: 3, cat: 'Gainage',
    resume: 'Sur le dos, bras vers le plafond, genoux à 90° : descends un bras et la jambe opposée, reviens. Alterne.',
    muscles: 'Abdos profonds', materiel: ['tapis'],
    depart: 'Allongé sur le dos, bras tendus vers le plafond, genoux pliés à 90° au-dessus des hanches (tibias à l’horizontale).',
    etapes: ['Colle le bas du dos au sol.', 'Descends lentement le bras droit derrière la tête et tends la jambe gauche vers l’avant, sans toucher le sol.', 'Reviens au centre, puis bras gauche et jambe droite.'],
    respiration: 'Souffle longuement pendant que le bras et la jambe s’éloignent.',
    tempo: 'Lent : 2 secondes pour aller, 2 pour revenir.',
    cles: ['Le bas du dos reste collé au sol TOUT le temps', 'Mouvement lent et contrôlé', 'Si le dos décolle : descends moins la jambe'],
    erreurs: ['Dos qui se décolle quand la jambe descend', 'Aller vite'],
    sensation: 'Le bas du ventre travaille en profondeur.',
    facile: 'Bouge seulement les jambes, bras immobiles.',
    anim: { vue: 'profil', durees: [1.4, 1.4, 1.4, 1.4], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 96] }, poses: [
      { buste: -90, cuisseG: 180, tibiaG: 90, cuisseD: 180, tibiaD: 90, brasG: 180, avbrasG: 180, brasD: 180, avbrasD: 180 },
      { buste: -90, cuisseG: 100, tibiaG: 98, cuisseD: 180, tibiaD: 90, brasG: 180, avbrasG: 180, brasD: 255, avbrasD: 255 },
      { buste: -90, cuisseG: 180, tibiaG: 90, cuisseD: 180, tibiaD: 90, brasG: 180, avbrasG: 180, brasD: 180, avbrasD: 180 },
      { buste: -90, cuisseD: 100, tibiaD: 98, cuisseG: 180, tibiaG: 90, brasD: 180, avbrasD: 180, brasG: 255, avbrasG: 255 },
    ], zones: ['tronc'] },
  }),

  // ===== Étirements / retour au calme =====
  ex({
    id: 'etirement_quadri', nom: 'Étirement des cuisses', icone: '🧘', met: 2.3, cat: 'Étirement',
    resume: 'Debout, attrape une cheville et ramène le talon vers la fesse. Change à mi-temps.',
    muscles: 'Avant des cuisses', materiel: ['mur'], tenue: true, unilateral: true,
    depart: 'Debout, une main contre un mur pour l’équilibre.',
    etapes: ['Plie le genou droit et attrape la cheville avec la main droite.', 'Ramène doucement le talon vers la fesse.', 'Garde les genoux l’un à côté de l’autre et pousse légèrement le bassin vers l’avant.', 'Tiens, puis change de jambe à mi-temps.'],
    respiration: 'Respiration lente ; à chaque expiration, relâche un peu plus.',
    cles: ['Genoux côte à côte', 'Bassin légèrement vers l’avant', 'Tension douce, jamais de douleur'],
    erreurs: ['Genou qui part vers l’arrière ou sur le côté', 'Se cambrer'],
    sensation: 'Étirement à l’avant de la cuisse.',
    facile: 'Utilise une serviette autour de la cheville si tu ne l’attrapes pas.',
    anim: { vue: 'profil', durees: [2, 2], decor: [{ type: 'mur', x: 160 }], ancre: { x: ['chevilleG', 108] }, poses: [
      { cuisseD: -6, tibiaD: -158, brasD: -50, avbrasD: -5, brasG: 75, avbrasG: 80 },
      { cuisseD: -10, tibiaD: -162, brasD: -52, avbrasD: -8, brasG: 75, avbrasG: 80 },
    ], zones: ['cuisseD'] },
  }),
  ex({
    id: 'etirement_ischios', nom: 'Étirement arrière des jambes', icone: '🧘', met: 2.3, cat: 'Étirement',
    resume: 'Talon sur une marche, jambe tendue, penche-toi doucement en avant dos droit. Change à mi-temps.',
    muscles: 'Arrière des cuisses', materiel: ['marche'], tenue: true, unilateral: true,
    depart: 'Debout face à une marche, pose le talon droit dessus, jambe tendue, pointe de pied vers le haut.',
    etapes: ['Mains sur les hanches ou sur la cuisse.', 'Penche-toi en avant en gardant le dos droit, comme pour faire une révérence.', 'Arrête-toi dès que tu sens une tension à l’arrière de la cuisse.', 'Tiens, puis change de jambe à mi-temps.'],
    respiration: 'Longues expirations pour relâcher.',
    cles: ['Dos DROIT : on bascule depuis les hanches', 'Jambe d’appui légèrement fléchie', 'Tension, pas douleur'],
    erreurs: ['Arrondir le dos pour aller plus loin', 'Forcer en à-coups'],
    sensation: 'Étirement à l’arrière de la cuisse (pas derrière le genou).',
    anim: { vue: 'profil', durees: [2.2, 2.2], decor: [{ type: 'marche', x: 140 }], ancre: { x: ['chevilleG', 84] }, poses: [
      { buste: 15, cuisseD: 46, tibiaD: 46, piedD: 160, cuisseG: 5, tibiaG: -5, brasG: 30, avbrasG: 60, brasD: 30, avbrasD: 60 },
      { buste: 40, cuisseD: 46, tibiaD: 46, piedD: 160, cuisseG: 5, tibiaG: -5, brasG: 55, avbrasG: 70, brasD: 55, avbrasD: 70 },
    ], zones: ['cuisseD', 'tibiaD'] },
  }),
  ex({
    id: 'etirement_pecs', nom: 'Étirement pectoraux', icone: '🧘', met: 2.3, cat: 'Étirement',
    resume: 'Avant-bras contre un cadre de porte, avance doucement le buste. Change à mi-temps.',
    muscles: 'Pectoraux, avant des épaules', materiel: ['porte'], tenue: true, unilateral: true,
    depart: 'Debout dans l’encadrement d’une porte, avant-bras droit posé contre le montant, coude à hauteur d’épaule.',
    etapes: ['Fais un petit pas en avant avec la jambe droite.', 'Laisse le buste avancer doucement : le bras reste en arrière.', 'Tiens, puis change de bras à mi-temps.'],
    respiration: 'Respire profondément, gonfle la poitrine.',
    cles: ['Coude à hauteur d’épaule', 'Épaule basse', 'Avance doucement, sans forcer'],
    erreurs: ['Coude trop haut (pincement de l’épaule)', 'Tourner le buste'],
    sensation: 'Étirement sur le devant de la poitrine et de l’épaule.',
    anim: { vue: 'profil', durees: [2, 2], decor: [{ type: 'porte', x: 84 }], ancre: { x: ['chevilleG', 96] }, poses: [
      { buste: 6, cuisseD: 18, tibiaD: -2, cuisseG: -6, tibiaG: -6, brasD: -90, avbrasD: 180 },
      { buste: 12, cuisseD: 22, tibiaD: -4, cuisseG: -10, tibiaG: -10, brasD: -100, avbrasD: 172 },
    ], zones: ['brasD', 'tronc'] },
  }),
  ex({
    id: 'etirement_dos', nom: 'Posture de l’enfant', icone: '🧘', met: 2.3, cat: 'Étirement',
    resume: 'À genoux, fesses vers les talons, allonge les bras devant toi au sol.',
    muscles: 'Dos, épaules, hanches', materiel: ['tapis'], tenue: true,
    depart: 'À genoux, gros orteils qui se touchent, genoux légèrement écartés.',
    etapes: ['Assieds-toi sur les talons.', 'Penche-toi en avant et allonge les bras devant toi au sol.', 'Pose le front au sol (ou sur un coussin) et relâche tout.'],
    respiration: 'Respire dans le dos : à chaque inspiration, le dos se gonfle.',
    cles: ['Fesses vers les talons', 'Épaules relâchées', 'Coussin sous le front ou les fesses si besoin'],
    erreurs: ['Forcer si les genoux font mal'],
    sensation: 'Le dos s’étire et se détend.',
    facile: 'Coussin entre les fesses et les talons.',
    securite: 'Douleur aux genoux : coussin sous les genoux, ou fais l’étirement assis.',
    anim: { vue: 'profil', durees: [2.5, 2.5], decor: [{ type: 'tapis', x: 100 }], ancre: { x: ['hanche', 74] }, poses: [
      { buste: 112, cuisseG: 62, tibiaG: -92, cuisseD: 62, tibiaD: -92, brasG: 96, avbrasG: 92, brasD: 96, avbrasD: 92, piedG: -175, piedD: -175, tete: 10 },
      { buste: 108, cuisseG: 64, tibiaG: -92, cuisseD: 64, tibiaD: -92, brasG: 96, avbrasG: 92, brasD: 96, avbrasD: 92, piedG: -175, piedD: -175, tete: 10 },
    ], zones: ['tronc'] },
  }),
  ex({
    id: 'respiration', nom: 'Respiration profonde', icone: '🌬️', met: 1.5, cat: 'Étirement',
    resume: 'Inspire 4 s par le nez en gonflant le ventre, expire 6 s par la bouche.',
    muscles: 'Récupération', materiel: [],
    depart: 'Debout ou assis, dos droit, épaules relâchées.',
    etapes: ['Inspire par le nez pendant 4 secondes en levant doucement les bras.', 'Expire par la bouche pendant 6 secondes en les baissant.', 'Recommence en suivant le rythme de l’animation.'],
    respiration: '4 secondes d’inspiration, 6 secondes d’expiration.',
    cles: ['Le ventre se gonfle à l’inspiration', 'Expiration plus longue que l’inspiration'],
    erreurs: ['Lever les épaules en inspirant'],
    sensation: 'Le cœur ralentit, le corps se détend.',
    anim: { vue: 'face', durees: [4, 6], ancre: { x: ['hanche', 100] }, poses: [
      { brasG: -12, avbrasG: -8, brasD: 12, avbrasD: 8 },
      { brasG: -95, avbrasG: -110, brasD: 95, avbrasD: 110 },
    ], zones: ['tronc'] },
  }),

  // ===== Pauses bureau (v3) : en tenue de travail, à côté du bureau =====
  // MET : 2024 Adult Compendium of Physical Activities (pacompendium.com), code cité pour chaque exercice.
  ex({
    // 02340 « Sit to stand exercise, 6-12 times/min » : 2,8 MET.
    id: 'assis_debout', nom: 'Assis-debout', icone: '🪑', met: 2.8, cat: 'Bureau',
    resume: 'Lève-toi de ta chaise sans les mains, puis rassieds-toi lentement : le meilleur réflexe entre deux mails.',
    muscles: 'Cuisses, fessiers (et le cœur, un peu)', materiel: ['chaise'],
    depart: 'Assis au bord d’une chaise stable, pieds à plat largeur de hanches, un peu en arrière des genoux. Bras tendus devant toi (ou croisés sur la poitrine).',
    etapes: ['Penche le buste en avant, dos droit : ton nez passe au-dessus de tes orteils.', 'Pousse dans les talons pour te lever, jusqu’à être bien droit, fessiers serrés.', 'Rassieds-toi lentement en poussant les fesses en arrière, comme pour un squat.', 'Effleure la chaise et repars, ou pose-toi une seconde si tu en as besoin.'],
    respiration: 'Souffle en te levant, inspire en te rasseyant.',
    tempo: '1 à 2 secondes pour te lever, 3 secondes pour te rasseoir.',
    cles: ['Genoux dans l’axe des pieds, jamais vers l’intérieur', 'Poids sur les talons, pas sur les orteils', 'Descente freinée : tu ne te laisses jamais tomber'],
    erreurs: ['Se laisser tomber sur la chaise (choc pour le dos)', 'Se lever d’un coup de reins en arrondissant le dos', 'Pieds trop loin devant : impossible de se lever sans élan'],
    sensation: 'Le devant des cuisses et les fessiers chauffent. Rien dans les genoux ni dans le bas du dos.',
    facile: 'Aide-toi des mains sur les cuisses ou sur les accoudoirs, ou rehausse l’assise avec un coussin.',
    difficile: 'Descente sur 4 secondes, ou squat sur chaise (sans t’asseoir).',
    securite: 'Chaise SANS roulettes, calée contre un mur ou le bureau. Si ta chaise de bureau roule, prends une chaise fixe.',
    anim: { vue: 'profil', durees: [0.8, 1.3, 0.7, 1.5, 1.5], decor: [{ type: 'chaise', x: CHAISE }], ancre: { x: ['cheville', 100] }, poses: [
      { buste: 6, cuisseG: 80, tibiaG: -8, cuisseD: 80, tibiaD: -8, brasG: 75, avbrasG: 85, brasD: 75, avbrasD: 85 },
      { buste: 42, cuisseG: 80, tibiaG: -8, cuisseD: 80, tibiaD: -8, brasG: 88, avbrasG: 90, brasD: 88, avbrasD: 90 },
      { brasG: 8, avbrasG: 10, brasD: 8, avbrasD: 10 },
      { brasG: 8, avbrasG: 10, brasD: 8, avbrasD: 10 },
      { buste: 32, cuisseG: 52, tibiaG: -10, cuisseD: 52, tibiaD: -10, brasG: 85, avbrasG: 88, brasD: 85, avbrasD: 88 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    // 02101 « Stretching, mild » : 2,3 MET.
    id: 'etirement_flechisseurs', nom: 'Étirement du devant des hanches', icone: '🧘', met: 2.3, cat: 'Bureau',
    resume: 'Debout en fente courte, bascule le bassin pour étirer le devant de la hanche, raccourci par les heures assis.',
    muscles: 'Fléchisseurs de hanche (psoas), avant des cuisses', materiel: ['chaise'], tenue: true, unilateral: true,
    depart: 'Debout, une main sur le dossier d’une chaise ou le bord du bureau. Recule la jambe droite d’un grand pas, talon arrière décollé, pieds bien dans l’axe.',
    etapes: ['Plie légèrement les deux genoux, buste droit.', 'Rentre le bas du ventre et serre la fesse droite : le bassin bascule, comme pour ramener la ceinture vers le nombril.', 'Avance doucement le bassin de quelques centimètres, jusqu’à sentir l’étirement devant la hanche droite.', 'Tiens, puis change de jambe à mi-temps.'],
    respiration: 'Respire lentement ; à chaque expiration, serre un peu plus la fesse de la jambe arrière.',
    cles: ['C’est la bascule du bassin qui étire, pas la profondeur de la fente', 'Buste droit, sans te cambrer', 'Genou avant au-dessus de la cheville'],
    erreurs: ['Cambrer le bas du dos pour aller plus loin', 'Fente profonde qui charge le genou avant', 'Pied arrière qui tourne vers l’extérieur'],
    sensation: 'Étirement doux devant la hanche et en haut de la cuisse de la jambe arrière. Rien dans le bas du dos.',
    facile: 'Pas plus court, bassin à peine basculé.',
    difficile: 'Lève le bras du côté de la jambe arrière au-dessus de la tête, sans te cambrer.',
    securite: 'Gêne dans le bas du dos : rentre davantage le ventre et raccourcis le pas.',
    anim: { vue: 'profil', durees: [2.2, 2.2], decor: [{ type: 'chaise', x: 150 }], ancre: { x: ['chevilleG', 118] }, poses: [
      { buste: -3, cuisseG: 28, tibiaG: 3, cuisseD: -22, tibiaD: -30, piedD: 70, brasG: 45, avbrasG: 45, brasD: -25, avbrasD: 60 },
      { buste: -4, cuisseG: 30, tibiaG: -2, cuisseD: -24, tibiaD: -33, piedD: 62, brasG: 47, avbrasG: 40, brasD: -25, avbrasD: 60 },
    ], zones: ['cuisseD'] },
  }),
  ex({
    // 02101 « Stretching, mild » : 2,3 MET.
    id: 'extension_dos', nom: 'Extension du dos debout', icone: '🙆', met: 2.3, cat: 'Bureau',
    resume: 'Mains en bas du dos, penche-toi doucement vers l’arrière pour contrer la position assise.',
    muscles: 'Bas du dos (mobilité), ventre, hanches', materiel: [],
    depart: 'Debout à côté de ton bureau, pieds largeur de hanches, genoux souples. Mains à plat en bas du dos, doigts vers le bas.',
    etapes: ['Pousse doucement les hanches vers l’avant avec les mains.', 'Penche le haut du corps vers l’arrière, petite amplitude, regard droit devant.', 'Tiens 2 secondes, puis reviens bien droit.'],
    respiration: 'Inspire en allant vers l’arrière, souffle en revenant.',
    tempo: '2 secondes pour aller, 2 tenues, 2 pour revenir.',
    cles: ['Petite amplitude : c’est un mouvement de soulagement, pas une performance', 'Genoux légèrement fléchis', 'Les mains soutiennent le bas du dos'],
    erreurs: ['Basculer la tête en arrière (nuque écrasée)', 'Forcer en arrière jusqu’à la douleur', 'Verrouiller les genoux'],
    sensation: 'Le bas du dos se détend, le ventre s’étire un peu. Ça doit soulager, jamais faire mal.',
    facile: 'Contente-toi de te grandir et de pousser les hanches vers l’avant, sans pencher le buste.',
    difficile: 'Garde la même petite amplitude, mais fais-le à chaque pause (toutes les heures) : la régularité compte plus que l’amplitude.',
    securite: 'Douleur qui augmente, qui descend dans la jambe, ou fourmillements : arrête et parles-en à un médecin ou un kiné.',
    anim: { vue: 'profil', durees: [1.8, 1.6, 1.8], decor: [{ type: 'bureau', x: 168 }], ancre: { x: ['cheville', 96] }, poses: [
      { brasG: -30, avbrasG: 25, brasD: -30, avbrasD: 25 },
      { buste: -14, tete: -4, cuisseG: 7, tibiaG: 0, cuisseD: 7, tibiaD: 0, brasG: -38, avbrasG: 35, brasD: -38, avbrasD: 35 },
      { buste: -14, tete: -4, cuisseG: 7, tibiaG: 0, cuisseD: 7, tibiaD: 0, brasG: -38, avbrasG: 35, brasD: -38, avbrasD: 35 },
    ], zones: ['tronc'] },
  }),
  ex({
    // 02101 « Stretching, mild » : 2,3 MET.
    id: 'ouverture_poitrine', nom: 'Ouverture de la poitrine', icone: '🙌', met: 2.3, cat: 'Bureau',
    resume: 'Assis au bord de la chaise, mains jointes derrière le dos : ouvre la poitrine et serre les omoplates.',
    muscles: 'Pectoraux et avant des épaules (étirement), haut du dos', materiel: ['chaise'],
    depart: 'Assis au bord de la chaise, pieds à plat, dos droit. Croise les doigts derrière le dos (ou attrape les côtés de l’assise).',
    etapes: ['Grandis-toi, comme tiré vers le plafond par le haut de la tête.', 'Tends les bras vers l’arrière et vers le bas, serre les omoplates l’une vers l’autre.', 'Ouvre la poitrine vers l’avant, regard droit devant, menton rentré.', 'Tiens 5 secondes, relâche, recommence.'],
    respiration: 'Inspire en ouvrant la poitrine, souffle en relâchant.',
    tempo: '5 secondes tenues, 3 secondes de relâche.',
    cles: ['Épaules basses, loin des oreilles', 'C’est la poitrine qui avance, pas le menton', 'Le bas du dos reste neutre, sans cambrure'],
    erreurs: ['Hausser les épaules', 'Projeter la tête en avant', 'Cambrer fort le bas du dos'],
    sensation: 'Étirement sur le devant des épaules et de la poitrine, travail entre les omoplates.',
    facile: 'Mains posées sur l’assise derrière les fesses, au lieu de les joindre.',
    difficile: 'Décolle un peu les bras joints vers l’arrière, sans pencher le buste.',
    securite: 'Pincement ou douleur dans l’épaule : écarte les mains et réduis l’amplitude.',
    anim: { vue: 'profil', durees: [1.5, 3, 1.5, 1.2], decor: [{ type: 'chaise', x: CHAISE }, { type: 'bureau', x: 158 }], poses: [
      assis({}, CHAISE + 12),
      assis({ buste: -4, tete: -3, brasG: -25, avbrasG: -25, brasD: -25, avbrasD: -25 }, CHAISE + 12),
      assis({ buste: -5, tete: -3, brasG: -27, avbrasG: -27, brasD: -27, avbrasD: -27 }, CHAISE + 12),
      assis({}, CHAISE + 12),
    ], zones: ['tronc', 'brasG', 'brasD'] },
  }),
  ex({
    // 02101 « Stretching, mild » : 2,3 MET.
    id: 'etirement_nuque', nom: 'Étirement de la nuque', icone: '🙇', met: 2.3, cat: 'Bureau',
    resume: 'Penche doucement l’oreille vers l’épaule, l’autre épaule bien basse. Change à mi-temps.',
    muscles: 'Côtés du cou, haut des épaules (trapèzes)', materiel: [], tenue: true, unilateral: true,
    depart: 'Assis bien droit ou debout, épaules relâchées, regard devant toi.',
    etapes: ['Laisse descendre l’épaule gauche, bras le long du corps (assis : tiens le bord de la chaise).', 'Penche doucement la tête à droite, oreille vers l’épaule, sans tourner le visage.', 'Pose la main droite sur le haut de la tête, sans tirer : son poids suffit.', 'Tiens, reviens lentement au centre, puis change de côté à mi-temps.'],
    respiration: 'Longues expirations : à chaque expiration, l’épaule basse descend un peu plus.',
    cles: ['Mouvement lent, jamais d’à-coup', 'Le nez reste face à toi : on penche, on ne tourne pas', 'La main pèse, elle ne tire pas'],
    erreurs: ['Tirer sur la tête avec la main', 'Hausser l’épaule du côté étiré', 'Faire des cercles rapides avec la tête'],
    sensation: 'Étirement doux sur le côté du cou opposé, jusqu’en haut de l’épaule.',
    facile: 'Sans la main : le poids de la tête suffit.',
    difficile: 'Tourne légèrement le nez vers l’aisselle pour étirer aussi l’arrière du cou.',
    securite: 'Vertige, fourmillements dans le bras ou douleur qui irradie : arrête.',
    anim: { vue: 'face', durees: [2, 3, 2], ancre: { x: ['hanche', 100] }, poses: [
      { brasG: -12, avbrasG: -8, brasD: 12, avbrasD: 8 },
      { tete: 32, brasG: -155, avbrasG: 81, brasD: 14, avbrasD: 12 },
      { tete: 36, brasG: -157, avbrasG: 83, brasD: 15, avbrasD: 13 },
    ] },
  }),
  ex({
    // 02101 « Stretching, mild » : 2,3 MET.
    id: 'rotation_buste_assis', nom: 'Rotation du buste assis', icone: '🔄', met: 2.3, cat: 'Bureau',
    resume: 'Assis bien droit, tourne doucement les épaules d’un côté en t’aidant du dossier, puis de l’autre.',
    muscles: 'Haut et milieu du dos (mobilité), obliques', materiel: ['chaise'],
    depart: 'Assis au milieu de la chaise, pieds à plat largeur de hanches, genoux à angle droit, dos droit.',
    etapes: ['Grandis-toi en inspirant.', 'En soufflant, tourne les épaules vers la droite : main droite sur le dossier, main gauche sur la cuisse droite.', 'Tiens 3 secondes, la tête suit les épaules.', 'Reviens au centre, puis tourne vers la gauche.'],
    respiration: 'Inspire pour te grandir, souffle en tournant.',
    tempo: '2 secondes pour tourner, 3 tenues, 2 pour revenir.',
    cles: ['Les genoux et le bassin restent face au bureau', 'Tu tournes depuis le haut du dos, sans forcer avec les bras', 'Dos droit, pas affaissé dans la chaise'],
    erreurs: ['Tirer fort sur le dossier pour gagner de l’amplitude', 'S’avachir en tournant', 'Laisser les genoux tourner avec le buste'],
    sensation: 'Le dos se délie entre les omoplates et sur les côtés. Rotation confortable, sans douleur.',
    facile: 'Bras croisés sur la poitrine, sans t’aider du dossier.',
    difficile: 'Tiens 5 secondes de chaque côté en respirant « dans le dos ».',
    securite: 'Chaise qui pivote : bloque-la avec les pieds ou prends une chaise fixe. Dos sensible : petite amplitude.',
    anim: { vue: 'profil', durees: [1.8, 2.5, 1.8, 1.8, 2.5, 1.8], decor: [{ type: 'chaise', x: CHAISE }, { type: 'bureau', x: 158 }], poses: [
      assis({ buste: -2 }),
      assis({ buste: -2, brasD: -40, avbrasD: -10, brasG: 18, avbrasG: 18 }),
      assis({ buste: -2, brasD: -42, avbrasD: -12, brasG: 18, avbrasG: 18 }),
      assis({ buste: -2 }),
      assis({ buste: -2, brasG: -40, avbrasG: -10, brasD: 18, avbrasD: 18 }),
      assis({ buste: -2, brasG: -42, avbrasG: -12, brasD: 18, avbrasD: 18 }),
    ], zones: ['tronc'] },
  }),
  ex({
    // 02170 « Yoga, Nadisodhana » (technique respiratoire, entrée la plus proche) : 2,0 MET.
    id: 'respiration_ventrale', nom: 'Respiration ventrale', icone: '🫁', met: 2, cat: 'Bureau',
    resume: 'Une main sur le ventre, une sur la poitrine : inspire par le nez en gonflant le ventre, expire longuement.',
    muscles: 'Diaphragme (respiration), récupération', materiel: ['chaise'],
    depart: 'Assis droit au fond de la chaise, pieds à plat, épaules relâchées. Une main sur le ventre, l’autre sur le haut de la poitrine.',
    etapes: ['Inspire par le nez pendant 4 secondes : la main du ventre avance, celle de la poitrine bouge à peine.', 'Expire doucement par la bouche, lèvres un peu pincées, pendant 6 secondes : le ventre rentre.', 'Recommence en suivant le rythme de l’animation.'],
    respiration: '4 secondes d’inspiration par le nez, 6 secondes d’expiration lèvres pincées.',
    tempo: '4 secondes, puis 6 secondes.',
    cles: ['C’est le ventre qui bouge, pas les épaules', 'Expiration plus longue que l’inspiration', 'Lèvres pincées à l’expiration : la même technique t’aide à récupérer quand tu es essoufflé'],
    erreurs: ['Lever les épaules en inspirant', 'Inspirer trop fort, jusqu’à avoir la tête qui tourne', 'Rentrer le ventre en inspirant (respiration à l’envers)'],
    sensation: 'Le ventre se gonfle et se vide, le souffle se pose, le cœur ralentit.',
    facile: 'Allongé sur le dos, genoux pliés : le ventre bouge plus facilement.',
    difficile: 'Allonge l’expiration jusqu’à 8 secondes.',
    securite: 'Vertige ou fourmillements : reprends une respiration normale.',
    anim: { vue: 'profil', durees: [4, 6], decor: [{ type: 'chaise', x: CHAISE }, { type: 'bureau', x: 158 }], poses: [
      assis({ brasD: -15, avbrasD: 55, brasG: -10, avbrasG: 138 }),
      assis({ buste: -2, brasD: -15, avbrasD: 64, brasG: -10, avbrasG: 138 }),
    ], zones: ['tronc'] },
  }),

  // ===== Hanches, fessiers, cardio progressif (v3) =====
  ex({
    // Pas de code « marche latérale » : 02030 « Calisthenics, light or moderate effort, general » : 3,5 MET.
    id: 'marche_laterale', nom: 'Marche latérale', icone: '↔️', met: 3.5, cat: 'Fessiers',
    resume: 'Pas lents sur le côté, genoux légèrement fléchis, pour réveiller les fessiers qui stabilisent les genoux.',
    muscles: 'Fessiers (moyen fessier), cuisses, équilibre', materiel: [],
    depart: 'Debout, pieds largeur de hanches, genoux légèrement fléchis, mains sur les hanches. Prévois 3 à 4 m libres sur le côté.',
    etapes: ['Fais un pas sur le côté avec le pied droit, pointe de pied vers l’avant.', 'Ramène le pied gauche, sans coller les pieds.', 'Enchaîne 3 pas vers la droite, puis reviens vers la gauche.', 'Reste à la même hauteur : ne te redresse pas entre les pas.'],
    respiration: 'Respire régulièrement, un souffle tous les deux pas.',
    tempo: 'Lent : environ un pas par seconde.',
    cles: ['Les genoux restent au-dessus des pieds, jamais vers l’intérieur', 'Pointes de pieds vers l’avant', 'Buste droit, bassin à niveau'],
    erreurs: ['Laisser les genoux rentrer vers l’intérieur', 'Croiser les jambes ou traîner le pied', 'Se pencher sur le côté à chaque pas'],
    sensation: 'Ça chauffe sur le côté des fesses : c’est ce muscle qui tient le genou droit quand tu cours.',
    facile: 'Jambes presque tendues et petits pas.', versionFacile: 'marche',
    difficile: 'Descends un peu plus bas et marque 2 secondes de pause pieds écartés.',
    anim: { vue: 'face', durees: [0.6], poses: pasLateraux({ ferme: 4, ouvert: 13, n: 3, haut: { brasG: -30, avbrasG: 50, brasD: 30, avbrasD: -50 } }), zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    // 02030 « Calisthenics, light or moderate effort, general » : 3,5 MET.
    id: 'pont_marche', nom: 'Pont fessier marché', icone: '🌉', met: 3.5, cat: 'Fessiers',
    resume: 'En pont, décolle un pied puis l’autre de quelques centimètres sans laisser tomber le bassin.',
    muscles: 'Fessiers, arrière des cuisses, abdos profonds', materiel: ['tapis'],
    depart: 'Allongé sur le dos, genoux pliés, pieds à plat largeur de hanches, près des fesses. Bras au sol le long du corps.',
    etapes: ['Monte en pont : serre les fessiers et pousse dans les talons jusqu’à la ligne épaules-hanches-genoux.', 'Décolle le pied droit de quelques centimètres, genou plié, sans que le bassin bascule ni descende.', 'Repose-le, puis décolle le pied gauche.', 'Après 6 à 10 pas, redescends le bassin lentement et souffle.'],
    respiration: 'Souffle à chaque pied qui décolle, ne bloque jamais.',
    tempo: 'Un pied toutes les 2 secondes, sans précipitation.',
    cles: ['Les hanches restent à la même hauteur et bien horizontales', 'Petite levée : 5 cm suffisent', 'Pousse fort dans le talon qui reste au sol'],
    erreurs: ['Bassin qui s’affaisse ou penche du côté du pied levé', 'Cambrer le bas du dos pour tenir', 'Lever le pied trop haut'],
    sensation: 'Le fessier de la jambe d’appui chauffe fort. Crampe derrière la cuisse : rapproche les pieds des fesses.',
    facile: 'Pont fessier classique, les deux pieds au sol.', versionFacile: 'pont',
    difficile: 'Tiens 3 secondes chaque pied levé.',
    securite: 'Douleur dans le bas du dos : monte moins haut et serre davantage les fessiers.',
    anim: { vue: 'profil', durees: [1.2, 1.0, 1.0, 1.0, 1.0, 1.6], decor: [{ type: 'tapis', x: 100 }], poses: [
      { buste: -90, cuisseG: 138, tibiaG: 12, cuisseD: 138, tibiaD: 12, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleG', 132] } },
      { buste: -110, tete: -20, cuisseG: 110, tibiaG: 0, cuisseD: 110, tibiaD: 0, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleG', 132] } },
      { buste: -110, tete: -20, cuisseG: 110, tibiaG: 0, cuisseD: 128, tibiaD: 20, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleG', 132] } },
      { buste: -110, tete: -20, cuisseG: 110, tibiaG: 0, cuisseD: 110, tibiaD: 0, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleG', 132] } },
      { buste: -110, tete: -20, cuisseG: 128, tibiaG: 20, cuisseD: 110, tibiaD: 0, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleD', 132] } },
      { buste: -110, tete: -20, cuisseG: 110, tibiaG: 0, cuisseD: 110, tibiaD: 0, brasG: 90, avbrasG: 90, brasD: 90, avbrasD: 90, ancre: { x: ['chevilleG', 132] } },
    ], zones: ['tronc', 'cuisseG', 'cuisseD'] },
  }),
  ex({
    // 12010 « Jog/walk combination (jogging component of less than 10 minutes) » : 6,0 MET.
    id: 'marche_course', nom: 'Marche-course (phase avancée)', icone: '🏃', met: 6, cat: 'Cardio',
    resume: 'Phase avancée seulement : alterne un trot très léger et de la marche rapide, quand ton plan l’autorise.',
    muscles: 'Cœur, jambes', materiel: [],
    depart: 'Uniquement si tu marches déjà vite 30 minutes sans difficulté ni douleur aux genoux. Dehors ou au jardin, sol plat et souple (herbe), chaussures amorties.',
    etapes: ['Échauffe-toi par quelques minutes de marche rapide.', 'Passe à un trot très lent : à peine plus vite que la marche, petits pas, pieds qui rasent le sol.', 'Après un court moment, repasse en marche rapide jusqu’à retrouver ton souffle.', 'Alterne ainsi : la marche reste la base, le trot vient par petits morceaux.'],
    respiration: 'Tu dois pouvoir dire une phrase en trottant. Si tu ne peux plus parler : marche.',
    tempo: 'Petits pas rapides plutôt que grandes foulées.',
    cles: ['Pied qui se pose sous le corps, pas loin devant', 'Atterrissage en douceur, genou légèrement fléchi', 'Allure de conversation : le trot reste très facile'],
    erreurs: ['Grandes foulées qui tapent sur le talon, jambe tendue devant', 'Trotter jusqu’à être à bout de souffle', 'Commencer trop tôt : douleur au genou = pas encore prêt'],
    sensation: 'Le cœur et la respiration montent, les jambes travaillent. Les genoux ne doivent jamais faire mal.',
    facile: 'Reste en marche rapide : c’est déjà très bien.', versionFacile: 'marche_rapide',
    difficile: 'Allonge peu à peu les morceaux de trot, d’une semaine à l’autre, si les genoux vont bien.',
    securite: 'Réservé aux phases avancées du plan. Douleur au genou, à la hanche ou au tibia, douleur thoracique, malaise, vertige ou essoufflement anormal : repasse en marche ou arrête. Ne remplace pas un avis médical.',
    anim: { vue: 'profil', durees: [0.22], ancre: { x: ['hanche', 100] }, poses: [
      { buste: 8, ...jambes('D', [24, 8], [-18, -70]), ...bras('D', [-35, 55], [40, 130]) },
      { buste: 8, ...jambes('D', [4, -6], [45, -25]), brasG: 5, avbrasG: 95, brasD: 5, avbrasD: 95 },
      { buste: 8, ...jambes('G', [24, 8], [-18, -70]), ...bras('G', [-35, 55], [40, 130]) },
      { buste: 8, ...jambes('G', [4, -6], [45, -25]), brasG: 5, avbrasG: 95, brasD: 5, avbrasD: 95 },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    // Pas d'entrée « équilibre » générale : 02024 « Calisthenics… light effort » (maintien statique) : 2,8 MET.
    id: 'equilibre_unipodal', nom: 'Équilibre sur une jambe', icone: '🦩', met: 2.8, cat: 'Jambes',
    resume: 'Tiens en équilibre sur une jambe, genou d’appui souple, à portée de main d’un appui. Change à mi-temps.',
    muscles: 'Chevilles, hanches, gainage (équilibre)', materiel: ['chaise'], tenue: true, unilateral: true,
    depart: 'Debout à côté du dossier d’une chaise ou d’un mur, la main juste au-dessus, prête à s’y tenir.',
    etapes: ['Transfère le poids sur la jambe droite, genou légèrement fléchi.', 'Lève le pied gauche de quelques centimètres, genou plié devant toi.', 'Tiens en fixant un point devant toi, bassin bien horizontal.', 'Touche l’appui si tu perds l’équilibre, puis reprends. Change de jambe à mi-temps.'],
    respiration: 'Respire calmement, sans bloquer.',
    cles: ['Genou d’appui souple, au-dessus du pied', 'Le pied d’appui « agrippe » le sol, poids sur tout le pied', 'Bassin à niveau, buste droit'],
    erreurs: ['Verrouiller le genou d’appui', 'Laisser la hanche s’affaisser sur le côté', 'Bloquer sa respiration'],
    sensation: 'La cheville et le côté de la hanche d’appui travaillent : c’est ce qui protège chevilles et genoux sur le terrain.',
    facile: 'Garde le bout des doigts posé sur l’appui, ou la pointe du pied levé au sol.',
    difficile: 'Ferme les yeux quelques secondes, ou tiens-toi sur un coussin plié.',
    securite: 'Toujours à portée de main d’un appui stable.',
    anim: { vue: 'profil', durees: [1.2, 3, 1.2], decor: [{ type: 'chaise', x: 150 }], ancre: { x: ['chevilleD', 100] }, poses: [
      { cuisseD: 4, tibiaD: 0, cuisseG: 4, tibiaG: 0, brasD: 48, avbrasD: 30, brasG: 10, avbrasG: 20 },
      { cuisseD: 6, tibiaD: 0, cuisseG: 55, tibiaG: 0, brasD: 48, avbrasD: 30, brasG: 15, avbrasG: 30 },
      { cuisseD: 7, tibiaD: 0, cuisseG: 57, tibiaG: 2, brasD: 46, avbrasD: 28, brasG: 18, avbrasG: 34 },
    ], zones: ['cuisseD', 'tibiaD'] },
  }),

  // ===== Football (v3) : ballon au pied, à allure de marche, sans saut =====
  // Le Compendium 2024 n'a pas de code « exercices techniques de foot » : on retient le plus proche,
  // 15615 « Walking football/soccer » (3,5 MET), car tout se fait à allure de marche.
  ex({
    id: 'conduite_balle', nom: 'Conduite de balle en marchant', icone: '⚽', met: 3.5, cat: 'Football',
    resume: 'Pousse le ballon devant toi par petites touches en marchant, demi-tour semelle, et retour.',
    muscles: 'Toucher de balle, coordination, chevilles, cœur (léger)', materiel: ['ballon'],
    depart: 'Au jardin, sur 5 à 10 m de terrain plat. Semelle posée sur le ballon devant toi.',
    etapes: ['Marche en poussant le ballon devant toi avec l’intérieur du pied ou le lacet, environ toutes les deux foulées.', 'Garde le ballon à moins d’un pas : petites touches, jamais de grand coup.', 'Au bout, arrête le ballon sous la semelle, tire-le vers l’arrière et fais demi-tour en petits pas.', 'Reviens de la même façon. Change de pied de touche à chaque aller-retour.'],
    respiration: 'Respire calmement : c’est de la marche, tu dois pouvoir parler.',
    tempo: 'Allure de marche tranquille.',
    cles: ['Petits pas, ballon proche', 'Regarde le ballon, puis lève les yeux entre deux touches', 'Genoux souples, touche douce'],
    erreurs: ['Pousser le ballon trop loin et devoir courir après', 'Ne regarder que tes pieds', 'Pivoter brusquement sur un genou tendu au demi-tour'],
    sensation: 'Le toucher de balle revient, le cœur monte un peu. Aucune douleur aux genoux.',
    facile: 'Arrête le ballon sous la semelle avant chaque nouvelle touche.', versionFacile: 'marche_normale',
    difficile: 'Alterne pied droit et pied gauche, intérieur et extérieur du pied, à allure de marche rapide.',
    securite: 'Terrain plat, sans trous ni objets. Au demi-tour, tourne en petits pas plutôt qu’en pivotant sur un pied.',
    anim: { vue: 'profil', durees: CONDUITE.durees, poses: CONDUITE.poses, decor: [{ type: 'ballon', x: CONDUITE.xs[0]!, xs: CONDUITE.xs }], zones: ['tibiaG', 'tibiaD'] },
  }),
  ex({
    id: 'slalom_plots', nom: 'Slalom ballon au pied', icone: '🔀', met: 3.5, cat: 'Football',
    resume: 'Conduis le ballon en marchant autour d’une ligne de plots, une touche à chaque pas, pied droit puis pied gauche.',
    muscles: 'Toucher de balle, coordination, hanches, chevilles', materiel: ['ballon', 'plots'],
    depart: 'Aligne 4 à 6 plots (bouteilles, chaussures) espacés d’environ 1,5 m, sur un sol plat. Ballon au pied, avant le premier plot.',
    etapes: ['Marche en poussant le ballon pour passer à droite du premier plot, puis à gauche du suivant.', 'Une petite touche à chaque pas : intérieur du pied droit, puis intérieur du pied gauche.', 'Au bout, arrête le ballon sous la semelle et fais demi-tour en petits pas.', 'Reviens en slalom. Va lentement : la précision avant la vitesse.'],
    respiration: 'Respire calmement, tu restes à allure de marche.',
    tempo: 'Allure de marche, une touche par pas.',
    cles: ['Ballon toujours à moins d’un pas', 'Petits pas et genoux souples dans les changements de direction', 'Lève les yeux vers le plot suivant entre deux touches'],
    erreurs: ['Changer de direction en pivotant sur une jambe tendue', 'Touches trop longues qui t’obligent à courir', 'Plots trop rapprochés au début'],
    sensation: 'Coordination et toucher de balle ; hanches et chevilles travaillent dans les virages.',
    facile: 'Plots plus espacés (2 m), et une seule surface du pied.', versionFacile: 'conduite_balle',
    difficile: 'Plots plus rapprochés, ou allure de marche rapide, toujours sans courir.',
    securite: 'Tourne en petits pas : jamais de pivot brusque sur le genou.',
    anim: { vue: 'profil', durees: SLALOM.durees, poses: SLALOM.poses, decor: [
      { type: 'plot', x: 104 }, { type: 'plot', x: 160 }, { type: 'ballon', x: SLALOM.xs[0]!, xs: SLALOM.xs },
    ], zones: ['tibiaG', 'tibiaD'] },
  }),
  ex({
    id: 'passe_mur', nom: 'Passes contre un mur', icone: '🧱', met: 3.5, cat: 'Football',
    resume: 'Passe du plat du pied contre un mur, contrôle le retour, recommence. Change de pied à mi-temps.',
    muscles: 'Précision, intérieur des cuisses, équilibre', materiel: ['ballon', 'mur'], unilateral: true,
    depart: 'À 2 ou 3 m d’un mur solide (garage, muret, clôture pleine), ballon devant toi.',
    etapes: ['Pose le pied d’appui à côté du ballon, pointe vers le mur, genou souple.', 'Ouvre le pied qui frappe (pointe vers l’extérieur) et pousse le ballon avec l’intérieur du pied, au milieu du ballon.', 'Accompagne le geste vers le mur, sans frapper fort.', 'Contrôle le retour sous la semelle ou de l’intérieur du pied, replace-toi, recommence.'],
    respiration: 'Respire librement, souffle au moment de la passe.',
    tempo: 'Une passe toutes les 3 à 4 secondes, en contrôlant chaque retour.',
    cles: ['Pied d’appui à côté du ballon, pointe vers la cible', 'Cheville ferme, intérieur du pied bien ouvert', 'Passe douce : c’est la précision qui compte'],
    erreurs: ['Frapper fort du bout du pied', 'Jambe d’appui tendue et raide', 'Laisser filer le retour sans le contrôler'],
    sensation: 'Toucher de balle et équilibre sur la jambe d’appui. Rien dans les genoux.',
    facile: 'Rapproche-toi du mur et arrête chaque retour sous la semelle avant de repasser.', versionFacile: 'controle_semelle',
    difficile: 'Passe en une touche (sans arrêter le ballon), ou alterne pied droit et pied gauche.',
    securite: 'Mur solide, pas de vitre à proximité, sol plat.',
    anim: { vue: 'profil', durees: [0.7, 0.35, 0.4, 0.6, 0.6, 0.6], decor: [
      { type: 'mur', x: 182 }, { type: 'ballon', x: BALLON_FRAPPE, xs: [BALLON_FRAPPE, BALLON_FRAPPE, BALLON_FRAPPE, 182 - R_BALLON - 2, 132, BALLON_FRAPPE + 3] },
    ], poses: [
      appuiFrappe({ cuisseD: 4, tibiaD: 0, brasG: 15, avbrasG: 30, brasD: -8, avbrasD: 10 }),
      appuiFrappe({ cuisseD: -12, tibiaD: -65, brasG: 40, avbrasG: 60, brasD: -30, avbrasD: 0 }),
      appuiFrappe({ cuisseD: 14, tibiaD: 6, piedD: 95, brasG: 35, avbrasG: 55, brasD: -20, avbrasD: 0 }),
      appuiFrappe({ cuisseD: 30, tibiaD: 22, piedD: 105, brasG: 25, avbrasG: 45, brasD: -10, avbrasD: 10 }),
      appuiFrappe({ cuisseD: 4, tibiaD: 0, brasG: 15, avbrasG: 30, brasD: -8, avbrasD: 10 }),
      appuiFrappe({ cuisseD: 24, tibiaD: 8, piedD: 122, brasG: 15, avbrasG: 30, brasD: -8, avbrasD: 10 }),
    ], zones: ['cuisseD', 'tibiaD'] },
  }),
  ex({
    id: 'controle_semelle', nom: 'Ballon sous la semelle', icone: '🦶', met: 3.5, cat: 'Football',
    resume: 'Pied posé sur le ballon, fais-le rouler d’avant en arrière sous la semelle, en équilibre sur l’autre jambe.',
    muscles: 'Toucher de balle, équilibre, chevilles', materiel: ['ballon'], unilateral: true,
    depart: 'Debout, ballon devant toi. Pose la semelle du pied droit sur le dessus du ballon, sans t’appuyer dessus. Près d’un mur si besoin.',
    etapes: ['Fais rouler le ballon vers l’avant sous la semelle, de quelques centimètres.', 'Ramène-le vers toi, toujours sous la semelle.', 'Garde la jambe d’appui légèrement fléchie, le poids du corps dessus.', 'Change de pied à mi-temps.'],
    respiration: 'Respire calmement.',
    tempo: 'Lent et régulier : environ un aller-retour par seconde.',
    cles: ['Le poids reste sur la jambe d’appui, pas sur le ballon', 'Genou d’appui légèrement fléchi', 'Petits mouvements contrôlés'],
    erreurs: ['Monter de tout ton poids sur le ballon (il roule, tu tombes)', 'Jambe d’appui verrouillée', 'Ne jamais lever les yeux du ballon'],
    sensation: 'La cheville et la hanche d’appui travaillent pour l’équilibre ; le pied apprivoise le ballon.',
    facile: 'Une main contre un mur ou sur un dossier de chaise.',
    difficile: 'Fais aussi rouler le ballon de gauche à droite, ou dessine des petits cercles.',
    securite: 'Ne t’appuie jamais sur le ballon. Un ballon un peu dégonflé est plus stable.',
    anim: { vue: 'profil', durees: [0.5], decor: [{ type: 'ballon', x: position(SOUS_SEMELLE[0]!, 'chevilleD')[0] + 6, xs: SOUS_SEMELLE.map(p => position(p, 'chevilleD')[0] + 6) }],
      poses: SOUS_SEMELLE, zones: ['cuisseG', 'tibiaG'] },
  }),
  ex({
    id: 'toucher_ballon', nom: 'Touches sur le ballon', icone: '👟', met: 3.5, cat: 'Football',
    resume: 'Touche le dessus du ballon avec la semelle, un pied puis l’autre, lentement, sans jamais sauter.',
    muscles: 'Coordination, cœur, hanches, mollets', materiel: ['ballon'],
    depart: 'Debout face au ballon, à un demi-pas, genoux souples. Ballon un peu dégonflé, calé contre un mur si besoin.',
    etapes: ['Pose doucement l’avant de la semelle droite sur le dessus du ballon, puis repose le pied au sol.', 'Fais pareil avec le pied gauche.', 'Alterne lentement : un pied reste TOUJOURS au sol.', 'Accélère un peu seulement si tu restes précis, toujours sans sautiller.'],
    respiration: 'Respiration rythmée, un souffle toutes les deux touches.',
    tempo: 'Lent : environ une touche par seconde au début.',
    cles: ['Zéro saut : on pose, on repose, on change', 'Touche légère : tu ne t’appuies pas sur le ballon', 'Buste droit, bras qui accompagnent comme en marchant'],
    erreurs: ['Sautiller d’un pied sur l’autre (chocs dans les genoux)', 'Écraser le ballon et le faire rouler', 'Se pencher en avant pour regarder'],
    sensation: 'Le cœur monte doucement, les hanches et les mollets travaillent, la coordination s’affine.',
    facile: 'Plus lentement, une main contre un mur ; ou touche un repère au sol à la place du ballon.', versionFacile: 'marche',
    difficile: 'Un peu plus vite en levant les yeux, toujours sans saut.',
    securite: 'Un ballon qui roule peut faire tomber : cale-le contre un mur ou dégonfle-le un peu.',
    anim: { vue: 'profil', durees: [0.5], decor: [{ type: 'ballon', x: TOUCHE_BALLON }], poses: [
      touche('D'),
      { buste: 4, tete: 12, cuisseG: 4, tibiaG: 0, cuisseD: 4, tibiaD: 0, brasG: 5, avbrasG: 40, brasD: 5, avbrasD: 40, ancre: { x: ['hanche', TOUCHE_X] } },
      touche('G'),
      { buste: 4, tete: 12, cuisseG: 4, tibiaG: 0, cuisseD: 4, tibiaD: 0, brasG: 5, avbrasG: 40, brasD: 5, avbrasD: 40, ancre: { x: ['hanche', TOUCHE_X] } },
    ], zones: ['cuisseG', 'cuisseD'] },
  }),
  ex({
    id: 'frappe_lente', nom: 'Frappe lente et précise', icone: '🎯', met: 3.5, cat: 'Football',
    resume: 'Décompose une frappe du plat du pied au ralenti : pied d’appui, armé, contact, accompagnement, équilibre.',
    muscles: 'Hanches, intérieur des cuisses, équilibre, gainage', materiel: ['ballon', 'mur'], unilateral: true,
    depart: 'À 4 ou 5 m d’un mur ou d’une clôture pleine, ballon posé devant toi. Un pas d’élan au maximum.',
    etapes: ['Pose le pied d’appui à côté du ballon, pointe vers la cible, genou fléchi.', 'Arme lentement la jambe de frappe vers l’arrière, genou plié.', 'Ramène-la vers l’avant et frappe le milieu du ballon avec l’intérieur du pied, sans forcer.', 'Accompagne vers la cible et tiens 2 secondes en équilibre sur la jambe d’appui. Change de pied à mi-temps.'],
    respiration: 'Souffle au moment du contact.',
    tempo: 'Au ralenti : 2 secondes d’armé, frappe souple, 2 secondes d’équilibre.',
    cles: ['Pied d’appui à côté du ballon, genou souple au-dessus du pied', 'Buste légèrement au-dessus du ballon, bras opposé ouvert pour l’équilibre', 'Frappe à la moitié de ta force au plus : la technique d’abord'],
    erreurs: ['Frapper en force, jambe d’appui tendue', 'Pied d’appui trop loin derrière le ballon (tu te penches en arrière)', 'Prendre un grand élan en courant'],
    sensation: 'Équilibre et gainage sur la jambe d’appui, la hanche de la jambe de frappe travaille. Aucune douleur au genou.',
    facile: 'Sans armé : pousse simplement le ballon du plat du pied.', versionFacile: 'passe_mur',
    difficile: 'Vise une cible (un seau, une marque sur le mur) et alterne les pieds.',
    securite: 'Pas de frappe en force tant que ton plan ne l’autorise pas : genoux et adducteurs doivent d’abord s’habituer.',
    anim: { vue: 'profil', durees: [1.4, 0.5, 0.45, 1.2, 0.9, 1.4], decor: [
      { type: 'mur', x: 190 }, { type: 'ballon', x: BALLON_FRAPPE, xs: [BALLON_FRAPPE, BALLON_FRAPPE, BALLON_FRAPPE, 132, 190 - R_BALLON - 2, 136] },
    ], poses: [
      appuiFrappe({ cuisseD: 4, tibiaD: 0, brasG: 15, avbrasG: 30, brasD: -8, avbrasD: 10 }),
      appuiFrappe({ buste: 10, cuisseG: 14, tibiaG: 2, cuisseD: -20, tibiaD: -88, brasG: 70, avbrasG: 80, brasD: -40, avbrasD: -10 }),
      appuiFrappe({ buste: 10, cuisseG: 14, tibiaG: 2, cuisseD: 12, tibiaD: 4, piedD: 95, brasG: 60, avbrasG: 70, brasD: -30, avbrasD: 0 }),
      appuiFrappe({ buste: 4, cuisseG: 10, tibiaG: 0, cuisseD: 48, tibiaD: 38, piedD: 120, brasG: 45, avbrasG: 55, brasD: -15, avbrasD: 10 }),
      appuiFrappe({ buste: 4, cuisseG: 10, tibiaG: 0, cuisseD: 48, tibiaD: 38, piedD: 120, brasG: 45, avbrasG: 55, brasD: -15, avbrasD: 10 }),
      appuiFrappe({ cuisseD: 4, tibiaD: 0, brasG: 15, avbrasG: 30, brasD: -8, avbrasD: 10 }),
    ], zones: ['cuisseD', 'cuisseG'] },
  }),
  ex({
    id: 'pas_chasses_plots', nom: 'Pas chassés entre deux plots', icone: '🔶', met: 3.5, cat: 'Football',
    resume: 'Pas chassés sur le côté d’un plot à l’autre, pieds qui rasent le sol, sans jamais sauter.',
    muscles: 'Fessiers, cuisses, cœur, appuis', materiel: ['plots'],
    depart: 'Deux plots (ou bouteilles, chaussures) à 3 ou 4 m l’un de l’autre. Place-toi à côté du premier : pieds largeur d’épaules, genoux fléchis, buste légèrement penché, bras prêts.',
    etapes: ['Écarte le pied droit sur le côté en le faisant glisser au ras du sol.', 'Ramène le pied gauche vers lui, sans que les pieds se touchent ni se croisent.', 'Enchaîne jusqu’au second plot, puis repars dans l’autre sens.', 'Reste bas et léger : un pied touche toujours le sol.'],
    respiration: 'Respiration rythmée ; si tu ne peux plus parler, ralentis.',
    tempo: 'Calme au début, plus vif ensuite si le souffle suit.',
    cles: ['Zéro saut : des pas glissés', 'Genoux au-dessus des pieds, jamais vers l’intérieur', 'Regard devant toi, pas sur tes pieds'],
    erreurs: ['Croiser les jambes', 'Sautiller (chocs dans les genoux)', 'Se redresser entre chaque pas'],
    sensation: 'Les fessiers et les cuisses chauffent, le cœur monte : c’est le déplacement du défenseur.',
    facile: 'Petits pas, jambes presque tendues, plots plus rapprochés.', versionFacile: 'marche_laterale',
    difficile: 'Un peu plus bas et plus vif, toujours sans saut.',
    securite: 'Sol plat et non glissant : pas d’herbe mouillée en chaussettes.',
    anim: { vue: 'face', durees: [0.38], decor: [{ type: 'plot', x: 16 }, { type: 'plot', x: 184 }],
      poses: pasLateraux({ ferme: 9, ouvert: 20, n: 3, haut: { brasG: -25, avbrasG: 20, brasD: 25, avbrasD: -20 } }), zones: ['cuisseG', 'cuisseD'] },
  }),
].map(e => [e.id, e]));

export const CATEGORIES: Categorie[] = ['Échauffement', 'Cardio', 'Jambes', 'Fessiers', 'Haut du corps', 'Dos', 'Gainage', 'Étirement', 'Bureau', 'Football'];

/** Animation du repos : debout, respiration calme. */
export const ANIM_REPOS: Animation = { vue: 'face', durees: [2, 2], ancre: { x: ['hanche', 100] }, poses: [
  { ...debout, brasG: -10, avbrasG: -6, brasD: 10, avbrasD: 6 },
  { brasG: -14, avbrasG: -10, brasD: 14, avbrasD: 10, buste: 0 },
] };
