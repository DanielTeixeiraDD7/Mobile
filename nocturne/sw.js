/* Service worker Nocturne — généré au build (voir vite.config.ts). */
const VERSION = 'nocturne-801251dbac';
const ASSETS = ["./","assets/index-CdYbA7Wz.js","assets/AdminPage-QMoBpw_I.js","assets/BannerCard-xBL45epQ.js","assets/BannerPage-C3MXQ9vr.js","assets/BannersPage-CpqYjNpG.js","assets/BattlePage-B1pMHfQh.js","assets/CardArt-CMScSUq1.js","assets/CardBack-CJhcWyhv.js","assets/CardPage-DQvXBRGk.js","assets/CardView-Bh8a7fTD.js","assets/CollectionPage-C0BbJfJT.js","assets/Currency-BxJXVZOJ.js","assets/HistoryPage-kyh6hy5d.js","assets/HomePage-Buc94eZE.js","assets/Icon-DCh5Yzuu.js","assets/LegalPage-D6mT6KHc.js","assets/LoginPage-7Ti_txOO.js","assets/MissionsPage-CAjsW7S-.js","assets/MorePage-CJG-FCNN.js","assets/PasswordPage-Dzdfc3HJ.js","assets/ProfilePage-B3xWemB6.js","assets/RatesPage-OYuMw_T2.js","assets/RegisterPage-BWeF-DSC.js","assets/ShopPage-CxFjuGj5.js","assets/TradesPage-Cj3Y0WcZ.js","assets/VerifyPage-BTPH5FaW.js","assets/battle-PDCvCpu1.js","assets/composables-cHcULAAV.js","assets/demo-xbW34JjY.js","assets/economy-CvdO6DW6.js","assets/format-pO9X1VY_.js","assets/gacha-C2gfgcAU.js","assets/now-DuveOuS8.js","assets/plugin-vue_export-helper-BDNMzG2s.js","assets/runtime-core.esm-bundler-oFlwsPOL.js","assets/runtime-dom.esm-bundler-CYKZGmXN.js","assets/session-BdhaS2TB.js","assets/src-BR3ohZmA.js","assets/types-BR6-3Lzi.js","assets/types-T7afLrz6.js","assets/vue-router-BIDFvfZz.js","assets/AdminPage-2OZYAkEF.css","assets/BannerCard-CF0FT6A7.css","assets/BannerPage-CoMVJb8R.css","assets/BattlePage-BScRYpBF.css","assets/CardArt-DV1GtofD.css","assets/CardBack-DtcvVRAr.css","assets/CardPage-CVmoX_1k.css","assets/CardView-BG84-sED.css","assets/CollectionPage-DuiAaHde.css","assets/Currency-CInueHmK.css","assets/HistoryPage-3KTQ-94B.css","assets/HomePage-DTvTh7fD.css","assets/LegalPage-CA69KwNf.css","assets/LoginPage-BOm_61Ag.css","assets/MissionsPage-Dsc2WSTe.css","assets/MorePage-pin9InQY.css","assets/ProfilePage-BAMcgMU2.css","assets/RatesPage-B_C_9TKp.css","assets/RegisterPage-DSNsHyB_.css","assets/ShopPage-CAhpcO3q.css","assets/TradesPage-b7pHoe7_.css","assets/VerifyPage-C2bfnCml.css","assets/cinzel-decorative-latin-700-normal-CnX1aK6s.woff2","assets/cinzel-decorative-latin-ext-700-normal-Dul5pKgq.woff2","assets/cinzel-latin-600-normal-Dd5YO2UX.woff2","assets/cinzel-latin-700-normal-Dkw14w9r.woff2","assets/cinzel-latin-ext-600-normal-BEFdM_VE.woff2","assets/cinzel-latin-ext-700-normal-C24KFjuG.woff2","assets/index-Bm6h-Vz7.css","assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","assets/inter-greek-wght-normal-CkhJZR-_.woff2","assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","assets/inter-latin-wght-normal-Dx4kXJAl.woff2","assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2","cards/NE1-001.webp","cards/NE1-002.webp","cards/NE1-009.webp","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
const NOTRE = new Set(ASSETS.map(a => new URL(a, self.registration.scope).href));
const RACINE = new URL('./', self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('nocturne-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.hash = '';
  const page = req.mode === 'navigate' && (url.href === RACINE || url.href === RACINE + 'index.html');
  if (!page && !NOTRE.has(url.href.split('?')[0])) return;
  if (page) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copie = res.clone(); caches.open(VERSION).then(c => c.put('./', copie)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
