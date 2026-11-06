<script setup lang="ts">
import { useRift } from '@/stores/rift';
import { FINITIONS, finitionsDispo } from '@/core/prix';
import type { Finition } from '@/core/types';

const props = defineProps<{ id: string }>();
const f = defineModel<Finition>({ required: true });
const rift = useRift();
const dispo = computed(() => finitionsDispo(rift.donnees!.prix, props.id));
</script>

<template>
  <div v-if="dispo.length > 1" class="seg" role="radiogroup" aria-label="Finition">
    <button v-for="x in dispo" :key="x" type="button" role="radio" :aria-checked="f === x" :class="{ on: f === x, foil: x === 'F' }" @click="f = x">{{ FINITIONS[x] }}</button>
  </div>
  <span v-else-if="dispo.length === 1" class="tag" :class="{ foil: dispo[0] === 'F' }">{{ FINITIONS[dispo[0]!] }} uniquement</span>
</template>

<style scoped>
.seg { display: inline-grid; grid-auto-flow: column; gap: 4px; padding: 4px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.seg button { min-height: 36px; padding: 0 16px; border: 0; border-radius: 10px; background: none; font-weight: 800; font-size: 14px; color: var(--muted); cursor: pointer; }
.seg button.on { background: var(--surface-3); color: var(--text); box-shadow: inset 0 0 0 1px var(--border-2); }
.seg button.on.foil { background: linear-gradient(90deg, rgba(95, 240, 227, 0.3), rgba(200, 120, 255, 0.3), rgba(240, 212, 138, 0.3)); }
</style>
