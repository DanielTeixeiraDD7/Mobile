import { EXERCICES } from './exercices';
import { ECHAUFFEMENT, MOBILITE, NIVEAUX, RETOUR_CALME, SEANCES, type Niveau, type TypeSeance } from './programmes';

export type Phase = 'warmup' | 'work' | 'rest' | 'cool' | 'demo';
export interface Etape {
  /** Identifiant d'exercice, ou « rest » pour une récupération. */
  cle: string;
  nom: string;
  icone: string;
  met: number;
  dur: number;
  phase: Phase;
  round?: number;
  rounds?: number;
}

export interface Options {
  /** Exercices jamais faits : une démo de 15 s est insérée avant leur première apparition. */
  vus?: string[];
  demo?: boolean;
  /** Exercice → remplaçant plus facile choisi lors d'une séance précédente. */
  remplacements?: Record<string, string>;
}

export const DUREE_DEMO = 15;

/** Séance du plan : un exercice absent de la bibliothèque (ancienne version) est remplacé par un proche. */
const REPLI: Record<string, string> = {
  assis_debout: 'squat_chaise', etirement_flechisseurs: 'etirement_quadri', extension_dos: 'etirement_dos', ouverture_poitrine: 'etirement_pecs',
  etirement_nuque: 'rotation_bras', rotation_buste_assis: 'rotation_bassin', marche_laterale: 'marche', pont_marche: 'pont',
  respiration_ventrale: 'respiration', marche_course: 'marche_rapide', conduite_balle: 'marche', passe_mur: 'marche_genoux',
  controle_semelle: 'mollets', toucher_ballon: 'marche_genoux', slalom_plots: 'marche', frappe_lente: 'marche_genoux',
  pas_chasses_plots: 'marche', equilibre_unipodal: 'mollets',
};
const existe = (cle: string) => (EXERCICES[cle] ? cle : REPLI[cle] && EXERCICES[REPLI[cle]!] ? REPLI[cle]! : 'marche');

/** Pause active bureau (~4 min) : se lever, ouvrir, détendre, marcher. Identique à tous les niveaux. */
export const PAUSE_BUREAU: [string, number][] = [
  ['assis_debout', 40], ['rotation_buste_assis', 30], ['etirement_nuque', 30], ['ouverture_poitrine', 30],
  ['etirement_flechisseurs', 40], ['extension_dos', 30], ['marche', 40],
];
const ECHAUFFEMENT_FOOT = ['marche', 'rotation_bassin', 'marche_laterale', 'rotation_bras'];
const ECHAUFFEMENT_PREVENTION = ['marche', 'marche_laterale', 'rotation_bassin', 'marche_genoux'];
const RETOUR_CALME_PLAN = ['etirement_quadri', 'etirement_ischios', 'etirement_flechisseurs', 'respiration'];
/** Marche / trottinement : [trot (s), marche (s), répétitions, trot final (s)]. N2 = semaine 1 de Couch to 5K (NHS), N3 = semaine 2. */
export const MARCHE_COURSE: Record<Niveau, [number, number, number, number]> = { 1: [30, 120, 6, 0], 2: [60, 90, 7, 60], 3: [90, 120, 5, 90] };
/** Intervalles marche : [rapide (s), normale (s), répétitions, montées de marche (s)]. */
export const INTERVALLES: Record<Niveau, [number, number, number, number]> = { 1: [60, 120, 5, 0], 2: [120, 90, 6, 0], 3: [120, 90, 6, 30] };
/** Souffle : minutes de marche facile. */
export const SOUFFLE_MIN: Record<Niveau, number> = { 1: 10, 2: 15, 3: 20 };

/** Construit la séance (mêmes durées et mêmes enchaînements que FitMaison v1). */
export function construire(type: TypeSeance, niveau: Niveau, o: Options = {}): Etape[] {
  const L = NIVEAUX[niveau];
  const etapes: Etape[] = [];
  const vus = new Set(o.vus ?? []);
  const demontres = new Set<string>();
  const remplacer = (cle: string) => o.remplacements?.[cle] && EXERCICES[o.remplacements[cle]!] ? o.remplacements[cle]! : cle;
  const ajouter = (cleBrute: string, dur: number, phase: Phase, extra: Partial<Etape> = {}) => {
    const cle = existe(phase === 'work' ? remplacer(cleBrute) : cleBrute);
    const e = EXERCICES[cle]!;
    if (o.demo && phase === 'work' && !vus.has(cle) && !demontres.has(cle)) {
      demontres.add(cle);
      etapes.push({ cle, nom: e.nom, icone: e.icone, met: 1.5, dur: DUREE_DEMO, phase: 'demo' });
    }
    etapes.push({ cle, nom: e.nom, icone: e.icone, met: e.met, dur, phase, ...extra });
  };
  const repos = (dur: number, nom = 'Récupération') => etapes.push({ cle: 'rest', nom, icone: '⏸️', met: 1.5, dur, phase: 'rest' });

  if (type === 'marche') {
    ajouter('marche', 120, 'warmup');
    const total = L.walk * 60 - 120 - 60;
    const blocs = Math.max(2, Math.round(total / 300));
    for (let i = 0; i < blocs; i++) {
      ajouter('marche_normale', 180, 'work', { round: i + 1, rounds: blocs });
      ajouter('marche_rapide', 120, 'work', { round: i + 1, rounds: blocs });
    }
    ajouter('respiration', 60, 'cool');
    return etapes;
  }
  if (type === 'mobilite') {
    MOBILITE.forEach(k => ajouter(k, 60, 'cool'));
    return etapes;
  }
  if (type === 'bureau') {
    PAUSE_BUREAU.forEach(([k, d], i) => ajouter(k, d, 'work', { round: i + 1, rounds: PAUSE_BUREAU.length }));
    return etapes;
  }
  if (type === 'souffle') {
    ajouter('respiration_ventrale', 90, 'warmup');
    ajouter('marche', 120, 'warmup');
    const blocs = SOUFFLE_MIN[niveau] / 5;
    for (let i = 0; i < blocs; i++) ajouter('marche_normale', 300, 'work', { round: i + 1, rounds: blocs });
    ajouter('respiration_ventrale', 60, 'cool');
    return etapes;
  }
  if (type === 'intervalles') {
    const [vite, lent, n, marche] = INTERVALLES[niveau];
    ajouter('marche', 180, 'warmup');
    for (let i = 1; i <= n; i++) {
      ajouter('marche_rapide', vite, 'work', { round: i, rounds: n });
      if (marche) ajouter('step_up', marche, 'work', { round: i, rounds: n });
      ajouter('marche_normale', lent, 'work', { round: i, rounds: n });
    }
    ajouter('marche_normale', 120, 'cool');
    ajouter('respiration', 60, 'cool');
    return etapes;
  }
  if (type === 'marche_course') {
    const [trot, marche, n, final] = MARCHE_COURSE[niveau];
    ajouter('marche_rapide', 300, 'warmup');
    for (let i = 1; i <= n; i++) {
      ajouter('marche_course', trot, 'work', { round: i, rounds: n });
      ajouter('marche_normale', marche, 'work', { round: i, rounds: n });
    }
    if (final) ajouter('marche_course', final, 'work', { round: n, rounds: n });
    ajouter('marche_normale', 300, 'cool');
    ajouter('etirement_quadri', 30, 'cool');
    ajouter('etirement_ischios', 30, 'cool');
    return etapes;
  }
  const plan = type === 'foot' || type === 'prevention';
  (type === 'foot' ? ECHAUFFEMENT_FOOT : type === 'prevention' ? ECHAUFFEMENT_PREVENTION : ECHAUFFEMENT).forEach(k => ajouter(k, 45, 'warmup'));
  const circuit = SEANCES[type].circuit?.[niveau] ?? SEANCES.full.circuit![niveau];
  for (let r = 1; r <= L.rounds; r++) {
    circuit.forEach((k, i) => {
      ajouter(k, L.work, 'work', { round: r, rounds: L.rounds });
      if (i < circuit.length - 1) repos(L.rest);
    });
    if (r < L.rounds) repos(L.roundRest, `Pause – tour ${r + 1}/${L.rounds} ensuite`);
  }
  (plan ? RETOUR_CALME_PLAN : RETOUR_CALME).forEach(k => ajouter(k, 30, 'cool'));
  return etapes;
}

export const duree = (etapes: Etape[]) => etapes.reduce((t, s) => t + s.dur, 0);

/** Matériel nécessaire pour toute la séance. */
export function materielSeance(etapes: Etape[]) {
  return [...new Set(etapes.filter(e => e.cle !== 'rest').flatMap(e => EXERCICES[e.cle]?.materiel ?? []))];
}

/** Exercices distincts de la séance, dans l'ordre d'apparition. */
export const exercicesSeance = (etapes: Etape[]) => [...new Set(etapes.filter(e => e.cle !== 'rest' && e.phase !== 'demo').map(e => e.cle))];
