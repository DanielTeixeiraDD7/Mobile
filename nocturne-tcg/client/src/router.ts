import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import { useSession } from './stores/session';

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./pages/HomePage.vue') },
  { path: '/connexion', component: () => import('./pages/LoginPage.vue'), meta: { guest: true } },
  { path: '/inscription', component: () => import('./pages/RegisterPage.vue'), meta: { guest: true } },
  { path: '/verifier', component: () => import('./pages/VerifyPage.vue') },
  { path: '/mot-de-passe', component: () => import('./pages/PasswordPage.vue') },
  { path: '/boosters', component: () => import('./pages/BannersPage.vue') },
  { path: '/boosters/:id', component: () => import('./pages/BannerPage.vue'), props: true },
  { path: '/taux/:id', component: () => import('./pages/RatesPage.vue'), props: true },
  { path: '/collection', component: () => import('./pages/CollectionPage.vue'), meta: { auth: true } },
  { path: '/carte/:id', component: () => import('./pages/CardPage.vue'), props: true },
  { path: '/historique', component: () => import('./pages/HistoryPage.vue'), meta: { auth: true } },
  { path: '/boutique', component: () => import('./pages/ShopPage.vue'), meta: { auth: true } },
  { path: '/echanges', component: () => import('./pages/TradesPage.vue'), meta: { auth: true } },
  { path: '/missions', component: () => import('./pages/MissionsPage.vue'), meta: { auth: true } },
  { path: '/combat', component: () => import('./pages/BattlePage.vue'), meta: { auth: true } },
  { path: '/profil', component: () => import('./pages/ProfilePage.vue'), meta: { auth: true } },
  { path: '/plus', component: () => import('./pages/MorePage.vue') },
  { path: '/legal/:doc', component: () => import('./pages/LegalPage.vue'), props: true },
  { path: '/admin', component: () => import('./pages/admin/AdminPage.vue'), meta: { auth: true, admin: true } },
  { path: '/:rest(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

router.beforeEach(async to => {
  const s = useSession();
  await s.boot();
  if (to.meta.auth && !s.me) return { path: '/connexion', query: { next: to.fullPath } };
  if (to.meta.guest && s.me) return '/';
  if (to.meta.admin && !s.isAdmin) return '/';
});
