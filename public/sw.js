// ═══════════════════════════════════════════════════════════════════════════
//  Kinzola Service Worker — Background push notifications with actions
//  Handles: notificationclick with action buttons (Répondre, Marqué comme lu, Silence)
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'kinzola-v1';

// Install — pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
        '/kinzola-logo.png',
      ]).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  Push event handler (for future real push notifications)
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, tag, conversationId, participantName } = data;

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag || `kinzola-msg-${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: { conversationId, participantName },
        actions: [
          { action: 'reply', title: 'Répondre' },
          { action: 'mark-read', title: 'Marqué comme lu' },
          { action: 'silence', title: 'Silence' },
        ],
      })
    );
  } catch (e) {
    // Fallback: show simple notification
    const body = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Kinzola', {
        body: body || 'Nouveau message',
        icon: '/favicon.ico',
      })
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  Notification click handler — handles action buttons
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const { conversationId, participantName } = data;

  if (action === 'silence') {
    // Just close the notification — already done above
    return;
  }

  if (action === 'mark-read') {
    // Focus the window and dispatch mark-read event
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients.length > 0) {
          const client = clients[0];
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: 'mark-read',
            conversationId,
          });
        }
      })
    );
    return;
  }

  // Default action (click on notification body) or 'reply'
  // Focus window and open chat / show reply input
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        const client = clients[0];
        client.focus();
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action === 'reply' ? 'reply' : 'open-chat',
          conversationId,
          participantName,
        });
      } else {
        // No open windows — open a new one
        const url = action === 'reply'
          ? `/?action=reply&conv=${conversationId}&name=${encodeURIComponent(participantName || '')}`
          : `/?action=open-chat&conv=${conversationId}`;
        self.clients.openWindow(url);
      }
    })
  );
});
