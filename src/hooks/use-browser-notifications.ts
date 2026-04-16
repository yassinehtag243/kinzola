'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

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
            vibrate: [200, 100, 200],
            tag: 'kinzola-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            ...options,
          });
        }).catch(() => {
          // Fallback to basic Notification if SW not ready
          const notif = new Notification(title, {
            icon: '/favicon.ico',
            vibrate: [200, 100, 200],
            tag: 'kinzola-' + Date.now(),
            renotify: true,
            ...options,
          });
          setTimeout(() => { notif.close(); }, 5000);
        });
      } else {
        // No Service Worker — fallback to basic Notification
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: 'kinzola-' + Date.now(),
          renotify: true,
          ...options,
        });
        setTimeout(() => { notif.close(); }, 5000);
      }
    } catch {
      // Notification API might fail in some contexts (iframe, etc.)
    }
  }, []);

  // Watch for new notifications and show browser notifications
  const notifications = useKinzolaStore((s) => s.notifications);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const currentCount = notifications.length;
    if (currentCount > prevCountRef.current && prevCountRef.current > 0) {
      // New notification arrived!
      const newNotif = notifications[0]; // Most recent
      if (newNotif && !newNotif.read) {
        const icon = NOTIFICATION_ICONS[newNotif.type] || NOTIFICATION_ICONS.default;
        showNotification(`${icon} ${newNotif.title}`, {
          body: newNotif.message,
          tag: `kinzola-notif-${newNotif.id}`,
        });
      }
    }
    prevCountRef.current = currentCount;
  }, [notifications, showNotification]);

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
          vibrate: [200, 100, 200],
          tag: `kinzola-msg-${conversationId}-${Date.now()}`,
          renotify: true,
          requireInteraction: true,
          data: { conversationId, participantName },
          actions: [
            { action: 'reply', title: 'Répondre' },
            { action: 'mark-read', title: 'Marqué comme lu' },
            { action: 'silence', title: 'Silence' },
          ],
        });
      }).catch(() => {
        // Fallback
        const notif = new Notification(title, { body, icon: icon || '/favicon.ico' });
        setTimeout(() => { notif.close(); }, 5000);
      });
    } else {
      const notif = new Notification(title, { body, icon: icon || '/favicon.ico' });
      setTimeout(() => { notif.close(); }, 5000);
    }
  } catch {
    // silent fail
  }
}
