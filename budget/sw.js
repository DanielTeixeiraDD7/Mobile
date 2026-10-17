const VERSION = 'budget-v2';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/db.js', 'js/store.js', 'js/format.js', 'js/i18n.js', 'js/calc.js',
  'js/ui.js', 'js/chart.js', 'js/csv.js', 'js/backup.js', 'js/router.js',
  'js/views/add.js', 'js/views/list.js', 'js/views/budget.js', 'js/views/stats.js',
  'js/views/settings.js', 'js/views/txform.js', 'js/views/month.js', 'js/views/share.js',
  'js/config.js', 'js/auth.js', 'js/api.js', 'js/outbox.js', 'js/sync.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('budget-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true })
    .then(hit => hit || fetch(e.request))
    .catch(() => caches.match('index.html')));
});
