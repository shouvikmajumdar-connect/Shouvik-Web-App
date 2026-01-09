
const CACHE_NAME = 'track-it-v8';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
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
  // Navigation fallback strategy for SPA/PWA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the network request fails with 404, fallback to index.html (SPA routing)
          if (!response || response.status === 404) {
            return caches.match('index.html', { ignoreSearch: true });
          }
          return response;
        })
        .catch(() => {
          // If offline or network error, fallback to index.html
          return caches.match('index.html', { ignoreSearch: true });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});