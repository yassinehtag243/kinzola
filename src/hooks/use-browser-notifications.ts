'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * useBrowserNotifications
 *
 * Registers the Service Worker, requests notification permission,
 * and provides a showNotification function for rich push-like notifications.
 *
 * Notifications appear in the phone's notification center when the app
 * is installed as a PWA or running in the browser.
 */

export function useBrowserNotifications() {
  const permissionRef = useRef<NotificationPermission>('default');

  // Request permission on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    permissionRef.current = Notification.permission;

    if (Notification.permission === 'default') {
      // Delay permission request slightly so it doesn't interrupt first load
      const timer = setTimeout(() => {
        Notification.requestPermission().then((perm) => {
          permissionRef.current = perm;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const showFallback = () => {
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        tag: 'kinzola-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        silent: true,
        vibrate: [200, 100, 200],
        ...options,
      } as NotificationOptions & { renotify?: boolean; vibrate?: number[] });
      setTimeout(() => { notif.close(); }, 8000);
    };

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker) {
        const timeout = setTimeout(showFallback, 3000);
        navigator.serviceWorker.ready.then((reg) => {
          clearTimeout(timeout);
          try {
            reg.showNotification(title, {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'kinzola-' + Date.now(),
              renotify: true,
              requireInteraction: true,
              silent: true,
              vibrate: [200, 100, 200],
              ...options,
            } as NotificationOptions & { renotify?: boolean; vibrate?: number[] });
          } catch { showFallback(); }
        }).catch(() => { clearTimeout(timeout); showFallback(); });
      } else {
        showFallback();
      }
    } catch {
      // Notification API might fail in some contexts
    }
  }, []);

  return { showNotification };
}

/**
 * Show a rich push notification via Service Worker with reply, mark-read, and silence actions.
 */
export function showMessageNotification(
  title: string,
  body: string,
  conversationId: string,
  participantName: string,
  icon?: string,
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const showFallback = () => {
    const notif = new Notification(title, { body, icon: icon || '/favicon.ico', silent: true, vibrate: [200, 100, 200] } as NotificationOptions & { vibrate?: number[] });
    setTimeout(() => { notif.close(); }, 8000);
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      const timeout = setTimeout(showFallback, 3000);
      navigator.serviceWorker.ready.then((reg) => {
        clearTimeout(timeout);
        try {
          reg.showNotification(title, {
            body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: `kinzola-msg-${conversationId}-${Date.now()}`,
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
          } as any);
        } catch { showFallback(); }
      }).catch(() => { clearTimeout(timeout); showFallback(); });
    } else {
      showFallback();
    }
  } catch {
    // silent fail
  }
}
