/* Offline support. Pages (navigations) are network-first so a new release shows up on the next
   launch; everything else is cache-first. Bump VERSION on every release. */
const VERSION = 'waraqa-v1.0.2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser HTTP cache, so a fresh deploy is never cached as the old file.
  e.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function save(req, res) {
  if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => save(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => save(req, res))
      .catch(() => caches.match('index.html')))
  );
});
