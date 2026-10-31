/* PUSULA — offline çalışma için önbellek */
const CACHE = 'pusula-v1.7.2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './tools.js', './words-tr.txt', './words-en.txt', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './fonts/carlito-400.woff2', './fonts/carlito-400-ext.woff2', './fonts/carlito-700.woff2', './fonts/carlito-700-ext.woff2', './fonts/source-sans-3.woff2', './fonts/source-sans-3-ext.woff2',
  './fonts/plex-400.woff2', './fonts/plex-400-ext.woff2', './fonts/plex-500.woff2', './fonts/plex-500-ext.woff2', './fonts/plex-600.woff2', './fonts/plex-600-ext.woff2', './fonts/plex-700.woff2', './fonts/plex-700-ext.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // senkron istekleri doğrudan ağa gider
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
