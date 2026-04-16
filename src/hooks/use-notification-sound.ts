'use client';

import { useCallback, useRef } from 'react';

// Pre-define notification sound types
export type NotificationSoundType = 'default' | 'match' | 'like' | 'message' | 'badge';

// Map sound types to their file paths
const SOUND_FILES: Record<NotificationSoundType, string> = {
  default: '/sounds/notification-default.wav',
  match: '/sounds/notification-match.wav',
  like: '/sounds/notification-like.wav',
  message: '/sounds/notification-message.wav',
  badge: '/sounds/notification-badge.wav',
};

// Sound type to notification type mapping
export function getSoundType(notifType: string): NotificationSoundType {
  switch (notifType) {
    case 'match':
    case 'love_interest':
      return 'match';
    case 'like':
      return 'like';
    case 'message':
      return 'message';
    case 'comment_mention':
    case 'mention':
      return 'message';
    case 'badge_obtained':
      return 'badge';
    default:
      return 'default';
  }
}

// Play notification sound with optional volume control
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayRef = useRef<number>(0);

  const playSound = useCallback((soundType: NotificationSoundType = 'default', volume = 0.6) => {
    try {
      // Prevent sound spam (minimum 500ms between plays)
      const now = Date.now();
      if (now - lastPlayRef.current < 500) return;
      lastPlayRef.current = now;

      // Create new audio instance
      const audio = new Audio(SOUND_FILES[soundType]);
      audio.volume = volume;
      audio.preload = 'auto';

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioRef.current = audio;

      audio.play().catch(() => {
        // Silently fail if browser blocks autoplay
        // This is common on first user interaction requirement
      });
    } catch {
      // Silently fail
    }
  }, []);

  const playNotificationSound = useCallback((notifType: string, volume?: number) => {
    const soundType = getSoundType(notifType);
    playSound(soundType, volume);
  }, [playSound]);

  return { playSound, playNotificationSound };
}
