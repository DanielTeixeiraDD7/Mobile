<script setup lang="ts">
/** Petite courbe d'évolution du prix (points manquants ignorés). */
const props = defineProps<{ valeurs: (number | null)[] }>();
const pts = computed(() => props.valeurs.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null));
const chemin = computed(() => {
  const p = pts.value;
  if (p.length < 2) return '';
  const min = Math.min(...p.map(x => x.v)), max = Math.max(...p.map(x => x.v));
  const n = props.valeurs.length - 1 || 1;
  return p.map((x, k) => `${k ? 'L' : 'M'}${((x.i / n) * 296 + 2).toFixed(1)},${(max === min ? 30 : 56 - ((x.v - min) / (max - min)) * 52).toFixed(1)}`).join(' ');
});
const hausse = computed(() => { const p = pts.value; return p.length > 1 && p[p.length - 1]!.v >= p[0]!.v; });
</script>

<template>
  <svg v-if="chemin" viewBox="0 0 300 60" class="courbe" preserveAspectRatio="none" role="img" aria-label="Évolution du prix">
    <path :d="chemin" fill="none" :stroke="hausse ? 'var(--bon)' : 'var(--mauvais)'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
  </svg>
  <p v-else class="tiny dim">L’historique se remplit jour après jour (un point par mise à jour).</p>
</template>

<style scoped>
.courbe { width: 100%; height: 64px; display: block; }
</style>
