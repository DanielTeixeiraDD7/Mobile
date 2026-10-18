/* Service worker Esport Companion — généré au build (voir vite.config.ts). */
const VERSION = 'esport-3e7db5e530';
const ASSETS = ["./","assets/index-CBzJtrH4.js","assets/index-CkN9lT0j.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
const IMAGES = 'esport-images';
const MAX_IMAGES = 600;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('esport-') && k !== VERSION && k !== IMAGES).map(k => caches.delete(k))))
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

  // Logos, champions, objets : hôtes qui autorisent le CORS → réponses lisibles, mises en cache
  // (jamais de réponses opaques : leur taille est comptée très large par les navigateurs).
  const IMG_HOSTS = ['static.lolesports.com', 'ddragon.leagueoflegends.com', 'cdn.steamusercontent.com'];
  if (IMG_HOSTS.includes(url.hostname) && req.destination === 'image') {
    e.respondWith(caches.open(IMAGES).then(async cache => {
      const hit = await cache.match(req.url);
      if (hit) return hit;
      try {
        const res = await fetch(req.url, { mode: 'cors', credentials: 'omit' });
        if (res.ok) { cache.put(req.url, res.clone()); trimImages(); }
        return res;
      } catch {
        return fetch(req);
      }
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
