<script setup lang="ts">
import type { Serie } from './types';
/**
 * Courbes cumulées (ex. ce mois / mois précédent / rythme du budget).
 * Chaque série : valeurs (index = jour), couleur, pointillés, aire.
 */
const props = withDefaults(defineProps<{ series: Serie[]; longueur: number; hauteur?: number; max?: number; point?: boolean }>(), { hauteur: 120, point: true });

const L = 300;
const H = computed(() => props.hauteur);
const maxi = computed(() => props.max ?? Math.max(1, ...props.series.flatMap(s => s.valeurs)));
const x = (i: number) => (props.longueur <= 1 ? 0 : (i / (props.longueur - 1)) * L);
const y = (v: number) => H.value - 6 - (v / maxi.value) * (H.value - 14);

function chemin(v: number[]) {
  if (!v.length) return '';
  return v.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
}
const id = `g${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <svg class="courbe" :viewBox="`0 0 ${L} ${H}`" preserveAspectRatio="none" :style="{ height: H + 'px' }" aria-hidden="true">
    <defs>
      <linearGradient v-for="(s, i) in series" :id="id + i" :key="i" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :style="{ stopColor: s.couleur, stopOpacity: .28 }" />
        <stop offset="1" :style="{ stopColor: s.couleur, stopOpacity: 0 }" />
      </linearGradient>
    </defs>
    <template v-for="(s, i) in series" :key="i">
      <path v-if="s.aire && s.valeurs.length > 1" :d="`${chemin(s.valeurs)} L${x(s.valeurs.length - 1)},${H} L0,${H} Z`" :fill="`url(#${id + i})`" />
      <path :d="chemin(s.valeurs)" fill="none" :style="{ stroke: s.couleur }" :stroke-width="s.epaisseur ?? 2.5" :stroke-dasharray="s.pointilles ? '4 5' : undefined"
        stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="trait" />
    </template>
    <template v-if="point && series[0]?.valeurs.length">
      <circle :cx="x(series[0].valeurs.length - 1)" :cy="y(series[0].valeurs.at(-1)!)" r="4.5" :style="{ fill: series[0].couleur }" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" />
    </template>
  </svg>
</template>

<style scoped>
.courbe { display: block; width: 100%; overflow: visible; }
.trait { stroke-dashoffset: 0; animation: trace 1.1s var(--ease); }
@keyframes trace { from { opacity: 0; } }
</style>
