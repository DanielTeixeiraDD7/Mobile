<script setup lang="ts">
/** Jeu d'icônes au trait (24×24), dessiné pour l'app. */
const props = withDefaults(defineProps<{ nom: string; taille?: number; epaisseur?: number }>(), { taille: 22, epaisseur: 2 });

const CHEMINS: Record<string, string> = {
  accueil: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  liste: 'M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  plus: 'M12 5v14M5 12h14',
  budget: 'M12 3a9 9 0 1 0 9 9h-9z M15 3.5A9 9 0 0 1 20.5 9H15z',
  stats: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
  reglages: 'M4 7h10M18 7h2M4 17h4M12 17h8 M16 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z M10 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  gauche: 'M15 18l-6-6 6-6',
  droite: 'M9 18l6-6-6-6',
  bas: 'M6 9l6 6 6-6',
  fermer: 'M6 6l12 12M18 6 6 18',
  retour: 'M19 12H5M11 18l-6-6 6-6',
  effacer: 'M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z M17 9l-6 6M11 9l6 6',
  poubelle: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  crayon: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  calendrier: 'M4 6h16v14H4z M4 10h16M8 3v4M16 3v4',
  note: 'M5 4h10l4 4v12H5z M14 4v5h5M8 13h8M8 17h5',
  recherche: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z M20 20l-4-4',
  filtre: 'M4 5h16l-6 8v6l-4-2v-4z',
  check: 'M5 12.5 10 17l9-10',
  alerte: 'M12 3 2 20h20z M12 10v4M12 17h.01',
  info: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 11v6M12 7.5h.01',
  tendanceHaut: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  tendanceBas: 'M3 7l6 6 4-4 8 8M15 17h6v-6',
  eclair: 'M13 2 4 14h7l-1 8 9-12h-7z',
  cible: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z M12 12h.01',
  personnes: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21v-1a6 6 0 0 1 12 0v1 M17 11a3 3 0 1 0 0-6 M22 21v-1a5 5 0 0 0-4-4.9',
  echange: 'M7 16H20M17 13l3 3-3 3 M17 8H4M7 5 4 8l3 3',
  nuage: 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z',
  synchro: 'M20 11a8 8 0 0 0-14.5-4.5L4 8 M4 4v4h4 M4 13a8 8 0 0 0 14.5 4.5L20 16 M20 20v-4h-4',
  telecharger: 'M12 4v12M7 11l5 5 5-5M5 20h14',
  envoyer: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  langue: 'M4 5h9M8.5 3v2M6 5c0 5 3 8 6 9 M11 5c0 4-3 8-7 9 M13 21l4-9 4 9M14.5 18h5',
  palette: 'M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1 3.7c.6.4.4 2.3-3 2.3z M7.5 11h.01M10 7.5h.01M14 7.5h.01M16.5 11h.01',
  lune: 'M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z',
  soleil: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  copier: 'M9 9h11v11H9z M5 15H4V4h11v1',
  sortie: 'M15 4h4v16h-4M10 17l-5-5 5-5M5 12h11',
  etoile: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  feu: 'M12 22c4 0 7-2.7 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4.3 3 7 7 7z',
  tirelire: 'M5 11a7 6 0 0 1 13-2h2v4l-2 1v3h-3v-2h-5v2H7v-3a6 6 0 0 1-2-3z M14 9h.01 M9 6a3 3 0 0 1 5 0',
  horloge: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 7v5l3 2',
  oeil: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  maison: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M9 21v-6h6v6',
  panier: 'M3 4h2l2.5 11h11L21 7H6.5 M9 20h.01M18 20h.01',
  voiture: 'M5 16h14M5 16v3h3v-3M16 16v3h3v-3 M3 13l2-6h14l2 6v3H3z M7 13h.01M17 13h.01',
  coeur: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  sourire: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01',
  pilule: 'M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z M8.5 8.5l7 7',
  portefeuille: 'M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11v3 M16 13.5h.01',
  pieces: 'M9 14a6 4 0 1 0 0-8 6 4 0 0 0 0 8z M3 10v4c0 2.2 2.7 4 6 4s6-1.8 6-4 M15 10.5c3.4 0 6 1.8 6 4s-2.7 4-6 4c-1 0-2-.2-2.8-.5',
  boite: 'M3 8l9-5 9 5v8l-9 5-9-5z M3 8l9 5 9-5M12 13v8',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  cadenas: 'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4',
  film: 'M4 4h16v16H4z M8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4',
  tv: 'M3 7h18v12H3z M8 3l4 4 4-4',
  anime: 'M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6l-5 2.9 1.4-5.7L4 9l5.8-.7z',
  livre: 'M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z',
  cloche: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4z M10 21h4',
  externe: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  annuler: 'M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3',
  moins: 'M5 12h14',
  profil: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z M4 21a8 8 0 0 1 16 0',
  biblio: 'M4 4h4v16H4z M10 4h4v16h-4z M16 5l3.5-.8 3 15.6-3.5.8z',
  play: 'M7 4.5v15l12-7.5z',
  sablier: 'M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9',
  ecran: 'M3 4h18v12H3z M8 20h8M12 16v4',
  donnees: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  bulle: 'M4 5h16v11H9l-5 4z',
  haltere: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12',
  balance: 'M5 4h14l2 16H3z M9 9a3 3 0 0 1 6 0 M12 9l1.5-2',
  assiette: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  goutte: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  chaussure: 'M3 16v-5l4 1 3-4 3 3c2 2 5 2 8 3v4H3z M3 19h18',
  pause: 'M8 5v14M16 5v14',
  suivant: 'M6 5l9 7-9 7z M18 5v14',
  precedent: 'M18 5l-9 7 9 7z M6 5v14',
  volume: 'M4 9h4l5-4v14l-5-4H4z M17 9a4 4 0 0 1 0 6',
  muet: 'M4 9h4l5-4v14l-5-4H4z M17 9l4 6M21 9l-4 6',
  question: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6 M12 17h.01',
  baisse: 'M12 5v14M6 13l6 6 6-6',
};

const d = computed(() => CHEMINS[props.nom] ?? CHEMINS.info);
</script>

<template>
  <svg :width="taille" :height="taille" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="epaisseur" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ic">
    <path :d="d" />
  </svg>
</template>

<style scoped>
.ic { flex: none; display: block; }
</style>
