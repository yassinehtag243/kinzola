'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * useBrowserNotifications
 *
 * Uses the Web Notification API via Service Worker to show rich push-like
 * notifications with action buttons (Répondre, Marqué comme lu, Silence).
 *
 * These appear in the phone's notification center (Android/iOS) when the app
 * is installed as a PWA or running in the browser.
 */

const NOTIFICATION_ICONS: Record<string, string> = {
  match: '❤️',
  love_interest: '💕',
  friend_request: '🤝',
  message: '💬',
  default: '🔔',
};

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

    try {
      // Use Service Worker for rich notifications with actions
      if ('serviceWorker' in navigator && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'kinzola-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            silent: true,
            vibrate: [200, 100, 200],
            ...options,
          });
        }).catch(() => {
          // Fallback to basic Notification if SW not ready
          const notif = new Notification(title, {
            icon: '/favicon.ico',
            tag: 'kinzola-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            silent: true,
            vibrate: [200, 100, 200],
            ...options,
          });
          setTimeout(() => { notif.close(); }, 6000);
        });
      } else {
        // No Service Worker — fallback to basic Notification
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          tag: 'kinzola-' + Date.now(),
          renotify: true,
          requireInteraction: true,
          silent: true,
          vibrate: [200, 100, 200],
          ...options,
        });
        setTimeout(() => { notif.close(); }, 6000);
      }
    } catch {
      // Notification API might fail in some contexts (iframe, etc.)
    }
  }, []);

  // NOTE: The useEffect that watched notifications.length and auto-called showNotification
  // was removed to prevent duplicate system notifications. The store's simulateReply and
  // startRandomMessages already show their own Service Worker notifications directly.

  return { showNotification };
}

/**
 * Show a rich push notification via Service Worker with reply, mark-read, and silence actions.
 * This function can be called from anywhere (store, hooks, etc.) and uses the SW for
 * proper action button support.
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

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((reg) => {
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
        });
      }).catch(() => {
        // Fallback
        const notif = new Notification(title, { body, icon: icon || '/favicon.ico', silent: true, vibrate: [200, 100, 200] });
        setTimeout(() => { notif.close(); }, 6000);
      });
    } else {
      const notif = new Notification(title, { body, icon: icon || '/favicon.ico', silent: true, vibrate: [200, 100, 200] });
      setTimeout(() => { notif.close(); }, 6000);
    }
  } catch {
    // silent fail
  }
}
