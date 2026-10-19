<script setup lang="ts">
import type { Transaction } from '@/core/types';
import { categoriesOf } from '@/core/store.js';
import { parseAmount, centsToInput, currencySymbol, today } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { champsQui } from '@/lib/saisie';
import { toast } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Feuille from './Feuille.vue';
import QuiPaie from './QuiPaie.vue';
import PastilleCategorie from './PastilleCategorie.vue';

/** Modifier / supprimer une opération (feuille). */
const tx = defineModel<Transaction | null>({ required: true });
const budget = useBudgetStore();
const { t, nomCat } = useT();
const ouvert = computed({ get: () => !!tx.value, set: v => { if (!v) tx.value = null; } });

const d = ref<Transaction & { montant: string }>({} as Transaction & { montant: string });
watch(tx, v => { if (v) d.value = { ...v, montant: centsToInput(v.amount) }; }, { immediate: true });
const categories = computed(() => (budget.tick, d.value.type ? categoriesOf(d.value.type) : []));

function changerType(ty: Transaction['type']) {
  if (ty === d.value.type) return;
  d.value.type = ty;
  d.value.categoryId = categoriesOf(ty)[0]?.id ?? d.value.categoryId;
}
async function enregistrer() {
  const amount = parseAmount(d.value.montant);
  if (!amount) { toast(t('form.invalidAmount'), { type: 'warn' }); return; }
  const { montant: _m, ...reste } = d.value;
  await budget.enregistrer({ ...reste, ...champsQui(reste), amount, date: d.value.date || reste.date, note: (reste.note ?? '').trim() });
  tx.value = null;
  toast(t('v2.edit.saved'), { type: 'ok' });
}
async function supprimer() {
  const original = tx.value!;
  tx.value = null;
  await budget.supprimer(original.id);
  toast(t('list.deleted'), { action: t('undo'), onAction: () => budget.restaurer(original) });
}
</script>

<template>
  <Feuille v-model="ouvert" :titre="$t('form.editTitle')">
    <form v-if="tx" class="form" novalidate @submit.prevent="enregistrer">
      <div class="seg">
        <button v-for="ty in (['expense', 'income'] as const)" :key="ty" type="button" :class="[ty, { on: d.type === ty }]" @click="changerType(ty)">{{ $t('type.' + ty) }}</button>
      </div>
      <label class="field"><span>{{ $t('form.amount') }} ({{ currencySymbol() }})</span>
        <input v-model="d.montant" class="input gros num" inputmode="decimal" autocomplete="off" required>
      </label>
      <QuiPaie v-model:paid-by="d.paidBy" v-model:shared="d.shared" :type="d.type" />
      <div class="field"><span>{{ $t('form.category') }}</span>
        <div class="cats">
          <button v-for="c in categories" :key="c.id" type="button" class="cat" :class="{ on: c.id === d.categoryId }" :style="{ '--c': c.color }" @click="d.categoryId = c.id">
            <PastilleCategorie :cat="c" :taille="30" /> {{ nomCat(c) }}
          </button>
        </div>
      </div>
      <div class="deux">
        <label class="field"><span>{{ $t('form.date') }}</span><input v-model="d.date" class="input" type="date" :max="today()" required></label>
        <label class="field"><span>{{ $t('form.note') }}</span><input v-model="d.note" class="input" maxlength="80"></label>
      </div>
      <div class="actions">
        <button type="submit" class="btn primary full">{{ $t('save') }}</button>
        <button type="button" class="btn danger full" @click="supprimer">{{ $t('delete') }}</button>
      </div>
    </form>
  </Feuille>
</template>

<style scoped>
.form { display: grid; gap: 16px; }
.gros { font-size: 24px; font-weight: 800; min-height: 56px; }
.cats { display: flex; flex-wrap: wrap; gap: 6px; }
.cat { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--surface); font-weight: 700; font-size: 14px; }
.cat.on { border-color: var(--c); background: color-mix(in srgb, var(--c) 10%, var(--surface)); }
.deux { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.actions { display: grid; gap: 8px; margin-top: 4px; }
</style>
