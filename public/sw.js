// public/sw.js
const CACHE_NAME = 'qr-plus-cache-v2'; // Increment cache version if you change cached assets

// Add paths to critical assets for precaching if desired.
// For a Next.js app, this is often handled by PWA plugins,
// but for a manual setup, you'd list essential files.
const urlsToCache = [
  // Example:
  // '/menu/', 
  // '/offline.html', // If you have an offline fallback page
  // '/styles/globals.css', // Example, actual paths depend on your build output
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching initial assets');
      // Only add urlsToCache if it's not empty
      return urlsToCache.length > 0 ? cache.addAll(urlsToCache) : Promise.resolve();
    }).then(() => {
      return self.skipWaiting(); // Ensure new SW activates quickly
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of clients immediately
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to apply caching strategies to GET requests.
  // Non-GET requests (POST, PUT, etc.) should always go to the network.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-First Strategy for GET requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // console.log('[Service Worker] Returning from cache:', event.request.url);
        return cachedResponse;
      }

      // console.log('[Service Worker] Fetching from network:', event.request.url);
      return fetch(event.request).then((networkResponse) => {
        // Optional: Cache the new response if it's a successful GET request
        // Be careful about caching too aggressively, especially for dynamic content,
        // unless you have a specific strategy for updating it.
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // console.log('[Service Worker] Caching new response:', event.request.url);
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed for:', event.request.url, error);
        // Optional: Return an offline fallback page for navigation requests
        // if (event.request.mode === 'navigate' && urlsToCache.includes('/offline.html')) {
        //   return caches.match('/offline.html');
        // }
        // For other types of requests, or if no offline page, re-throw to show browser default.
        throw error;
      });
    })
  );
});
