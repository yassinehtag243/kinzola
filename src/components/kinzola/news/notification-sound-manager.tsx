'use client';

import { useEffect, useRef } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { useNotificationSound, getSoundType } from '@/hooks/use-notification-sound';
import type { Notification } from '@/types';

/**
 * NotificationSoundManager
 * Renders nothing visible. Listens for new notifications globally
 * and plays the appropriate sound based on notification type.
 * Place this component once in your app layout.
 */
export default function NotificationSoundManager() {
  const notifications = useKinzolaStore((s) => s.notifications);
  const prevCountRef = useRef(notifications.length);
  const { playNotificationSound } = useNotificationSound();

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = notifications.length;

    if (currentCount > prevCount) {
      const newNotification = notifications[0] as Notification | undefined;
      if (newNotification && !newNotification.read) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          playNotificationSound(newNotification.type, 0.5);
        }
      }
    }

    prevCountRef.current = currentCount;
  }, [notifications, playNotificationSound]);

  return null;
}
