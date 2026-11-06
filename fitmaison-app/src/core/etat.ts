import type { Niveau, TypeSeance } from './programmes';
import type { Gouts } from './aliments';

/**
 * Données de l'app, au MÊME format et sous la MÊME clé que FitMaison v1 (localStorage « fitmaison_v1 »).
 * Les champs ajoutés par la v2 sont facultatifs : la v1 (archive) peut toujours relire les données.
 */
export const CLE = 'fitmaison_v1';

export interface Profil {
  name: string; sex: 'h' | 'f'; age: number; height: number; goalWeight: number; activity: number;
  startWeight: number; level: Niveau; createdAt: string;
}
export interface Pesee { date: string; kg: number }
export interface SeanceFaite { date: string; type: TypeSeance; level: Niveau; duration: number; kcal: number; feel: 0 | 1 | 2 | 3; steps?: number; exos?: string[] }
export interface Jour {
  water: number; steps: number; habits: Record<string, boolean>; food: { label: string; kcal: number }[];
  /** v3 : pauses actives au bureau faites ce jour (séance « bureau » terminée ou pause notée à la main). */
  pauses?: number;
  /** v3 : douleur genoux / dos ressentie ce jour (0 à 10), règle de la douleur du plan. */
  douleur?: number;
}
export interface Reglages {
  voice: boolean; sound: boolean; vibrate: boolean;
  /** v2 : démonstration des exercices jamais faits avant de les commencer. */
  demo?: boolean;
  /** v2 : la voix rappelle un point clé au début de chaque exercice. */
  conseilVocal?: boolean;
  theme?: 'sombre' | 'clair' | 'auto';
}
export interface Etat {
  profile: Profil | null;
  weights: Pesee[];
  sessions: SeanceFaite[];
  days: Record<string, Jour>;
  settings: Reglages;
  /** v2 : exercices déjà faits au moins une fois (pas de démo pour eux). */
  vus?: string[];
  /** v2 : exercice → version plus facile choisie pendant une séance (gardée pour les suivantes). */
  remplacements?: Record<string, string>;
  /** v2 : exercices favoris. */
  favoris?: string[];
  /** v3 : goûts alimentaires (aliments exclus, fruits aimés) pour les idées de repas. */
  gouts?: Gouts;
  /** v3 : plan « Objectif Foot » (facultatif). */
  plan?: PlanEtat;
}

export type PhaseId = 'reveil' | 'fondations' | 'moteur' | 'terrain';
/** Bilan (test de passage) du plan. Tous les champs mesurés sont facultatifs : on note ce qu'on a pu faire. */
export interface BilanPlan {
  date: string;
  /** Test de la parole pendant 6 min de marche rapide : 2 = phrases complètes, 1 = phrases courtes, 0 = quelques mots. */
  parole?: 0 | 1 | 2;
  /** Distance parcourue en 6 min de marche (m). */
  marche6?: number;
  /** Assis-debout depuis une chaise en 30 s (répétitions). */
  assisDebout?: number;
  /** Tenue de gainage (planche sur les genoux ou chaise contre le mur), en secondes. */
  gainage?: number;
  /** Essoufflement après un étage d'escalier, 0 (aucun) à 10 (maximal). */
  escaliers?: number;
  poids?: number;
  /** Tour de taille (cm). */
  tour?: number;
  /** Douleur genoux / dos la plus forte pendant ou après le bilan (0 à 10). */
  douleur?: number;
}
export interface PlanEtat {
  /** Date de début (lundi de la première semaine ou jour de démarrage). */
  debut: string;
  /** Phase choisie à la main à partir d'une date (sinon : calculée par les bilans). */
  phaseForcee?: { phase: PhaseId; depuis: string };
  bilans: BilanPlan[];
  /** Pauses du plan (« reprendre ») : à partir du lundi `date`, le plan recule de `semaines`. */
  reprises?: { date: string; semaines: number }[];
  /** Pas par jour au départ (mesurés ou estimés). */
  pasDepart?: number;
  /** Questionnaire santé (type PAR-Q+). */
  sante?: { date: string; oui: string[]; avisMedical?: boolean };
  /** Rappel de pause active quand l'app est ouverte. */
  rappel?: { actif: boolean; minutes: number; notification?: boolean; debut?: number; fin?: number };
}

export const etatVide = (): Etat => ({
  profile: null, weights: [], sessions: [], days: {},
  settings: { voice: true, sound: true, vibrate: true, demo: true, conseilVocal: true, theme: 'sombre' },
});

export function charger(stockage: Pick<Storage, 'getItem'> = localStorage): Etat {
  try {
    const brut = stockage.getItem(CLE);
    if (brut) return normaliser(JSON.parse(brut));
  } catch { /* stockage indisponible ou données illisibles */ }
  return etatVide();
}

/** Complète les champs manquants (données v1 ou import partiel) sans rien perdre. */
export function normaliser(d: Partial<Etat>): Etat {
  const v = etatVide();
  return {
    ...v, ...d,
    weights: Array.isArray(d.weights) ? d.weights : [],
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    days: d.days && typeof d.days === 'object' ? d.days : {},
    settings: { ...v.settings, ...(d.settings ?? {}) },
    ...(d.plan && typeof d.plan === 'object' && typeof d.plan.debut === 'string'
      ? { plan: { ...d.plan, bilans: Array.isArray(d.plan.bilans) ? d.plan.bilans : [] } }
      : { plan: undefined }),
  };
}

export function enregistrer(e: Etat, stockage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try { stockage.setItem(CLE, JSON.stringify(e)); return true; } catch { return false; }
}

/** Import (fichier ou copier-coller) : refuse ce qui ne ressemble pas à une sauvegarde FitMaison. */
export function lireSauvegarde(texte: string): Etat {
  const d = JSON.parse(texte);
  if (!d || typeof d !== 'object' || !d.profile || !Array.isArray(d.weights)) throw new Error('Données invalides');
  return normaliser(d);
}
