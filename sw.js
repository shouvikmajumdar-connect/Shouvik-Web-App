
const CACHE_NAME = 'track-it-v9';
const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);

  // 1. Navigation (HTML) - Network First, fallback to cache, then fallback to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then(response => {
            if (response) return response;
            return caches.match('index.html', { ignoreSearch: true });
          });
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images) - Cache First, but update cache if found (Stale-While-Revalidate logic)
  // OR simpler: Dynamic Runtime Caching (Cache First, put in cache if missing)
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clone the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Default fallback
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});