/** Préférences lues par les adaptateurs (fournies par le store ; valeurs par défaut sinon). */
export interface AdapterPrefs {
  /** Compétitions suivies par jeu (identifiants propres à la source). Vide = choix par défaut du jeu. */
  followed: Record<string, string[]>;
}

let current: AdapterPrefs = { followed: {} };
export const getPrefs = () => current;
export const setPrefs = (p: AdapterPrefs) => { current = p; };
