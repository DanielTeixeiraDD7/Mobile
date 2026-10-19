<script setup lang="ts">
import type { Category } from '@/core/types';
import { budgetStatus } from '@/core/calc.js';
import { money, percent, parseAmount, centsToInput, currencySymbol, currentMonth, daysInMonth, addMonths } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { joursEcoules, regulieres } from '@/lib/insights';
import { toast } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import NavMois from '@/components/NavMois.vue';
import Feuille from '@/components/Feuille.vue';
import Anneau from '@/components/graph/Anneau.vue';
import PartageCarte from '@/components/PartageCarte.vue';
import PastilleCategorie from '@/components/PastilleCategorie.vue';

const budget = useBudgetStore();
const { t, nomCat } = useT();
const statut = computed(() => (budget.tick, budgetStatus(budget.mois)));
const g = computed(() => statut.value.global);
const enCours = computed(() => budget.mois === currentMonth());
// Repère « temps écoulé » : où devrait en être la dépense à rythme régulier.
const avancement = computed(() => joursEcoules(budget.mois) / daysInMonth(budget.mois));
const joursRestants = computed(() => (enCours.value ? daysInMonth(budget.mois) - new Date().getDate() + 1 : 0));

const alertes = computed(() => {
  const base = statut.value.categories.filter(c => c.level === 'warn' || c.level === 'over').map(c => ({ nom: nomCat(c.cat), ...c }));
  if (g.value.level === 'warn' || g.value.level === 'over') base.unshift({ nom: t('budget.all'), ...g.value, cat: null as never });
  return base;
});
const sansPlafond = computed(() => statut.value.categories.filter(c => !c.cap));
const avecPlafond = computed(() => statut.value.categories.filter(c => c.cap));
const fixes = computed(() => (budget.tick, regulieres(budget.mois).slice(0, 6)));
const totalFixes = computed(() => fixes.value.reduce((s, f) => s + f.montant, 0));

// Édition d'un plafond (global ou par catégorie).
const edition = ref<{ cat: Category | null; valeur: string } | null>(null);
const ouvert = computed({ get: () => !!edition.value, set: v => { if (!v) edition.value = null; } });
function editer(cat: Category | null) {
  const actuel = cat ? cat.budget : budget.settings.monthlyBudget;
  edition.value = { cat, valeur: actuel ? centsToInput(actuel) : '' };
}
async function enregistrerPlafond() {
  const e = edition.value!;
  const brut = e.valeur.trim();
  const valeur = brut ? parseAmount(brut) : null;
  if (brut && !valeur) { toast(t('form.invalidAmount'), { type: 'warn' }); return; }
  if (e.cat) await budget.enregistrerCategorie({ ...e.cat, budget: valeur });
  else await budget.reglage('monthlyBudget', valeur);
  edition.value = null;
  toast(t('v2.budget.saved'), { type: 'ok' });
}
// Suggestion : moyenne des 3 derniers mois.
const suggestion = computed(() => {
  if (!edition.value) return null;
  const id = edition.value.cat?.id;
  const mois = [1, 2, 3].map(i => addMonths(currentMonth(), -i));
  const vals = mois.map(m => { const st = budgetStatus(m); return id ? st.categories.find(c => c.cat.id === id)?.spent ?? 0 : st.global.spent; }).filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length / 100) * 100 : null;
});
</script>

<template>
  <div class="page">
    <h1 class="page-title">{{ $t('tab.budget') }}</h1>
    <NavMois class="mb" />

    <PartageCarte v-if="budget.couple" :ym="budget.mois" class="mb" />

    <button type="button" class="global card" :class="g.level" @click="editer(null)">
      <Anneau v-if="g.cap" :ratio="g.spent / g.cap" :taille="112" :epaisseur="12" :couleur="g.level === 'over' ? 'var(--expense)' : g.level === 'warn' ? 'var(--warn)' : 'var(--brand)'" fond="var(--surface-2)">
        <b class="num pct">{{ percent(g.spent / g.cap) }}</b>
      </Anneau>
      <span class="grow">
        <span class="label">{{ $t('budget.global') }}</span>
        <b class="gros num">{{ money(g.spent) }}</b>
        <small v-if="g.cap" class="muted cap">{{ $t('v2.home.ofBudget', { cap: money(g.cap) }) }}</small>
        <template v-if="g.cap">
          <span v-if="g.spent > g.cap" class="small expense">{{ $t('budget.over', { amount: money(g.spent - g.cap) }) }}</span>
          <span v-else-if="enCours" class="small muted">{{ $t('budget.remaining', { amount: money(g.cap - g.spent), perDay: money(Math.floor((g.cap - g.spent) / joursRestants)) }) }}</span>
          <span v-else class="small muted">{{ money(g.cap - g.spent) }}</span>
        </template>
        <span v-else class="lien small"><Icone nom="plus" :taille="14" /> {{ $t('budget.setCap') }}</span>
      </span>
      <Icone nom="crayon" :taille="18" class="dim" />
    </button>

    <div v-if="alertes.length" class="alertes card pad">
      <span class="label">{{ $t('budget.alerts') }}</span>
      <p v-for="a in alertes" :key="a.nom" :class="a.level"><Icone nom="alerte" :taille="16" /> {{ a.nom }} · {{ percent(a.spent / a.cap!) }}</p>
    </div>

    <section class="section">
      <div class="section-head"><h2>{{ $t('budget.categories') }}</h2><span v-if="enCours" class="small muted">{{ $t('v2.budget.paceHint') }}</span></div>
      <div class="card cats">
        <button v-for="c in avecPlafond" :key="c.cat.id" type="button" class="cat" @click="editer(c.cat)">
          <PastilleCategorie :cat="c.cat" :taille="40" />
          <span class="grow">
            <span class="row between"><b>{{ nomCat(c.cat) }}</b><span class="num"><b>{{ money(c.spent) }}</b> <small class="muted">/ {{ money(c.cap!) }}</small></span></span>
            <span class="progress" :class="c.level"><i :style="{ width: Math.min(100, (c.spent / c.cap!) * 100) + '%' }" /><b v-if="enCours" class="pace" :style="{ left: avancement * 100 + '%' }" /></span>
            <small :class="c.level === 'over' ? 'expense' : 'muted'">{{ c.spent > c.cap! ? $t('budget.over', { amount: money(c.spent - c.cap!) }) : $t('v2.budget.left', { amount: money(c.cap! - c.spent) }) }}</small>
          </span>
        </button>
        <button v-for="c in sansPlafond" :key="c.cat.id" type="button" class="cat sans" @click="editer(c.cat)">
          <PastilleCategorie :cat="c.cat" :taille="40" />
          <span class="grow">
            <span class="row between"><b>{{ nomCat(c.cat) }}</b><b class="num">{{ money(c.spent) }}</b></span>
            <span class="lien small"><Icone nom="plus" :taille="13" /> {{ $t('budget.setCap') }}</span>
          </span>
        </button>
      </div>
    </section>

    <section v-if="fixes.length" class="section">
      <div class="section-head"><h2>{{ $t('v2.budget.fixed') }}</h2><span class="small muted num">≈ {{ money(totalFixes) }}</span></div>
      <div class="card fixes">
        <p class="small muted m0">{{ $t('v2.budget.fixedHint') }}</p>
        <div v-for="f in fixes" :key="f.note + f.cat.id" class="fixe">
          <PastilleCategorie :cat="f.cat" :taille="32" />
          <span class="grow"><b>{{ f.note }}</b><small class="muted block">{{ nomCat(f.cat) }} · {{ $t('v2.budget.months', { n: f.mois }) }}</small></span>
          <b class="num">{{ money(f.montant) }}</b>
        </div>
      </div>
    </section>

    <Feuille v-model="ouvert" :titre="edition?.cat ? $t('budget.capFor', { name: nomCat(edition.cat) }) : $t('budget.globalCap')">
      <form v-if="edition" class="form" novalidate @submit.prevent="enregistrerPlafond">
        <label class="field"><span>{{ $t('form.amount') }} ({{ currencySymbol() }})</span>
          <input v-model="edition.valeur" class="input gros num" inputmode="decimal" autocomplete="off" placeholder="0" autofocus>
        </label>
        <button v-if="suggestion" type="button" class="chip sugg" @click="edition.valeur = centsToInput(suggestion)">
          <Icone nom="eclair" :taille="15" /> {{ $t('v2.budget.suggest', { amount: money(suggestion) }) }}
        </button>
        <p class="small muted m0">{{ $t('budget.capHelp') }}</p>
        <button type="submit" class="btn primary full">{{ $t('save') }}</button>
      </form>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Budget" } }
</route>

<style scoped>
.page { max-width: 760px; margin: 0 auto; }
.mb { margin-bottom: 14px; }
.global { width: 100%; display: flex; align-items: center; gap: 18px; padding: 18px; text-align: left; color: var(--text); }
.global .grow { display: grid; gap: 4px; }
.gros { font-size: 26px; letter-spacing: -.03em; }
.cap { font-weight: 700; font-size: 14px; margin-top: -4px; }
.pct { font-size: 20px; }
.lien { color: var(--brand-2); font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
.dark .lien { color: var(--brand); }
.alertes { margin-top: 12px; display: grid; gap: 6px; }
.alertes p { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 700; }
.alertes .warn { color: #b45309; } .dark .alertes .warn { color: #fbbf24; }
.alertes .over { color: var(--expense); }
.cats { padding: 4px 14px; }
.cat { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 0; border: 0; background: none; text-align: left; color: var(--text); }
.cat + .cat { border-top: 1px solid var(--border); }
.cat .grow { display: grid; gap: 6px; }
.cat.sans .grow { gap: 2px; }
.cat small { font-size: 12.5px; }
.fixes { padding: 14px 16px; display: grid; gap: 10px; }
.fixe { display: flex; align-items: center; gap: 12px; }
.block { display: block; }
.m0 { margin: 0; }
.form { display: grid; gap: 14px; }
.input.gros { font-size: 26px; font-weight: 800; min-height: 58px; }
.sugg { justify-self: start; }
</style>
