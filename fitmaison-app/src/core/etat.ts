import type { Niveau, TypeSeance } from './programmes';

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
export interface Jour { water: number; steps: number; habits: Record<string, boolean>; food: { label: string; kcal: number }[] }
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
