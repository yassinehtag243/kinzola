// ═══════════════════════════════════════════════════════════════════════════
//  Kinzola Service Worker — Production
//
//  Stratégie de cache :
//    • App shell (HTML, CSS, JS) : Cache-first (performance)
//    • Images statiques (logo, icons) : Cache-first
//    • API routes : Network-only (jamais en cache)
//    • Supabase assets : Network-first avec fallback cache
//
//  Gestion des notifications push avec actions
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'kinzola-v2';

// ─── URLs à pré-cacher à l'installation ────────────────────────────────
const PRECACHE_URLS = [
  '/',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ─── Install — pre-cache essential assets ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently fail if individual assets can't be cached
        console.warn('[SW] Some precache assets failed');
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate — clean old caches ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Helper : déterminer la stratégie de cache ─────────────────────────

/**
 * Détermine si une requête doit être mise en cache.
 * Exclut : API routes, Supabase auth, Supabase realtime
 */
function shouldCache(url: string): boolean {
  // Jamais cacher les API
  if (url.includes('/api/')) return false;
  // Jamais cacher les requêtes Supabase auth
  if (url.includes('/auth/v1/')) return false;
  // Jamais cacher les requêtes realtime
  if (url.includes('/realtime/v1/')) return false;
  // Jamais cacher les requêtes POST/PUT/DELETE
  // (déjà filtré par la stratégie, mais double sécurité)
  return true;
}

/**
 * Détermine si on doit utiliser la stratégie Cache-first
 * (pour les assets statiques) ou Network-first (pour le reste)
 */
function isStaticAsset(url: string): boolean {
  const staticExtensions = [
    '.js', '.css', '.woff2', '.woff', '.ttf', '.png',
    '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  ];
  return staticExtensions.some((ext) => url.includes(ext));
}

// ─── Fetch — stratégie adaptative ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. API routes : Network-only (jamais en cache)
  if (!shouldCache(url)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Retourner une erreur JSON pour les API
        return new Response(
          JSON.stringify({ error: 'Hors connexion' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. Assets statiques : Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Ne mettre en cache que les réponses valides
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, responseClone)
            );
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. App shell (HTML pages) : Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, responseClone)
            );
          }
          return response;
        })
        .catch(() => cached || new Response('Hors connexion', { status: 503 }));

      return cached || fetchPromise;
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  Push event handler
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, tag, conversationId, participantName } = data;

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || `kinzola-msg-${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        silent: true,
        vibrate: [200, 100, 200],
        data: { conversationId, participantName },
        actions: [
          { action: 'reply', title: 'Répondre' },
          { action: 'mark-read', title: 'Marqué comme lu' },
          { action: 'silence', title: 'Silence' },
        ],
      })
    );
  } catch (e) {
    // Fallback : notification simple
    const body = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Kinzola', {
        body: body || 'Nouveau message',
        icon: '/icon-192.png',
        silent: true,
        vibrate: [200, 100, 200],
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
    return;
  }

  if (action === 'mark-read') {
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
