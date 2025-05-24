
const CACHE_NAME = 'qr-plus-cache-v1.3'; // Incremented version
const urlsToCache = [
  '/',
  // Add other critical assets like main JS/CSS bundles if known and static
  // For Next.js, this is more complex due to hashed filenames.
  // The runtime caching below is generally more effective for dynamic Next.js apps.
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache, caching initial assets:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] All initial assets cached. Activating new service worker immediately.');
        return self.skipWaiting(); // Activate new SW immediately
      })
      .catch(error => {
        console.error('[SW] Failed to cache initial assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Clients claimed.');
      return self.clients.claim(); // Take control of open clients
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') {
    // console.log('[SW] Ignoring non-GET request:', event.request.method, event.request.url);
    return;
  }

  // Strategy: Cache, falling back to network, then update cache.
  // Good for app shell and API calls you want to cache.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200) {
            // For basic types and non-opaque responses (to avoid caching errors for cross-origin no-cors requests)
             if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                // console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, networkResponse.clone());
             }
          } else if (networkResponse && networkResponse.status !== 0) { // status 0 for opaque responses (no-cors)
            console.warn('[SW] Network response was not ok:', networkResponse.status, event.request.url);
          }
          return networkResponse;
        }).catch(error => {
          console.warn('[SW] Network request failed for:', event.request.url, error);
          // If network fails, and it wasn't in cache, this will naturally fail.
          // If it was in cache, cachedResponse would have been returned.
          // We could return a custom offline page here if cachedResponse is also null
          // return cachedResponse || caches.match('/offline.html'); // Example offline page
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
