<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import LogoMark from '@/shared/components/LogoMark.vue';
import { useEcran } from '@/composables/useEcran';
import { useTheme } from '@/composables/useTheme';
import { useProgressionStore } from '@/stores/progression';

const { t } = useI18n();
const route = useRoute();
const { estMobile } = useEcran();
useTheme();
const progression = useProgressionStore();

// Menu décrit par une config, affiché en menu latéral (bureau) ou barre du bas (mobile).
const menu = computed(() => {
  const base = [
    { to: '/', label: t('nav.accueil'), icon: 'pi pi-home', badge: 0 },
    { to: '/parcours', label: t('nav.parcours'), icon: 'pi pi-map', badge: 0 },
    { to: '/revision', label: t('nav.revision'), icon: 'pi pi-bolt', badge: progression.dueCards.length },
    { to: '/profil', label: t('nav.profil'), icon: 'pi pi-user', badge: 0 },
  ];
  return base;
});

const titre = computed(() => (route.meta.titre as string | undefined) ?? t('app.nom'));
const large = computed(() => !!route.meta.large);
</script>

<template>
  <div class="shell">
    <aside v-if="!estMobile" class="sidebar" aria-label="Navigation principale">
      <router-link to="/" class="brand">
        <LogoMark />
        <span><b>{{ $t('app.nom') }}</b><small>{{ $t('app.slogan') }}</small></span>
      </router-link>
      <router-link v-for="m in menu" :key="m.to" :to="m.to" class="navlink" :class="{ 'router-link-active': m.to !== '/' && route.path.startsWith(m.to) || (m.to === '/parcours' && route.path.startsWith('/lecon')) }">
        <i :class="m.icon" /> {{ m.label }}
        <span v-if="m.badge" class="count">{{ m.badge }}</span>
      </router-link>
      <div class="side-foot">
        <div class="flex justify-content-between mb-2"><span>Parcours</span><b class="text-color">{{ progression.percent }} %</b></div>
        <div class="bar"><i :style="{ width: progression.percent + '%' }" /></div>
        <div class="flex justify-content-between mt-3">
          <span><i class="pi pi-star-fill" style="color:#f5b301" /> {{ $t('accueil.xp', { n: progression.xp }) }}</span>
          <span>🔥 {{ progression.streak }}</span>
        </div>
      </div>
    </aside>

    <header v-else class="topbar">
      <router-link to="/" aria-label="Accueil"><LogoMark /></router-link>
      <h1>{{ titre }}</h1>
      <span class="pill green" v-if="progression.streak">🔥 {{ progression.streak }}</span>
    </header>

    <main class="main" :class="{ wide: large }">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>
    </main>

    <nav v-if="estMobile" class="bottombar" aria-label="Navigation principale">
      <router-link v-for="m in menu" :key="m.to" :to="m.to" :class="{ 'router-link-active': m.to !== '/' && route.path.startsWith(m.to) || (m.to === '/parcours' && route.path.startsWith('/lecon')) }">
        <i :class="m.icon" />
        <span>{{ m.label }}</span>
        <span v-if="m.badge" class="dot">{{ m.badge }}</span>
      </router-link>
    </nav>
  </div>
  <Toast position="top-center" group="app" />
  <ConfirmDialog group="app" />
</template>
