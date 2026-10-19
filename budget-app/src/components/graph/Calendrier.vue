<script setup lang="ts">
/** Calendrier « chaleur » : intensité des dépenses par jour du mois. */
import { parseIso } from '@/core/format.js';
const props = defineProps<{ ym: string; valeurs: number[]; format: (n: number) => string; aujourdhui: string; jours: string[] }>();
const emit = defineEmits<{ choisir: [jour: number] }>();
const decalage = computed(() => (parseIso(`${props.ym}-01`).getDay() + 6) % 7);
const max = computed(() => Math.max(1, ...props.valeurs));
const niveau = (v: number) => (v ? 0.18 + 0.82 * Math.sqrt(v / max.value) : 0);
const estAujourdhui = (j: number) => props.aujourdhui === `${props.ym}-${String(j).padStart(2, '0')}`;
const futur = (j: number) => `${props.ym}-${String(j).padStart(2, '0')}` > props.aujourdhui;
</script>

<template>
  <div class="cal">
    <span v-for="j in jours" :key="j" class="entete">{{ j }}</span>
    <span v-for="i in decalage" :key="'v' + i" />
    <button v-for="(v, i) in valeurs" :key="i" type="button" class="jour" :class="{ auj: estAujourdhui(i + 1), futur: futur(i + 1) }"
      :style="{ '--n': niveau(v) }" :title="format(v)" :aria-label="`${i + 1} : ${format(v)}`" @click="emit('choisir', i + 1)">
      {{ i + 1 }}
    </button>
  </div>
</template>

<style scoped>
.cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.entete { font-size: 11px; font-weight: 800; color: var(--dim); text-align: center; text-transform: uppercase; }
.jour { aspect-ratio: 1; border: 0; border-radius: 10px; font-size: 12.5px; font-weight: 700; color: var(--text);
  background: color-mix(in srgb, var(--expense) calc(var(--n) * 100%), var(--surface-2)); transition: transform .1s; }
.jour:active { transform: scale(.92); }
.jour.auj { box-shadow: inset 0 0 0 2px var(--text); }
.jour.futur { opacity: .35; }
</style>
