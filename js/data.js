// Données statiques : exercices, programmes, conseils.
// MET = équivalent métabolique (sert à estimer les calories brûlées).

const EXERCISES = {
  // --- Échauffement / mobilité ---
  rotation_bras: { name: 'Rotations des bras', icon: '🔄', met: 2.5, cat: 'Échauffement',
    desc: 'Debout, bras tendus sur les côtés. Fais de grands cercles vers l’avant puis vers l’arrière.',
    tip: 'Mouvement ample et contrôlé, épaules basses.' },
  rotation_bassin: { name: 'Rotations du bassin', icon: '⭕', met: 2.5, cat: 'Échauffement',
    desc: 'Mains sur les hanches, pieds largeur d’épaules. Dessine des cercles avec le bassin.',
    tip: 'Change de sens à mi-temps.' },
  marche: { name: 'Marche sur place', icon: '🚶', met: 3.5, cat: 'Cardio',
    desc: 'Marche sur place en balançant les bras. Lève un peu les genoux.',
    tip: 'Reste sur l’avant des pieds, respire calmement.' },

  // --- Cardio sans saut (faible impact articulaire) ---
  marche_genoux: { name: 'Montées de genoux marchées', icon: '🦵', met: 4.5, cat: 'Cardio',
    desc: 'Monte un genou vers la hanche puis l’autre, en rythme, sans sauter. Bras opposé vers l’avant.',
    tip: 'Plus tu montes haut et vite, plus c’est intense.', easier: 'Monte moins haut, plus lentement.' },
  step_jack: { name: 'Jumping jacks sans saut', icon: '⭐', met: 4.5, cat: 'Cardio',
    desc: 'Écarte une jambe sur le côté en levant les bras au-dessus de la tête, reviens, puis l’autre jambe.',
    tip: 'Zéro saut = genoux préservés.', easier: 'Lève les bras seulement à hauteur d’épaules.' },
  boxe: { name: 'Shadow boxing', icon: '🥊', met: 5.5, cat: 'Cardio',
    desc: 'Garde haute, enchaîne directs et crochets dans le vide en pivotant légèrement le buste.',
    tip: 'Reste léger sur les appuis, sautille sur place si tu te sens bien.' },
  talons_fesses: { name: 'Talons-fesses marchés', icon: '🦶', met: 4, cat: 'Cardio',
    desc: 'Ramène un talon vers la fesse puis l’autre, en alternance rapide, sans sauter.',
    tip: 'Mains sur les hanches ou bras qui accompagnent.' },
  climber_incline: { name: 'Mountain climbers inclinés', icon: '⛰️', met: 6, cat: 'Cardio',
    desc: 'Mains sur une table, un banc ou un muret. Corps gainé, ramène un genou vers la poitrine puis l’autre.',
    tip: 'Plus le support est haut, plus c’est facile.', easier: 'Mains contre un mur, mouvement lent.' },
  marche_rapide: { name: 'Marche rapide', icon: '🏃', met: 4.3, cat: 'Cardio',
    desc: 'Marche dans le jardin, la rue ou sur place à allure soutenue : tu peux parler mais pas chanter.',
    tip: 'Le meilleur exercice pour brûler des graisses sans abîmer les articulations.' },
  marche_normale: { name: 'Marche normale', icon: '🚶', met: 3.3, cat: 'Cardio',
    desc: 'Allure confortable, récupère ton souffle.', tip: 'Garde les épaules relâchées.' },
  burpee_sans_saut: { name: 'Burpees sans saut', icon: '💥', met: 7, cat: 'Cardio',
    desc: 'Accroupis-toi, pose les mains, recule une jambe puis l’autre en planche, reviens jambe par jambe, relève-toi.',
    tip: 'Mains sur un banc pour simplifier.', easier: 'Mains sur une chaise ou un banc.' },

  // --- Renforcement bas du corps ---
  squat_chaise: { name: 'Squat sur chaise', icon: '🪑', met: 5, cat: 'Jambes',
    desc: 'Debout devant une chaise, pieds largeur d’épaules. Descends en poussant les fesses en arrière jusqu’à effleurer la chaise, remonte.',
    tip: 'Genoux dans l’axe des pieds, talons au sol, poitrine fière.', easier: 'Assieds-toi vraiment puis relève-toi.' },
  squat: { name: 'Squat', icon: '🏋️', met: 5.5, cat: 'Jambes',
    desc: 'Pieds largeur d’épaules, descends comme pour t’asseoir, cuisses vers l’horizontale, remonte en poussant dans les talons.',
    tip: 'Inspire en descendant, souffle en montant.', easier: 'Squat sur chaise.' },
  fente_arriere: { name: 'Fentes arrière assistées', icon: '🦿', met: 5, cat: 'Jambes',
    desc: 'Tiens-toi à un dossier de chaise. Recule une jambe et fléchis les deux genoux, reviens. Alterne.',
    tip: 'Le genou avant ne dépasse pas trop la pointe du pied.', easier: 'Petite amplitude.' },
  chaise_mur: { name: 'Chaise contre le mur', icon: '🧱', met: 4, cat: 'Jambes',
    desc: 'Dos contre un mur, glisse jusqu’à ce que les genoux soient fléchis (à 90° si possible). Tiens la position.',
    tip: 'Plus tu es haut, plus c’est facile.' },
  pont: { name: 'Pont fessier', icon: '🌉', met: 3.5, cat: 'Fessiers',
    desc: 'Allongé sur le dos, genoux fléchis, pieds au sol. Monte le bassin en serrant les fessiers, redescends.',
    tip: 'Pousse dans les talons, ne cambre pas le bas du dos.' },
  mollets: { name: 'Montées sur pointes', icon: '🦶', met: 3, cat: 'Jambes',
    desc: 'Debout, tiens-toi à un mur. Monte sur la pointe des pieds, redescends lentement.',
    tip: 'Sur une marche pour plus d’amplitude.' },
  step_up: { name: 'Montées sur marche', icon: '🪜', met: 6, cat: 'Jambes',
    desc: 'Monte sur une marche (escalier, terrasse, banc bas) un pied après l’autre, redescends. Change de jambe de départ à mi-temps.',
    tip: 'Pose tout le pied sur la marche.', easier: 'Marche plus basse, tiens une rampe.' },

  // --- Haut du corps ---
  pompes_mur: { name: 'Pompes contre le mur', icon: '🧍', met: 3.8, cat: 'Haut du corps',
    desc: 'Face au mur, mains à hauteur d’épaules. Fléchis les coudes pour approcher la poitrine du mur, repousse.',
    tip: 'Corps droit comme une planche.' },
  pompes_inclinees: { name: 'Pompes inclinées', icon: '💪', met: 4.5, cat: 'Haut du corps',
    desc: 'Mains sur une table, un banc ou le rebord d’un muret. Descends la poitrine vers le support, repousse.',
    tip: 'Plus le support est bas, plus c’est dur.', easier: 'Pompes contre le mur.' },
  pompes_genoux: { name: 'Pompes sur les genoux', icon: '💪', met: 5, cat: 'Haut du corps',
    desc: 'Au sol, genoux posés (sur un coussin). Mains un peu plus larges que les épaules, descends et remonte.',
    tip: 'Gaine le ventre, ne creuse pas le dos.', easier: 'Pompes inclinées.' },
  superman: { name: 'Superman', icon: '🦸', met: 3, cat: 'Dos',
    desc: 'Allongé sur le ventre, bras devant. Décolle légèrement bras et jambes, tiens 2 s, repose.',
    tip: 'Regard vers le sol, nuque alignée.', easier: 'Lève seulement les bras, puis seulement les jambes.' },
  dips_chaise: { name: 'Dips sur chaise', icon: '🪑', met: 4, cat: 'Haut du corps',
    desc: 'Mains sur le bord d’une chaise stable, fesses devant. Fléchis les coudes vers l’arrière, remonte.',
    tip: 'Pieds proches = plus facile. Épaules basses.' },

  // --- Gainage / abdos ---
  planche_genoux: { name: 'Planche sur les genoux', icon: '📏', met: 3.3, cat: 'Gainage',
    desc: 'Sur les avant-bras et les genoux, corps aligné des épaules aux genoux. Tiens.',
    tip: 'Serre le ventre et les fessiers, respire.' },
  planche: { name: 'Planche', icon: '📏', met: 3.8, cat: 'Gainage',
    desc: 'Sur les avant-bras et la pointe des pieds, corps aligné. Tiens.',
    tip: 'Si le dos se creuse, repose les genoux.', easier: 'Planche sur les genoux.' },
  bird_dog: { name: 'Bird dog', icon: '🐕', met: 3, cat: 'Gainage',
    desc: 'À quatre pattes, tends le bras droit et la jambe gauche, tiens 2 s, reviens. Alterne.',
    tip: 'Le dos reste plat comme une table.' },
  dead_bug: { name: 'Dead bug', icon: '🪲', met: 3, cat: 'Gainage',
    desc: 'Sur le dos, bras vers le plafond, genoux à 90°. Descends bras droit et jambe gauche vers le sol, reviens. Alterne.',
    tip: 'Le bas du dos reste collé au sol.' },

  // --- Retour au calme ---
  etirement_quadri: { name: 'Étirement des cuisses', icon: '🧘', met: 2.3, cat: 'Étirement',
    desc: 'Debout, tiens-toi à un mur, attrape une cheville et ramène le talon vers la fesse. Change à mi-temps.',
    tip: 'Genoux serrés, bassin en avant.' },
  etirement_ischios: { name: 'Étirement arrière des jambes', icon: '🧘', met: 2.3, cat: 'Étirement',
    desc: 'Pose un talon sur une marche, jambe tendue, penche-toi doucement en avant dos droit. Change à mi-temps.',
    tip: 'Pas de douleur, juste une tension.' },
  etirement_pecs: { name: 'Étirement pectoraux', icon: '🧘', met: 2.3, cat: 'Étirement',
    desc: 'Avant-bras contre un cadre de porte, avance doucement le buste. Change à mi-temps.',
    tip: 'Respire profondément.' },
  etirement_dos: { name: 'Posture de l’enfant', icon: '🧘', met: 2.3, cat: 'Étirement',
    desc: 'À genoux, fesses vers les talons, allonge les bras devant toi au sol.',
    tip: 'Relâche les épaules à chaque expiration.' },
  respiration: { name: 'Respiration profonde', icon: '🌬️', met: 1.5, cat: 'Étirement',
    desc: 'Inspire 4 s par le nez, gonfle le ventre, expire 6 s par la bouche.',
    tip: 'Bravo pour cette séance !' },
};

// Paramètres par niveau : travail / repos (s), nombre de tours.
const LEVELS = {
  1: { name: 'Démarrage', work: 30, rest: 30, rounds: 2, roundRest: 60, walk: 25 },
  2: { name: 'Progression', work: 40, rest: 20, rounds: 3, roundRest: 60, walk: 35 },
  3: { name: 'Brûle-graisse', work: 45, rest: 15, rounds: 4, roundRest: 45, walk: 45 },
};

// Exercices des circuits selon le niveau.
const WORKOUTS = {
  full: {
    name: 'Full body', icon: '🔥', desc: 'Tout le corps, idéal pour démarrer la semaine.',
    circuit: {
      1: ['squat_chaise', 'pompes_mur', 'marche_genoux', 'pont', 'bird_dog', 'planche_genoux'],
      2: ['squat', 'pompes_inclinees', 'step_jack', 'fente_arriere', 'pont', 'planche_genoux'],
      3: ['squat', 'pompes_genoux', 'climber_incline', 'fente_arriere', 'burpee_sans_saut', 'planche'],
    },
  },
  cardio: {
    name: 'Cardio doux', icon: '❤️', desc: 'Cardio sans saut pour brûler un max en protégeant les genoux.',
    circuit: {
      1: ['marche_genoux', 'step_jack', 'boxe', 'talons_fesses', 'marche'],
      2: ['marche_genoux', 'step_jack', 'boxe', 'climber_incline', 'talons_fesses', 'step_up'],
      3: ['marche_genoux', 'burpee_sans_saut', 'boxe', 'climber_incline', 'step_jack', 'step_up'],
    },
  },
  renfo: {
    name: 'Renfo & gainage', icon: '💪', desc: 'Muscler pour augmenter la dépense au repos.',
    circuit: {
      1: ['chaise_mur', 'pompes_mur', 'pont', 'superman', 'dead_bug', 'mollets'],
      2: ['squat', 'pompes_inclinees', 'dips_chaise', 'superman', 'dead_bug', 'planche_genoux'],
      3: ['chaise_mur', 'pompes_genoux', 'dips_chaise', 'fente_arriere', 'superman', 'planche'],
    },
  },
  marche: {
    name: 'Marche active', icon: '🌳', desc: 'Alternance marche normale / rapide. Dans le jardin ou dehors.',
  },
  mobilite: {
    name: 'Mobilité & étirements', icon: '🧘', desc: '10 min pour récupérer et assouplir le corps.',
  },
};

const WARMUP = ['marche', 'rotation_bras', 'rotation_bassin', 'marche_genoux'];
const COOLDOWN = ['etirement_quadri', 'etirement_ischios', 'etirement_pecs', 'respiration'];
const MOBILITY = ['rotation_bras', 'rotation_bassin', 'bird_dog', 'pont', 'etirement_dos',
  'etirement_quadri', 'etirement_ischios', 'etirement_pecs', 'dead_bug', 'respiration'];

// Planning hebdo (0 = dimanche).
const WEEK_PLAN = { 1: 'full', 2: 'marche', 3: 'cardio', 4: 'mobilite', 5: 'renfo', 6: 'marche', 0: null };
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const HABITS = [
  { id: 'proteines', label: 'Protéines à chaque repas', icon: '🍗' },
  { id: 'legumes', label: 'Légumes à midi et le soir', icon: '🥦' },
  { id: 'sucre', label: 'Zéro boisson sucrée / alcool', icon: '🚫' },
  { id: 'grignotage', label: 'Pas de grignotage', icon: '🍪' },
  { id: 'sommeil', label: '7 h de sommeil', icon: '😴' },
];

const TIPS = [
  'Remplis la moitié de ton assiette de légumes, un quart de protéines, un quart de féculents.',
  'Un grand verre d’eau avant chaque repas aide à manger moins.',
  'Mange lentement : il faut environ 20 minutes pour ressentir la satiété.',
  'Les protéines (œufs, poulet, poisson, skyr, légumineuses) calent longtemps et protègent tes muscles.',
  'Les boissons sucrées et l’alcool sont des calories « invisibles » : c’est le levier le plus rapide.',
  'Prépare tes repas à l’avance pour éviter les choix impulsifs.',
  'La balance fluctue de ±1 kg par jour : regarde la tendance sur la semaine, pas le chiffre du jour.',
  'Pèse-toi le matin, à jeun, après être passé aux toilettes, pour des mesures comparables.',
  'Marcher 8 000 à 10 000 pas par jour brûle souvent plus que les séances elles-mêmes.',
  'Le sommeil compte : moins de 6 h augmente la faim le lendemain.',
  'Un écart n’annule rien. Reprends simplement au repas suivant.',
  'Garde des collations saines à portée : fruits, yaourt nature, amandes (une poignée).',
];

const FOOD_PRESETS = [
  { label: 'Petit-déj équilibré', kcal: 400 }, { label: 'Repas équilibré', kcal: 600 },
  { label: 'Collation', kcal: 150 }, { label: 'Fruit', kcal: 80 },
  { label: 'Fast-food', kcal: 1100 }, { label: 'Pizza (entière)', kcal: 900 },
  { label: 'Bière 50 cl', kcal: 210 }, { label: 'Soda 33 cl', kcal: 140 },
];
