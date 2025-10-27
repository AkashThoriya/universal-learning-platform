/**
 * @fileoverview Minimal Service Worker
 * PWA functionality is currently disabled for performance optimization.
 */

// Minimal service worker that does nothing
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simply pass through all requests without caching
  event.respondWith(fetch(event.request));
});