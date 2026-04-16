// ─── Kinzola Service Worker — Push Notifications ───

const KINZOLA_CACHE = 'kinzola-v2';

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(KINZOLA_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/kinzola-logo.png',
        '/logo.svg',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== KINZOLA_CACHE).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(KINZOLA_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If navigating, return cached index
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ─── Push Notification Handler ───
self.addEventListener('push', (event) => {
  let data = {
    title: 'Kinzola',
    body: 'Vous avez une nouvelle notification',
    icon: '/kinzola-logo.png',
    badge: '/kinzola-logo.png',
    tag: 'kinzola-notification',
    data: {
      url: '/',
    },
  };

  if (event.data) {
    try {
      const parsed = JSON.parse(event.data.text());
      data = { ...data, ...parsed };
    } catch (e) {
      // If not JSON, use text as body
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'kinzola-notification',
      silent: true,
      data: data.data || {},
      actions: data.actions || [],
    })
  );
});

// ─── Notification Click Handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});
