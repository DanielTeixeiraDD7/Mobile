<script setup lang="ts">
import type { Barre } from './types';
/** Histogramme vertical simple (mois, jours de la semaine…), barre en surbrillance. */
const props = withDefaults(defineProps<{ barres: Barre[]; format: (n: number) => string; hauteur?: number }>(), { hauteur: 150 });
const max = computed(() => Math.max(1, ...props.barres.map(b => b.valeur)));
const anime = ref(false);
onMounted(() => requestAnimationFrame(() => (anime.value = true)));
</script>

<template>
  <div class="barres" :style="{ height: hauteur + 'px' }">
    <div v-for="(b, i) in barres" :key="i" class="col" :class="{ actif: b.actif }">
      <small class="val num">{{ b.valeur ? format(b.valeur) : '' }}</small>
      <div class="piste"><i :style="{ height: (anime ? (b.valeur / max) * 100 : 0) + '%', background: b.couleur, transitionDelay: i * 40 + 'ms' }" /></div>
      <span class="lib">{{ b.libelle }}</span>
    </div>
  </div>
</template>

<style scoped>
.barres { display: flex; align-items: stretch; gap: 8px; }
.col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 0; }
.piste { flex: 1; width: 100%; max-width: 38px; display: flex; align-items: flex-end; }
.piste i { display: block; width: 100%; min-height: 3px; border-radius: 9px 9px 4px 4px; background: var(--surface-3); transition: height .8s var(--ease); }
.actif .piste i { background: var(--brand); }
.val { font-size: 11px; font-weight: 700; color: var(--dim); white-space: nowrap; }
.actif .val { color: var(--text); }
.lib { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: capitalize; }
.actif .lib { color: var(--text); }
</style>
