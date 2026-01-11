
const CACHE_NAME = 'track-it-v12';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Immediately delete old caches to fix "stuck" versions
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Navigation (HTML) - Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status === 404) {
             throw new Error('Not found or 404');
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html')
            .then(cachedRes => cachedRes || caches.match('index.html'));
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images) - Cache First with Strict MIME Check
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
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // CRITICAL: Prevent caching HTML as JS
            const contentType = networkResponse.headers.get('content-type');
            if (event.request.destination === 'script') {
                if (contentType && (contentType.includes('text/html') || contentType.includes('application/json'))) {
                    // Do not cache this, do not return it. Let the browser fail correctly.
                    return networkResponse;
                }
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

  // 3. Default
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});