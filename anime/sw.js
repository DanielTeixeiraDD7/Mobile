/* Service worker AnimePilot — généré au build (voir vite.config.ts). */
const VERSION = 'animepilot-1f78738366';
const ASSETS = ["./","assets/index-Cy9UWBum.css","assets/index-DeY36UMl.js","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
const IMAGES = 'animepilot-images';
const MAX_IMAGES = 400;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('animepilot-') && k !== VERSION && k !== IMAGES).map(k => caches.delete(k))))
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

  // Affiches AniList : cache d'abord (elles ne changent pas), réseau sinon.
  if (url.hostname.endsWith('anilist.co') && /\.(jpe?g|png|webp|gif)$/i.test(url.pathname)) {
    e.respondWith(caches.open(IMAGES).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.type === 'cors') { cache.put(req, res.clone()); trimImages(); }
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Page : réseau d'abord (mises à jour immédiates), cache hors-ligne.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  // Fichiers du build (noms avec hash) : cache d'abord.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => list[0] ? list[0].focus() : self.clients.openWindow('./')));
});
