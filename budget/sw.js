/* Service worker Budget v2 — généré au build (voir vite.config.ts). */
const VERSION = 'budget2-eb23b67807';
const ASSETS = ["./","assets/index-DRAN9_nw.js","assets/Barres-DU9CL72r.js","assets/ID-BVocRUmB.js","assets/budget-CgJ9lMwk.js","assets/historique-CkF4zhAb.js","assets/reglages-D3P_t9Nw.js","assets/route-block-D3E3wkB4.js","assets/stats-CZi15dDt.js","assets/Barres-SXQ04R6H.css","assets/ID-Beu5WW93.css","assets/budget-Ca8VEODi.css","assets/historique-C63HGKWV.css","assets/index-CcHwJ8BA.css","assets/reglages-B_jJaW1Y.css","assets/route-block-CIGRVROw.css","assets/stats-DriTbCcU.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

// Supprime les anciens caches de la v2 et celui de la v1 (« budget-v7 »…), remplacée à la même adresse.
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => (k.startsWith('budget2-') && k !== VERSION) || /^budget-v\d+$/.test(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase : jamais mis en cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
