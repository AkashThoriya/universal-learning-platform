/**
 * @fileoverview Advanced Service Worker for Exam Strategy Engine PWA
 * 
 * Implements sophisticated caching strategies for optimal offline experience:
 * - App Shell caching for instant loading
 * - API response caching with TTL
 * - Background sync for data synchronization
 * - Push notification handling
 * - Performance optimization
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'exam-strategy-engine-v1';
const API_CACHE_NAME = 'exam-strategy-api-v1';
const STATIC_CACHE_NAME = 'exam-strategy-static-v1';
const DYNAMIC_CACHE_NAME = 'exam-strategy-dynamic-v1';

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 24 * 60 * 60 * 1000, // 1 day
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/micro-learning',
  '/missions',
  '/analytics',
  '/subjects',
  '/syllabus',
  '/login',
  '/onboarding',
  '/manifest.json',
  '/offline',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/user',
  '/api/missions',
  '/api/micro-learning',
  '/api/analytics',
  '/api/subjects',
  '/api/progress',
];

// Network-first URLs (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/auth/,
  /\/api\/real-time/,
  /\/api\/live/,
  /firebase/,
];

// Cache-first URLs (serve from cache if available)
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static/,
  /\/icons\//,
  /\/images\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:css|js|woff|woff2|ttf|eot)$/,
];

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener('install', (event) => {
  // console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        // console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// ============================================================================
// ACTIVATION
// ============================================================================

self.addEventListener('activate', (event) => {
  // console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize background sync
      initializeBackgroundSync(),
    ])
  );
});

// ============================================================================
// FETCH HANDLING WITH SMART CACHING
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetchRequest(request));
});

async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Network-first strategy for real-time data
    if (isNetworkFirst(url)) {
      return await networkFirstStrategy(request);
    }
    
    // 2. Cache-first strategy for static assets
    if (isCacheFirst(url)) {
      return await cacheFirstStrategy(request);
    }
    
    // 3. API requests - stale-while-revalidate
    if (isApiRequest(url)) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // 4. Navigation requests - app shell with fallback
    if (request.mode === 'navigate') {
      return await navigationStrategy(request);
    }
    
    // 5. Default: network with cache fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('[ServiceWorker] Fetch error:', error);
    return await getCachedResponseOrOfflinePage(request);
  }
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = parseInt(cachedResponse.headers.get('sw-cache-time') || '0');
    const now = Date.now();
    
    if (now - cacheTime < CACHE_DURATION.STATIC) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const responseToCache = networkResponse.clone();
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-time', Date.now().toString());
        
        const responseWithTimestamp = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });
        
        cache.put(request, responseWithTimestamp);
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Check if cache is stale
    const cacheTime = parseInt(cachedResponse.headers.get('sw-cache-time') || '0');
    const now = Date.now();
    
    if (now - cacheTime < CACHE_DURATION.API) {
      return cachedResponse;
    }
    
    // Cache is stale, but return it while fetching fresh data
    fetchPromise.then(() => {
      // Notify clients about fresh data
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            url: request.url
          });
        });
      });
    });
    
    return cachedResponse;
  }
  
  // No cached response, wait for network
  return await fetchPromise || new Response('Network error', { status: 503 });
}

async function navigationStrategy(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to app shell or offline page
    return await caches.match('/') || await caches.match('/offline');
  }
}

async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname + url.search));
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

async function getCachedResponseOrOfflinePage(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return await caches.match('/offline') || new Response('Offline', { status: 503 });
  }
  
  return new Response('Resource not available offline', { status: 503 });
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        // console.log('[ServiceWorker] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

async function initializeBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    // console.log('[ServiceWorker] Background sync supported');
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-missions') {
    event.waitUntil(syncMissionsData());
  } else if (event.tag === 'background-sync-progress') {
    event.waitUntil(syncProgressData());
  } else if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

async function syncMissionsData() {
  try {
    // Get pending mission data from IndexedDB
    const pendingData = await getPendingMissionsData();
    
    for (const data of pendingData) {
      await fetch('/api/missions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    // Clear pending data after successful sync
    await clearPendingMissionsData();
    
    // Notify clients about successful sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: 'missions'
        });
      });
    });
    
  } catch (error) {
    console.error('[ServiceWorker] Mission sync failed:', error);
  }
}

async function syncProgressData() {
  try {
    const pendingData = await getPendingProgressData();
    
    for (const data of pendingData) {
      await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    await clearPendingProgressData();
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: 'progress'
        });
      });
    });
    
  } catch (error) {
    console.error('[ServiceWorker] Progress sync failed:', error);
  }
}

async function syncAnalyticsData() {
  try {
    const pendingData = await getPendingAnalyticsData();
    
    for (const data of pendingData) {
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    await clearPendingAnalyticsData();
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: 'analytics'
        });
      });
    });
    
  } catch (error) {
    console.error('[ServiceWorker] Analytics sync failed:', error);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: data.tag ?? 'default',
    renotify: true,
    requireInteraction: data.requireInteraction ?? false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  if (action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          if (data && data.url) {
            client.postMessage({
              type: 'NAVIGATE',
              url: data.url
            });
          }
          return;
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        const url = data && data.url ? data.url : '/';
        return self.clients.openWindow(url);
      }
    })
  );
});

// ============================================================================
// INDEXEDDB HELPERS (Placeholder - implement based on your data structure)
// ============================================================================

async function getPendingMissionsData() {
  // Implement IndexedDB query to get pending mission data
  return [];
}

async function clearPendingMissionsData() {
  // Implement IndexedDB clear operation
}

async function getPendingProgressData() {
  // Implement IndexedDB query to get pending progress data
  return [];
}

async function clearPendingProgressData() {
  // Implement IndexedDB clear operation
}

async function getPendingAnalyticsData() {
  // Implement IndexedDB query to get pending analytics data
  return [];
}

async function clearPendingAnalyticsData() {
  // Implement IndexedDB clear operation
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload.cacheName));
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    default:
      // console.log('[ServiceWorker] Unknown message type:', type);
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  return caches.delete(cacheName);
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

// console.log('[ServiceWorker] Service Worker loaded and ready!');
