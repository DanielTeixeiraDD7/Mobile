<script setup lang="ts">
import { num } from '@/lib/format';
import Icon from './Icon.vue';

defineProps<{ kind: 'SHARDS' | 'EMBERS' | 'DUST'; value: number; label?: boolean }>();
const META = { SHARDS: ['shard', 'Éclats', 'var(--shard)'], EMBERS: ['ember', 'Braises', 'var(--ember)'], DUST: ['dust', 'Poussière', 'var(--dust)'] } as const;
</script>

<template>
  <span class="cur" :style="{ color: META[kind][2] }" :title="META[kind][1]">
    <Icon :name="META[kind][0]" :size="16" />
    <b>{{ num(value) }}</b>
    <span v-if="label" class="lbl">{{ META[kind][1] }}</span>
  </span>
</template>

<style scoped>
.cur { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
b { color: var(--text); font-weight: 700; }
.lbl { color: var(--muted); font-size: .85em; }
</style>
