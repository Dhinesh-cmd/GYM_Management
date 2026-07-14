const CACHE_NAME = 'pulsegym-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/api.js',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network first, fallback to cache)
self.addEventListener('fetch', (e) => {
  // Only handle standard HTTP/S requests (ignore chrome-extension, etc)
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Clone and cache successful requests
        if (res.status === 200 && e.request.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push Event Listener (Display native OS notification)
self.addEventListener('push', (e) => {
  let data = {
    title: '🏋️ PulseGym Management',
    body: 'Membership update available.',
    icon: '/favicon.ico',
    url: '/'
  };

  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      // Fallback if data is raw text
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body,
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  if (data.icon) {
    options.icon = data.icon;
    options.badge = data.icon;
  }

  console.log('[Service Worker] Received push event, attempting to display notification:', data);

  e.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[Service Worker] Notification displayed successfully.'))
      .catch(err => {
        console.error('[Service Worker] Failed to display notification with icons, retrying fallback...', err);
        // Fallback without external icon dependencies
        delete options.icon;
        delete options.badge;
        return self.registration.showNotification(data.title, options)
          .then(() => console.log('[Service Worker] Fallback notification displayed successfully.'))
          .catch(fallbackErr => console.error('[Service Worker] Fallback notification also failed:', fallbackErr));
      })
  );
});

// Notification Click Event Listener (Open or focus app window)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  
  const targetUrl = e.notification.data && e.notification.data.url 
    ? new URL(e.notification.data.url, self.location.origin).href 
    : self.location.origin;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL and focus it
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
