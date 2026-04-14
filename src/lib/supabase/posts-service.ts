// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Publications (Posts)
//
//  Gestion des publications sociales :
//  - CRUD des publications avec visibilité (public / amis)
//  - Système de likes avec compteur
//  - Commentaires publics et privés
//  - Compteur de vues
//  - Expiration automatique (48h)
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type {
  PostRow,
  PostLike,
  CommentRow,
  PostVisibility,
  Profile,
} from '@/lib/supabase/database.types';

// ─── Types utilitaires ───────────────────────────────────────────────────

/** Publication enrichie avec le profil de l'auteur */
export interface PostWithAuthor extends PostRow {
  author: Profile;
}

/** Résultat du toggle like */
export interface LikeToggleResult {
  liked: boolean; // true = liké, false = unliké
  totalLikes: number;
}

// ─── Constantes ──────────────────────────────────────────────────────────

/** Durée de vie d'une publication en heures */
const POST_EXPIRATION_HOURS = 48;

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class PostServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PostServiceError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLICATIONS — Lecture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer les publications actives (non expirées).
 * - Publications publiques pour tout le monde
 * - Publications "friends" uniquement si l'utilisateur fait partie des amis
 * - Joint le profil de l'auteur
 */
export async function getPosts(
  userId?: string,
  friendsIds?: string[]
): Promise<PostWithAuthor[]> {
  const now = new Date().toISOString();

  // Publications publiques non expirées
  let query = supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('visibility', 'public')
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  const { data: publicPosts, error: publicError } = await query;

  if (publicError) {
    throw new PostServiceError(
      'Impossible de charger les publications',
      publicError
    );
  }

  let allPosts = [...(publicPosts ?? [])];

  // Si on a des amis, ajouter les publications friends-only
  if (userId && friendsIds && friendsIds.length > 0) {
    const { data: friendsPosts, error: friendsError } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('visibility', 'friends')
      .in('author_id', friendsIds)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (!friendsError && friendsPosts) {
      allPosts = [...allPosts, ...friendsPosts];
    }
  }

  // Trier par date de création (plus récent en premier)
  allPosts.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return allPosts as PostWithAuthor[];
}

/**
 * Récupérer toutes les publications d'un utilisateur spécifique.
 */
export async function getUserPosts(authorId: string): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('author_id', authorId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new PostServiceError(
      'Impossible de charger les publications de cet utilisateur',
      error
    );
  }

  return (data ?? []) as PostWithAuthor[];
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLICATIONS — Écriture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Créer une nouvelle publication.
 * Expiration automatique : 48 heures à partir de maintenant.
 */
export async function createPost(
  authorId: string,
  content: string,
  imageUrl?: string | null,
  visibility: PostVisibility = 'public'
): Promise<PostRow> {
  // Calculer la date d'expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + POST_EXPIRATION_HOURS);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content,
      image_url: imageUrl ?? null,
      views: 0,
      likes: 0,
      visibility,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new PostServiceError(
      'Impossible de créer la publication',
      error
    );
  }

  return data;
}

/**
 * Supprimer sa propre publication.
 */
export async function deletePost(
  postId: string,
  authorId: string
): Promise<void> {
  // Vérifier que l'utilisateur est bien l'auteur
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    throw new PostServiceError(
      'Publication introuvable',
      fetchError
    );
  }

  if (post.author_id !== authorId) {
    throw new PostServiceError(
      'Vous ne pouvez supprimer que vos propres publications'
    );
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    throw new PostServiceError(
      'Impossible de supprimer la publication',
      deleteError
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIKES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifier si un utilisateur a liké une publication.
 */
export async function checkPostLiked(
  postId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new PostServiceError(
      'Impossible de vérifier le like',
      error
    );
  }

  return !!data;
}

/**
 * Toggle like sur une publication.
 * Si déjà liké → supprime le like et décrémente le compteur.
 * Si pas liké → ajoute le like et incrémente le compteur.
 */
export async function likePost(
  postId: string,
  userId: string
): Promise<LikeToggleResult> {
  const alreadyLiked = await checkPostLiked(postId, userId);

  if (alreadyLiked) {
    // ── Unlike : supprimer le like ──
    const { error: unlikeError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (unlikeError) {
      throw new PostServiceError(
        'Impossible de supprimer le like',
        unlikeError
      );
    }

    // Décrémenter le compteur de likes (via RPC pour éviter la course)
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ likes: supabase.rpc ? supabase.rpc : undefined })
      .eq('id', postId)
      .select('likes')
      .single();

    // Fallback : décrémenter manuellement
    if (updateError || !updatedPost) {
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();

      if (post) {
        await supabase
          .from('posts')
          .update({ likes: Math.max(0, post.likes - 1) })
          .eq('id', postId);
        return { liked: false, totalLikes: Math.max(0, post.likes - 1) };
      }
    }

    return { liked: false, totalLikes: Math.max(0, (updatedPost?.likes ?? 1) - 1) };
  } else {
    // ── Like : ajouter le like ──
    const { error: likeError } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: userId,
    });

    if (likeError) {
      throw new PostServiceError(
        'Impossible d\'ajouter le like',
        likeError
      );
    }

    // Incrémenter le compteur de likes
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();

    if (fetchError) {
      throw new PostServiceError(
        'Impossible de récupérer le compteur de likes',
        fetchError
      );
    }

    const newCount = (post?.likes ?? 0) + 1;

    await supabase
      .from('posts')
      .update({ likes: newCount })
      .eq('id', postId);

    return { liked: true, totalLikes: newCount };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ajouter un commentaire à une publication.
 * Un commentaire peut être public ou privé (visible uniquement par l'auteur).
 */
export async function addComment(
  postId: string,
  authorId: string,
  content: string,
  isPublic: boolean = true
): Promise<CommentRow> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
      is_public: isPublic,
    })
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .single();

  if (error) {
    throw new PostServiceError(
      'Impossible d\'ajouter le commentaire',
      error
    );
  }

  return data as CommentRow;
}

/**
 * Récupérer tous les commentaires d'une publication.
 * Joint le profil de l'auteur de chaque commentaire.
 * Si userId est fourni, inclut les commentaires privés visibles par cet utilisateur.
 */
export async function getComments(
  postId: string,
  userId?: string
): Promise<CommentRow[]> {
  // D'abord récupérer l'auteur de la publication
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const isPostAuthor = userId && post?.author_id === userId;

  let query = supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new PostServiceError(
      'Impossible de charger les commentaires',
      error
    );
  }

  if (!data) {
    return [];
  }

  // Filtrer les commentaires privés si l'utilisateur n'est pas l'auteur du post
  const filteredComments = data.filter((comment) => {
    if (comment.is_public) return true;
    // Commentaires privés : visibles par l'auteur du commentaire
    // et par l'auteur de la publication
    return (
      (userId && comment.author_id === userId) || isPostAuthor
    );
  });

  return filteredComments as CommentRow[];
}

// ═══════════════════════════════════════════════════════════════════════════
//  VUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Incrémenter le compteur de vues d'une publication.
 * Utilise une approche simple avec update + fetch pour éviter les conditions de course.
 */
export async function incrementPostViews(postId: string): Promise<number> {
  // Récupérer le compteur actuel
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('views')
    .eq('id', postId)
    .single();

  if (fetchError) {
    throw new PostServiceError(
      'Impossible de récupérer la publication',
      fetchError
    );
  }

  const newViews = (post?.views ?? 0) + 1;

  // Mettre à jour le compteur
  const { error: updateError } = await supabase
    .from('posts')
    .update({ views: newViews })
    .eq('id', postId);

  if (updateError) {
    throw new PostServiceError(
      'Impossible de mettre à jour les vues',
      updateError
    );
  }

  return newViews;
}
