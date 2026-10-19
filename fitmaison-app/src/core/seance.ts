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

/** Construit la séance (mêmes durées et mêmes enchaînements que FitMaison v1). */
export function construire(type: TypeSeance, niveau: Niveau, o: Options = {}): Etape[] {
  const L = NIVEAUX[niveau];
  const etapes: Etape[] = [];
  const vus = new Set(o.vus ?? []);
  const demontres = new Set<string>();
  const remplacer = (cle: string) => o.remplacements?.[cle] && EXERCICES[o.remplacements[cle]!] ? o.remplacements[cle]! : cle;
  const ajouter = (cleBrute: string, dur: number, phase: Phase, extra: Partial<Etape> = {}) => {
    const cle = phase === 'work' ? remplacer(cleBrute) : cleBrute;
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
  ECHAUFFEMENT.forEach(k => ajouter(k, 45, 'warmup'));
  const circuit = SEANCES[type].circuit![niveau];
  for (let r = 1; r <= L.rounds; r++) {
    circuit.forEach((k, i) => {
      ajouter(k, L.work, 'work', { round: r, rounds: L.rounds });
      if (i < circuit.length - 1) repos(L.rest);
    });
    if (r < L.rounds) repos(L.roundRest, `Pause – tour ${r + 1}/${L.rounds} ensuite`);
  }
  RETOUR_CALME.forEach(k => ajouter(k, 30, 'cool'));
  return etapes;
}

export const duree = (etapes: Etape[]) => etapes.reduce((t, s) => t + s.dur, 0);

/** Matériel nécessaire pour toute la séance. */
export function materielSeance(etapes: Etape[]) {
  return [...new Set(etapes.filter(e => e.cle !== 'rest').flatMap(e => EXERCICES[e.cle]?.materiel ?? []))];
}

/** Exercices distincts de la séance, dans l'ordre d'apparition. */
export const exercicesSeance = (etapes: Etape[]) => [...new Set(etapes.filter(e => e.cle !== 'rest' && e.phase !== 'demo').map(e => e.cle))];
