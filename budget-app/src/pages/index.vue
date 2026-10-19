<script setup lang="ts">
import { budgetStatus, totals, split } from '@/core/calc.js';
import { money, percent, currentMonth, addMonths, monthLabel, daysInMonth } from '@/core/format.js';
import { toast } from '@/composables/useToast';
import { categoryById } from '@/core/store.js';
import { coupleIds, memberName } from '@/core/sync.js';
import { useBudgetStore } from '@/stores/budget';
import { rythme, cumul, plusGrosse, joursSansDepense, variationCategorie } from '@/lib/insights';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import Nombre from '@/components/Nombre.vue';
import NavMois from '@/components/NavMois.vue';
import Anneau from '@/components/graph/Anneau.vue';
import Courbe from '@/components/graph/Courbe.vue';
import LigneOperation from '@/components/LigneOperation.vue';
import EditeurOperation from '@/components/EditeurOperation.vue';
import PastilleCategorie from '@/components/PastilleCategorie.vue';
import type { Transaction } from '@/core/types';

const emit = defineEmits<{ ajouter: [] }>();
const budget = useBudgetStore();
const { t, nomCat } = useT();
const mois = computed(() => budget.mois);
const enCours = computed(() => mois.value === currentMonth());

const statut = computed(() => (budget.tick, budgetStatus(mois.value)));
const tot = computed(() => (budget.tick, totals(mois.value)));
const r = computed(() => (budget.tick, rythme(mois.value, statut.value.global.cap)));
const cap = computed(() => statut.value.global.cap);
const ratio = computed(() => (cap.value ? statut.value.global.spent / cap.value : 0));

// Salutation avec le prénom choisi dans le budget partagé.
const prenom = computed(() => (budget.tick, budget.moi ? memberName(budget.moi.id) : null));
const salut = computed(() => {
  const h = new Date().getHours();
  return t(h < 5 ? 'v2.home.night' : h < 18 ? 'v2.home.hello' : 'v2.home.evening');
});

// Courbes : ce mois (cumul), mois précédent, rythme idéal du budget.
const series = computed(() => {
  budget.tick;
  const ym = mois.value;
  const jm = daysInMonth(ym);
  const out = [
    { valeurs: cumul(ym, 'expense', r.value.jours || jm), couleur: '#ffffff', aire: true, epaisseur: 3 },
    { valeurs: cumul(addMonths(ym, -1), 'expense'), couleur: 'rgba(255,255,255,.45)', pointilles: true, epaisseur: 2 },
  ];
  if (cap.value) out.push({ valeurs: Array.from({ length: jm }, (_, i) => (cap.value! * (i + 1)) / jm), couleur: 'rgba(190,255,220,.55)', epaisseur: 1.5, pointilles: true } as never);
  return out;
});
const longueur = computed(() => daysInMonth(mois.value));

// Phrase de rythme (déclarative : chaque cas a son texte).
const phraseRythme = computed(() => {
  const x = r.value;
  if (!enCours.value) return x.ecartMemeDate == null ? null : { ok: x.ecartMemeDate <= 0, texte: t(x.ecartMemeDate <= 0 ? 'v2.home.lessThan' : 'v2.home.moreThan', { pct: percent(Math.abs(x.ecartMemeDate)), month: monthLabel(addMonths(mois.value, -1), true) }) };
  if (x.projection == null) return null;
  if (cap.value) {
    const depasse = x.projection > cap.value;
    return { ok: !depasse, texte: t(depasse ? 'v2.home.paceOver' : 'v2.home.paceOk', { amount: money(x.projection), diff: money(Math.abs(x.projection - cap.value)) }) };
  }
  return { ok: true, texte: t('v2.home.paceNoCap', { amount: money(x.projection) }) };
});

// Cartes « à savoir » : construites selon les données disponibles.
const cartes = computed(() => {
  budget.tick;
  const base: { icone: string; titre: string; texte: string; ton: 'bon' | 'mauvais' | '' }[] = [];
  const x = r.value;
  if (x.ecartMemeDate != null && x.jours > 0) {
    const moins = x.ecartMemeDate <= 0;
    base.push({ icone: moins ? 'tendanceBas' : 'tendanceHaut', ton: moins ? 'bon' : 'mauvais', titre: (moins ? '−' : '+') + percent(Math.abs(x.ecartMemeDate)), texte: t('v2.home.vsSameDay', { month: monthLabel(addMonths(mois.value, -1), true) }) });
  }
  const v = variationCategorie(mois.value);
  if (v) base.push({ icone: v.ecart > 0 ? 'tendanceHaut' : 'tendanceBas', ton: v.ecart > 0 ? 'mauvais' : 'bon', titre: `${nomCat(v.cat)} ${v.ecart > 0 ? '+' : '−'}${money(Math.abs(v.ecart))}`, texte: t('v2.home.catChange') });
  const g = plusGrosse(mois.value);
  if (g) base.push({ icone: 'eclair', ton: '', titre: money(g.amount), texte: t('v2.home.biggest', { what: g.note || nomCat(categoryById(g.categoryId)) }) });
  if (x.jours >= 5) {
    const n = joursSansDepense(mois.value);
    base.push({ icone: 'etoile', ton: n ? 'bon' : '', titre: t('v2.home.noSpendDays', { n }), texte: t('v2.home.noSpendHint', { total: x.jours }) });
  }
  if (x.jours) base.push({ icone: 'horloge', ton: '', titre: money(Math.round(x.moyenne)), texte: t('v2.home.perDay') });
  return base;
});

// Top catégories du mois.
const top = computed(() => {
  budget.tick;
  return statut.value.categories.filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 4);
});
const maxTop = computed(() => Math.max(1, ...top.value.map(c => c.spent)));

// Partage 50/50.
const partage = computed(() => {
  budget.tick;
  if (!budget.couple) return null;
  const s = split(mois.value, coupleIds());
  return s.due.amount ? { texte: t('split.owes', { debtor: memberName(s.due.debtor) ?? '', amount: money(s.due.amount), creditor: memberName(s.due.creditor) ?? '' }), regle: false } : { texte: t('split.allSettled'), regle: true };
});

const recentes = computed(() => budget.transactions.filter(x => x.date.startsWith(mois.value)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5));
const edite = ref<Transaction | null>(null);
async function supprimer(tx: Transaction) {
  await budget.supprimer(tx.id);
  toast(t('list.deleted'), { action: t('undo'), onAction: () => budget.restaurer(tx) });
}
const vide = computed(() => !budget.transactions.length);
</script>

<template>
  <div class="page">
    <header class="tete">
      <div class="grow">
        <span class="salut">{{ salut }}<template v-if="prenom">, {{ prenom }}</template> 👋</span>
        <NavMois />
      </div>
      <router-link to="/reglages" class="icon-btn mobile-only" :aria-label="$t('tab.settings')"><Icone nom="reglages" /></router-link>
    </header>

    <section v-if="vide" class="bienvenue card pad">
      <img :src="'icons/icon.svg'" alt="" width="72" height="72">
      <h1>{{ $t('v2.home.welcome') }}</h1>
      <p class="muted">{{ $t('v2.home.welcomeHint') }}</p>
      <button type="button" class="btn primary" @click="emit('ajouter')"><Icone nom="plus" /> {{ $t('v2.home.first') }}</button>
    </section>

    <template v-else>
      <section class="hero" :class="statut.global.level">
        <div class="hero-haut">
          <div class="grow">
            <span class="hl">{{ $t('v2.home.spent') }}</span>
            <div class="gros"><Nombre :valeur="statut.global.spent" :format="money" /></div>
            <span v-if="cap" class="sous">{{ $t('v2.home.ofBudget', { cap: money(cap) }) }}</span>
            <span v-else class="sous">{{ $t('sum.income') }} {{ money(tot.income) }} · {{ $t('sum.balance') }} {{ money(tot.balance) }}</span>
          </div>
          <Anneau v-if="cap" :ratio="ratio" :taille="84" :epaisseur="9" couleur="#ffffff">
            <b class="pct num">{{ Math.round(ratio * 100) }}<small>%</small></b>
          </Anneau>
        </div>
        <Courbe :series="series" :longueur="longueur" :hauteur="90" class="courbe" />
        <div class="hero-bas">
          <span v-if="cap && enCours && r.resteParJour != null" class="pilule">
            <Icone nom="cible" :taille="16" />
            {{ statut.global.spent > cap ? $t('budget.over', { amount: money(statut.global.spent - cap) }) : $t('v2.home.leftPerDay', { amount: money(cap - statut.global.spent), perDay: money(Math.max(0, r.resteParJour)) }) }}
          </span>
          <span v-if="phraseRythme" class="pilule" :class="{ alerte: !phraseRythme.ok }"><Icone :nom="phraseRythme.ok ? 'check' : 'alerte'" :taille="16" /> {{ phraseRythme.texte }}</span>
          <router-link v-if="!cap" to="/budget" class="pilule lien"><Icone nom="cible" :taille="16" /> {{ $t('budget.setCap') }}</router-link>
        </div>
      </section>

      <router-link v-if="partage" to="/budget" class="partage card" :class="{ regle: partage.regle }">
        <span class="ic"><Icone nom="personnes" /></span>
        <span class="grow"><small class="label">{{ $t('split.title') }}</small><b>{{ partage.texte }}</b></span>
        <Icone nom="droite" :taille="18" class="dim" />
      </router-link>

      <section v-if="cartes.length" class="section">
        <div class="section-head"><h2>{{ $t('v2.home.insights') }}</h2></div>
        <div class="defile">
          <article v-for="(c, i) in cartes" :key="i" class="carte card" :class="c.ton" :style="{ animationDelay: i * 60 + 'ms' }">
            <span class="ic"><Icone :nom="c.icone" :taille="18" /></span>
            <b class="num">{{ c.titre }}</b>
            <small>{{ c.texte }}</small>
          </article>
        </div>
      </section>

      <section v-if="top.length" class="section">
        <div class="section-head"><h2>{{ $t('v2.home.topCats') }}</h2><router-link to="/stats">{{ $t('v2.seeAll') }}</router-link></div>
        <div class="card top">
          <router-link v-for="c in top" :key="c.cat.id" :to="'/categorie/' + c.cat.id" class="top-l">
            <PastilleCategorie :cat="c.cat" :taille="38" />
            <span class="grow">
              <span class="row between"><b>{{ nomCat(c.cat) }}</b><b class="num">{{ money(c.spent) }}</b></span>
              <span class="progress" :class="c.level"><i :style="{ width: (c.cap ? Math.min(100, (c.spent / c.cap) * 100) : (c.spent / maxTop) * 100) + '%', background: c.level === 'ok' || c.level === 'none' ? c.cat.color : undefined }" /></span>
              <small v-if="c.cap" class="muted">{{ percent(c.spent / c.cap) }} · {{ $t('v2.home.ofBudget', { cap: money(c.cap) }) }}</small>
            </span>
          </router-link>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>{{ $t('v2.home.recent') }}</h2><router-link to="/historique">{{ $t('v2.seeAll') }}</router-link></div>
        <ul v-if="recentes.length" class="card liste">
          <LigneOperation v-for="tx in recentes" :key="tx.id" :tx="tx" date @ouvrir="edite = tx" @supprimer="supprimer(tx)" />
        </ul>
        <p v-else class="muted center">{{ $t('list.empty') }}</p>
      </section>
    </template>

    <EditeurOperation v-model="edite" />
  </div>
</template>

<route>
{ "meta": { "titre": "Accueil" } }
</route>

<style scoped>
.page { max-width: 860px; margin: 0 auto; }
.tete { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
.salut { display: block; font-size: 14px; font-weight: 700; color: var(--muted); margin: 0 0 2px 50px; }
.tete :deep(.titre) { font-size: 24px; }
.hero { position: relative; overflow: hidden; color: #fff; border-radius: 28px; padding: 22px 22px 16px;
  background: radial-gradient(130% 120% at 0% 0%, #2ee59d 0%, #12a36b 38%, #0b6b4b 72%, #0b3d33 100%);
  box-shadow: 0 24px 50px -24px rgba(18, 163, 107, .8); }
.hero.warn { background: radial-gradient(130% 120% at 0% 0%, #ffd166 0%, #f59e0b 40%, #b45309 80%, #7c2d12 100%); box-shadow: 0 24px 50px -24px rgba(245, 158, 11, .8); }
.hero.over { background: radial-gradient(130% 120% at 0% 0%, #ff8a8f 0%, #e5484d 40%, #9f1d2a 80%, #5c0f19 100%); box-shadow: 0 24px 50px -24px rgba(229, 72, 77, .8); }
.hero::after { content: ""; position: absolute; width: 280px; height: 280px; right: -90px; top: -120px; border-radius: 50%; background: rgba(255,255,255,.08); }
.hero > * { position: relative; z-index: 1; }
.hero-haut { display: flex; align-items: center; gap: 14px; }
.hl { font-size: 13.5px; font-weight: 700; opacity: .85; }
.gros { font-size: clamp(30px, 9.5vw, 42px); font-weight: 850; line-height: 1.05; letter-spacing: -.04em; margin: 2px 0; white-space: nowrap; }
.sous { font-size: 14px; opacity: .85; font-weight: 600; }
.pct { font-size: 20px; } .pct small { font-size: 13px; opacity: .8; }
.courbe { margin: 14px -4px 8px; }
.hero-bas { display: flex; flex-wrap: wrap; gap: 6px; }
.pilule { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 13px; font-weight: 700; color: #fff; text-decoration: none; backdrop-filter: blur(8px); }
.pilule.alerte { background: rgba(0,0,0,.22); }
.partage { display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-top: 12px; text-decoration: none; color: var(--text); }
.partage .ic { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, var(--p1) 15%, transparent); color: var(--p1); }
.partage.regle .ic { background: var(--brand-soft); color: var(--brand); }
.partage b { display: block; font-size: 15px; }
.defile { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 2px 16px 8px; scroll-snap-type: x mandatory; }
.defile::-webkit-scrollbar { display: none; }
.carte { flex: none; width: 168px; padding: 14px; display: grid; gap: 4px; align-content: start; scroll-snap-align: start; animation: monte .4s var(--ease) both; }
.carte .ic { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); margin-bottom: 4px; }
.carte.bon .ic { background: var(--brand-soft); color: var(--brand); }
.carte.mauvais .ic { background: color-mix(in srgb, var(--expense) 14%, transparent); color: var(--expense); }
.carte b { font-size: 17px; line-height: 1.2; }
.carte small { color: var(--muted); font-size: 13px; line-height: 1.35; }
@keyframes monte { from { opacity: 0; transform: translateY(10px); } }
.top { padding: 6px 14px; }
.top-l { display: flex; gap: 12px; align-items: center; padding: 10px 0; text-decoration: none; color: var(--text); }
.top-l + .top-l { border-top: 1px solid var(--border); }
.top-l .grow { display: grid; gap: 6px; }
.top-l b { font-size: 15px; }
.top-l small { font-size: 12px; }
.liste { padding: 4px; margin: 0; display: grid; gap: 2px; }
.bienvenue { text-align: center; display: grid; justify-items: center; gap: 8px; padding: 34px 20px; }
.bienvenue img { border-radius: 20px; box-shadow: 0 16px 36px -14px var(--brand); }
.bienvenue h1 { margin: 10px 0 0; letter-spacing: -.03em; }
@media (min-width: 992px) { .mobile-only { display: none; } .carte { width: 190px; } }
</style>
