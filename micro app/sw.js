const CACHE_NAME = 'microapps-hub-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './mobile.css',
  './icon-192.png',
  './icon-512.png',
  './01-interesse-composto/index.html',
  './02-planner-3task/index.html',
  './03-media-universitaria/index.html',
  './04-wifi-qrcode/index.html',
  './05-idratatore/index.html',
  './06-pomodoro/index.html',
  './07-linkbox/index.html',
  './08-gym-timer/index.html',
  './09-scratchpad/index.html',
  './10-autocompiler/index.html',
  './11-timeblocking/index.html',
  './12-timetosave/index.html',
  './13-smartshopping/index.html',
  './14-aiprompter/index.html',
  './15-valigia-zero-peso/index.html',
  './16-radar-scadenze/index.html',
  './17-trascrittore-audio/index.html',
  './18-matrix-tempo/index.html',
  './19-compattatore-bibliografia/index.html',
  './20-crypto-tracker/index.html',
  './21-workspace-launcher/index.html',
  './22-divisore-spese/index.html',
  './23-organizzatore-idee/index.html',
  './24-generatore-qrcode/index.html'
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
