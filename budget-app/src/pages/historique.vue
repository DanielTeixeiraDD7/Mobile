<script setup lang="ts">
import type { Transaction } from '@/core/types';
import { categoryById } from '@/core/store.js';
import { coupleIds, memberName } from '@/core/sync.js';
import { money, dateLabel, today, monthLabel } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { toast } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import NavMois from '@/components/NavMois.vue';
import LigneOperation from '@/components/LigneOperation.vue';
import EditeurOperation from '@/components/EditeurOperation.vue';

const budget = useBudgetStore();
const route = useRoute();
const { t, nomCat } = useT();

// Filtres (déclaratifs) : type, catégorie, personne. La recherche porte sur tous les mois.
const recherche = ref(typeof route.query.q === 'string' ? route.query.q : '');
const type = ref<'tout' | 'expense' | 'income'>('tout');
const categorie = ref<string | null>(typeof route.query.cat === 'string' ? route.query.cat : null);
const qui = ref<string | null>(null); // id d'un membre, ou « perso »

const personnes = computed(() => (budget.tick, budget.couple ? coupleIds().map((id, i) => ({ id, nom: memberName(id) ?? '?', i })) : []));
const categoriesFiltre = computed(() => budget.categories.filter(c => type.value === 'tout' || c.kind === type.value));

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const correspond = (tx: Transaction, q: string) => {
  const montant = (tx.amount / 100).toFixed(2);
  return norm(`${tx.note} ${nomCat(categoryById(tx.categoryId))} ${montant} ${montant.replace('.', ',')}`).includes(q);
};

const liste = computed(() => {
  const q = norm(recherche.value.trim());
  return budget.transactions
    .filter(tx => (q ? correspond(tx, q) : tx.date.startsWith(budget.mois)))
    .filter(tx => type.value === 'tout' || tx.type === type.value)
    .filter(tx => !categorie.value || tx.categoryId === categorie.value)
    .filter(tx => !qui.value || (qui.value === 'perso' ? tx.shared === false : (tx.paidBy ?? tx.createdBy) === qui.value))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
});
const somme = computed(() => {
  let entrees = 0, sorties = 0;
  for (const tx of liste.value) tx.type === 'income' ? (entrees += tx.amount) : (sorties += tx.amount);
  return { entrees, sorties, solde: entrees - sorties };
});
const jours = computed(() => {
  const m = new Map<string, Transaction[]>();
  for (const tx of liste.value) m.set(tx.date, [...(m.get(tx.date) ?? []), tx]);
  return [...m].map(([date, items]) => ({ date, items, net: items.reduce((s, x) => s + (x.type === 'income' ? x.amount : -x.amount), 0) }));
});
const filtresActifs = computed(() => type.value !== 'tout' || !!categorie.value || !!qui.value);
const libelleJour = (d: string) => (budget.tick, d === today() ? t('add.today') : dateLabel(d));
const enRecherche = computed(() => !!recherche.value.trim());

const edite = ref<Transaction | null>(null);
async function supprimer(tx: Transaction) {
  await budget.supprimer(tx.id);
  toast(t('list.deleted'), { action: t('undo'), onAction: () => budget.restaurer(tx) });
}
function reinitialiser() { type.value = 'tout'; categorie.value = null; qui.value = null; }
</script>

<template>
  <div class="page">
    <h1 class="page-title">{{ $t('tab.list') }}</h1>
    <NavMois v-if="!enRecherche" class="mb" />

    <label class="recherche">
      <Icone nom="recherche" :taille="18" />
      <input v-model="recherche" type="search" :placeholder="$t('v2.list.search')" enterkeyhint="search">
      <button v-if="recherche" type="button" :aria-label="$t('close')" @click="recherche = ''"><Icone nom="fermer" :taille="16" /></button>
    </label>

    <div class="filtres">
      <button v-for="f in (['tout', 'expense', 'income'] as const)" :key="f" type="button" class="chip" :class="{ on: type === f }" @click="type = f; categorie = null">
        {{ f === 'tout' ? $t('v2.list.all') : $t('sum.' + f) }}
      </button>
      <select v-model="categorie" class="chip select" :class="{ on: categorie }" :aria-label="$t('form.category')">
        <option :value="null">{{ $t('v2.list.allCats') }}</option>
        <option v-for="c in categoriesFiltre" :key="c.id" :value="c.id">{{ nomCat(c) }}</option>
      </select>
      <template v-if="personnes.length">
        <button v-for="p in personnes" :key="p.id" type="button" class="chip" :class="{ on: qui === p.id }" @click="qui = qui === p.id ? null : p.id">
          <i class="pt" :class="'p' + p.i" />{{ p.nom }}
        </button>
        <button type="button" class="chip" :class="{ on: qui === 'perso' }" @click="qui = qui === 'perso' ? null : 'perso'">{{ $t('who.personal') }}</button>
      </template>
      <button v-if="filtresActifs" type="button" class="chip raz" @click="reinitialiser"><Icone nom="fermer" :taille="14" /> {{ $t('v2.list.clear') }}</button>
    </div>

    <div class="resume card">
      <div><span>{{ $t('sum.income') }}</span><b class="income num">{{ money(somme.entrees) }}</b></div>
      <div><span>{{ $t('sum.expense') }}</span><b class="expense num">{{ money(somme.sorties) }}</b></div>
      <div><span>{{ $t('sum.balance') }}</span><b class="num" :class="{ expense: somme.solde < 0 }">{{ money(somme.solde) }}</b></div>
    </div>
    <p v-if="enRecherche" class="muted small center">{{ $t('v2.list.results', { n: liste.length }) }}</p>

    <div v-if="!liste.length" class="vide">
      <Icone nom="liste" :taille="34" />
      <p>{{ enRecherche || filtresActifs ? $t('v2.list.noMatch') : $t('list.empty') }}</p>
      <p v-if="!enRecherche && !filtresActifs" class="muted small">{{ $t('v2.list.emptyHint') }}</p>
    </div>

    <section v-for="j in jours" :key="j.date" class="jour">
      <header>
        <span>{{ libelleJour(j.date) }}<small v-if="enRecherche" class="dim"> · {{ monthLabel(j.date.slice(0, 7), true) }}</small></span>
        <span class="num" :class="j.net < 0 ? 'muted' : 'income'">{{ j.net < 0 ? '−' : '+' }}{{ money(Math.abs(j.net)) }}</span>
      </header>
      <transition-group tag="ul" name="list" class="card ops">
        <LigneOperation v-for="tx in j.items" :key="tx.id" :tx="tx" @ouvrir="edite = tx" @supprimer="supprimer(tx)" />
      </transition-group>
    </section>
    <p v-if="liste.length" class="aide dim small center">{{ $t('v2.list.help') }}</p>

    <EditeurOperation v-model="edite" />
  </div>
</template>

<route>
{ "meta": { "titre": "Historique" } }
</route>

<style scoped>
.page { max-width: 760px; margin: 0 auto; }
.mb { margin-bottom: 12px; }
.recherche { display: flex; align-items: center; gap: 10px; padding: 0 14px; min-height: 48px; border-radius: 15px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); }
.recherche input { flex: 1; border: 0; background: none; outline: none; font-size: 16px; color: var(--text); min-width: 0; }
.recherche input::-webkit-search-cancel-button { display: none; }
.recherche button { border: 0; background: var(--surface-2); color: var(--muted); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; }
.filtres { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 10px -16px 0; padding: 2px 16px 6px; }
.filtres::-webkit-scrollbar { display: none; }
.select { appearance: none; padding-right: 14px; max-width: 170px; }
.pt { width: 8px; height: 8px; border-radius: 50%; background: var(--p0); }
.pt.p1 { background: var(--p1); }
.raz { color: var(--expense); }
.resume { display: grid; grid-template-columns: repeat(3, 1fr); padding: 14px 6px; margin: 10px 0 6px; }
.resume div { display: grid; text-align: center; gap: 2px; }
.resume div + div { border-left: 1px solid var(--border); }
.resume span { font-size: 12.5px; color: var(--muted); font-weight: 700; }
.resume b { font-size: 16.5px; }
.jour { margin-top: 16px; }
.jour header { display: flex; justify-content: space-between; padding: 0 6px 7px; font-size: 13.5px; font-weight: 800; color: var(--muted); text-transform: capitalize; }
.ops { position: relative; list-style: none; margin: 0; padding: 4px; display: grid; gap: 2px; }
.vide { display: grid; justify-items: center; gap: 4px; padding: 40px 0; color: var(--dim); text-align: center; }
.vide p { margin: 0; color: var(--muted); font-weight: 600; }
.aide { margin-top: 18px; }
</style>
