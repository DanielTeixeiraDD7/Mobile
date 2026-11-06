import type { Niveau, TypeSeance } from '@/core/programmes';

/** Séance en cours (affichée en plein écran par Lecteur.vue, au-dessus de toutes les pages). */
const enCours = ref<TypeSeance | null>(null);
/** Options de la séance en cours (ex. niveau prescrit par le plan). Remises à zéro à la fermeture. */
export interface OptionsSeance { niveau?: Niveau; plan?: boolean }
const options = ref<OptionsSeance>({});
watch(enCours, v => { if (!v) options.value = {}; });
export const lancerSeance = (t: TypeSeance, o: OptionsSeance = {}) => { options.value = o; enCours.value = t; };
export const useSeanceEnCours = () => enCours;
export const useOptionsSeance = () => options;

/** Fiche d'un exercice ouverte par-dessus (pendant une séance notamment). */
const fiche = ref<string | null>(null);
export const ouvrirFiche = (id: string) => { fiche.value = id; };
export const useFicheOuverte = () => fiche;
