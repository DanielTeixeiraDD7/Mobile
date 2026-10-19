/* Service worker ScreenPilot — généré au build (voir vite.config.ts). Remplace celui d'AnimePilot à la même adresse. */
const VERSION = 'screenpilot-d06f7c5fb1';
const ASSETS = ["./","assets/index-Dx5vyVt-.js","assets/Affiche-CRvS6MwQ.js","assets/BadgeType-3cshybjy.js","assets/bibliotheque-DrbOFd__.js","assets/calendrier-DTgzC5Wk.js","assets/donnees-B5-yUaGn.js","assets/id-D560uDz3.js","assets/profil-BAPmBH4L.js","assets/recherche-TYvgFJHa.js","assets/reglages-CSCgSzll.js","assets/route-block-yNGUbeS1.js","assets/temps-BwpDKskR.js","assets/useToast-D1NRLMDo.js","assets/Affiche-XBlHXvOv.css","assets/BadgeType-DpoRnLX4.css","assets/bibliotheque-C4obbwOq.css","assets/calendrier-D67UbNZy.css","assets/donnees-Br12zMcY.css","assets/id-C1jlnB6L.css","assets/index-ld6kD0yl.css","assets/profil-CNw9rP97.css","assets/recherche-D2xZp_Fz.css","assets/reglages-CVJpOjeG.css","assets/route-block-BqPhC0lP.css","assets/temps-BJif8ThN.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
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
