<script setup lang="ts">
/** Montant animé (compte jusqu'à la nouvelle valeur). */
const props = withDefaults(defineProps<{ valeur: number; format: (n: number) => string; duree?: number }>(), { duree: 650 });
const affiche = ref(props.valeur);
let raf = 0;
watch(() => props.valeur, (v, ancien) => {
  cancelAnimationFrame(raf);
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) { affiche.value = v; return; }
  const t0 = performance.now();
  const de = ancien ?? 0;
  const pas = (t: number) => {
    const k = Math.min(1, (t - t0) / props.duree);
    affiche.value = Math.round(de + (v - de) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) raf = requestAnimationFrame(pas);
  };
  raf = requestAnimationFrame(pas);
});
onMounted(() => {
  // Animation d'entrée depuis 0.
  const v = props.valeur; affiche.value = 0;
  const t0 = performance.now();
  const pas = (t: number) => {
    const k = Math.min(1, (t - t0) / props.duree);
    affiche.value = Math.round(v * (1 - Math.pow(1 - k, 3)));
    if (k < 1) raf = requestAnimationFrame(pas); else affiche.value = props.valeur;
  };
  raf = requestAnimationFrame(pas);
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template><span class="num">{{ format(affiche) }}</span></template>
