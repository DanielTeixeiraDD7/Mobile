import type { MediaSnapshot } from '@/domain/types';

/** Feuille « Ajouter à ma bibliothèque », ouverte depuis n'importe quelle affiche (affichée par App). */
const media = ref<MediaSnapshot | null>(null);
export const ouvrirAjout = (m: MediaSnapshot) => { media.value = m; };
export const useAjout = () => media;
