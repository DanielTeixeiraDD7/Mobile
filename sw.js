/* Service worker FitMaison — généré au build (voir vite.config.ts). */
const VERSION = 'fitmaison-60c0ab9bad';
const ASSETS = ["./","assets/archivo-var-DtnZy9gq.woff2","assets/exercices-B45RDrcK.js","assets/exercices-M4cc0VjX.js","assets/exercices-k8l7_kLC.css","assets/id-BDS8Me_d.css","assets/id-MjRUPat4.js","assets/index-C_zlaJre.css","assets/index-MAwDl51k.js","assets/nutrition-AQtE31mi.js","assets/nutrition-f0DoeCbR.css","assets/plan-AA1dJcxl.css","assets/plan-Cw9D5mAM.js","assets/poids-BV8YD-BW.js","assets/poids-pAboMb1Q.css","assets/profil-BNu0qk7Q.js","assets/profil-BmUHnoT9.css","assets/route-block-7q7U71kS.css","assets/route-block-DK6B2bHU.js","assets/seances-B5IRkv6W.css","assets/seances-bJ3w3Ok8.js","assets/type-C0hG6Wno.js","assets/type-sym_-f80.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
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
