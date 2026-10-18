/* Service worker Vue Express — généré au build (voir vite.config.ts). */
const VERSION = 'vue-express-5897e02209';
const ASSETS = ["./","assets/index-DU5akYSy.js","assets/Celebration-ek5-bU0e.js","assets/ID-3kEhP99e.js","assets/QuizCard-CUCkMHJQ.js","assets/exercice-LhoL2lTF.js","assets/highlight-JZG6mSd3.js","assets/parcours-Cx2yPvwy.js","assets/profil-BUQ0zC2K.js","assets/revision-Bg0n8UIr.js","assets/rolldown-runtime-DK3Fl9T5.js","assets/route-block-D0KaDhiA.js","assets/Celebration-BbnlY2Xp.css","assets/ID-hyrK-mqA.css","assets/QuizCard-C4Cd7Z2S.css","assets/exercice-9yDkpqUt.css","assets/index-DTdOLl4W.css","assets/parcours-BtaDWvLc.css","assets/primeicons-C6QP2o4f.woff2","assets/profil-DezVBpe6.css","assets/revision-C5sXAtpK.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('vue-express-') && k !== VERSION).map(k => caches.delete(k))))
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
