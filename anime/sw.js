/* Service worker ScreenPilot — généré au build (voir vite.config.ts). Remplace celui d'AnimePilot à la même adresse. */
const VERSION = 'screenpilot-72ef345989';
const ASSETS = ["./","assets/index-CEdITj93.js","assets/Affiche-C8nhIdwz.js","assets/Anneau-CMdflZpX.js","assets/BadgeType--bHlBJSp.js","assets/amis-CZKRpH66.js","assets/bibliotheque-D-ood9Yw.js","assets/calendrier-BNotzTTI.js","assets/dist-BgjI5Ojy.js","assets/donnees-BgL_AsXl.js","assets/id-Bdq04UtX.js","assets/id-C5ZxT-cr.js","assets/profil-COyk-MpK.js","assets/recherche-BDZlEWUq.js","assets/reglages-BXCv_BcC.js","assets/route-block-Z3aYRLef.js","assets/temps-C22tSZXr.js","assets/useToast-DLDDnTV-.js","assets/Affiche-XBlHXvOv.css","assets/Anneau-DiY8Ir1B.css","assets/BadgeType-DpoRnLX4.css","assets/amis-BSquqbRA.css","assets/bibliotheque-C4obbwOq.css","assets/calendrier-D67UbNZy.css","assets/donnees-Br12zMcY.css","assets/id-C1jlnB6L.css","assets/id-D7yIjaH1.css","assets/index-BJzOlfEC.css","assets/profil-QpKssA7p.css","assets/recherche-D2xZp_Fz.css","assets/reglages-BhcM5tyz.css","assets/route-block-BqPhC0lP.css","assets/temps-C_3DGTgn.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
const IMAGES = 'screenpilot-images';
const MAX_IMAGES = 600;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

// Nettoie les anciens caches ScreenPilot et ceux d'AnimePilot (la version précédente de l'app).
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => (k.startsWith('screenpilot-') && k !== VERSION && k !== IMAGES) || k.startsWith('animepilot-')).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trimImages() {
  const cache = await caches.open(IMAGES);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(k);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Affiches AniList et TMDB : cache d'abord (elles ne changent pas), réseau sinon.
  if ((url.hostname.endsWith('anilist.co') || url.hostname === 'image.tmdb.org') && /\.(jpe?g|png|webp|gif)$/i.test(url.pathname)) {
    e.respondWith(caches.open(IMAGES).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && (res.type === 'cors' || res.type === 'basic')) { cache.put(req, res.clone()); trimImages(); }
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => list[0] ? list[0].focus() : self.clients.openWindow('./')));
});
