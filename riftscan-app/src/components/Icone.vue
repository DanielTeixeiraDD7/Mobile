<script setup lang="ts">
/** Icônes au trait (24 × 24). */
withDefaults(defineProps<{ nom: keyof typeof CHEMINS; taille?: number }>(), { taille: 22 });
</script>
<script lang="ts">
const CHEMINS = {
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 7h6v10H9z',
  recherche: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  collection: 'M7 4h10v14H7zM4 7v12a1 1 0 0 0 1 1h11M10 8h4',
  infos: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 11v5M12 7.5h.01',
  flash: 'M13 2 4 14h7l-1 8 9-12h-7z',
  photo: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plus: 'M12 5v14M5 12h14',
  moins: 'M5 12h14',
  externe: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  retour: 'M15 18l-6-6 6-6',
  fermer: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12l5 5L20 7',
  hausse: 'M4 16l6-6 4 4 6-6M14 8h6v6',
  camera: 'M3 8h4l2-3h6l2 3h4v11H3zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
} as const;
</script>
<template>
  <svg :width="taille" :height="taille" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="CHEMINS[nom]" />
  </svg>
</template>
