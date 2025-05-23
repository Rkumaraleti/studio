
// public/sw.js
const CACHE_NAME = 'qr-plus-cache-v1';
// Add any assets here that you want to cache during the install phase
const PRECACHE_ASSETS = [
  '/manifest.json',
  // Add paths to your PWA icons if you want them pre-cached
  // '/icon-192x192.png',
  // '/icon-512x512.png',
  // '/apple-touch-icon.png',
  // Add shell pages if desired, e.g., '/menu/' if you have a generic shell
];

self.addEventListener('install', (event) => {
  console.log('QR Plus Service Worker: Installing...');
  // event.waitUntil(
  //   caches.open(CACHE_NAME).then((cache) => {
  //     console.log('QR Plus Service Worker: Caching pre-cache assets');
  //     return cache.addAll(PRECACHE_ASSETS);
  //   })
  // );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('QR Plus Service Worker: Activating...');
  // Clean up old caches if necessary
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.map((cacheName) => {
  //         if (cacheName !== CACHE_NAME) {
  //           console.log('QR Plus Service Worker: Deleting old cache', cacheName);
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  // Take control of all clients as soon as the SW activates.
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Log all fetch requests handled by the service worker
  console.log(`QR Plus Service Worker: Fetching ${event.request.method} ${event.request.url}`);

  // Basic pass-through fetch strategy (network first).
  // For offline capabilities, you would implement more sophisticated caching strategies here.
  // Example: Network falling back to cache, or cache first then network.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // You could cache successful GET requests here if desired
        // if (response.ok && event.request.method === 'GET') {
        //   const responseToCache = response.clone();
        //   caches.open(CACHE_NAME).then((cache) => {
        //     cache.put(event.request, responseToCache);
        //   });
        // }
        return response;
      })
      .catch((error) => {
        // If the network request fails, you might want to serve a fallback page or resource from cache
        console.error('QR Plus Service Worker: Fetch error:', error);
        // Example: return caches.match('/offline.html');
        // For now, just re-throw the error to let the browser handle it (e.g., show offline page)
        throw error;
      })
  );
});
