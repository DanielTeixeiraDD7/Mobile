import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from '~pages';
import App from './App.vue';
import { extend } from './core/i18n.js';
import { TEXTES } from './lib/textes';
import { useBudgetStore } from './stores/budget';
import { t as tCore, categoryName } from './core/i18n.js';
import type { Category } from './core/types';
import './styles/app.css';

extend(TEXTES);

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// $t / $cat dans les templates, réactifs à la langue.
const budget = useBudgetStore(pinia);
app.config.globalProperties.$t = (cle: string, p?: Record<string, string | number>) => (budget.tick, tCore(cle, p));
app.config.globalProperties.$cat = (c: Pick<Category, 'name' | 'key'>) => (budget.tick, categoryName(c));

budget.demarrer().finally(() => app.mount('#app'));

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  // Nouvelle version publiée : on recharge dès qu'aucune saisie n'est en cours.
  let avaitControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avaitControleur && !document.documentElement.classList.contains('feuille-ouverte')) location.reload();
    avaitControleur = true;
  });
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (cle: string, p?: Record<string, string | number>) => string;
    $cat: (c: Pick<Category, 'name' | 'key'>) => string;
  }
}
