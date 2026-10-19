<script setup lang="ts">
import type { Transaction } from '@/core/types';
import { totals, byCategory, lastMonths, change, txOfMonth } from '@/core/calc.js';
import { money, compactMoney, percent, monthLabel, addMonths, daysInMonth, today, dateLabel } from '@/core/format.js';
import { categoryById } from '@/core/store.js';
import { useBudgetStore } from '@/stores/budget';
import { cumul, joursEcoules, parJour, parJourSemaine } from '@/lib/insights';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import NavMois from '@/components/NavMois.vue';
import Feuille from '@/components/Feuille.vue';
import Donut from '@/components/graph/Donut.vue';
import Barres from '@/components/graph/Barres.vue';
import Courbe from '@/components/graph/Courbe.vue';
import Calendrier from '@/components/graph/Calendrier.vue';
import LigneOperation from '@/components/LigneOperation.vue';
import EditeurOperation from '@/components/EditeurOperation.vue';
import PastilleCategorie from '@/components/PastilleCategorie.vue';

const budget = useBudgetStore();
const { t, nomCat } = useT();
const type = ref<'expense' | 'income'>('expense');
const periode = ref<6 | 12>(6);
const actif = ref<string | null>(null);

const ym = computed(() => budget.mois);
const avant = computed(() => addMonths(ym.value, -1));
const maintenant = computed(() => (budget.tick, totals(ym.value)));
const precedent = computed(() => (budget.tick, totals(avant.value)));
const jours = computed(() => joursEcoules(ym.value) || daysInMonth(ym.value));

// Indicateurs (config déclarative) avec variation vs mois précédent.
const kpis = computed(() => [
  { cle: 'expense', label: t('sum.expense'), valeur: maintenant.value.expense, avant: precedent.value.expense, bienSiBaisse: true, classe: 'expense' },
  { cle: 'income', label: t('sum.income'), valeur: maintenant.value.income, avant: precedent.value.income, bienSiBaisse: false, classe: 'income' },
  { cle: 'balance', label: t('sum.balance'), valeur: maintenant.value.balance, avant: null, bienSiBaisse: false, classe: maintenant.value.balance < 0 ? 'expense' : '' },
  { cle: 'avg', label: t('v2.stats.perDay'), valeur: Math.round(maintenant.value.expense / jours.value), avant: null, bienSiBaisse: true, classe: '' },
]);
const variation = (k: { valeur: number; avant: number | null; bienSiBaisse: boolean }) => {
  if (k.avant == null) return null;
  const c = change(k.valeur, k.avant);
  if (c == null) return { texte: t('stats.noPrev'), classe: 'muted' };
  return { texte: `${c > 0 ? '▲' : c < 0 ? '▼' : '='} ${percent(Math.abs(c))}`, classe: c === 0 ? 'muted' : (c < 0) === k.bienSiBaisse ? 'bon' : 'mauvais' };
};

// Répartition par catégorie.
const parts = computed(() => {
  budget.tick;
  const sommes = byCategory(ym.value, type.value);
  const avantS = byCategory(avant.value, type.value);
  return [...sommes].map(([id, valeur]) => ({ id, valeur, cat: categoryById(id), avant: avantS.get(id) ?? 0 }))
    .sort((a, b) => b.valeur - a.valeur)
    .map(p => ({ ...p, couleur: p.cat.color }));
});
const total = computed(() => (type.value === 'expense' ? maintenant.value.expense : maintenant.value.income));
const partActive = computed(() => parts.value.find(p => p.id === actif.value) ?? null);
watch([ym, type], () => { actif.value = null; });

// Tendance sur 6 ou 12 mois.
const tendance = computed(() => (budget.tick, lastMonths(ym.value, periode.value).map(m => ({
  libelle: monthLabel(m.ym, true).replace('.', ''), valeur: type.value === 'expense' ? m.expense : m.income, actif: m.ym === ym.value,
}))));
const moyenne = computed(() => {
  const v = tendance.value.filter(b => !b.actif && b.valeur > 0).map(b => b.valeur);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
});

// Courbe cumulée : ce mois vs mois précédent.
const courbes = computed(() => (budget.tick, [
  { valeurs: cumul(ym.value, 'expense', joursEcoules(ym.value) || daysInMonth(ym.value)), couleur: 'var(--brand)', aire: true, epaisseur: 3 },
  { valeurs: cumul(avant.value, 'expense'), couleur: 'var(--dim)', pointilles: true, epaisseur: 2 },
]));

// Calendrier et jours de la semaine (lundi en premier).
const parJ = computed(() => (budget.tick, parJour(ym.value)));
const nomsJours = computed(() => (budget.tick, Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(budget.settings.lang === 'pt' ? 'pt-PT' : 'fr-FR', { weekday: 'narrow' }))));
const semaine = computed(() => (budget.tick, parJourSemaine(ym.value).map((v, i) => ({
  libelle: new Date(2024, 0, 1 + i).toLocaleDateString(budget.settings.lang === 'pt' ? 'pt-PT' : 'fr-FR', { weekday: 'short' }).replace('.', ''), valeur: v,
}))));
const maxSemaine = computed(() => Math.max(...semaine.value.map(s => s.valeur)));
const semaineMarquee = computed(() => semaine.value.map(s => ({ ...s, actif: s.valeur === maxSemaine.value && s.valeur > 0 })));

// Détail d'un jour (toucher le calendrier).
const jourChoisi = ref<string | null>(null);
const opsDuJour = computed<Transaction[]>(() => (budget.tick, jourChoisi.value ? txOfMonth(ym.value).filter(x => x.date === jourChoisi.value) : []));
const feuilleJour = computed({ get: () => !!jourChoisi.value, set: v => { if (!v) jourChoisi.value = null; } });
const choisir = (j: number) => { jourChoisi.value = `${ym.value}-${String(j).padStart(2, '0')}`; };
const edite = ref<Transaction | null>(null);
const aujourdhui = today();
</script>

<template>
  <div class="page">
    <h1 class="page-title">{{ $t('tab.stats') }}</h1>
    <NavMois class="mb" />

    <div class="kpis">
      <div v-for="k in kpis" :key="k.cle" class="kpi card">
        <span class="label">{{ k.label }}</span>
        <b class="num" :class="k.classe">{{ money(k.valeur) }}</b>
        <small v-if="variation(k)" :class="variation(k)!.classe">{{ variation(k)!.texte }} <span class="dim">{{ $t('stats.vsPrev', { month: monthLabel(avant, true) }) }}</span></small>
      </div>
    </div>

    <div class="seg mt">
      <button v-for="ty in (['expense', 'income'] as const)" :key="ty" type="button" :class="[ty, { on: type === ty }]" @click="type = ty">{{ $t('sum.' + ty) }}</button>
    </div>

    <section class="card pad mt">
      <h2 class="h2">{{ $t('stats.byCategory') }}</h2>
      <template v-if="parts.length">
        <Donut v-model:actif="actif" :parts="parts" :taille="230">
          <template v-if="partActive">
            <small class="muted">{{ nomCat(partActive.cat) }}</small>
            <b class="num centre-val">{{ money(partActive.valeur) }}</b>
            <small class="muted">{{ percent(partActive.valeur / total) }}</small>
          </template>
          <template v-else>
            <small class="muted">{{ $t('v2.stats.total') }}</small>
            <b class="num centre-val">{{ money(total) }}</b>
          </template>
        </Donut>
        <ul class="legende">
          <li v-for="p in parts" :key="p.id" :class="{ faible: actif && actif !== p.id }">
            <router-link :to="'/categorie/' + p.id">
              <PastilleCategorie :cat="p.cat" :taille="34" />
              <span class="grow"><b>{{ nomCat(p.cat) }}</b><small class="muted">{{ percent(p.valeur / total) }}</small></span>
              <span class="droite">
                <b class="num">{{ money(p.valeur) }}</b>
                <small v-if="p.avant && p.valeur === p.avant" class="muted">= 0 %</small>
                <small v-else-if="p.avant" :class="(p.valeur < p.avant) === (type === 'expense') ? 'bon' : 'mauvais'">{{ p.valeur > p.avant ? '▲' : '▼' }} {{ percent(Math.abs(change(p.valeur, p.avant) ?? 0)) }}</small>
                <small v-else class="dim">{{ $t('v2.stats.new') }}</small>
              </span>
            </router-link>
          </li>
        </ul>
      </template>
      <p v-else class="muted">{{ $t('stats.empty') }}</p>
    </section>

    <section class="card pad mt">
      <div class="row between"><h2 class="h2 m0">{{ $t('v2.stats.trend') }}</h2>
        <div class="seg petit"><button v-for="p in ([6, 12] as const)" :key="p" type="button" :class="{ on: periode === p }" @click="periode = p">{{ p }} {{ $t('v2.stats.months') }}</button></div>
      </div>
      <Barres :barres="tendance" :format="compactMoney" :hauteur="170" class="mt" />
      <p v-if="moyenne" class="small muted m0 mt">{{ $t('v2.stats.avg', { amount: money(moyenne) }) }}</p>
    </section>

    <section v-if="type === 'expense'" class="card pad mt">
      <h2 class="h2">{{ $t('v2.stats.cumul') }}</h2>
      <Courbe :series="courbes" :longueur="daysInMonth(ym)" :hauteur="140" />
      <div class="leg2"><span><i class="l1" />{{ monthLabel(ym, true) }}</span><span><i class="l2" />{{ monthLabel(avant, true) }}</span></div>
    </section>

    <section v-if="type === 'expense'" class="card pad mt">
      <h2 class="h2">{{ $t('v2.stats.calendar') }}</h2>
      <Calendrier :ym="ym" :valeurs="parJ" :format="money" :aujourdhui="aujourdhui" :jours="nomsJours" @choisir="choisir" />
      <h3 class="h3">{{ $t('v2.stats.weekdays') }}</h3>
      <Barres :barres="semaineMarquee" :format="compactMoney" :hauteur="120" />
    </section>

    <Feuille v-model="feuilleJour" :titre="jourChoisi ? dateLabel(jourChoisi) : ''">
      <ul v-if="opsDuJour.length" class="ops">
        <LigneOperation v-for="tx in opsDuJour" :key="tx.id" :tx="tx" @ouvrir="edite = tx; jourChoisi = null" @supprimer="budget.supprimer(tx.id)" />
      </ul>
      <p v-else class="muted center"><Icone nom="etoile" :taille="18" /> {{ $t('v2.stats.noSpendDay') }}</p>
    </Feuille>
    <EditeurOperation v-model="edite" />
  </div>
</template>

<route>
{ "meta": { "titre": "Stats" } }
</route>

<style scoped>
.page { max-width: 860px; margin: 0 auto; }
.mb { margin-bottom: 12px; } .mt { margin-top: 12px; } .m0 { margin: 0; }
.kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.kpi { padding: 14px 16px; display: grid; gap: 2px; }
.kpi b { font-size: 22px; }
.kpi small { font-size: 12.5px; font-weight: 700; }
.bon { color: var(--income); } .mauvais { color: var(--expense); }
.h2 { font-size: 17px; margin: 0 0 14px; letter-spacing: -.01em; }
.h3 { font-size: 14px; margin: 22px 0 10px; color: var(--muted); }
.centre-val { font-size: 24px; }
.legende { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 2px; }
.legende li { transition: opacity .2s; }
.legende li.faible { opacity: .4; }
.legende a { display: flex; align-items: center; gap: 12px; padding: 8px 4px; border-radius: 12px; color: var(--text); text-decoration: none; }
.legende a:hover { background: var(--surface-2); }
.legende .grow { display: grid; }
.droite { display: grid; text-align: right; }
.droite small { font-size: 12px; font-weight: 700; }
.petit { padding: 3px; } .petit button { min-height: 30px; padding: 0 10px; font-size: 13px; white-space: nowrap; }
.leg2 { display: flex; gap: 16px; font-size: 12.5px; color: var(--muted); font-weight: 700; margin-top: 8px; text-transform: capitalize; }
.leg2 i { display: inline-block; width: 14px; height: 3px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
.l1 { background: var(--brand); } .l2 { background: var(--dim); }
.ops { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
@media (min-width: 720px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
</style>
