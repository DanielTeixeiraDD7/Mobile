<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import { useRift } from '@/stores/rift';

const rift = useRift();
const route = useRoute();
onMounted(() => rift.demarrer());
const onglets = [
  { to: '/', label: 'Scanner', icone: 'scan' },
  { to: '/recherche', label: 'Cartes', icone: 'recherche' },
  { to: '/collection', label: 'Collection', icone: 'collection' },
  { to: '/infos', label: 'Infos', icone: 'infos' },
] as const;
const actif = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
</script>

<template>
  <router-view v-slot="{ Component, route: r }">
    <transition name="fade" mode="out-in"><component :is="Component" :key="r.path" /></transition>
  </router-view>
  <nav class="tabbar" aria-label="Navigation">
    <router-link v-for="o in onglets" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }" :aria-current="actif(o.to) ? 'page' : undefined">
      <Icone :nom="o.icone" />
      <span>{{ o.label }}</span>
      <b v-if="o.to === '/collection' && rift.nbCollection" class="badge num">{{ rift.nbCollection }}</b>
    </router-link>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(10px + var(--safe-b)); z-index: 50;
  width: min(520px, calc(100% - 20px)); height: var(--tab-h);
  display: grid; grid-template-columns: repeat(4, 1fr); padding: 6px;
  background: rgba(11, 18, 34, 0.86); backdrop-filter: blur(18px) saturate(1.4);
  border: 1px solid var(--border); border-radius: 22px; box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.8);
}
.tabbar a {
  position: relative; display: grid; place-items: center; align-content: center; gap: 3px; border-radius: 16px;
  color: var(--dim); text-decoration: none; font-size: 11.5px; font-weight: 800; letter-spacing: 0.04em;
}
.tabbar a.on { color: var(--or-vif); background: rgba(200, 170, 110, 0.12); }
.badge {
  position: absolute; top: 4px; right: calc(50% - 22px); min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: var(--cyan); color: #032421; font-size: 11px; display: grid; place-items: center;
}
</style>
