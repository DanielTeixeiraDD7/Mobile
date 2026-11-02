/** Programmes, niveaux, planning, habitudes, conseils (repris de FitMaison v1). */
export type TypeSeance = 'full' | 'cardio' | 'renfo' | 'marche' | 'mobilite'
  // v3 (plan « Objectif Foot ») : séances construites dans seance.ts.
  | 'bureau' | 'souffle' | 'foot' | 'intervalles' | 'marche_course' | 'prevention';
export type Niveau = 1 | 2 | 3;

export const NIVEAUX: Record<Niveau, { nom: string; work: number; rest: number; rounds: number; roundRest: number; walk: number }> = {
  1: { nom: 'Démarrage', work: 30, rest: 30, rounds: 2, roundRest: 60, walk: 25 },
  2: { nom: 'Progression', work: 40, rest: 20, rounds: 3, roundRest: 60, walk: 35 },
  3: { nom: 'Brûle-graisse', work: 45, rest: 15, rounds: 4, roundRest: 45, walk: 45 },
};

export const SEANCES: Record<TypeSeance, { nom: string; icone: string; desc: string; circuit?: Record<Niveau, string[]> }> = {
  full: {
    nom: 'Full body', icone: '🔥', desc: 'Tout le corps, idéal pour démarrer la semaine.',
    circuit: {
      1: ['squat_chaise', 'pompes_mur', 'marche_genoux', 'pont', 'bird_dog', 'planche_genoux'],
      2: ['squat', 'pompes_inclinees', 'step_jack', 'fente_arriere', 'pont', 'planche_genoux'],
      3: ['squat', 'pompes_genoux', 'climber_incline', 'fente_arriere', 'burpee_sans_saut', 'planche'],
    },
  },
  cardio: {
    nom: 'Cardio doux', icone: '❤️', desc: 'Cardio sans saut pour brûler un max en protégeant les genoux.',
    circuit: {
      1: ['marche_genoux', 'step_jack', 'boxe', 'talons_fesses', 'marche'],
      2: ['marche_genoux', 'step_jack', 'boxe', 'climber_incline', 'talons_fesses', 'step_up'],
      3: ['marche_genoux', 'burpee_sans_saut', 'boxe', 'climber_incline', 'step_jack', 'step_up'],
    },
  },
  renfo: {
    nom: 'Renfo & gainage', icone: '💪', desc: 'Muscler pour augmenter la dépense au repos.',
    circuit: {
      1: ['chaise_mur', 'pompes_mur', 'pont', 'superman', 'dead_bug', 'mollets'],
      2: ['squat', 'pompes_inclinees', 'dips_chaise', 'superman', 'dead_bug', 'planche_genoux'],
      3: ['chaise_mur', 'pompes_genoux', 'dips_chaise', 'fente_arriere', 'superman', 'planche'],
    },
  },
  marche: { nom: 'Marche active', icone: '🌳', desc: 'Alternance marche normale / rapide. Dans le jardin ou dehors.' },
  mobilite: { nom: 'Mobilité & étirements', icone: '🧘', desc: '10 min pour récupérer et assouplir le corps.' },
  // ----- v3 : plan « Objectif Foot » (aucun saut) -----
  bureau: { nom: 'Pause active bureau', icone: '🪑', desc: '4 min pour casser la position assise : se lever, ouvrir la poitrine, détendre la nuque et les hanches.' },
  souffle: { nom: 'Souffle & marche facile', icone: '🌬️', desc: 'Respiration ventrale puis marche à allure où tu peux parler en phrases complètes.' },
  foot: {
    nom: 'Technique balle', icone: '⚽', desc: 'Toucher de balle au jardin, sans course ni saut : conduite, passes contre un mur, contrôles.',
    circuit: {
      1: ['toucher_ballon', 'conduite_balle', 'passe_mur', 'controle_semelle', 'equilibre_unipodal'],
      2: ['toucher_ballon', 'conduite_balle', 'slalom_plots', 'passe_mur', 'controle_semelle', 'frappe_lente'],
      3: ['conduite_balle', 'slalom_plots', 'pas_chasses_plots', 'passe_mur', 'frappe_lente', 'controle_semelle', 'equilibre_unipodal'],
    },
  },
  intervalles: { nom: 'Intervalles marche', icone: '⏱️', desc: 'Marche rapide / marche normale, puis montées de marche au niveau 3. Sans impact.' },
  marche_course: { nom: 'Marche / trottinement', icone: '🏃', desc: 'Retour progressif à la course : petits trottinements entre des blocs de marche (inspiré de Couch to 5K).' },
  prevention: {
    nom: 'Prévention blessures', icone: '🛡️', desc: 'Inspiré du FIFA 11+ : gainage, équilibre, pont, appuis latéraux. Sans saut.',
    circuit: {
      1: ['planche_genoux', 'pont', 'equilibre_unipodal', 'squat_chaise', 'marche_laterale', 'mollets'],
      2: ['planche_genoux', 'pont_marche', 'equilibre_unipodal', 'squat', 'pas_chasses_plots', 'mollets'],
      3: ['planche', 'pont_marche', 'equilibre_unipodal', 'fente_arriere', 'pas_chasses_plots', 'mollets'],
    },
  },
};
export const TYPES: TypeSeance[] = ['full', 'cardio', 'renfo', 'marche', 'mobilite', 'souffle', 'intervalles', 'foot', 'prevention', 'marche_course', 'bureau'];
/** Séances surtout marchées : le podomètre se lance automatiquement. */
export const TYPES_MARCHE: TypeSeance[] = ['marche', 'souffle', 'intervalles', 'marche_course'];

export const ECHAUFFEMENT = ['marche', 'rotation_bras', 'rotation_bassin', 'marche_genoux'];
export const RETOUR_CALME = ['etirement_quadri', 'etirement_ischios', 'etirement_pecs', 'respiration'];
export const MOBILITE = ['rotation_bras', 'rotation_bassin', 'bird_dog', 'pont', 'etirement_dos', 'etirement_quadri', 'etirement_ischios', 'etirement_pecs', 'dead_bug', 'respiration'];

/** Planning hebdo (0 = dimanche). */
export const PLANNING: Record<number, TypeSeance | null> = { 1: 'full', 2: 'marche', 3: 'cardio', 4: 'mobilite', 5: 'renfo', 6: 'marche', 0: null };
export const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const HABITUDES = [
  { id: 'proteines', label: 'Protéines à chaque repas', icone: '🍗' },
  { id: 'legumes', label: 'Légumes à midi et le soir', icone: '🥦' },
  { id: 'sucre', label: 'Zéro boisson sucrée / alcool', icone: '🚫' },
  { id: 'grignotage', label: 'Pas de grignotage', icone: '🍪' },
  { id: 'sommeil', label: '7 h de sommeil', icone: '😴' },
];

export const CONSEILS = [
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

export const REPAS_TYPES = [
  { label: 'Petit-déj équilibré', kcal: 400 }, { label: 'Repas équilibré', kcal: 600 },
  { label: 'Collation', kcal: 150 }, { label: 'Fruit', kcal: 80 },
  { label: 'Fast-food', kcal: 1100 }, { label: 'Pizza (entière)', kcal: 900 },
  { label: 'Bière 50 cl', kcal: 210 }, { label: 'Soda 33 cl', kcal: 140 },
];

export const PALIERS = [120, 115, 110, 105, 100, 99];
