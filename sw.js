/* Service worker FitMaison — généré au build (voir vite.config.ts). */
const VERSION = 'fitmaison-04b3c1c746';
const ASSETS = ["./","assets/exercices-BINawyZM.js","assets/exercices-BnBjrQjj.js","assets/exercices-D-hZWqaT.css","assets/id-98HkocMM.js","assets/id-tARyvy1J.css","assets/index-BDpl7tPa.js","assets/index-COWv3Rd6.css","assets/nutrition-CdsV4rW7.js","assets/nutrition-Cztszbor.css","assets/poids-BDQY5c0i.js","assets/poids-C5n7KBm-.css","assets/profil-Bm946ez_.js","assets/profil-DswfX2-5.css","assets/route-block-BB6o01P9.css","assets/route-block-CDgP3wtS.js","assets/seances-ZBUEchi_.js","assets/seances-sIxjLI3w.css","assets/type-DKe30HMf.css","assets/type-f6Fh7dKo.js","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
// FitMaison est à la racine du site : d'autres apps vivent dans des sous-dossiers (budget/, anime/…).
// On ne touche qu'à nos propres fichiers et caches.
const NOTRE = new Set(ASSETS.map(a => new URL(a, self.registration.scope).href));
const RACINE = new URL('./', self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Anciennes versions de FitMaison seulement (la v1 s'appelait « fitmaison-v3 »).
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('fitmaison-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.hash = '';
  const page = req.mode === 'navigate' && (url.href === RACINE || url.href === RACINE + 'index.html');
  if (!page && !NOTRE.has(url.href.split('?')[0])) return; // autres apps : pas notre affaire
  // Page : réseau d'abord (mises à jour immédiates), cache hors-ligne. Fichiers versionnés : cache d'abord.
  if (page) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copie = res.clone(); caches.open(VERSION).then(c => c.put('./', copie)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
