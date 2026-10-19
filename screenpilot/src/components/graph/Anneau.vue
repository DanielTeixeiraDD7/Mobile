<script setup lang="ts">
/** Anneau de progression (0–1+), couleur selon le niveau. */
const props = withDefaults(defineProps<{ ratio: number; taille?: number; epaisseur?: number; couleur?: string; fond?: string }>(), { taille: 120, epaisseur: 12, couleur: 'currentColor', fond: 'rgba(255,255,255,.18)' });
const r = computed(() => (props.taille - props.epaisseur) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const anime = ref(0);
onMounted(() => requestAnimationFrame(() => (anime.value = 1)));
const offset = computed(() => circ.value * (1 - Math.min(1, Math.max(0, props.ratio)) * anime.value));
</script>

<template>
  <div class="anneau" :style="{ width: taille + 'px', height: taille + 'px' }">
    <svg :viewBox="`0 0 ${taille} ${taille}`" :width="taille" :height="taille" aria-hidden="true">
      <circle :cx="taille / 2" :cy="taille / 2" :r="r" fill="none" :style="{ stroke: fond }" :stroke-width="epaisseur" />
      <circle :cx="taille / 2" :cy="taille / 2" :r="r" fill="none" :style="{ stroke: couleur }" :stroke-width="epaisseur" stroke-linecap="round"
        :stroke-dasharray="circ" :stroke-dashoffset="offset" :transform="`rotate(-90 ${taille / 2} ${taille / 2})`" class="arc" />
    </svg>
    <div class="centre"><slot /></div>
  </div>
</template>

<style scoped>
.anneau { position: relative; flex: none; }
svg { display: block; }
.arc { transition: stroke-dashoffset 1s var(--ease); }
.centre { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
</style>
