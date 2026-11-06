<script setup lang="ts">
/** Anneau de progression (0–1+). Dégradé facultatif (couleur → couleur2), lueur à 100 %. */
const props = withDefaults(defineProps<{ ratio: number; taille?: number; epaisseur?: number; couleur?: string; couleur2?: string; fond?: string }>(), { taille: 120, epaisseur: 12, couleur: 'currentColor', fond: 'var(--ring-track)' });
const r = computed(() => (props.taille - props.epaisseur) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const anime = ref(0);
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => (anime.value = 1))));
const borne = computed(() => Math.min(1, Math.max(0, props.ratio)));
const offset = computed(() => circ.value * (1 - borne.value * anime.value));
const plein = computed(() => props.ratio >= 1);
const id = `an${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div class="anneau" :class="{ plein }" :style="{ width: taille + 'px', height: taille + 'px', '--c': couleur }">
    <svg :viewBox="`0 0 ${taille} ${taille}`" :width="taille" :height="taille" aria-hidden="true">
      <defs v-if="couleur2">
        <linearGradient :id="id" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" :style="{ stopColor: couleur }" />
          <stop offset="1" :style="{ stopColor: couleur2 }" />
        </linearGradient>
      </defs>
      <circle :cx="taille / 2" :cy="taille / 2" :r="r" fill="none" :style="{ stroke: fond }" :stroke-width="epaisseur" />
      <circle :cx="taille / 2" :cy="taille / 2" :r="r" fill="none" :style="{ stroke: couleur2 ? `url(#${id})` : couleur, opacity: borne > 0 ? 1 : 0 }" :stroke-width="epaisseur" stroke-linecap="round"
        :stroke-dasharray="circ" :stroke-dashoffset="offset" :transform="`rotate(-90 ${taille / 2} ${taille / 2})`" class="arc" />
    </svg>
    <div class="centre"><slot /></div>
  </div>
</template>

<style scoped>
.anneau { position: relative; flex: none; }
svg { display: block; overflow: visible; }
.arc { transition: stroke-dashoffset 1.1s var(--ease); }
.plein svg { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 55%, transparent)); }
.centre { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
</style>
