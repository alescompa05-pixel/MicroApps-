const CACHE_NAME = 'microapps-hub-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Fase di Installazione: Salva in cache gli asset essenziali della shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache pre-caricata con successo.');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Fase di Attivazione: Pulisce eventuali vecchie versioni della cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Cancellazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fase di Intercettazione Richieste (Fetch)
self.addEventListener('fetch', (event) => {
  // Gestisce solo richieste GET standard (esclude POST, PUT, ecc. che la cache non supporta)
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Esclude schemi non HTTP (come estensioni di Chrome o file interni)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Spara una richiesta in rete in parallelo per aggiornare la cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Se la risposta di rete è valida, clona ed aggiorna la cache
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log('[Service Worker] Risorsa caricata offline (rete non disponibile) per:', url);
        });

      // Ritorna la risorsa caricata istantaneamente da cache, se presente, altrimenti aspetta la rete
      return cachedResponse || fetchPromise;
    })
  );
});
