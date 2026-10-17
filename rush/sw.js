// Cache hors-ligne : tous les fichiers du jeu. Changer VERSION à chaque publication.
const VERSION = 'rush-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'vendor/three.module.min.js',
  'js/main.js', 'js/ui/ui.js', 'js/core/input.js', 'js/core/audio.js',
  'js/sim/config.js', 'js/sim/rng.js', 'js/sim/kinds.js', 'js/sim/zones.js', 'js/sim/patterns.js', 'js/sim/validator.js',
  'js/sim/generator.js', 'js/sim/run.js', 'js/sim/boss.js', 'js/sim/missions.js', 'js/sim/save.js', 'js/sim/characters.js', 'js/sim/autopilot.js',
  'js/view/kit.js', 'js/view/characters.js', 'js/view/props.js', 'js/view/world.js', 'js/view/entities.js', 'js/view/rig.js', 'js/view/effects.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('rush-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)).catch(() => caches.match('index.html')));
});
