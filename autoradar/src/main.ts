import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Textarea from 'primevue/textarea';
import routes from '~pages';
import App from './App.vue';
import { PRIMEVUE_CONFIG } from './lib/theme';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.min.css';
import './styles/app.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, PRIMEVUE_CONFIG);
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
// Composants PrimeVue utilisés partout : enregistrés globalement.
for (const [nom, c] of Object.entries({ Button, Tag, Drawer, InputText, InputNumber, Select, SelectButton, Textarea })) app.component(nom, c);
app.mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
