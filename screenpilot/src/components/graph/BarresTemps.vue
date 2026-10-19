<script setup lang="ts">
import { MEDIA_TYPES, type MediaType } from '@/domain/types';
import { TYPE_LABELS } from '@/domain/labels';

/** Histogramme empilé par catégorie (films, séries, anime, manga). Toucher une barre la sélectionne. */
export interface Tranche { libelle: string; parType: Record<MediaType, number>; total: number; actif?: boolean; detail?: string }
const props = withDefaults(defineProps<{ tranches: Tranche[]; hauteur?: number; reference?: number | null; format: (n: number) => string }>(), { hauteur: 170, reference: null });
const choisie = defineModel<number | null>('choisie', { default: null });
const max = computed(() => Math.max(1, props.reference ?? 0, ...props.tranches.map(t => t.total)));
const anime = ref(false);
onMounted(() => requestAnimationFrame(() => (anime.value = true)));
const etroit = computed(() => props.tranches.length > 12);
</script>

<template>
  <div class="graph" :class="{ etroit }" :style="{ height: hauteur + 'px' }">
    <div v-if="reference" class="ref" :style="{ bottom: 22 + (reference / max) * (hauteur - 22) + 'px' }"><span>moy.</span></div>
    <button v-for="(t, i) in tranches" :key="i" type="button" class="col" :class="{ actif: t.actif, choisie: choisie === i, vide: !t.total }"
      :aria-label="`${t.detail ?? t.libelle} : ${format(t.total)}`" @click="choisie = choisie === i ? null : i">
      <span class="piste">
        <span class="pile" :style="{ height: (anime ? (t.total / max) * 100 : 0) + '%', transitionDelay: Math.min(i, 20) * 25 + 'ms' }">
          <i v-for="ty in MEDIA_TYPES.filter(x => t.parType[x] > 0)" :key="ty" :style="{ flexGrow: t.parType[ty], background: TYPE_LABELS[ty].couleur }" />
        </span>
      </span>
      <span class="lib">{{ t.libelle }}</span>
    </button>
  </div>
</template>

<style scoped>
.graph { position: relative; display: flex; align-items: stretch; gap: 6px; }
.graph.etroit { gap: 2px; }
.col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0; border: 0; background: none; }
.piste { flex: 1; width: 100%; max-width: 34px; display: flex; align-items: flex-end; border-radius: 9px; }
.pile { width: 100%; min-height: 3px; display: flex; flex-direction: column-reverse; border-radius: 8px 8px 4px 4px; overflow: hidden; background: var(--surface-3); transition: height .8s var(--ease); }
.pile i { display: block; min-height: 2px; }
.pile i + i { border-bottom: 1.5px solid var(--surface); }
.vide .pile { background: var(--surface-3); }
.col.choisie .pile { box-shadow: 0 0 0 2px var(--text); }
.graph:has(.choisie) .col:not(.choisie) .pile { opacity: .45; }
.lib { height: 16px; font-size: 11.5px; font-weight: 700; color: var(--dim); white-space: nowrap; }
.etroit .lib { font-size: 10px; }
.actif .lib { color: var(--text); }
.ref { position: absolute; left: 0; right: 0; border-top: 1.5px dashed var(--dim); opacity: .6; pointer-events: none; }
.ref span { position: absolute; right: 0; top: -17px; font-size: 10.5px; font-weight: 700; color: var(--dim); }
</style>
