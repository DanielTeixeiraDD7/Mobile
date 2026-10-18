<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import LogoMark from '@/shared/components/LogoMark.vue';
import { useEcran } from '@/composables/useEcran';
import { useTheme } from '@/composables/useTheme';
import { useAnnoncesStore } from '@/stores/annonces';

const route = useRoute();
const { estMobile } = useEcran();
useTheme();
const annonces = useAnnoncesStore();

// Menu décrit par une config : menu latéral (bureau) ou barre du bas (mobile).
const menu = computed(() => [
  { to: '/', label: 'Rechercher', icon: 'pi pi-search', badge: 0 },
  { to: '/annonces', label: 'Annonces', icon: 'pi pi-car', badge: annonces.actives.length },
  { to: '/import', label: 'Import', icon: 'pi pi-calculator', badge: 0 },
  { to: '/guide', label: 'Guide', icon: 'pi pi-shield', badge: 0 },
]);
const estActif = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
const titre = computed(() => (route.meta.titre as string | undefined) ?? 'AutoRadar');
</script>

<template>
  <div class="shell">
    <aside v-if="!estMobile" class="sidebar" aria-label="Navigation principale">
      <router-link to="/" class="brand">
        <LogoMark />
        <span><b>AutoRadar</b><small>Voitures PT · FR · DE · BE</small></span>
      </router-link>
      <router-link v-for="m in menu" :key="m.to" :to="m.to" class="navlink" :class="{ actif: estActif(m.to) }">
        <i :class="m.icon" /> {{ m.label }}
        <span v-if="m.badge" class="count">{{ m.badge }}</span>
      </router-link>
      <router-link to="/reglages" class="navlink" :class="{ actif: estActif('/reglages') }"><i class="pi pi-cog" /> Réglages</router-link>
      <div class="side-foot">
        <b class="block mb-1" style="color: var(--ar-text)">Rien n'est copié</b>
        AutoRadar ouvre les recherches sur les sites officiels. Tes annonces suivies restent sur cet appareil.
      </div>
    </aside>

    <header v-else class="topbar">
      <router-link to="/" aria-label="Accueil"><LogoMark :size="34" /></router-link>
      <h1>{{ titre }}</h1>
      <router-link to="/reglages" class="icon-btn" aria-label="Réglages"><i class="pi pi-cog" /></router-link>
    </header>

    <main class="main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>
    </main>

    <nav v-if="estMobile" class="bottombar" aria-label="Navigation principale">
      <router-link v-for="m in menu" :key="m.to" :to="m.to" :class="{ actif: estActif(m.to) }">
        <i :class="m.icon" />
        <span>{{ m.label }}</span>
        <span v-if="m.badge" class="dot">{{ m.badge }}</span>
      </router-link>
    </nav>
  </div>
  <Toast position="top-center" />
  <ConfirmDialog />
</template>
