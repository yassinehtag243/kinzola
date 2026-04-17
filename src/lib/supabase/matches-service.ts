// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Matches
//
//  Gestion des matchs, likes, blocages et signalements :
//  - CRUD des matchs avec profil joint
//  - Système de likes / super likes (demo avec probabilité)
//  - Blocage / déblocage d'utilisateurs
//  - Signalement d'utilisateurs
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type {
  MatchRow,
  ConversationRow,
  BlockedUser,
  ReportRow,
  DiscoverIntent,
  ReportReason,
  Profile,
} from '@/lib/supabase/database.types';

// ─── Types utilitaires ───────────────────────────────────────────────────

/** Match enrichi avec le profil de l'autre utilisateur */
export interface MatchWithProfile extends MatchRow {
  profile: Profile;
}

/** Résultat d'un like (créé ou non, avec match éventuel) */
export interface LikeResult {
  liked: boolean;
  matched: boolean;
  matchId?: string;
  conversationId?: string;
}

/** Vérification d'existence de match */
export interface MatchCheckResult {
  exists: boolean;
  match?: MatchRow;
}

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class MatchServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MatchServiceError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MATCHS — Lecture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer tous les matchs d'un utilisateur.
 * Joint le profil de l'autre utilisateur.
 * Ordonné du plus récent au plus ancien.
 */
export async function getMatches(userId: string): Promise<MatchWithProfile[]> {
  // Récupère les matchs où l'utilisateur est user1 ou user2
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (matchError) {
    throw new MatchServiceError(
      'Impossible de charger les matchs',
      matchError
    );
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  // Enrichir chaque match avec le profil de l'autre utilisateur
  const enriched: MatchWithProfile[] = [];

  for (const match of matches) {
    const otherUserId =
      match.user1_id === userId ? match.user2_id : match.user1_id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single();

    if (profileError) {
      console.warn(
        `Profil introuvable pour le match ${match.id}`,
        profileError
      );
      continue;
    }

    enriched.push({
      ...match,
      profile: profile!,
    });
  }

  return enriched;
}

/**
 * Récupérer les nouveaux matchs (new_match = true).
 */
export async function getNewMatches(userId: string): Promise<MatchWithProfile[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('new_match', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new MatchServiceError(
      'Impossible de charger les nouveaux matchs',
      error
    );
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  const enriched: MatchWithProfile[] = [];

  for (const match of matches) {
    const otherUserId =
      match.user1_id === userId ? match.user2_id : match.user1_id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single();

    if (profileError) {
      console.warn(
        `Profil introuvable pour le nouveau match ${match.id}`,
        profileError
      );
      continue;
    }

    enriched.push({
      ...match,
      profile: profile!,
    });
  }

  return enriched;
}

/**
 * Vérifier si un match existe déjà entre deux utilisateurs.
 */
export async function checkMatchExists(
  user1Id: string,
  user2Id: string
): Promise<MatchCheckResult> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .maybeSingle();

  if (error) {
    throw new MatchServiceError(
      'Impossible de vérifier le match',
      error
    );
  }

  return {
    exists: !!data,
    match: data ?? undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MATCHS — Écriture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Créer un nouveau match entre deux utilisateurs.
 * Crée aussi automatiquement une conversation associée.
 */
export async function createMatch(
  user1Id: string,
  user2Id: string,
  isSuperMatch: boolean = false,
  intent: DiscoverIntent = 'amour'
): Promise<{ match: MatchRow; conversation: ConversationRow }> {
  // Vérifier qu'un match n'existe pas déjà
  const existing = await checkMatchExists(user1Id, user2Id);
  if (existing.exists) {
    throw new MatchServiceError(
      'Un match existe déjà entre ces deux utilisateurs'
    );
  }

  // 1. Créer le match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      is_super_match: isSuperMatch,
      intent,
      new_match: true,
    })
    .select()
    .single();

  if (matchError) {
    throw new MatchServiceError(
      'Impossible de créer le match',
      matchError
    );
  }

  // 2. Créer la conversation associée
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      match_id: match.id,
      participant1_id: user1Id,
      participant2_id: user2Id,
      last_message: '',
      last_message_time: new Date().toISOString(),
      participant1_unread: 0,
      participant2_unread: 0,
    })
    .select()
    .single();

  if (convError) {
    // Nettoyer le match si la conversation échoue
    await supabase.from('matches').delete().eq('id', match.id);
    throw new MatchServiceError(
      'Impossible de créer la conversation associée',
      convError
    );
  }

  return { match, conversation: conversation! };
}

/**
 * Marquer un match comme vu (new_match = false).
 */
export async function markMatchSeen(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ new_match: false })
    .eq('id', matchId);

  if (error) {
    throw new MatchServiceError(
      'Impossible de marquer le match comme vu',
      error
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIKES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Exprimer de l'intérêt pour un profil.
 * En mode demo : 40% de chance de créer un match.
 * En production : notifier l'autre utilisateur.
 */
export async function likeProfile(
  likerId: string,
  likedId: string
): Promise<LikeResult> {
  // Vérifier qu'un match n'existe pas déjà
  const existing = await checkMatchExists(likerId, likedId);
  if (existing.exists) {
    return { liked: false, matched: true, matchId: existing.match?.id };
  }

  // Ne pas s'aimer soi-même
  if (likerId === likedId) {
    throw new MatchServiceError('Un utilisateur ne peut pas se liker lui-même');
  }

  // Mode démo : probabilité de 40% de match
  const shouldMatch = Math.random() < 0.4;

  if (shouldMatch) {
    try {
      const { match, conversation } = await createMatch(
        likerId,
        likedId,
        false,
        'amour'
      );
      return {
        liked: true,
        matched: true,
        matchId: match.id,
        conversationId: conversation.id,
      };
    } catch {
      // Le like est quand même enregistré même si le match échoue
      return { liked: true, matched: false };
    }
  }

  // En production, on notifierait l'autre utilisateur ici
  // TODO: envoyer une notification push / in-app
  return { liked: true, matched: false };
}

/**
 * Super Like = match garanti entre deux utilisateurs.
 */
export async function superLikeProfile(
  likerId: string,
  likedId: string
): Promise<LikeResult> {
  // Vérifier qu'un match n'existe pas déjà
  const existing = await checkMatchExists(likerId, likedId);
  if (existing.exists) {
    return { liked: false, matched: true, matchId: existing.match?.id };
  }

  if (likerId === likedId) {
    throw new MatchServiceError('Un utilisateur ne peut pas se super liker lui-même');
  }

  try {
    const { match, conversation } = await createMatch(
      likerId,
      likedId,
      true, // isSuperMatch
      'amour'
    );
    return {
      liked: true,
      matched: true,
      matchId: match.id,
      conversationId: conversation.id,
    };
  } catch (error) {
    throw new MatchServiceError(
      'Impossible de créer le super match',
      error
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  BLOCAGES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer la liste des utilisateurs bloqués par un utilisateur.
 */
export async function getBlockedUsers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', userId);

  if (error) {
    throw new MatchServiceError(
      'Impossible de charger la liste des utilisateurs bloqués',
      error
    );
  }

  return data?.map((row) => row.blocked_id) ?? [];
}

/**
 * Bloquer un utilisateur.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<void> {
  // Ne pas se bloquer soi-même
  if (blockerId === blockedId) {
    throw new MatchServiceError('Impossible de se bloquer soi-même');
  }

  // Vérifier si déjà bloqué
  const { data: existing, error: checkError } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();

  if (checkError) {
    throw new MatchServiceError(
      'Impossible de vérifier le blocage',
      checkError
    );
  }

  if (existing) {
    return; // Déjà bloqué, rien à faire
  }

  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    throw new MatchServiceError(
      'Impossible de bloquer cet utilisateur',
      error
    );
  }
}

/**
 * Débloquer un utilisateur.
 */
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<void> {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) {
    throw new MatchServiceError(
      'Impossible de débloquer cet utilisateur',
      error
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SIGNALEMENTS
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//  REALTIME — Abonnement
// ═══════════════════════════════════════════════════════════════════════════

/** Callback Realtime pour les nouveaux matchs */
export type MatchCallback = (match: MatchWithProfile) => void;

/**
 * S'abonner aux nouveaux matchs d'un utilisateur en temps réel.
 * Écoute les INSERT sur la table matches où l'utilisateur est participant.
 * @returns Fonction de désabonnement
 */
export function subscribeToMatches(
  userId: string,
  callback: MatchCallback
): () => void {
  const channel = supabase
    .channel(`matches:${userId}`)
    // Écouter quand user est participant 1
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${userId}`,
      },
      async (payload) => {
        const matchRow = payload.new as MatchRow;
        // Charger le profil de l'autre utilisateur
        const otherUserId = matchRow.user2_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
        if (profile) {
          callback({ ...matchRow, profile });
        }
      }
    )
    // Écouter quand user est participant 2
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user2_id=eq.${userId}`,
      },
      async (payload) => {
        const matchRow = payload.new as MatchRow;
        const otherUserId = matchRow.user1_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
        if (profile) {
          callback({ ...matchRow, profile });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Signaler un utilisateur.
 * Crée un signalement dans la table reports.
 */
export async function reportUser(
  reporterId: string,
  targetId: string,
  reason: ReportReason
): Promise<ReportRow> {
  // Ne pas se signaler soi-même
  if (reporterId === targetId) {
    throw new MatchServiceError(
      'Impossible de se signaler soi-même'
    );
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_id: targetId,
      reason,
    })
    .select()
    .single();

  if (error) {
    throw new MatchServiceError(
      'Impossible de créer le signalement',
      error
    );
  }

  return data;
}
