import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from '~pages';
import App from './App.vue';
import './styles/app.css';

const router = createRouter({ history: createWebHashHistory(), routes, scrollBehavior: (_t, _f, saved) => saved ?? { top: 0 } });
createApp(App).use(createPinia()).use(router).mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
