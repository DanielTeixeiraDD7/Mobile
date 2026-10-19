<script setup lang="ts">
import type { LibraryEntry } from '@/domain/types';
import { mediaTitle, statusLabel, totalUnits, formatNumber, unitShort } from '@/domain/labels';
import { canIncrement } from '@/domain/progress';
import { behind } from '@/domain/calendar';
import { plusUn, uniteLabel } from '@/lib/actions';
import { useBiblio } from '@/stores/biblio';
import Affiche from './Affiche.vue';
import BadgeType from './BadgeType.vue';
import Icone from './Icone.vue';

/** Ligne d'un titre suivi : affiche, avancement, bouton +1. */
const props = withDefaults(defineProps<{ entry: LibraryEntry; plus?: boolean; statut?: boolean }>(), { plus: true, statut: false });
const biblio = useBiblio();
const titre = computed(() => mediaTitle(props.entry.media, biblio.settings.titleLanguage));
const total = computed(() => totalUnits(props.entry.media));
const ratio = computed(() => (total.value ? Math.min(1, props.entry.progress / total.value) : 0));
const retard = computed(() => behind(props.entry));
const avancement = computed(() => {
  const e = props.entry;
  if (e.type === 'MOVIE') return statusLabel(e.type, e.status);
  if (!e.progress) return `${total.value ? `${total.value} ${unitShort(e.type)}` : 'Pas commencé'}`;
  const ici = uniteLabel(e, e.progress);
  return total.value ? `${ici} / ${formatNumber(total.value)}` : ici;
});
const peutPlus = computed(() => props.plus && props.entry.type !== 'MOVIE' && canIncrement(props.entry));
const bondit = ref(false);
async function plus() {
  bondit.value = true;
  setTimeout(() => (bondit.value = false), 400);
  await plusUn(props.entry);
}
</script>

<template>
  <li class="ligne">
    <router-link :to="`/titre/${entry.type}/${entry.mediaId}`" class="corps">
      <Affiche :src="entry.media.cover" :couleur="entry.media.coverColor" :titre="titre" :largeur="52" :rayon="10" />
      <span class="grow infos">
        <span class="nom clamp2">{{ titre }}</span>
        <span class="meta">
          <BadgeType :type="entry.type" court />
          <span class="ellipsis">{{ avancement }}</span>
          <span v-if="statut && entry.type !== 'MOVIE'" class="dim ellipsis">· {{ statusLabel(entry.type, entry.status) }}</span>
          <span v-if="retard" class="retard">{{ retard }} à voir</span>
        </span>
        <span v-if="total && entry.type !== 'MOVIE'" class="progress"><i :style="{ width: ratio * 100 + '%' }" /></span>
      </span>
    </router-link>
    <button v-if="peutPlus" type="button" class="plus" :class="{ pop: bondit }" :aria-label="`+1 ${unitShort(entry.type)} · ${titre}`" @click="plus">
      <Icone nom="plus" :taille="20" :epaisseur="2.6" />
    </button>
  </li>
</template>

<style scoped>
.ligne { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 10px; border-radius: 16px; }
.corps { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; color: inherit; text-decoration: none; }
.infos { display: grid; gap: 4px; }
.nom { font-weight: 700; font-size: 15.5px; line-height: 1.25; letter-spacing: -.01em; }
.meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); min-width: 0; }
.retard { flex: none; padding: 1px 7px; border-radius: 99px; background: var(--brand-soft); color: var(--brand); font-weight: 800; font-size: 11.5px; }
.progress { height: 4px; margin-top: 2px; }
.plus { flex: none; width: 46px; height: 46px; border-radius: 15px; border: 0; display: grid; place-items: center; color: #fff; background: var(--brand-grad); box-shadow: 0 8px 18px -10px var(--brand); transition: transform .12s; }
.plus:active { transform: scale(.9); }
</style>
