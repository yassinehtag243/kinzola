'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

/**
 * useBrowserNotifications
 *
 * Uses the Web Notification API to show real push-like notifications
 * on the phone when:
 *  - A new match occurs
 *  - An incoming message arrives
 *  - A new like/interest notification comes in
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
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: 'kinzola-' + Date.now(),
        renotify: true,
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notif.close();
      }, 5000);

      // Click on notification -> focus the window/tab
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
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
