
const CACHE_NAME = 'track-it-v11';
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
  const url = new URL(event.request.url);

  // 1. Navigation (HTML) - Network First, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if valid response (200 OK).
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
                return caches.match('./', { ignoreSearch: true });
            });
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images) - Cache First, Network fallback
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
            // Strict check: DO NOT cache or return 404s or HTML for scripts
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Extra safety: Don't cache if content-type is html for a script request
            const contentType = networkResponse.headers.get('content-type');
            if (event.request.destination === 'script' && contentType && contentType.includes('text/html')) {
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