/* Service worker Nocturne — généré au build (voir vite.config.ts). */
const VERSION = 'nocturne-ab83ebba45';
const ASSETS = ["./","assets/index-DuFnTMzA.js","assets/AdminPage-BLPqMcG-.js","assets/BannerCard-Bk_B1Z0z.js","assets/BannerPage-B3AzCR57.js","assets/BannersPage-BRFsjibi.js","assets/BattlePage-D6ALGKZa.js","assets/CardArt-NRsWaHqB.js","assets/CardBack-CJhcWyhv.js","assets/CardPage-C93ubvP7.js","assets/CardView-BcqiSS2e.js","assets/CollectionPage-6MZTJH7a.js","assets/Currency-BxJXVZOJ.js","assets/HistoryPage-CL_AU9A_.js","assets/HomePage-T6CF06x6.js","assets/Icon-DCh5Yzuu.js","assets/LegalPage-D6mT6KHc.js","assets/LoginPage-CSCHvL8A.js","assets/MissionsPage-CFMsNTEr.js","assets/MorePage-CYl72Lox.js","assets/PasswordPage-Dc9Knvwj.js","assets/ProfilePage-d6UTZ8SJ.js","assets/RatesPage-CF2eye43.js","assets/RegisterPage--ZkolF1j.js","assets/ShopPage-BMdJNTXi.js","assets/TradesPage-5_aqfZ_9.js","assets/VerifyPage-Bzar8b9O.js","assets/battle-PDCvCpu1.js","assets/composables-yG0EP7AT.js","assets/demo-BMIZ2VCj.js","assets/economy-CvdO6DW6.js","assets/format-pO9X1VY_.js","assets/gacha-C2gfgcAU.js","assets/now-DuveOuS8.js","assets/plugin-vue_export-helper-BDNMzG2s.js","assets/runtime-core.esm-bundler-oFlwsPOL.js","assets/runtime-dom.esm-bundler-CYKZGmXN.js","assets/session-Hs_8WsS7.js","assets/src-1LrHFNnO.js","assets/types-BR6-3Lzi.js","assets/types-T7afLrz6.js","assets/vue-router-BIDFvfZz.js","assets/AdminPage-2OZYAkEF.css","assets/BannerCard-CF0FT6A7.css","assets/BannerPage-CoMVJb8R.css","assets/BattlePage-BScRYpBF.css","assets/CardArt-DV1GtofD.css","assets/CardBack-DtcvVRAr.css","assets/CardPage-CVmoX_1k.css","assets/CardView-BG84-sED.css","assets/CollectionPage-DuiAaHde.css","assets/Currency-CInueHmK.css","assets/HistoryPage-3KTQ-94B.css","assets/HomePage-DTvTh7fD.css","assets/LegalPage-CA69KwNf.css","assets/LoginPage-BOm_61Ag.css","assets/MissionsPage-Dsc2WSTe.css","assets/MorePage-pin9InQY.css","assets/ProfilePage-BAMcgMU2.css","assets/RatesPage-B_C_9TKp.css","assets/RegisterPage-DSNsHyB_.css","assets/ShopPage-CAhpcO3q.css","assets/TradesPage-b7pHoe7_.css","assets/VerifyPage-C2bfnCml.css","assets/cinzel-decorative-latin-700-normal-CnX1aK6s.woff2","assets/cinzel-decorative-latin-ext-700-normal-Dul5pKgq.woff2","assets/cinzel-latin-600-normal-Dd5YO2UX.woff2","assets/cinzel-latin-700-normal-Dkw14w9r.woff2","assets/cinzel-latin-ext-600-normal-BEFdM_VE.woff2","assets/cinzel-latin-ext-700-normal-C24KFjuG.woff2","assets/index-Bm6h-Vz7.css","assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2","assets/inter-cyrillic-wght-normal-DqGufNeO.woff2","assets/inter-greek-ext-wght-normal-DlzME5K_.woff2","assets/inter-greek-wght-normal-CkhJZR-_.woff2","assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2","assets/inter-latin-wght-normal-Dx4kXJAl.woff2","assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2","cards/NE1-001.webp","cards/NE1-002.webp","cards/NE1-003.webp","cards/NE1-004.webp","cards/NE1-005.webp","cards/NE1-006.webp","cards/NE1-007.webp","cards/NE1-008.webp","cards/NE1-009.webp","cards/NE1-010-f2cc6093.webp","cards/NE1-011.webp","cards/NE1-012-c78d0a91.webp","cards/NE1-013-7b98b01f.webp","cards/NE1-014-c17d0b24.webp","cards/NE1-015-36dcd2d1.webp","cards/NE1-016.webp","cards/NE1-017.webp","cards/NE1-018-e46fe920.webp","cards/NE1-019.webp","cards/NE1-020-155c6bee.webp","cards/NE1-021-eec4a6d6.webp","cards/NE1-022-d9f00d51.webp","cards/NE1-023-8fcfbeef.webp","cards/NE1-024-42880345.webp","cards/NE1-025-713666ba.webp","cards/NE1-026-0ea7736a.webp","cards/NE1-027-3c7ecd14.webp","cards/NE1-028-6d402613.webp","cards/NE1-029-b9b60da7.webp","cards/NE1-030-c8cf5d25.webp","cards/NE1-031-ad240ece.webp","cards/NE1-032-0bc08ebc.webp","cards/NE1-033-2714b2d0.webp","cards/NE1-034-2815f94c.webp","cards/NE1-035-56accd9d.webp","cards/NE1-036-f28a54a1.webp","cards/NE1-037-216bb6ff.webp","cards/NE1-038-e2d81683.webp","cards/NE1-039-06fc4ac6.webp","cards/NE1-040-7bc463d6.webp","cards/NE1-041-294f0688.webp","cards/NE1-042-4e4af7cd.webp","cards/NE1-043-1a38cfef.webp","cards/NE1-044-e27c27d4.webp","cards/NE1-045-ebac4750.webp","cards/NE1-046-f4f970ca.webp","cards/NE1-047-09db86aa.webp","cards/NE1-048-5e6b720b.webp","cards/NE1-049-936ec7f5.webp","cards/NE1-050-146b0987.webp","cards/NE1-051-c2046ec4.webp","cards/NE1-052-92927902.webp","cards/NE1-053-7e782a32.webp","cards/NE1-054-00a09708.webp","cards/NE1-055-e14d6350.webp","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
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
