<script setup lang="ts">
import { dateCourte, ecartJours } from '@/core/dates';
import type { Pesee } from '@/core/etat';

/** Courbe du poids : pesées, moyenne glissante sur 7 jours, objectif en pointillés. */
const props = defineProps<{ pesees: Pesee[]; objectif: number }>();
const W = 340, H = 200, P = { g: 34, d: 10, h: 10, b: 22 };
const g = computed(() => {
  const w = props.pesees;
  if (w.length < 2) return null;
  const xs = w.map(p => ecartJours(w[0]!.date, p.date));
  const span = Math.max(1, xs[xs.length - 1]!);
  const vals = [...w.map(p => p.kg), props.objectif];
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = (x: number) => P.g + (x / span) * (W - P.g - P.d);
  const Y = (y: number) => P.h + (1 - (y - lo) / (hi - lo)) * (H - P.h - P.b);
  const pas = Math.max(1, Math.ceil((hi - lo) / 5));
  const grille: number[] = [];
  for (let y = lo; y <= hi; y += pas) grille.push(y);
  const moy = w.map((_, i) => {
    const fen = w.filter((_, j) => j <= i && xs[i]! - xs[j]! < 7);
    return [X(xs[i]!), Y(fen.reduce((a, q) => a + q.kg, 0) / fen.length)];
  });
  return {
    grille: grille.map(y => ({ y: Y(y), v: y })),
    objectif: Y(props.objectif),
    brut: w.map((p, i) => [X(xs[i]!), Y(p.kg)] as [number, number]),
    moyenne: moy.map(([x, y], i) => `${i ? 'L' : 'M'}${x!.toFixed(1)},${y!.toFixed(1)}`).join(' '),
    etiquettes: [0, Math.floor(w.length / 2), w.length - 1].map(i => ({ x: Math.min(W - 25, Math.max(P.g + 15, X(xs[i]!))), t: dateCourte(w[i]!.date) })),
  };
});
</script>

<template>
  <svg v-if="g" class="graph" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Évolution du poids">
    <g class="grille">
      <template v-for="l in g.grille" :key="l.v"><line :x1="P.g" :x2="W - P.d" :y1="l.y" :y2="l.y" /><text :x="P.g - 5" :y="l.y + 4" text-anchor="end">{{ l.v }}</text></template>
      <text v-for="(e, k) in g.etiquettes" :key="k" :x="e.x" :y="H - 5" text-anchor="middle">{{ e.t }}</text>
    </g>
    <line :x1="P.g" :x2="W - P.d" :y1="g.objectif" :y2="g.objectif" class="obj" />
    <path :d="g.moyenne" class="moy" />
    <polyline :points="g.brut.map(p => p.join(',')).join(' ')" class="brut" />
    <circle v-for="(p, k) in g.brut" :key="k" :cx="p[0]" :cy="p[1]" r="3" class="pt" />
  </svg>
  <p v-else class="vide small">Ajoute au moins 2 pesées pour voir la courbe.</p>
</template>

<style scoped>
.graph { width: 100%; height: auto; display: block; }
.grille line { stroke: var(--border); stroke-width: 1; }
.grille text { fill: var(--dim); font-size: 10.5px; font-weight: 600; }
.obj { stroke: var(--good); stroke-dasharray: 5 5; stroke-width: 1.5; }
.moy { fill: none; stroke: var(--brand-3); stroke-width: 2.5; stroke-linejoin: round; }
.brut { fill: none; stroke: var(--brand); stroke-width: 1.5; }
.pt { fill: var(--brand); }
</style>
