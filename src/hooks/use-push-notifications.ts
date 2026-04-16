'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushNotificationState {
  permission: NotificationPermissionStatus;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
}

interface PushNotificationActions {
  requestPermission: () => Promise<boolean>;
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, string>;
    actions?: Array<{ action: string; title: string }>;
  }) => Promise<void>;
  unregister: () => Promise<void>;
}

const usePushNotifications = (): PushNotificationState & PushNotificationActions => {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
  });

  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check support and current permission on mount
  useEffect(() => {
    const init = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;

      if (!supported) {
        setState({ permission: 'unsupported', isSupported: false, isSubscribed: false, isLoading: false });
        return;
      }

      // Register service worker
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        swRef.current = registration;
      } catch (err) {
        console.warn('[SW] Registration failed:', err);
      }

      const permission = Notification.permission as NotificationPermissionStatus;
      setState({
        permission,
        isSupported: true,
        isSubscribed: permission === 'granted',
        isLoading: false,
      });
    };

    init();
  }, []);

  // Listen for permission changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const handler = () => {
      const permission = Notification.permission as NotificationPermissionStatus;
      setState((prev) => ({
        ...prev,
        permission,
        isSubscribed: permission === 'granted',
      }));
    };

    // Notification permission changes don't fire an event in all browsers,
    // but we update state after requestPermission
    return () => {};
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';

      setState({
        permission: result as NotificationPermissionStatus,
        isSupported: true,
        isSubscribed: granted,
        isLoading: false,
      });

      return granted;
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const showNotification = useCallback(
    async (options: {
      title: string;
      body: string;
      icon?: string;
      tag?: string;
      data?: Record<string, string>;
      actions?: Array<{ action: string; title: string }>;
    }) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/kinzola-logo.png',
        badge: '/kinzola-logo.png',
        tag: options.tag || `kinzola-${Date.now()}`,
        silent: true,
        data: options.data || {},
        actions: options.actions || [],
      };

      // Try via service worker first (works even when app is in background)
      if (swRef.current) {
        try {
          await swRef.current.showNotification(options.title, notificationOptions);
          return;
        } catch {
          // Fallback to regular notification
        }
      }

      // Fallback: direct Notification API
      try {
        new Notification(options.title, notificationOptions);
      } catch {
        // Silently fail if blocked
      }
    },
    []
  );

  const unregister = useCallback(async () => {
    if (swRef.current) {
      try {
        await swRef.current.unregister();
        swRef.current = null;
      } catch {
        // Ignore
      }
    }
    setState({ permission: 'default', isSupported: false, isSubscribed: false, isLoading: false });
  }, []);

  return {
    ...state,
    requestPermission,
    showNotification,
    unregister,
  };
};

export default usePushNotifications;
