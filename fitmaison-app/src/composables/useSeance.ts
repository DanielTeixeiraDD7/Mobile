import type { TypeSeance } from '@/core/programmes';

/** Séance en cours (affichée en plein écran par Lecteur.vue, au-dessus de toutes les pages). */
const enCours = ref<TypeSeance | null>(null);
export const lancerSeance = (t: TypeSeance) => { enCours.value = t; };
export const useSeanceEnCours = () => enCours;

/** Fiche d'un exercice ouverte par-dessus (pendant une séance notamment). */
const fiche = ref<string | null>(null);
export const ouvrirFiche = (id: string) => { fiche.value = id; };
export const useFicheOuverte = () => fiche;
