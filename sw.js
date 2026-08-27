const CACHE_NAME = 'jbsports-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para el shell de la app; red normal (sin interceptar) para las
// llamadas a las APIs (TheSportsDB, football-data.org vía Worker, etc.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAppShell = APP_SHELL.some((p) => url.pathname.endsWith(p.replace('./', '/')));
  if (!isAppShell) return; // deja pasar todo lo demás (APIs) directo a la red

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
