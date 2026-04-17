// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Messagerie (Messages & Conversations)
//
//  Toutes les opérations CRUD pour la messagerie :
//  - Conversations avec infos du participant
//  - Envoi / suppression / marquage des messages
//  - Abonnements Realtime pour les nouveaux messages
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type {
  ConversationRow,
  MessageRow,
  MessageType,
  Profile,
} from '@/lib/supabase/database.types';

// ─── Types utilitaires ───────────────────────────────────────────────────

/** Conversation enrichie avec le profil de l'autre participant */
export interface ConversationWithParticipant extends ConversationRow {
  participant: Pick<
    Profile,
    'id' | 'pseudo' | 'photo_url' | 'online' | 'last_seen' | 'age'
  >;
  /** Nombre de messages non lus pour l'utilisateur courant */
  unread_count: number;
}

/** Callback Realtime pour les nouveaux messages */
export type MessageCallback = (message: MessageRow) => void;

/** Callback Realtime pour les mises à jour de conversation */
export type ConversationCallback = (payload: {
  eventType: string;
  new: ConversationRow;
  old: ConversationRow;
}) => void;

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class MessageServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MessageServiceError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer toutes les conversations d'un utilisateur.
 * Joint le profil de l'autre participant, le statut en ligne,
 * et le nombre de messages non lus.
 */
export async function getConversations(
  userId: string
): Promise<ConversationWithParticipant[]> {
  // Récupère les conversations où l'utilisateur est participant
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('last_message_time', { ascending: false });

  if (convError) {
    throw new MessageServiceError(
      'Impossible de charger les conversations',
      convError
    );
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  // Pour chaque conversation, récupérer le profil de l'autre participant
  const enrichedConversations: ConversationWithParticipant[] = [];

  for (const conv of conversations) {
    const otherUserId =
      conv.participant1_id === userId
        ? conv.participant2_id
        : conv.participant1_id;

    const unreadCount =
      conv.participant1_id === userId
        ? conv.participant1_unread
        : conv.participant2_unread;

    const { data: participant, error: profileError } = await supabase
      .from('profiles')
      .select('id, pseudo, photo_url, online, last_seen, age')
      .eq('id', otherUserId)
      .single();

    if (profileError) {
      console.warn(
        `Impossible de charger le profil du participant ${otherUserId}`,
        profileError
      );
      continue; // Skip cette conversation si le profil n'est pas trouvé
    }

    enrichedConversations.push({
      ...conv,
      participant: participant!,
      unread_count: unreadCount ?? 0,
    });
  }

  return enrichedConversations;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer tous les messages d'une conversation.
 * Filtre les messages supprimés pour l'utilisateur courant.
 */
export async function getMessages(
  conversationId: string,
  userId: string
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .or(
      // Message pas supprimé du tout, ou supprimé seulement pour l'autre
      `and(deleted_for_sender.eq.false,deleted_for_receiver.eq.false),` +
        `and(sender_id.eq.${userId},deleted_for_sender.eq.false,deleted_for_receiver.eq.true),` +
        `and(sender_id.neq.${userId},deleted_for_sender.eq.true,deleted_for_receiver.eq.false)`
    )
    .order('created_at', { ascending: true });

  if (error) {
    throw new MessageServiceError(
      'Impossible de charger les messages',
      error
    );
  }

  return data ?? [];
}

/**
 * Envoyer un nouveau message dans une conversation.
 * Le trigger Supabase met à jour la conversation automatiquement.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  type: MessageType = 'text'
): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
      read: false,
      important: false,
      deleted_for_sender: false,
      deleted_for_receiver: false,
    })
    .select()
    .single();

  if (error) {
    throw new MessageServiceError(
      "Impossible d'envoyer le message",
      error
    );
  }

  return data;
}

/**
 * Envoyer un message en réponse à un autre message.
 * Lie la réponse au message original via reply_to_id.
 */
export async function sendReplyMessage(
  conversationId: string,
  senderId: string,
  content: string,
  replyToId: string
): Promise<MessageRow> {
  // Vérifier que le message parent existe et appartient à la conversation
  const { data: parentMessage, error: parentError } = await supabase
    .from('messages')
    .select('id')
    .eq('id', replyToId)
    .eq('conversation_id', conversationId)
    .single();

  if (parentError || !parentMessage) {
    throw new MessageServiceError(
      'Message de référence introuvable',
      parentError
    );
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type: 'text' as MessageType,
      read: false,
      important: false,
      deleted_for_sender: false,
      deleted_for_receiver: false,
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) {
    throw new MessageServiceError(
      "Impossible d'envoyer la réponse",
      error
    );
  }

  return data;
}

/**
 * Supprimer un message pour soi-même uniquement.
 * Si l'utilisateur est l'expéditeur → deleted_for_sender
 * Si l'utilisateur est le destinataire → deleted_for_receiver
 */
export async function deleteMessageForMe(
  messageId: string,
  userId: string
): Promise<void> {
  // Récupérer le message pour vérifier l'expéditeur
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();

  if (fetchError || !message) {
    throw new MessageServiceError(
      'Message introuvable',
      fetchError
    );
  }

  const isSender = message.sender_id === userId;
  const updateField = isSender ? 'deleted_for_sender' : 'deleted_for_receiver';

  const { error } = await supabase
    .from('messages')
    .update({ [updateField]: true })
    .eq('id', messageId);

  if (error) {
    throw new MessageServiceError(
      'Impossible de supprimer le message',
      error
    );
  }
}

/**
 * Marquer/démarquer un message comme important.
 */
export async function toggleMessageImportant(
  messageId: string,
  isImportant: boolean
): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .update({ important: isImportant })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw new MessageServiceError(
      'Impossible de modifier le statut important',
      error
    );
  }

  return data;
}

/**
 * Marquer tous les messages non lus d'une conversation comme lus.
 * Remet aussi le compteur unread à 0 dans la table conversations.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  // 1. Mettre à jour les messages non lus
  const { error: msgError } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (msgError) {
    throw new MessageServiceError(
      'Impossible de marquer les messages comme lus',
      msgError
    );
  }

  // 2. Réinitialiser le compteur unread pour le participant
  const unreadField =
    'participant1_id'; // On vérifie quel participant on est

  // D'abord récupérer la conversation pour savoir quel champ mettre à jour
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('participant1_id')
    .eq('id', conversationId)
    .single();

  if (convError) {
    throw new MessageServiceError(
      'Conversation introuvable',
      convError
    );
  }

  const isParticipant1 = conv.participant1_id === userId;
  const unreadCountField = isParticipant1
    ? 'participant1_unread'
    : 'participant2_unread';

  const { error: convUpdateError } = await supabase
    .from('conversations')
    .update({ [unreadCountField]: 0 })
    .eq('id', conversationId);

  if (convUpdateError) {
    console.warn(
      'Impossible de réinitialiser le compteur unread',
      convUpdateError
    );
    // Non bloquant — les messages sont déjà marqués comme lus
  }
}

/**
 * Supprimer une conversation et tous ses messages (cascade en base).
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    throw new MessageServiceError(
      'Impossible de supprimer la conversation',
      error
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  REALTIME — Abonnements
// ═══════════════════════════════════════════════════════════════════════════

/**
 * S'abonner aux nouveaux messages d'une conversation en temps réel.
 * @returns Fonction de désabonnement
 */
export function subscribeToMessages(
  conversationId: string,
  callback: MessageCallback
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as MessageRow);
      }
    )
    .subscribe();

  // Retourne une fonction de cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * S'abonner aux mises à jour de conversation en temps réel
 * (dernier message, compteur unread, etc.).
 *
 * Note: Le filtre OR n'est pas supporté par Supabase Realtime,
 * donc on crée deux souscriptions séparées (participant1 et participant2).
 *
 * @returns Fonction de désabonnement
 */
export function subscribeToConversations(
  userId: string,
  callback: ConversationCallback
): () => void {
  const channel = supabase
    .channel(`conversations:${userId}`)
    // Participant 1 — UPDATE
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant1_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ConversationRow,
          old: payload.old as ConversationRow,
        });
      }
    )
    // Participant 2 — UPDATE
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant2_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ConversationRow,
          old: payload.old as ConversationRow,
        });
      }
    )
    // Participant 1 — INSERT (nouvelle conversation)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `participant1_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ConversationRow,
          old: {} as ConversationRow,
        });
      }
    )
    // Participant 2 — INSERT
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `participant2_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ConversationRow,
          old: {} as ConversationRow,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  REALTIME — Presence (En ligne / Hors ligne)
// ═══════════════════════════════════════════════════════════════════════════

/** Callback pour les changements de statut en ligne */
export type PresenceCallback = (payload: {
  userId: string;
  online: boolean;
  lastSeen: string;
}) => void;

/**
 * S'abonner aux changements de statut en ligne des profils.
 * Écoute les UPDATE sur la table profiles pour les champs online et last_seen.
 *
 * ⚠️ On n'applique PAS de filtre sur les user_ids spécifiques car
 *    Supabase Realtime ne supporte qu'un filtre par .on().
 *    Le callback reçoit TOUT changement de profil — le consumer doit filtrer.
 *
 * @returns Fonction de désabonnement
 */
export function subscribeToProfilePresence(
  callback: PresenceCallback
): () => void {
  const channel = supabase
    .channel('profiles:presence')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      },
      (payload) => {
        const profile = payload.new as any;
        const old = payload.old as any;
        // Ne déclencher QUE si online ou last_seen a changé
        if (
          profile.online !== old?.online ||
          profile.last_seen !== old?.last_seen
        ) {
          callback({
            userId: profile.id,
            online: profile.online,
            lastSeen: profile.last_seen,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Met à jour le statut en ligne de l'utilisateur courant.
 * Appelé régulièrement (heartbeat) pour maintenir le statut à jour.
 */
export async function updateOwnPresence(
  userId: string,
  online: boolean
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      online,
      last_seen: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.warn('[Presence] Impossible de mettre à jour le statut:', error.message);
  }
}
