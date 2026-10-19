<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import ToastHost from '@/components/ToastHost.vue';
import ConfirmHost from '@/components/ConfirmHost.vue';
import SaisieRapide from '@/components/SaisieRapide.vue';
import { useBudgetStore } from '@/stores/budget';
import { useTheme } from '@/composables/useTheme';
import { useEcran } from '@/composables/useEcran';
import { useT } from '@/lib/t';

const budget = useBudgetStore();
const route = useRoute();
const { t } = useT();
const { estMobile } = useEcran();
useTheme();

// Onglets décrits par une config ; le « + » central ouvre la saisie.
const onglets = computed(() => [
  { to: '/', label: t('v2.nav.home'), icone: 'accueil' },
  { to: '/historique', label: t('tab.list'), icone: 'liste' },
  { to: '/budget', label: t('tab.budget'), icone: 'budget' },
  { to: '/stats', label: t('tab.stats'), icone: 'stats' },
]);
const actif = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
const saisie = ref(false);
const sync = computed(() => budget.etatSync);
</script>

<template>
  <div v-if="budget.erreur" class="fatal">
    <Icone nom="alerte" :taille="40" />
    <p>IndexedDB indisponible / indisponível.</p>
  </div>

  <div v-else class="shell">
    <aside v-if="!estMobile" class="side">
      <router-link to="/" class="brand">
        <img :src="'icons/icon.svg'" alt="" width="40" height="40">
        <span><b>Budget</b><small>{{ budget.couple ? $t('v2.brand.couple') : $t('v2.brand.solo') }}</small></span>
      </router-link>
      <button type="button" class="add-side" @click="saisie = true"><Icone nom="plus" :epaisseur="2.6" /> {{ $t('tab.add') }}</button>
      <router-link v-for="o in onglets" :key="o.to" :to="o.to" class="nav" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /> {{ o.label }}</router-link>
      <router-link to="/reglages" class="nav" :class="{ on: actif('/reglages') }"><Icone nom="reglages" /> {{ $t('tab.settings') }}</router-link>
      <div v-if="sync.status !== 'off'" class="side-sync" :class="sync.status">
        <i /> {{ $t('v2.sync.' + sync.status) }}<template v-if="sync.pending"> · {{ sync.pending }}</template>
      </div>
    </aside>

    <main class="main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.path" @ajouter="saisie = true" />
        </transition>
      </router-view>
    </main>

    <nav v-if="estMobile" class="tabbar" :aria-label="$t('v2.nav.main')">
      <router-link v-for="(o, i) in onglets.slice(0, 2)" :key="i" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
      <button type="button" class="fab" :aria-label="$t('tab.add')" @click="saisie = true"><Icone nom="plus" :taille="28" :epaisseur="2.6" /></button>
      <router-link v-for="(o, i) in onglets.slice(2)" :key="'b' + i" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
    </nav>
  </div>

  <SaisieRapide v-model="saisie" />
  <ToastHost />
  <ConfirmHost />
</template>

<style scoped>
.fatal { min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 10px; color: var(--muted); }
.shell { min-height: 100dvh; display: flex; }
.main { flex: 1; min-width: 0; padding: calc(var(--safe-t) + 14px) 16px calc(var(--tab-h) + var(--safe-b) + 28px); }
.side { position: sticky; top: 0; height: 100dvh; width: 250px; flex: none; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; background: var(--surface); border-right: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 18px; color: var(--text); text-decoration: none; }
.brand img { border-radius: 12px; box-shadow: 0 8px 20px -10px var(--brand); }
.brand b { display: block; font-size: 18px; letter-spacing: -.02em; }
.brand small { color: var(--muted); font-size: 12.5px; }
.add-side { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 0 14px; min-height: 48px; border: 0; border-radius: 15px; background: linear-gradient(135deg, #17c47f, var(--brand-2)); color: #fff; font-weight: 800; font-size: 15.5px; box-shadow: 0 12px 26px -12px var(--brand); }
.nav { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 13px; color: var(--muted); text-decoration: none; font-weight: 700; transition: background .15s, color .15s; }
.nav:hover { background: var(--surface-2); color: var(--text); }
.nav.on { background: var(--brand-soft); color: var(--brand-2); }
.dark .nav.on { color: var(--brand); }
.side-sync { margin-top: auto; display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 14px; background: var(--surface-2); font-size: 13px; font-weight: 600; color: var(--muted); }
.side-sync i { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); }
.side-sync.syncing i { background: var(--warn); animation: pulse 1s infinite; }
.side-sync.offline i, .side-sync.error i { background: var(--expense); }
@keyframes pulse { 50% { opacity: .3; } }

.tabbar {
  position: fixed; z-index: 50; left: 10px; right: 10px; bottom: calc(8px + var(--safe-b)); height: var(--tab-h);
  display: grid; grid-template-columns: 1fr 1fr 76px 1fr 1fr; align-items: center; padding: 0 6px; border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 86%, transparent); backdrop-filter: saturate(1.8) blur(20px); -webkit-backdrop-filter: saturate(1.8) blur(20px);
  border: 1px solid var(--border); box-shadow: 0 16px 40px -18px rgba(0, 0, 0, .35);
}
.tabbar a { display: grid; justify-items: center; gap: 3px; padding: 8px 0; color: var(--dim); text-decoration: none; font-size: 11px; font-weight: 700; transition: color .15s; }
.tabbar a.on { color: var(--brand-2); }
.dark .tabbar a.on { color: var(--brand); }
.fab { justify-self: center; width: 60px; height: 60px; margin-top: -26px; border: 0; border-radius: 22px; display: grid; place-items: center; color: #fff; background: linear-gradient(140deg, #22d38c, var(--brand-2)); box-shadow: 0 14px 28px -10px var(--brand), inset 0 1px 0 rgba(255,255,255,.35); transition: transform .15s var(--ease); }
.fab:active { transform: scale(.92) rotate(90deg); }
@media (min-width: 992px) {
  .main { padding: 28px 36px 48px; }
}
</style>
