const CACHE_NAME = 'pwa-commerce-v1';
const STATIC_ASSETS = [
  import.meta.env.BASE_URL,
  `${import.meta.env.BASE_URL}index.html`,
  `${import.meta.env.BASE_URL}vite.svg`,
  `${import.meta.env.BASE_URL}parts.json`
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For JSON data, use stale-while-revalidate strategy
  if (event.request.url.includes('parts.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Update the cache with the fresh data
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => {
            // If network fails, use cached data
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // For other requests, use network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response for future
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// Function to handle cart synchronization
async function syncCart() {
  try {
    // Get pending cart operations from IndexedDB
    const pendingOperations = await getPendingCartOperations();
    
    if (pendingOperations && pendingOperations.length > 0) {
      // Process each pending operation
      for (const operation of pendingOperations) {
        await sendToServer(operation);
      }
      
      // Clear processed operations
      await clearPendingOperations();
      
      // Notify the user that sync is complete
      self.registration.showNotification('Cart Synchronized', {
        body: 'Your cart has been synchronized with the server.',
        icon: '/vite.svg'
      });
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Mock functions for IndexedDB operations (to be implemented)
async function getPendingCartOperations() {
  // In a real app, this would retrieve data from IndexedDB
  return [];
}

async function clearPendingOperations() {
  // In a real app, this would clear processed operations from IndexedDB
}

async function sendToServer(operation) {
  // In a real app, this would send data to your server
  console.log('Syncing operation:', operation);
}

// Push Notifications
self.addEventListener('push', (event) => {
  let notification = {
    title: 'PWA Commerce',
    body: 'New notification',
    icon: '/vite.svg',
    data: {
      url: self.location.origin
    }
  };

  // If we have data in the push event
  if (event.data) {
    try {
      notification = { ...notification, ...JSON.parse(event.data.text()) };
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      data: notification.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
}); 
