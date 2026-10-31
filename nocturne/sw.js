/* Service worker Nocturne — généré au build (voir vite.config.ts). */
const VERSION = 'nocturne-783e17b3f8';
const ASSETS = ["./","assets/index-wKowx5ai.js","assets/AdminPage-L32MGd2r.js","assets/BannerCard-DNYWgOoS.js","assets/BannerPage-C2RoYE_h.js","assets/BannersPage-CVvIpgpO.js","assets/BattlePage-AhUbS3-G.js","assets/CardArt-CwL-wiIX.js","assets/CardBack-CJhcWyhv.js","assets/CardPage-Bb97U1-E.js","assets/CardView-D7VYn5U-.js","assets/CollectionPage-B3O7ex5s.js","assets/Currency-BxJXVZOJ.js","assets/HistoryPage-DJN1plGP.js","assets/HomePage-DBbqNP5R.js","assets/Icon-DCh5Yzuu.js","assets/LegalPage-D6mT6KHc.js","assets/LoginPage-C6G-Q1WV.js","assets/MissionsPage-C72sNYhc.js","assets/MorePage-DTI8ly-U.js","assets/PasswordPage-Ce9nPPAP.js","assets/ProfilePage-BPlVZJs1.js","assets/RatesPage-CMit2V0l.js","assets/RegisterPage-BL0AUrCT.js","assets/ShopPage-D0fbhkvs.js","assets/TradesPage-DgT_h9LS.js","assets/VerifyPage-2sJHeb4N.js","assets/battle-YICfnbW3.js","assets/composables-C3p0zkri.js","assets/demo-Bl2S2g5g.js","assets/economy-CvdO6DW6.js","assets/format-pO9X1VY_.js","assets/now-DuveOuS8.js","assets/plugin-vue_export-helper-BDNMzG2s.js","assets/runtime-core.esm-bundler-oFlwsPOL.js","assets/runtime-dom.esm-bundler-CYKZGmXN.js","assets/session-DExysbxx.js","assets/src-Dgr41CBs.js","assets/types-BR6-3Lzi.js","assets/types-CLQFmeqk.js","assets/vue-router-BIDFvfZz.js","assets/AdminPage-2OZYAkEF.css","assets/BannerCard-CF0FT6A7.css","assets/BannerPage-Belf4U2E.css","assets/BattlePage-BScRYpBF.css","assets/CardArt-DV1GtofD.css","assets/CardBack-DtcvVRAr.css","assets/CardPage-D2MapUPH.css","assets/CardView-BqjzmqbC.css","assets/CollectionPage-BqKm00SL.css","assets/Currency-CInueHmK.css","assets/HistoryPage-fQjECMF3.css","assets/HomePage-DTvTh7fD.css","assets/LegalPage-CA69KwNf.css","assets/LoginPage-BOm_61Ag.css","assets/MissionsPage-Dsc2WSTe.css","assets/MorePage-pin9InQY.css","assets/ProfilePage-BAMcgMU2.css","assets/RatesPage-CNRDYdYY.css","assets/RegisterPage-DSNsHyB_.css","assets/ShopPage-CAhpcO3q.css","assets/TradesPage-b7pHoe7_.css","assets/VerifyPage-C2bfnCml.css","assets/cinzel-decorative-latin-700-normal-CnX1aK6s.woff2","assets/cinzel-decorative-latin-ext-700-normal-Dul5pKgq.woff2","assets/cinzel-latin-600-normal-Dd5YO2UX.woff2","assets/cinzel-latin-700-normal-Dkw14w9r.woff2","assets/cinzel-latin-ext-600-normal-BEFdM_VE.woff2","assets/cinzel-latin-ext-700-normal-C24KFjuG.woff2","assets/index-Bm6h-Vz7.css","assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","assets/inter-greek-wght-normal-CkhJZR-_.woff2","assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","assets/inter-latin-wght-normal-Dx4kXJAl.woff2","assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2","cards/NE1-009.webp","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
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
