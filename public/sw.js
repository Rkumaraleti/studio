// public/sw.js
self.addEventListener('install', (event) => {
  console.log('QR Plus Service Worker: Installing...');
  // Pre-caching essential assets (optional, but good for app shell)
  // Example:
  // event.waitUntil(
  //   caches.open('qrplus-cache-v1').then((cache) => {
  //     return cache.addAll([
  //       '/menu/', // A generic shell for the menu section
  //       '/manifest.json',
  //       // Add other critical assets like global CSS, main JS bundles if names are static
  //     ]);
  //   })
  // );
  self.skipWaiting(); // Ensures the new service worker activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('QR Plus Service Worker: Activating...');
  // Clean up old caches (optional, but good practice)
  // Example:
  // const currentCacheName = 'qrplus-cache-v1';
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.filter((cacheName) => cacheName !== currentCacheName)
  //                 .map((cacheName) => caches.delete(cacheName))
  //     );
  //   })
  // );
  event.waitUntil(self.clients.claim()); // Allows the activated SW to control clients immediately
});

self.addEventListener('fetch', (event) => {
  // This is a basic fetch handler.
  // For a truly offline-first PWA, you would implement caching strategies here.
  // For example, network-first, then cache, or cache-first for static assets.
  // This simple version attempts to fetch from the network.
  // It's often enough to satisfy the "has a fetch handler" PWA installability requirement.
  // console.log('QR Plus Service Worker: Fetching ', event.request.url);
  event.respondWith(fetch(event.request).catch(() => {
    // Basic fallback: if network fails, and if you had an offline page cached:
    // return caches.match('/offline.html'); 
    // For now, just let the network failure propagate if not handled by a more specific cache strategy.
    // This mainly serves to make the PWA installable.
    // If you want to ensure the page loads even if the SW fetch fails,
    // you might just return fetch(event.request) without try-catch or respondWith for GET requests.
    // However, respondWith is generally expected for a fetch handler.
  }));
});
