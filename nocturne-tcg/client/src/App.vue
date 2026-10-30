<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { isDemo } from './api';
import Currency from './components/Currency.vue';
import Icon from './components/Icon.vue';
import { useSession } from './stores/session';
import { useToast } from './stores/toast';

const s = useSession();
const toast = useToast();
const route = useRoute();

const tabs = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/boosters', icon: 'pack', label: 'Boosters' },
  { to: '/collection', icon: 'cards', label: 'Collection' },
  { to: '/combat', icon: 'swords', label: 'Combat' },
  { to: '/plus', icon: 'more', label: 'Plus' },
] as const;

const active = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
const immersive = computed(() => route.path === '/combat' && route.query.live === '1');
</script>

<template>
  <div class="shell">
    <div v-if="isDemo" class="demo-strip">Démo : tes données restent dans ce navigateur. Les paiements sont désactivés.</div>
    <header v-if="!immersive" class="top">
      <RouterLink to="/" class="logo"><Icon name="moon" :size="20" /> Nocturne</RouterLink>
      <div v-if="s.wallet" class="wallet">
        <Currency kind="SHARDS" :value="s.wallet.balances.SHARDS" />
        <Currency kind="EMBERS" :value="s.wallet.balances.EMBERS" />
        <Currency kind="DUST" :value="s.wallet.balances.DUST" />
      </div>
      <RouterLink v-else-if="s.ready" to="/connexion" class="btn sm primary">Connexion</RouterLink>
    </header>

    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in"><component :is="Component" :key="route.path" /></Transition>
      </RouterView>
    </main>

    <nav v-if="!immersive" class="tabs" aria-label="Navigation principale">
      <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" :class="{ on: active(t.to) }">
        <Icon :name="t.icon" />
        <span>{{ t.label }}</span>
      </RouterLink>
    </nav>

    <div class="toasts" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toast.list" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.demo-strip { position: sticky; top: 0; z-index: 30; padding: 4px 12px; font-size: .75rem; text-align: center; background: #3a1530; color: #f6c9dc; }
.top {
  position: sticky; top: 0; z-index: 20; height: var(--top-h); display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 0 16px; padding-top: env(safe-area-inset-top); background: #0b0710d9; backdrop-filter: blur(10px); border-bottom: 1px solid #ffffff10;
}
.demo-strip + .top { top: 24px; }
.logo { display: inline-flex; align-items: center; gap: 6px; font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 700; font-size: 1.15rem; color: var(--text); text-decoration: none; }
.logo .icon { color: var(--blood); }
.wallet { display: flex; gap: 12px; font-size: .9rem; }
@media (max-width: 360px) { .wallet { gap: 8px; font-size: .8rem; } .logo { font-size: 1rem; } }
.tabs {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; display: grid; grid-template-columns: repeat(5, 1fr);
  height: calc(var(--nav-h) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom);
  background: #0b0710ee; backdrop-filter: blur(12px); border-top: 1px solid #ffffff12;
}
.tabs a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: var(--muted); text-decoration: none; font-size: .7rem; }
.tabs a.on { color: var(--text); }
.tabs a.on .icon { color: var(--blood); filter: drop-shadow(0 0 6px #e0315a99); }
.toasts { position: fixed; z-index: 100; left: 50%; transform: translateX(-50%); top: calc(var(--top-h) + 30px); width: min(92vw, 420px); display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.toast { padding: 10px 14px; border-radius: 12px; background: #20172bf2; border: 1px solid var(--line); box-shadow: 0 8px 30px #000a; font-size: .92rem; }
.toast.error { border-color: #e0315a; }
.toast.success { border-color: var(--ok); }
.toast.reward { border-color: var(--gold); color: #ffe2a6; }
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
