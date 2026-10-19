<script setup lang="ts">
import type { Transaction } from '@/core/types';
import { categoryById } from '@/core/store.js';
import { signedMoney, shortDate } from '@/core/format.js';
import { memberName, coupleIds } from '@/core/sync.js';
import { useBudgetStore } from '@/stores/budget';
import { useT } from '@/lib/t';
import PastilleCategorie from './PastilleCategorie.vue';
import Icone from './Icone.vue';

/** Une opération. Glisser vers la gauche pour supprimer, toucher pour modifier. */
const props = defineProps<{ tx: Transaction; date?: boolean }>();
const emit = defineEmits<{ ouvrir: []; supprimer: [] }>();
const budget = useBudgetStore();
const { t, nomCat } = useT();

const cat = computed(() => (budget.tick, categoryById(props.tx.categoryId)));
const payeur = computed(() => props.tx.paidBy ?? props.tx.createdBy);
const indexPayeur = computed(() => (budget.tick, budget.couple ? coupleIds().indexOf(payeur.value ?? '') : -1));
const sousTitre = computed(() => {
  const nom = budget.etatSync.members.length > 1 && payeur.value && payeur.value !== budget.moi?.id && memberName(payeur.value);
  return [
    props.date && shortDate(props.tx.date),
    props.tx.note,
    nom && t(props.tx.type === 'income' ? 'list.receivedBy' : 'list.paidBy', { name: nom }),
    budget.couple && props.tx.type === 'expense' && props.tx.shared === false && t('list.personal'),
  ].filter(Boolean).join(' · ');
});

// ----- Glisser -----
const dx = ref(0);
const glisse = ref(false);
const suivi = ref(false);
let x0 = 0, y0 = 0, horizontal: boolean | null = null;
function down(e: PointerEvent) { x0 = e.clientX; y0 = e.clientY; suivi.value = true; horizontal = null; glisse.value = false; }
function move(e: PointerEvent) {
  if (!suivi.value) return;
  const ddx = e.clientX - x0, ddy = e.clientY - y0;
  if (horizontal === null && Math.hypot(ddx, ddy) > 8) horizontal = Math.abs(ddx) > Math.abs(ddy);
  if (horizontal) { glisse.value = true; dx.value = Math.min(0, ddx); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
}
function up() {
  if (!suivi.value) return;
  suivi.value = false;
  if (dx.value < -110) { dx.value = -500; setTimeout(() => emit('supprimer'), 160); return; }
  dx.value = 0;
}
function clic() { if (!glisse.value) emit('ouvrir'); }
</script>

<template>
  <li class="ligne">
    <div class="fond"><Icone nom="poubelle" :taille="20" /> {{ $t('delete') }}</div>
    <button type="button" class="contenu" :class="{ anim: !suivi }" :style="{ transform: `translateX(${dx}px)` }"
      @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @click="clic">
      <span class="pc-wrap">
        <PastilleCategorie :cat="cat" :taille="42" />
        <i v-if="indexPayeur >= 0" class="qui" :class="'p' + indexPayeur" />
      </span>
      <span class="txt">
        <b>{{ nomCat(cat) }}</b>
        <small v-if="sousTitre">{{ sousTitre }}</small>
      </span>
      <span class="mt num" :class="tx.type">{{ signedMoney(tx.amount, tx.type) }}</span>
    </button>
  </li>
</template>

<style scoped>
.ligne { position: relative; list-style: none; overflow: hidden; border-radius: 16px; }
.fond { position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-right: 20px; background: var(--expense); color: #fff; font-weight: 800; font-size: 14px; border-radius: 16px; }
.contenu { position: relative; width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 0; background: var(--surface); text-align: left; border-radius: 16px; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.contenu.anim { transition: transform .25s var(--ease); }
.contenu:active { background: var(--surface-2); }
.pc-wrap { position: relative; }
.qui { position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--surface); background: var(--p0); }
.qui.p1 { background: var(--p1); }
.txt { flex: 1; min-width: 0; display: grid; }
.txt b { font-size: 15.5px; font-weight: 700; }
.txt small { color: var(--muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mt { font-weight: 800; font-size: 16px; }
.mt.expense { color: var(--text); }
</style>
