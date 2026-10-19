import { HAUTEUR, SOL, type Animation, type Pose } from './figurine';

/**
 * Bibliothèque d'exercices : guide complet (comment faire, quoi sentir, erreurs à éviter)
 * + animation. Les identifiants sont ceux de FitMaison v1 (historique compatible).
 * MET = équivalent métabolique, sert à estimer les calories.
 */
export type Categorie = 'Échauffement' | 'Cardio' | 'Jambes' | 'Fessiers' | 'Haut du corps' | 'Dos' | 'Gainage' | 'Étirement';
export type Materiel = 'chaise' | 'mur' | 'marche' | 'support' | 'tapis' | 'porte';

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
};

// ---------- Poses de base ----------
const debout: Pose = {};
const mainsHanches: Pose = { brasG: -25, avbrasG: 60, brasD: -25, avbrasD: 60 };

const ex = (e: Exercice) => e;
/** Planche inclinée mains sur une table (bras à 41° : mains sur le plateau, pointes de pieds au sol). */
const climber = (): Pose => ({ buste: 38, cuisseG: -38, tibiaG: -38, cuisseD: -38, tibiaD: -38, brasG: 41, avbrasG: 41, brasD: 41, avbrasD: 41, piedG: 10, piedD: 10 });

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
].map(e => [e.id, e]));

export const CATEGORIES: Categorie[] = ['Échauffement', 'Cardio', 'Jambes', 'Fessiers', 'Haut du corps', 'Dos', 'Gainage', 'Étirement'];

/** Animation du repos : debout, respiration calme. */
export const ANIM_REPOS: Animation = { vue: 'face', durees: [2, 2], ancre: { x: ['hanche', 100] }, poses: [
  { ...debout, brasG: -10, avbrasG: -6, brasD: 10, avbrasD: 6 },
  { brasG: -14, avbrasG: -10, brasD: 14, avbrasD: 10, buste: 0 },
] };
