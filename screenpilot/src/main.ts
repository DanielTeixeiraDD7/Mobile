import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from '~pages';
import App from './App.vue';
import { useBiblio } from './stores/biblio';
import './styles/app.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

useBiblio(pinia).demarrer().finally(() => app.mount('#app'));

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  // Nouvelle version publiée : rechargement dès qu'aucune feuille n'est ouverte.
  let avaitControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avaitControleur && !document.documentElement.classList.contains('feuille-ouverte')) location.reload();
    avaitControleur = true;
  });
}
