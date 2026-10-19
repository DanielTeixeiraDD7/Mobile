import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from '~pages';
import App from './App.vue';
import './styles/app.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (to, _from, saved) => saved ?? (to.hash ? { el: to.hash, top: 12 } : { top: 0 }),
});
createApp(App).use(createPinia()).use(router).mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  // Nouvelle version : rechargement une fois, jamais pendant une séance ou une feuille ouverte.
  let avaitControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avaitControleur && !document.body.classList.contains('noscroll') && !document.documentElement.classList.contains('feuille-ouverte')) location.reload();
    avaitControleur = true;
  });
}
