<script setup lang="ts">
import type { Part } from './types';
/** Donut interactif : toucher un segment le met en avant (v-model:actif = id). */
const props = withDefaults(defineProps<{ parts: Part[]; taille?: number; epaisseur?: number }>(), { taille: 220, epaisseur: 26 });
const actif = defineModel<string | null>('actif', { default: null });

const total = computed(() => props.parts.reduce((s, p) => s + p.valeur, 0));
const R = computed(() => (props.taille - props.epaisseur) / 2 - 6);
const c = computed(() => props.taille / 2);
const ESPACE = 0.012; // espace entre segments (en tours)

const arcs = computed(() => {
  let debut = 0;
  return props.parts.map(p => {
    const frac = total.value ? p.valeur / total.value : 0;
    const a0 = debut + (props.parts.length > 1 ? ESPACE / 2 : 0);
    const a1 = debut + frac - (props.parts.length > 1 ? ESPACE / 2 : 0);
    debut += frac;
    return { ...p, d: arc(a0, Math.max(a0 + 0.0001, a1)) };
  });
});
function pt(t: number, r: number) { const a = t * 2 * Math.PI - Math.PI / 2; return [c.value + r * Math.cos(a), c.value + r * Math.sin(a)]; }
function arc(t0: number, t1: number) {
  if (t1 - t0 >= 0.9999) t1 = t0 + 0.9999;
  const [x0, y0] = pt(t0, R.value), [x1, y1] = pt(t1, R.value);
  return `M${x0},${y0} A${R.value},${R.value} 0 ${t1 - t0 > 0.5 ? 1 : 0} 1 ${x1},${y1}`;
}
const anime = ref(false);
onMounted(() => requestAnimationFrame(() => (anime.value = true)));
</script>

<template>
  <div class="donut" :style="{ width: taille + 'px', height: taille + 'px' }">
    <svg :viewBox="`0 0 ${taille} ${taille}`" role="img">
      <circle :cx="c" :cy="c" :r="R" fill="none" style="stroke: var(--surface-2)" :stroke-width="epaisseur" />
      <path v-for="a in arcs" :key="a.id" :d="a.d" fill="none" :style="{ stroke: a.couleur }" stroke-linecap="butt"
        :stroke-width="actif === a.id ? epaisseur + 10 : epaisseur" :class="['seg', { faible: actif && actif !== a.id, on: anime }]"
        @click="actif = actif === a.id ? null : a.id" />
    </svg>
    <div class="centre"><slot /></div>
  </div>
</template>

<style scoped>
.donut { position: relative; margin: 0 auto; }
svg { width: 100%; height: 100%; overflow: visible; }
.seg { cursor: pointer; transition: stroke-width .25s var(--ease), opacity .25s; opacity: 0; }
.seg.on { opacity: 1; }
.seg.faible { opacity: .3; }
.centre { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; }
</style>
