// This function registers the service worker
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Setup for push notifications
          setupPushNotifications(registration);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the updated precached content has been fetched,
                  // but the previous service worker will still serve the older
                  // content until all client tabs are closed.
                  console.log('New content is available and will be used when all tabs for this page are closed.');
                } else {
                  // At this point, everything has been precached.
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

// This function unregisters the service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Setup push notifications
function setupPushNotifications(registration) {
  // Check if push is supported
  if (!('PushManager' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  // Request permission for notifications
  Notification.requestPermission().then(permission => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Subscribe to push notifications
    // In a real app, you would send this subscription to your server
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // Replace with your VAPID public key in a real application
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      )
    }).then(subscription => {
      console.log('User is subscribed to push notifications:', subscription);
      // In a real app, you would send this subscription to your server
    }).catch(error => {
      console.error('Failed to subscribe to push notifications:', error);
    });
  });
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to request background sync
export function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(registration => {
        return registration.sync.register('sync-cart');
      })
      .then(() => {
        console.log('Background sync registered!');
      })
      .catch(err => {
        console.error('Background sync registration failed:', err);
      });
  } else {
    console.log('Background sync not supported');
  }
} 