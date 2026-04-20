// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Hook useRealtime
//
//  Orchestrateur central de toutes les souscriptions Supabase Realtime.
//  Gère les abonnements pour :
//    • Messages (conversation ouverte)
//    • Conversations (INSERT / UPDATE)
//    • Notifications (INSERT)
//    • Matches (INSERT)
//    • Presence online/hors ligne
//    • Heartbeat (mise à jour own online status)
//
//  Utilisation : <useRealtime /> dans AppShell (ou tout composant racine)
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import {
  subscribeToMessages,
  subscribeToConversations,
  subscribeToProfilePresence,
  updateOwnPresence,
} from '@/lib/supabase/messages-service';
import {
  subscribeToNotifications,
  type NotificationWithProfile,
} from '@/lib/supabase/notifications-service';
import {
  subscribeToMatches,
  type MatchWithProfile,
} from '@/lib/supabase/matches-service';
import type { MessageRow, ConversationRow } from '@/lib/supabase/database.types';
import { dbMessageToMessage, dbNotificationToNotification, dbMatchToMatch } from '@/lib/supabase/adapter';

// ─── Constants ─────────────────────────────────────────────────────────
/** Intervalle du heartbeat (mise à jour du statut en ligne) */
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 secondes

/**
 * Hook principal pour Supabase Realtime.
 *
 * Doit être monté UNE SEULE FOIS dans l'arbre React,
 * idéalement dans AppShell.
 *
 * Il gère automatiquement :
 *  - Souscription aux messages de la conversation ouverte
 *  - Souscription globale aux conversations
 *  - Souscription aux notifications entrantes
 *  - Souscription aux nouveaux matchs
 *  - Suivi du statut en ligne (presence + heartbeat)
 */
export function useRealtime() {
  const userId = useKinzolaStore((s) => s.user?.id);
  const isAuthenticated = useKinzolaStore((s) => s.isAuthenticated);
  const currentChatId = useKinzolaStore((s) => s.currentChatId);

  // Ref pour stocker les fonctions de cleanup
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Nettoyer toutes les souscriptions ───────────────────────────────
  const cleanupAll = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ─── 1. Souscription aux messages de la conversation ouverte ─────────
  useEffect(() => {
    // Se désabonner de la conversation précédente
    const msgUnsubs = unsubscribersRef.current.filter(
      (_, i) => unsubscribersRef.current[i]?.toString().includes('messages:')
    );
    // On va juste tout nettoyer et recréer ci-dessous

    if (!currentChatId || !userId) return;

    console.log('[Realtime] Abonnement aux messages:', currentChatId);

    const unsubscribe = subscribeToMessages(currentChatId, (message: MessageRow) => {
      const store = useKinzolaStore.getState();

      // Ne pas ajouter si c'est notre propre message (déjà ajouté via optimistic update)
      if (message.sender_id === userId) return;

      // Convertir le message DB → frontend
      const frontendMsg = dbMessageToMessage(message);
      // Résoudre le receiverId depuis la conversation
      const conv = store.conversations.find((c) => c.id === currentChatId);
      if (conv) {
        frontendMsg.receiverId = userId;
      }

      // Vérifier si le message n'est pas déjà dans la conversation
      // (évite les doublons si optimistic update a déjà ajouté le message)
      const existsInConv = conv?.messages.some((m) => m.id === message.id);
      if (existsInConv) return;

      // Mettre à jour la conversation dans le store
      const updatedConversations = store.conversations.map((c) => {
        if (c.id !== currentChatId) return c;
        return {
          ...c,
          messages: [...c.messages, frontendMsg],
          lastMessage:
            message.type === 'voice'
              ? '🎤 Message vocal'
              : message.type === 'image'
              ? '📷 Photo'
              : message.type === 'video'
              ? '🎬 Vidéo'
              : message.content.substring(0, 50),
          lastMessageTime: 'Maintenant',
          // Incrémenter unreadCount si on n'est PAS dans cette conversation
          unreadCount:
            store.currentChatId === currentChatId ? 0 : c.unreadCount + 1,
        };
      });
      useKinzolaStore.setState({ conversations: updatedConversations });

      console.log('[Realtime] Nouveau message reçu:', message.id);
    });

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribersRef.current = unsubscribersRef.current.filter(
        (fn) => fn !== unsubscribe
      );
    };
  }, [currentChatId, userId]);

  // ─── 2. Souscription globale aux conversations ───────────────────────
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    console.log('[Realtime] Abonnement aux conversations');

    const unsubscribe = subscribeToConversations(
      userId,
      (payload: { eventType: string; new: ConversationRow; old: ConversationRow }) => {
        const store = useKinzolaStore.getState();
        const conv = payload.new;

        // Déterminer le unread count pour cette conversation
        const unreadCount =
          conv.participant1_id === userId
            ? conv.participant1_unread
            : conv.participant2_unread;

        // Vérifier si la conversation existe déjà dans le store
        const existingIndex = store.conversations.findIndex(
          (c) => c.id === conv.id
        );

        if (existingIndex >= 0) {
          // UPDATE — mettre à jour la conversation existante
          const updated = [...store.conversations];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: conv.last_message,
            lastMessageTime: formatTimeAgo(conv.last_message_time),
            unreadCount: unreadCount ?? 0,
          };
          useKinzolaStore.setState({ conversations: updated });
        } else if (payload.eventType === 'INSERT') {
          // Nouvelle conversation — la recharger depuis Supabase
          // (pour avoir le profil du participant)
          console.log('[Realtime] Nouvelle conversation détectée:', conv.id);
          store.fetchAllData().catch(console.error);
        }
      }
    );

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribersRef.current = unsubscribersRef.current.filter(
        (fn) => fn !== unsubscribe
      );
    };
  }, [userId, isAuthenticated]);

  // ─── 3. Souscription aux notifications ───────────────────────────────
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    console.log('[Realtime] Abonnement aux notifications');

    const unsubscribe = subscribeToNotifications(
      userId,
      (notification: NotificationWithProfile) => {
        const store = useKinzolaStore.getState();
        const frontendNotif = dbNotificationToNotification(
          notification as any
        );

        // Ajouter la notification en haut de la liste
        useKinzolaStore.setState({
          notifications: [frontendNotif, ...store.notifications],
        });

        console.log('[Realtime] Nouvelle notification:', notification.type);
      }
    );

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribersRef.current = unsubscribersRef.current.filter(
        (fn) => fn !== unsubscribe
      );
    };
  }, [userId, isAuthenticated]);

  // ─── 4. Souscription aux matchs ──────────────────────────────────────
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    console.log('[Realtime] Abonnement aux matchs');

    const unsubscribe = subscribeToMatches(
      userId,
      (match: MatchWithProfile) => {
        const store = useKinzolaStore.getState();
        const frontendMatch = dbMatchToMatch(match, match.profile);

        // Vérifier si le match existe déjà
        const exists = store.matches.some((m) => m.id === match.id);
        if (exists) return;

        // Ajouter le nouveau match + afficher le modal avec le profil
        useKinzolaStore.setState({
          matches: [frontendMatch, ...store.matches],
          showMatchModal: true,
          matchProfile: frontendMatch.profile,
        });

        // Recharger les conversations pour inclure la conversation du match
        store.fetchAllData().catch(console.error);

        console.log('[Realtime] Nouveau match:', match.id);
      }
    );

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribersRef.current = unsubscribersRef.current.filter(
        (fn) => fn !== unsubscribe
      );
    };
  }, [userId, isAuthenticated]);

  // ─── 5. Presence — Suivi du statut en ligne ──────────────────────────
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    console.log('[Realtime] Abonnement presence');

    // Construire l'ensemble des IDs de contacts (conversations + matchs)
    const getContactIds = (): Set<string> => {
      const store = useKinzolaStore.getState();
      const ids = new Set<string>();
      store.conversations.forEach((c) => ids.add(c.participant.userId));
      store.matches.forEach((m) => ids.add(m.profile.userId));
      return ids;
    };

    const unsubscribe = subscribeToProfilePresence((payload) => {
      // Ne traiter que les changements de nos contacts (pas nous-même)
      if (payload.userId === userId) return;

      const contactIds = getContactIds();
      if (!contactIds.has(payload.userId)) return;

      const store = useKinzolaStore.getState();

      // Mettre à jour le statut dans les conversations
      const updatedConversations = store.conversations.map((c) => {
        if (c.participant.userId !== payload.userId) return c;
        return {
          ...c,
          online: payload.online,
          lastSeen: payload.lastSeen,
        };
      });

      // Mettre à jour le statut dans les matches
      const updatedMatches = store.matches.map((m) => {
        if (m.profile.userId !== payload.userId) return m;
        return {
          ...m,
          profile: {
            ...m.profile,
            online: payload.online,
            lastSeen: payload.lastSeen,
          },
        };
      });

      // Mettre à jour le statut dans les profils (discover)
      const updatedProfiles = store.profiles.map((p) => {
        if (p.userId !== payload.userId) return p;
        return {
          ...p,
          online: payload.online,
          lastSeen: payload.lastSeen,
        };
      });

      useKinzolaStore.setState({
        conversations: updatedConversations,
        matches: updatedMatches,
        profiles: updatedProfiles,
      });
    });

    unsubscribersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribersRef.current = unsubscribersRef.current.filter(
        (fn) => fn !== unsubscribe
      );
    };
  }, [userId, isAuthenticated]);

  // ─── 6. Heartbeat — Mettre à jour notre propre statut en ligne ───────
  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    // Mettre en ligne immédiatement
    updateOwnPresence(userId, true).catch(console.error);

    // Puis heartbeat toutes les 30s
    heartbeatRef.current = setInterval(() => {
      updateOwnPresence(userId, true).catch(console.error);
    }, HEARTBEAT_INTERVAL_MS);

    // Mettre hors ligne quand le composant est démonté ou l'utilisateur se déconnecte
    const handleBeforeUnload = () => {
      updateOwnPresence(userId, false).catch(console.error);
    };

    // Écouter visibilitychange (onglet en arrière-plan/avant-plan)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optionnel : on peut garder "online" même en arrière-plan
        // sur mobile c'est mieux de le garder true
      } else {
        updateOwnPresence(userId, true).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mettre hors ligne au démontage
      updateOwnPresence(userId, false).catch(console.error);
    };
  }, [userId, isAuthenticated]);

  // ─── Cleanup global ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Formater un timestamp ISO en texte relatif court */
function formatTimeAgo(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Maintenant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
