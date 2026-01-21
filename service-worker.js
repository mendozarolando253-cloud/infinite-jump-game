const CACHE_NAME = 'infinite-jump-pwa-v1';
const urlsToCache = [
  '/infinite-jump-game/',
  '/infinite-jump-game/index.html',
  '/infinite-jump-game/style.css',
  '/infinite-jump-game/game.js',
  '/infinite-jump-game/manifest.json',
  '/infinite-jump-game/service-worker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Manejar todas las rutas, especialmente para PWA instalada
  const requestUrl = new URL(event.request.url);

  // Si es una navegación (página HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/infinite-jump-game/index.html')
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => {
          return caches.match('/infinite-jump-game/index.html');
        })
    );
    return;
  }

  // Para otros recursos (CSS, JS, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        // Si no está en cache, hacer fetch
        return fetch(event.request)
          .then(response => {
            // Verificar respuesta válida
            if (!response || response.status !== 200) {
              return response;
            }

            // Guardar en cache para próxima vez
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            // Para recursos específicos, intentar rutas alternativas
            if (event.request.url.includes('.css')) {
              return caches.match('/infinite-jump-game/style.css');
            }
            if (event.request.url.includes('.js')) {
              return caches.match('/infinite-jump-game/game.js');
            }
          });
      })
  );
});