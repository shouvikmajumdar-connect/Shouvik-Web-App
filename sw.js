
const CACHE_NAME = 'track-it-v10';
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
  // 1. Navigation (HTML) - Network First, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if valid response (200 OK). 
          // Render.com or other static hosts might return 404 for /index.html if configured for clean URLs.
          // If 404, we want to fallback to the cached index.html.
          if (!response || response.status === 404) {
             throw new Error('Not found or 404');
          }
          return response;
        })
        .catch(() => {
          // Fallback to index.html from cache
          return caches.match('index.html', { ignoreSearch: true })
            .then(cachedRes => {
                if (cachedRes) return cachedRes;
                // If index.html isn't in cache (rare), try matching the request (e.g. '/')
                return caches.match('./', { ignoreSearch: true });
            });
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images) - Cache First, Network fallback, then update cache
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
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
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
