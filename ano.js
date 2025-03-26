// service-worker.js
const CACHE_NAME = 'ecommerce-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event: Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and Chrome extensions
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request is successful, cache and return response
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        }
        // If network request fails, try cache
        return caches.match(event.request);
      })
      .catch(() => {
        // If both network and cache fail, return offline page
        return caches.match('/offline.html');
      })
  );
});

// Background Sync Event: Handle failed product add-to-cart requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(
      syncCartItems()
    );
  }
});

// Sync Cart Items Function
async function syncCartItems() {
  try {
    // Retrieve pending cart items from IndexedDB or localStorage
    const pendingItems = await getPendingCartItems();
    
    for (let item of pendingItems) {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        // Remove item from pending list
        await removePendingCartItem(item);
      }
    }
  } catch (error) {
    console.error('Cart sync failed:', error);
  }
}

// Push Event: Handle product notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Open product or sale page if exists
      if (clientList.length > 0) {
        const client = clientList[0];
        client.navigate(event.notification.data.url || '/deals');
        client.focus();
      } else {
        // Open new window if no existing clients
        clients.openWindow('/deals');
      }
    })
  );
});

// Placeholder functions (to be implemented with actual storage mechanism)
async function getPendingCartItems() {
  // Implement retrieval from IndexedDB or localStorage
  return [];
}

async function removePendingCartItem(item) {
  // Implement removal from IndexedDB or localStorage
  return true;
}

