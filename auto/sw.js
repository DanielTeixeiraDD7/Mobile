/* Service worker AutoRadar — généré au build (voir vite.config.ts). */
const VERSION = 'autoradar-055c4ce5fd';
const ASSETS = ["./","assets/index-mFFzZnzZ.js","assets/AnnonceForm-CtNKXi14.js","assets/ID-eDwJGg8e.js","assets/annonces-qPyh0yWt.js","assets/guide-CHNG5EeO.js","assets/guide-ZbnD6UcI.js","assets/hypotheses-DlzlB5BQ.js","assets/import-BJn4CIji.js","assets/import-BdZKWQMS.js","assets/reglages-CWtuHauZ.js","assets/AnnonceForm-DyQmttxe.css","assets/ID-DU_3WLjE.css","assets/annonces-DJt61MTk.css","assets/guide-CkeaLBi1.css","assets/import-WM07a-Hp.css","assets/index-45MT5IBr.css","assets/primeicons-C6QP2o4f.woff2","assets/reglages-D_fDa8fk.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];

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
