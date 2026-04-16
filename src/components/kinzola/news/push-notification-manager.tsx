'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import usePushNotifications from '@/hooks/use-push-notifications';
import type { Notification } from '@/types';

/**
 * PushNotificationManager
 * Renders nothing visible. Watches the Zustand store for new notifications
 * and sends native browser push notifications.
 * Also requests notification permission on first user interaction.
 * Place this component once in your app layout.
 */
export default function PushNotificationManager() {
  const notifications = useKinzolaStore((s) => s.notifications);
  const isAuthenticated = useKinzolaStore((s) => s.isAuthenticated);
  const { permission, isSupported, showNotification, requestPermission } = usePushNotifications();
  const prevCountRef = useRef(notifications.length);
  const permissionRequestedRef = useRef(false);

  // Auto-request permission after login (on first interaction)
  const handleFirstInteraction = useCallback(() => {
    if (
      isSupported &&
      permission === 'default' &&
      !permissionRequestedRef.current &&
      isAuthenticated
    ) {
      permissionRequestedRef.current = true;
      // Small delay so it doesn't feel intrusive
      setTimeout(() => {
        requestPermission();
      }, 2000);
    }
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
  }, [isSupported, permission, requestPermission, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && permission === 'default') {
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    }
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isAuthenticated, permission, handleFirstInteraction]);

  // Watch for new notifications and send push notifications
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = notifications.length;

    if (currentCount > prevCount && permission === 'granted') {
      const newNotif = notifications[0] as Notification | undefined;
      if (newNotif && !newNotif.read) {
        sendPushForNotification(newNotif);
      }
    }

    prevCountRef.current = currentCount;
  }, [notifications, permission]);

  const sendPushForNotification = useCallback(
    async (notif: Notification) => {
      const iconUrl = notif.fromUserPhoto || '/kinzola-logo.png';

      // Determine actions based on notification type
      const actions: Array<{ action: string; title: string }> = [];
      if (notif.actionLabel) {
        actions.push({ action: 'open', title: notif.actionLabel });
      }
      actions.push({ action: 'dismiss', title: 'Fermer' });

      await showNotification({
        title: notif.title,
        body: notif.message,
        icon: iconUrl,
        tag: `kinzola-${notif.id}`,
        data: {
          url: notif.actionUrl || '/',
          notificationId: notif.id,
          type: notif.type,
        },
        actions,
      });
    },
    [showNotification]
  );

  return null;
}
