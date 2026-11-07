// Hoot's service worker: makes Hoot installable and lets it open without a
// connection. Pages and code are fetched fresh when online (so updates show up
// straight away) and fall back to the last copy when offline.
const CACHE = 'hoot-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/favicon.svg', '/icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && (req.mode === 'navigate' || /\.(js|css|svg|png|woff2?)$/.test(url.pathname) || url.pathname.startsWith('/content/'))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? '/' : req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? '/' : req).then(r => r || Response.error())),
  );
});
