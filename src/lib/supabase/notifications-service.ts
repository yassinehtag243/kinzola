// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Notifications
//
//  Gestion des notifications utilisateur :
//  - Récupération avec profil de l'expéditeur joint
//  - Marquage lu / non lu
//  - Suppression individuelle ou en masse
//  - Abonnement Realtime
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/database.types';

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class NotificationServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'NotificationServiceError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS — Lecture
// ═══════════════════════════════════════════════════════════════════════════

/** Notification enrichie avec le profil de l'expéditeur */
export interface NotificationWithProfile {
  id: string;
  user_id: string;
  from_user_id?: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user: Profile | null;
}

/**
 * Récupérer toutes les notifications d'un utilisateur.
 * Joint le profil de l'expéditeur (from_user).
 */
export async function getNotifications(
  userId: string
): Promise<NotificationWithProfile[]> {
  const { data, error } = await (supabase
    .from('notifications') as any)
    .select('*, from_user:profiles!notifications_from_user_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new NotificationServiceError(
      'Impossible de charger les notifications',
      error
    );
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    from_user: (row.from_user as Profile) ?? null,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS — Écriture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marquer une notification comme lue.
 */
export async function markNotificationRead(notifId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .update({ read: true })
    .eq('id', notifId);

  if (error) {
    throw new NotificationServiceError(
      'Impossible de marquer la notification comme lue',
      error
    );
  }
}

/**
 * Marquer toutes les notifications d'un utilisateur comme lues.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new NotificationServiceError(
      'Impossible de marquer toutes les notifications comme lues',
      error
    );
  }
}

/**
 * Supprimer une notification.
 */
export async function deleteNotification(notifId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .delete()
    .eq('id', notifId);

  if (error) {
    throw new NotificationServiceError(
      'Impossible de supprimer la notification',
      error
    );
  }
}

/**
 * Supprimer toutes les notifications d'un utilisateur.
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new NotificationServiceError(
      'Impossible de supprimer toutes les notifications',
      error
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  REALTIME — Abonnement
// ═══════════════════════════════════════════════════════════════════════════

/**
 * S'abonner aux nouvelles notifications d'un utilisateur en temps réel.
 * @returns Fonction de désabonnement
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: NotificationWithProfile) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Charger le profil de l'expéditeur
        const notif = payload.new as any;
        let fromUser: Profile | null = null;

        if (notif.from_user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', notif.from_user_id)
            .single();
          fromUser = data ?? null;
        }

        callback({
          ...notif,
          from_user: fromUser,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
