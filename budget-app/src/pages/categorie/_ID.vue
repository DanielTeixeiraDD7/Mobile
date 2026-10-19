<script setup lang="ts">
import type { Transaction } from '@/core/types';
import { byCategory } from '@/core/calc.js';
import { money, compactMoney, percent, monthLabel, addMonths } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { toast } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import Barres from '@/components/graph/Barres.vue';
import LigneOperation from '@/components/LigneOperation.vue';
import EditeurOperation from '@/components/EditeurOperation.vue';
import PastilleCategorie from '@/components/PastilleCategorie.vue';

defineProps<{ ID?: string }>(); // passé par le routeur ; on lit useRoute()
const route = useRoute();
const router = useRouter();
const budget = useBudgetStore();
const { t, nomCat } = useT();

const cat = computed(() => budget.categories.find(c => c.id === String(route.params.ID)) ?? null);
const ici = computed(() => (budget.tick, cat.value ? byCategory(budget.mois, cat.value.kind).get(cat.value.id) ?? 0 : 0));
const douze = computed(() => {
  budget.tick;
  if (!cat.value) return [];
  return Array.from({ length: 12 }, (_, i) => addMonths(budget.mois, i - 11)).map(m => ({
    libelle: monthLabel(m, true).replace('.', ''), valeur: byCategory(m, cat.value!.kind).get(cat.value!.id) ?? 0, actif: m === budget.mois,
  }));
});
const moyenne = computed(() => {
  const v = douze.value.filter(b => !b.actif && b.valeur).map(b => b.valeur);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
});
const ops = computed(() => budget.transactions.filter(x => x.categoryId === cat.value?.id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 40));
const edite = ref<Transaction | null>(null);
async function supprimer(tx: Transaction) {
  await budget.supprimer(tx.id);
  toast(t('list.deleted'), { action: t('undo'), onAction: () => budget.restaurer(tx) });
}
</script>

<template>
  <div v-if="cat" class="page" :style="{ '--c': cat.color }">
    <button type="button" class="retour" @click="router.back()"><Icone nom="retour" :taille="18" /> {{ $t('v2.back') }}</button>
    <header class="tete card">
      <PastilleCategorie :cat="cat" :taille="60" />
      <div class="grow">
        <span class="label">{{ monthLabel(budget.mois) }}</span>
        <h1>{{ nomCat(cat) }}</h1>
        <b class="num gros">{{ money(ici) }}<small v-if="cat.budget"> / {{ money(cat.budget) }}</small></b>
      </div>
    </header>
    <div v-if="cat.budget" class="progress mt" :class="ici > cat.budget ? 'over' : ici > cat.budget * 0.8 ? 'warn' : ''"><i :style="{ width: Math.min(100, (ici / cat.budget) * 100) + '%', background: ici <= cat.budget * 0.8 ? cat.color : undefined }" /></div>

    <section class="card pad mt">
      <h2 class="h2">{{ $t('v2.stats.trend') }} · 12 {{ $t('v2.stats.months') }}</h2>
      <Barres :barres="douze.map(b => ({ ...b, couleur: b.actif ? cat!.color : undefined }))" :format="compactMoney" :hauteur="160" />
      <p v-if="moyenne" class="small muted m0 mt">{{ $t('v2.stats.avg', { amount: money(moyenne) }) }}<template v-if="ici && moyenne"> · {{ ici > moyenne ? '▲' : '▼' }} {{ percent(Math.abs(ici - moyenne) / moyenne) }}</template></p>
    </section>

    <section class="section">
      <div class="section-head"><h2>{{ $t('v2.cat.ops') }}</h2><span class="small muted">{{ ops.length }}</span></div>
      <ul v-if="ops.length" class="card liste">
        <LigneOperation v-for="tx in ops" :key="tx.id" :tx="tx" date @ouvrir="edite = tx" @supprimer="supprimer(tx)" />
      </ul>
      <p v-else class="muted center">{{ $t('stats.empty') }}</p>
    </section>
    <EditeurOperation v-model="edite" />
  </div>
  <div v-else class="page center muted"><p>{{ $t('v2.cat.missing') }}</p><router-link to="/stats">{{ $t('tab.stats') }}</router-link></div>
</template>

<route>
{ "meta": { "titre": "Catégorie" } }
</route>

<style scoped>
.page { max-width: 760px; margin: 0 auto; }
.retour { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--muted); font-weight: 700; padding: 6px 0 12px; }
.tete { display: flex; align-items: center; gap: 16px; padding: 18px; background: linear-gradient(130deg, color-mix(in srgb, var(--c) 16%, var(--surface)), var(--surface) 70%); }
.tete h1 { margin: 0; font-size: 26px; letter-spacing: -.03em; }
.gros { font-size: 22px; } .gros small { font-size: 14px; color: var(--muted); }
.mt { margin-top: 12px; } .m0 { margin: 0; }
.h2 { font-size: 17px; margin: 0 0 14px; }
.liste { list-style: none; padding: 4px; margin: 0; display: grid; gap: 2px; }
</style>
