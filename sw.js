/* PUSULA — offline çalışma için önbellek */
const CACHE = 'pusula-v1.23.0';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './vendor/freehand.js', './ink.js', './tools.js', './mail.js', './feedback.js', './planner.js', './notes.js', './ux.js', './money.js', './money2.js', './focus.js', './games2.js', './extras.js', './ux2.js', './bridge.js', './words-tr.txt', './words-en.txt', './words-tr-all.txt', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/sc-task.png', './icons/sc-tx.png', './icons/sc-ctr.png', './icons/sc-focus.png',
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
/* PUSULA köprüsünden gelen bildirim: uygulama ekrandaysa ona ilet (kendisi gösterir), değilse bildirim göster */
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch (x) { m = { title: 'PUSULA', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const vis = list.filter(c => c.visibilityState === 'visible');
    if (vis.length && m.kind !== undefined) { vis.forEach(c => c.postMessage({ pusula: 'push', msg: m })); return; }
    return self.registration.showNotification(m.title || 'PUSULA', { body: m.body || '', tag: m.tag || 'pusula', renotify: m.kind !== 'rem', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [300, 150, 300], requireInteraction: m.kind === 'rem', data: m.data || {}, actions: m.actions || [] });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, act = e.action;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    if (d.mail !== undefined) { // yeni mail bildirimi: uygulamayı aç ve maili göster
      for (const c of list) { if ('focus' in c) { c.postMessage({ pusula: 'mail', id: d.mail }); return c.focus(); } }
      return self.clients.openWindow('./?go=mail&id=' + encodeURIComponent(d.mail || ''));
    }
    if (act && d.rem) { // Tamamlandı / 10 dk ertele: açık uygulamaya ilet, yoksa açıp ilet
      if (list.length) { list[0].postMessage({ pusula: 'rem', action: act, r: d.rem }); return; }
      return self.clients.openWindow('./?go=rem&a=' + encodeURIComponent(act) + '&r=' + encodeURIComponent(JSON.stringify(d.rem)));
    }
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
