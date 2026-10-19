<script setup lang="ts">
import type { Kind, Transaction } from '@/core/types';
import { categoriesOf } from '@/core/store.js';
import { parseAmount, currencySymbol, today, isoDate, shortDate, currentMonth, money, signedMoney, percent } from '@/core/format.js';
import { budgetStatus } from '@/core/calc.js';
import { useBudgetStore } from '@/stores/budget';
import { champsQui, alerteBudget, recents, notesConnues } from '@/lib/saisie';
import { toast, vibrer } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Feuille from './Feuille.vue';
import Icone from './Icone.vue';
import QuiPaie from './QuiPaie.vue';
import PastilleCategorie from './PastilleCategorie.vue';

const ouvert = defineModel<boolean>({ required: true });
const budget = useBudgetStore();
const { t, nomCat } = useT();

const vide = () => ({ montant: '', type: 'expense' as Kind, date: today(), note: '', paidBy: null as string | null, shared: true });
const d = ref(vide());
watch(ouvert, v => { if (v) d.value = { ...vide(), type: d.value.type }; });

const categories = computed(() => (budget.tick, categoriesOf(d.value.type)));
const symbole = computed(() => (budget.tick, currencySymbol()));
const etat = computed(() => (budget.tick, budgetStatus(currentMonth()).global));
const derniers = computed(() => recents(budget.transactions, d.value.type));
const notes = computed(() => notesConnues(budget.transactions));
const catDe = (id: string) => budget.categories.find(c => c.id === id);

const libelleDate = computed(() => {
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  if (d.value.date === today()) return t('add.today');
  if (d.value.date === isoDate(hier)) return t('add.yesterday');
  return shortDate(d.value.date);
});

// ----- Pavé numérique -----
const secoue = ref(false);
function refuser() { vibrer(30); secoue.value = false; nextTick(() => (secoue.value = true)); }
function touche(k: string) {
  let a = d.value.montant;
  if (k === 'back') a = a.slice(0, -1);
  else if (k === ',') a = a.includes(',') ? a : (a || '0') + ',';
  else {
    const [ent, dec] = a.split(',');
    if (dec !== undefined && dec.length >= 2) return refuser();
    if (dec === undefined && ent!.replace(/^0+/, '').length >= 7) return refuser();
    a = a === '0' ? k : a + k;
  }
  vibrer(8);
  d.value.montant = a;
}
// 4 colonnes × 3 rangées : tout tient à l'écran, même sur un petit téléphone.
const TOUCHES = ['1', '2', '3', 'back', '4', '5', '6', ',', '7', '8', '9', '0'];
function clavier(e: KeyboardEvent) {
  if (!ouvert.value || (e.target as HTMLElement).matches('input, textarea, select')) return;
  if (/^[0-9]$/.test(e.key)) touche(e.key);
  else if (e.key === ',' || e.key === '.') touche(',');
  else if (e.key === 'Backspace') touche('back');
}
onMounted(() => window.addEventListener('keydown', clavier));
onBeforeUnmount(() => window.removeEventListener('keydown', clavier));

// ----- Enregistrement -----
async function enregistrer(categoryId: string, montantCts?: number, note?: string) {
  const amount = montantCts ?? parseAmount(d.value.montant.replace(/,$/, ''));
  if (!amount) { refuser(); toast(t('add.enterAmount'), { type: 'warn' }); return; }
  const avant = budgetStatus(currentMonth());
  const tx = await budget.enregistrer({
    type: d.value.type, amount, categoryId, date: d.value.date, note: (note ?? d.value.note).trim(),
    ...champsQui(d.value),
  });
  vibrer(20);
  ouvert.value = false;
  const cat = catDe(categoryId)!;
  const al = tx.type === 'expense' ? alerteBudget(avant, budgetStatus(currentMonth()), categoryId) : null;
  const nom = al ? (al.cat ? nomCat(al.cat) : t('budget.all')) : '';
  toast(al
    ? (al.niveau === 'over' ? t('budget.overToast', { name: nom }) : t('budget.warnToast', { name: nom, pct: percent(al.ratio) }))
    : t('add.saved', { amount: signedMoney(amount, tx.type), cat: nomCat(cat) }), {
    type: al ? (al.niveau === 'over' ? 'danger' : 'warn') : 'ok',
    action: t('undo'),
    onAction: () => budget.supprimer(tx.id),
  });
  if (al) vibrer([80, 60, 80]);
}
const refaire = (r: Transaction) => enregistrer(r.categoryId, r.amount, r.note);
</script>

<template>
  <Feuille v-model="ouvert">
    <div class="saisie">
      <div class="seg">
        <button v-for="ty in (['expense', 'income'] as const)" :key="ty" type="button" :class="[ty, { on: d.type === ty }]" @click="d.type = ty">{{ $t('type.' + ty) }}</button>
      </div>

      <output class="montant num" :class="[d.type, { shake: secoue, vide: !d.montant }]" @animationend="secoue = false">
        <span>{{ d.type === 'income' ? '+' : '−' }}{{ d.montant || '0' }}</span><small>{{ symbole }}</small>
      </output>
      <div v-if="d.type === 'expense'" class="mois">
        <template v-if="etat.cap">
          <span>{{ $t('add.monthSpent', { spent: money(etat.spent), cap: money(etat.cap) }) }}</span>
          <div class="progress" :class="etat.level"><i :style="{ width: Math.min(100, (etat.spent / etat.cap) * 100) + '%' }" /></div>
        </template>
        <span v-else>{{ $t('add.monthSpentNoCap', { spent: money(etat.spent) }) }}</span>
      </div>

      <QuiPaie v-model:paid-by="d.paidBy" v-model:shared="d.shared" :type="d.type" class="mt" />

      <div class="meta">
        <label class="chip date"><Icone nom="calendrier" :taille="16" /> {{ libelleDate }}
          <input v-model="d.date" type="date" :max="today()" :aria-label="$t('form.date')" @change="d.date ||= today()">
        </label>
        <input v-model="d.note" class="input note" maxlength="80" :placeholder="$t('add.note')" list="notes-connues" enterkeyhint="done">
        <datalist id="notes-connues"><option v-for="n in notes" :key="n" :value="n" /></datalist>
      </div>

      <div v-if="derniers.length" class="recents">
        <div class="defile">
 <button v-for="r in derniers" :key="r.id" type="button" class="chip" :title="$t('v2.add.again')" @click="refaire(r)">
            <Icone nom="synchro" :taille="13" class="dim" /><i class="pt" :style="{ background: catDe(r.categoryId)?.color }" />{{ r.note }} · <b class="num">{{ money(r.amount) }}</b>
          </button>
        </div>
      </div>

      <div class="cats" :title="$t('add.hint')">
        <button v-for="c in categories" :key="c.id" type="button" class="cat" @click="enregistrer(c.id)">
          <PastilleCategorie :cat="c" :taille="40" />
          <span>{{ nomCat(c) }}</span>
        </button>
      </div>

      <div class="pave">
        <button v-for="k in TOUCHES" :key="k" type="button" :aria-label="k === 'back' ? '⌫' : k" @click="touche(k)">
          <Icone v-if="k === 'back'" nom="effacer" :taille="24" /><template v-else>{{ k }}</template>
        </button>
      </div>
    </div>
  </Feuille>
</template>

<style scoped>
.saisie { display: grid; gap: 10px; }
.montant { display: flex; align-items: baseline; justify-content: center; gap: 6px; font-size: 50px; font-weight: 800; line-height: 1.05; padding: 2px 0 0; transition: color .2s; }
.montant small { font-size: 26px; font-weight: 700; opacity: .7; }
.montant.vide { color: var(--dim); }
.mois { display: grid; gap: 6px; font-size: 13.5px; color: var(--muted); text-align: center; }
.mois .progress { height: 6px; max-width: 260px; width: 100%; margin: 0 auto; }
.mt { margin-top: 2px; }
.meta { display: flex; gap: 8px; align-items: center; }
.date { position: relative; flex: none; min-height: 48px; border-radius: 14px; }
.date input { position: absolute; inset: 0; opacity: 0; width: 100%; }
.note { flex: 1; }
.recents { display: grid; gap: 6px; }
.recents .label { font-size: 11.5px; }
.defile { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -20px; padding: 0 20px 2px; }
.defile::-webkit-scrollbar { display: none; }
.pt { width: 8px; height: 8px; border-radius: 50%; }
.cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
.cat { display: grid; justify-items: center; gap: 4px; padding: 6px 2px; border: 0; border-radius: 16px; background: none; font-size: 12.5px; font-weight: 700; color: var(--text); transition: background .15s, transform .1s; }
.cat:hover { background: var(--surface-2); }
.cat:active { transform: scale(.93); background: var(--surface-2); }
.cat span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pave { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
.pave button { min-height: 52px; border: 0; border-radius: 16px; background: var(--surface-2); font-size: 24px; font-weight: 700; display: grid; place-items: center; transition: transform .08s, background .15s; }
.pave button[aria-label='⌫'], .pave button[aria-label=','] { background: var(--surface-3); }
.pave button:active { transform: scale(.94); background: var(--surface-3); }
@media (max-height: 760px) {
  .montant { font-size: 40px; } .pave button { min-height: 46px; font-size: 22px; } .mois { display: none; }
  .cat { padding: 4px 2px; } .cat :deep(.pc) { width: 36px !important; height: 36px !important; }
}
</style>
