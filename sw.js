// ============================================================
// ጽቡቕ ተኽሊ — Service Worker for Offline Support
// Caches everything on first visit, works fully offline after
// ============================================================

const CACHE_NAME = 'tsibuk-teklil-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/react.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/react-dom.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
];

// Install: cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets for offline use');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache any new successful requests for future offline use
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, show offline message
        if (event.request.destination === 'document') {
          return new Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#F0F7F0">' +
            '<h1>🌱 ጽቡቕ ተኽሊ</h1>' +
            '<p>ኦፍላይን — Offline</p>' +
            '<p>Please connect to the internet once to download the app, then it will work offline forever.</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      });
    })
  );
});
