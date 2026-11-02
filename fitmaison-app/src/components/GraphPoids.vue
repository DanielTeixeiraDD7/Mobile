<script setup lang="ts">
import { dateCourte, ecartJours, kg } from '@/core/dates';
import type { Pesee } from '@/core/etat';

/** Courbe du poids : pesées, moyenne glissante sur 7 jours (avec aire), objectif en pointillés. Dessinée à la taille réelle du conteneur. */
const props = withDefaults(defineProps<{ pesees: Pesee[]; objectif: number; hauteur?: number; montrerObjectif?: boolean }>(), { hauteur: 230, montrerObjectif: true });
const boite = useTemplateRef<HTMLElement>('boite');
const W = ref(340);
let obs: ResizeObserver | null = null;
onMounted(() => {
  if (!boite.value) return;
  W.value = boite.value.clientWidth || 340;
  if ('ResizeObserver' in window) { obs = new ResizeObserver(([e]) => { if (e) W.value = Math.max(200, Math.round(e.contentRect.width)); }); obs.observe(boite.value); }
});
onBeforeUnmount(() => obs?.disconnect());

const P = { g: 34, d: 12, h: 14, b: 26 };
const H = computed(() => props.hauteur);
const g = computed(() => {
  const w = props.pesees;
  if (w.length < 2) return null;
  const Wv = W.value;
  const xs = w.map(p => ecartJours(w[0]!.date, p.date));
  const span = Math.max(1, xs[xs.length - 1]!);
  const vals = [...w.map(p => p.kg), ...(props.montrerObjectif ? [props.objectif] : [])];
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = (x: number) => P.g + (x / span) * (Wv - P.g - P.d);
  const Y = (y: number) => P.h + (1 - (y - lo) / (hi - lo)) * (H.value - P.h - P.b);
  const pas = Math.max(1, Math.ceil((hi - lo) / 5));
  const grille: number[] = [];
  for (let y = Math.ceil(lo / pas) * pas; y <= hi; y += pas) grille.push(y);
  const moy = w.map((_, i) => {
    const fen = w.filter((_, j) => j <= i && xs[i]! - xs[j]! < 7);
    return [X(xs[i]!), Y(fen.reduce((a, q) => a + q.kg, 0) / fen.length)] as [number, number];
  });
  const ligne = moy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const bas = H.value - P.b;
  const nbEt = Wv > 520 ? 5 : 3;
  const idx = [...new Set(Array.from({ length: nbEt }, (_, k) => Math.round((k / (nbEt - 1)) * (w.length - 1))))];
  const dernier = w[w.length - 1]!;
  return {
    Wv,
    grille: grille.map(y => ({ y: Y(y), v: y })),
    objectif: Y(props.objectif),
    brut: w.map((p, i) => [X(xs[i]!), Y(p.kg)] as [number, number]),
    moyenne: ligne,
    aire: `${ligne} L${moy[moy.length - 1]![0].toFixed(1)},${bas} L${moy[0]![0].toFixed(1)},${bas} Z`,
    etiquettes: idx.map(i => ({ x: Math.min(Wv - 28, Math.max(P.g + 18, X(xs[i]!))), t: dateCourte(w[i]!.date) })),
    fin: { x: X(xs[xs.length - 1]!), y: Y(dernier.kg), t: kg(dernier.kg) },
  };
});
const id = `gp${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div ref="boite" class="boite">
    <svg v-if="g" class="graph" :width="g.Wv" :height="H" :viewBox="`0 0 ${g.Wv} ${H}`" role="img" :aria-label="`Évolution du poids : ${pesees.length} pesées, dernière ${g.fin.t} kg, objectif ${kg(objectif)} kg`">
      <defs>
        <linearGradient :id="id" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="s0" />
          <stop offset="1" class="s1" />
        </linearGradient>
      </defs>
      <g class="grille">
        <template v-for="l in g.grille" :key="l.v"><line :x1="P.g" :x2="g.Wv - P.d" :y1="l.y" :y2="l.y" /><text :x="P.g - 7" :y="l.y + 4" text-anchor="end">{{ l.v }}</text></template>
        <text v-for="(e, k) in g.etiquettes" :key="k" :x="e.x" :y="H - 6" text-anchor="middle">{{ e.t }}</text>
      </g>
      <template v-if="montrerObjectif">
        <line :x1="P.g" :x2="g.Wv - P.d" :y1="g.objectif" :y2="g.objectif" class="obj" />
        <text :x="g.Wv - P.d" :y="g.objectif - 6" text-anchor="end" class="obj-t">⚽ objectif {{ kg(objectif) }}</text>
      </template>
      <path :d="g.aire" :fill="`url(#${id})`" class="aire" />
      <circle v-for="(p, k) in g.brut" :key="k" :cx="p[0]" :cy="p[1]" r="2.6" class="pt" />
      <path :d="g.moyenne" class="moy" pathLength="1" />
      <circle :cx="g.fin.x" :cy="g.fin.y" r="6" class="fin" />
    </svg>
    <div v-else class="vide">
      <span class="vide-ic">📈</span>
      <p>Ajoute au moins 2 pesées pour voir ta courbe.</p>
    </div>
  </div>
</template>

<style scoped>
.boite { width: 100%; }
.graph { display: block; overflow: visible; }
.grille line { stroke: var(--border); stroke-width: 1; }
.grille text { fill: var(--dim); font-size: 11px; font-weight: 700; font-family: var(--font); }
.obj { stroke: var(--accent); stroke-dasharray: 2 6; stroke-width: 2; stroke-linecap: round; }
.obj-t { fill: var(--accent); font-size: 11.5px; font-weight: 800; font-family: var(--font); }
.s0 { stop-color: var(--volt); stop-opacity: .38; }
.s1 { stop-color: var(--volt); stop-opacity: 0; }
.aire { animation: apparait .9s var(--ease) both; }
.moy { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: trace 1.2s var(--ease) both; }
.pt { fill: var(--muted); opacity: .55; }
.fin { fill: var(--volt); stroke: var(--surface); stroke-width: 3; filter: drop-shadow(0 0 6px color-mix(in srgb, var(--volt) 70%, transparent)); }
@keyframes trace { from { stroke-dashoffset: 1; } }
@keyframes apparait { from { opacity: 0; } }
.vide { padding: 28px 12px; }
.vide-ic { font-size: 28px; }
</style>
