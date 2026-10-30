/* Service worker Nocturne — généré au build (voir vite.config.ts). */
const VERSION = 'nocturne-dcc03d80ff';
const ASSETS = ["./","assets/index-DduVWaNb.js","assets/AdminPage-BYJJuJff.js","assets/BannerCard-DiPbVDfl.js","assets/BannerPage-C6V-sNRl.js","assets/BannersPage-BbNiEjWW.js","assets/BattlePage-CbTLcPTw.js","assets/CardArt-CJw_XMus.js","assets/CardBack-CJhcWyhv.js","assets/CardPage-Cn0RGY8o.js","assets/CardView-BF9AjauG.js","assets/CollectionPage-CxesjAjh.js","assets/Currency-BxJXVZOJ.js","assets/HistoryPage-Nuu2-b19.js","assets/HomePage-Dm2QDK4w.js","assets/Icon-DCh5Yzuu.js","assets/LegalPage-D6mT6KHc.js","assets/LoginPage-CJGCuumM.js","assets/MissionsPage-D3WGkI_D.js","assets/MorePage-DtQN9c7P.js","assets/PasswordPage-x_l9-FU7.js","assets/ProfilePage-CX6Sz602.js","assets/RatesPage-Dvuz2q4k.js","assets/RegisterPage-C74x-pB4.js","assets/ShopPage-DimPVgn4.js","assets/TradesPage-Bg4ChqH8.js","assets/VerifyPage-Bwl6wJgv.js","assets/battle-YICfnbW3.js","assets/composables-CUJriANn.js","assets/demo-DHLIXHKy.js","assets/economy-CvdO6DW6.js","assets/format-pO9X1VY_.js","assets/now-DuveOuS8.js","assets/plugin-vue_export-helper-BDNMzG2s.js","assets/runtime-core.esm-bundler-oFlwsPOL.js","assets/runtime-dom.esm-bundler-CYKZGmXN.js","assets/session-DMHZ8Ijr.js","assets/src-BjB8t4ps.js","assets/types-BR6-3Lzi.js","assets/types-CLQFmeqk.js","assets/vue-router-BIDFvfZz.js","assets/AdminPage-2OZYAkEF.css","assets/BannerCard-CF0FT6A7.css","assets/BannerPage-Belf4U2E.css","assets/BattlePage-BScRYpBF.css","assets/CardArt-tTaTBde9.css","assets/CardBack-DtcvVRAr.css","assets/CardPage-D2MapUPH.css","assets/CardView-D35TFxnp.css","assets/CollectionPage-BqKm00SL.css","assets/Currency-CInueHmK.css","assets/HistoryPage-fQjECMF3.css","assets/HomePage-DTvTh7fD.css","assets/LegalPage-CA69KwNf.css","assets/LoginPage-BOm_61Ag.css","assets/MissionsPage-Dsc2WSTe.css","assets/MorePage-pin9InQY.css","assets/ProfilePage-BAMcgMU2.css","assets/RatesPage-CNRDYdYY.css","assets/RegisterPage-DSNsHyB_.css","assets/ShopPage-CAhpcO3q.css","assets/TradesPage-b7pHoe7_.css","assets/VerifyPage-C2bfnCml.css","assets/cinzel-decorative-latin-700-normal-CnX1aK6s.woff2","assets/cinzel-decorative-latin-ext-700-normal-Dul5pKgq.woff2","assets/cinzel-latin-600-normal-Dd5YO2UX.woff2","assets/cinzel-latin-700-normal-Dkw14w9r.woff2","assets/cinzel-latin-ext-600-normal-BEFdM_VE.woff2","assets/cinzel-latin-ext-700-normal-C24KFjuG.woff2","assets/index-Bm6h-Vz7.css","assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","assets/inter-greek-wght-normal-CkhJZR-_.woff2","assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","assets/inter-latin-wght-normal-Dx4kXJAl.woff2","assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
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
