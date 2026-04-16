'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendTextMessage,
  markMessagesAsRead,
  FirebaseConversation,
  FirebaseMessage,
} from './messaging-service';
import { getUserId } from './auth-service';
import { onFirebaseAuthChange } from './auth-service';
import { isFirebaseConfigured } from './config';

/**
 * Hook that bridges Firebase real-time messaging with Zustand store.
 * Call once at the top level (e.g., in messages-screen).
 * Falls back to demo mode when Firebase is not configured.
 */
export function useFirebaseMessaging() {
  const conversationsUnsubRef = useRef<(() => void) | null>(null);
  const firebaseConnectedRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo mode: don't connect to Firebase, let mock data flow
      console.log('📱 Kinzola: Messagerie en mode démo (données locales)');
      return;
    }

    const unsubscribe = onFirebaseAuthChange((user) => {
      if (!user) return;

      if (firebaseConnectedRef.current) return;
      firebaseConnectedRef.current = true;

      // Subscribe to conversations list
      const unsubConv = subscribeToConversations((firebaseConvs) => {
        // Map FirebaseConversation to app Conversation format
        const myId = user.uid;
        const mapped = firebaseConvs.map(fc => {
          const otherParticipantId = fc.participants.find((p: string) => p !== myId) || '';
          const otherName = fc.participantNames?.[otherParticipantId] || 'Utilisateur';
          const otherPhoto = fc.participantPhotos?.[otherParticipantId] || '';

          return {
            id: fc.id,
            matchId: fc.id,
            participant: {
              id: otherParticipantId,
              userId: otherParticipantId,
              name: otherName,
              photoUrl: otherPhoto,
              online: false,
              lastSeen: new Date().toISOString(),
              age: 0,
              gender: 'femme' as const,
              city: 'Kinshasa',
              profession: '',
              religion: '',
              bio: '',
              photoGallery: [],
              verified: false,
              interests: [],
            },
            messages: [], // Messages loaded separately when chat opens
            lastMessage: fc.lastMessage || '',
            lastMessageTime: formatFirebaseTime(fc.lastMessageTime),
            unreadCount: fc.unreadCount?.[myId] || 0,
            online: false,
            lastSeen: new Date().toISOString(),
          };
        });

        // Merge with mock conversations: keep Firebase ones, add mock ones
        const state = useKinzolaStore.getState();
        const mockConvs = state.conversations.filter(c => !mapped.find(m => m.id === c.id));
        useKinzolaStore.setState({ conversations: [...mapped, ...mockConvs] });
      });

      conversationsUnsubRef.current = unsubConv;
    });

    return () => {
      unsubscribe();
      conversationsUnsubRef.current?.();
    };
  }, []);
}

/**
 * Subscribe to messages of a specific conversation.
 * Call when opening a chat.
 */
export function useFirebaseChatMessages(conversationId: string | null) {
  useEffect(() => {
    if (!conversationId) return;
    if (!isFirebaseConfigured) return; // Demo mode: use local messages

    const unsub = subscribeToMessages(conversationId, (firebaseMsgs) => {
      // Map FirebaseMessage to app Message format
      const mappedMsgs = firebaseMsgs.map(fm => ({
        id: fm.id,
        senderId: fm.senderId,
        receiverId: '',
        content: fm.text || fm.imageUrl || fm.audioUrl || '',
        type: fm.type,
        read: fm.read,
        timestamp: formatFirebaseTimestamp(fm.createdAt),
      }));

      // Update the specific conversation's messages in Zustand
      const state = useKinzolaStore.getState();
      const updatedConvs = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: mappedMsgs,
          };
        }
        return conv;
      });
      useKinzolaStore.setState({ conversations: updatedConvs });
    });

    // Mark messages as read
    markMessagesAsRead(conversationId).catch(() => {});

    return () => {
      unsub();
    };
  }, [conversationId]);
}

/**
 * Send a text message via Firebase
 */
export async function firebaseSendMessage(
  conversationId: string,
  text: string,
): Promise<void> {
  if (!isFirebaseConfigured) return; // Demo mode: no-op
  await sendTextMessage(conversationId, text);
}

// ─── Time Formatting Helpers ───

function formatFirebaseTime(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return formatRelativeTime(date);
}

function formatFirebaseTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate ? timestamp.toDate().toISOString() : new Date(timestamp).toISOString();
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Maintenant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour}h`;
  if (diffDay === 1) return 'hier';
  return `il y a ${diffDay}j`;
}
