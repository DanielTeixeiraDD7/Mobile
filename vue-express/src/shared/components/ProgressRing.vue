<script setup lang="ts">
const props = withDefaults(defineProps<{ value: number; size?: number; stroke?: number; color?: string }>(), { size: 120, stroke: 10, color: '#42b883' });
const r = computed(() => (props.size - props.stroke) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const offset = computed(() => circ.value * (1 - Math.min(100, Math.max(0, props.value)) / 100));
</script>

<template>
  <div class="ring" :style="{ width: size + 'px', height: size + 'px' }" role="img" :aria-label="value + ' % terminé'">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="currentColor" :stroke-width="stroke" opacity=".12" />
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke="color" :stroke-width="stroke" stroke-linecap="round"
        :stroke-dasharray="circ" :stroke-dashoffset="offset" :transform="`rotate(-90 ${size / 2} ${size / 2})`" class="arc" />
    </svg>
    <div class="ring-label"><slot>{{ value }}<small>%</small></slot></div>
  </div>
</template>

<style scoped>
.ring { position: relative; flex: none; }
.ring svg { display: block; }
.arc { transition: stroke-dashoffset .9s cubic-bezier(.2, .8, .2, 1); }
.ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 26px; letter-spacing: -.02em; }
.ring-label small { font-size: 14px; margin-left: 1px; opacity: .7; }
</style>
