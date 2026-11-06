<script setup lang="ts">
import { useRift } from '@/stores/rift';
import { FINITIONS, enEuros, formatDollars, formatEuros, variation } from '@/core/prix';
import type { Finition } from '@/core/types';

/** Prix d'une carte pour une finition : valeur du marché en grand, plus bas / médian, variation sur 30 jours. */
const props = defineProps<{ id: string; finition: Finition; compact?: boolean }>();
const rift = useRift();
const d = computed(() => rift.donnees!);
const ligne = computed(() => d.value.prix.p[props.id]?.[props.finition] ?? null);
const eur = (v: number | null | undefined) => (v == null ? null : enEuros(v, d.value.prix));
const valeur = computed(() => rift.valeur(props.id, props.finition));
const varia = computed(() => variation(d.value.histo, props.id, props.finition));
</script>

<template>
  <div class="bloc" :class="{ compact }">
    <template v-if="ligne">
      <p class="label">Valeur {{ FINITIONS[finition].toLowerCase() }} · prix du marché</p>
      <p class="valeur num">{{ formatEuros(valeur) }}</p>
      <p class="usd num">{{ formatDollars(ligne[0] ?? ligne[1]) }} sur TCGplayer<span v-if="ligne[0] == null"> (plus bas proposé : pas de vente récente)</span></p>
      <p v-if="varia" class="varia num" :class="varia.pct > 0 ? 'hausse' : varia.pct < 0 ? 'baisse' : ''">
        {{ varia.pct > 0 ? '▲' : varia.pct < 0 ? '▼' : '=' }} {{ Math.abs(varia.pct).toLocaleString('fr-FR') }} % sur {{ varia.jours }} jour{{ varia.jours > 1 ? 's' : '' }}
      </p>
      <dl v-if="!compact" class="details">
        <div><dt>Plus bas</dt><dd class="num">{{ formatEuros(eur(ligne[1])) }}</dd></div>
        <div><dt>Médian</dt><dd class="num">{{ formatEuros(eur(ligne[2])) }}</dd></div>
      </dl>
    </template>
    <p v-else class="muted small">Pas de prix connu en version {{ FINITIONS[finition].toLowerCase() }}.</p>
  </div>
</template>

<style scoped>
.label { margin: 0; font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.valeur {
  margin: 2px 0 0; font-size: 46px; line-height: 1.05; font-weight: 900; letter-spacing: -0.01em;
  background: var(--or-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.compact .valeur { font-size: 36px; }
.usd { margin: 2px 0 0; color: var(--dim); font-size: 13px; font-weight: 700; }
.varia { margin: 6px 0 0; font-weight: 800; font-size: 13.5px; }
.details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0 0; }
.details div { padding: 10px 12px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); }
.details dt { font-size: 11.5px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.details dd { margin: 2px 0 0; font-size: 18px; font-weight: 900; }
</style>
