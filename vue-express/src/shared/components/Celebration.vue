<script setup lang="ts">
/** Petite pluie de confettis en CSS (aucune dépendance). */
const props = defineProps<{ active: boolean }>();
const pieces = Array.from({ length: 70 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.4,
  dur: 1.6 + Math.random() * 1.2,
  color: ['#42b883', '#35495e', '#f5b301', '#3b82f6', '#ec4899', '#7fdcb3'][i % 6],
  rot: Math.random() * 360,
  size: 6 + Math.random() * 6,
}));
const visible = ref(false);
watch(() => props.active, v => { if (v) { visible.value = true; setTimeout(() => (visible.value = false), 3200); } });
</script>

<template>
  <div v-if="visible" class="confetti" aria-hidden="true">
    <i v-for="(p, i) in pieces" :key="i" :style="{ left: p.left + '%', animationDelay: p.delay + 's', animationDuration: p.dur + 's', background: p.color, transform: `rotate(${p.rot}deg)`, width: p.size + 'px', height: p.size * 0.45 + 'px' }" />
  </div>
</template>

<style scoped>
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
.confetti i { position: absolute; top: -12px; border-radius: 2px; animation: fall linear forwards; }
@keyframes fall { to { transform: translateY(105vh) rotate(720deg); opacity: .9; } }
</style>
