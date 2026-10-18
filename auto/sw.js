/* Service worker AutoRadar — généré au build (voir vite.config.ts). */
const VERSION = 'autoradar-ff8725e88e';
const ASSETS = ["./","assets/index-DvxDbrLs.js","assets/AnnonceForm-CculNQGP.js","assets/ID-DFO8J72k.js","assets/annonces-ChvrhpcV.js","assets/guide-CHNG5EeO.js","assets/guide-CbETm4DM.js","assets/hypotheses-y2aWgSlI.js","assets/import-BJn4CIji.js","assets/import-DR56i2di.js","assets/reglages-DhBXV9gT.js","assets/AnnonceForm-Cdgl4nJo.css","assets/ID-DU_3WLjE.css","assets/annonces-Dz6bFLkA.css","assets/guide-CkeaLBi1.css","assets/import-WM07a-Hp.css","assets/index-DTld25Gn.css","assets/primeicons-C6QP2o4f.woff2","assets/reglages-D_fDa8fk.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('autoradar-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Page : réseau d'abord (mises à jour immédiates), cache hors-ligne.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  // Fichiers du build (noms avec hash) : cache d'abord.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
