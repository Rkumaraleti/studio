// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Optionally, tell the new service worker to take over immediately
  // event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Optionally, claim clients immediately
  // event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching', event.request.url);
  // For now, just pass through network requests.
  // More advanced caching strategies can be added later for offline capabilities.
  event.respondWith(fetch(event.request));
});
