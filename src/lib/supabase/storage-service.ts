// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Stockage (Supabase Storage)
//
//  Gestion des fichiers stockés dans le bucket Supabase :
//  - Photos de profil (principale + galerie)
//  - Images de messages
//  - Images de publications
//  - Images de stories
//  - Helpers URL / suppression
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';

// ─── Types utilitaires ───────────────────────────────────────────────────

/** Résultat d'un upload avec l'URL publique */
export interface UploadResult {
  url: string | null;
  error: string | null;
}

/** Bucket de stockage principal */
const STORAGE_BUCKET = 'kinzola-photos';

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class StorageServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageServiceError';
  }
}

// ─── Helpers internes ───────────────────────────────────────────────────

/**
 * Générer un timestamp unique pour les noms de fichiers.
 */
function generateTimestamp(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Upload un fichier dans un chemin donné du bucket.
 * Gère la conversion en ArrayBuffer et le content-type.
 */
async function uploadFile(
  path: string,
  file: File
): Promise<UploadResult> {
  try {
    // Convertir le File en ArrayBuffer pour Supabase
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Écraser si le fichier existe déjà
        cacheControl: '3600', // Cache d'1 heure
      });

    if (error) {
      return { url: null, error: error.message };
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload';
    return { url: null, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PHOTOS DE PROFIL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Uploader la photo de profil principale.
 * Chemin : profiles/{userId}/main.jpg
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<UploadResult> {
  const path = `profiles/${userId}/main.jpg`;
  return uploadFile(path, file);
}

/**
 * Mettre à jour la photo de profil :
 * - Upload la nouvelle photo dans le stockage
 * - Met à jour le champ photo_url dans la table profiles
 */
export async function updateProfilePhoto(
  userId: string,
  file: File
): Promise<UploadResult> {
  // 1. Upload dans le stockage
  const uploadResult = await uploadProfilePhoto(userId, file);

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  // 2. Mettre à jour le profil avec la nouvelle URL
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ photo_url: uploadResult.url })
    .eq('id', userId);

  if (dbError) {
    return {
      url: null,
      error: `Upload réussi mais mise à jour du profil échouée : ${dbError.message}`,
    };
  }

  return uploadResult;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GALERIE DE PHOTOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Uploader une photo de galerie.
 * Chemin : profiles/{userId}/gallery/{index}.jpg
 */
export async function uploadGalleryPhoto(
  userId: string,
  file: File,
  index: number
): Promise<UploadResult> {
  const path = `profiles/${userId}/gallery/${index}.jpg`;
  return uploadFile(path, file);
}

/**
 * Mettre à jour la galerie complète d'un utilisateur.
 * - Upload toutes les photos
 * - Met à jour le tableau photo_gallery dans la table profiles
 */
export async function updateGallery(
  userId: string,
  files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  // Uploader chaque photo
  for (let i = 0; i < files.length; i++) {
    const result = await uploadGalleryPhoto(userId, files[i], i);
    if (result.url) {
      urls.push(result.url);
    } else {
      errors.push(
        `Photo ${i + 1} : ${result.error}`
      );
    }
  }

  // Mettre à jour le profil avec les nouvelles URLs
  if (urls.length > 0) {
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ photo_gallery: urls })
      .eq('id', userId);

    if (dbError) {
      errors.push(
        `Mise à jour galerie échouée : ${dbError.message}`
      );
    }
  }

  return { urls, errors };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Uploader une image pour un message de chat.
 * Chemin : messages/{conversationId}/{timestamp}.jpg
 */
export async function uploadMessageImage(
  userId: string,
  conversationId: string,
  file: File
): Promise<UploadResult> {
  const path = `messages/${conversationId}/${generateTimestamp()}.jpg`;
  return uploadFile(path, file);
}

/**
 * Uploader un fichier audio (message vocal) pour un message de chat.
 * Chemin : messages/{conversationId}/audio/{timestamp}.webm
 */
export async function uploadMessageAudio(
  conversationId: string,
  blob: Blob,
  mimeType: string
): Promise<UploadResult> {
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const path = `messages/${conversationId}/audio/${generateTimestamp()}.${ext}`;

  try {
    const arrayBuffer = await blob.arrayBuffer();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload audio';
    return { url: null, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Uploader une image pour une publication.
 * Chemin : posts/{userId}/{timestamp}.jpg
 */
export async function uploadPostImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const path = `posts/${userId}/${generateTimestamp()}.jpg`;
  return uploadFile(path, file);
}

// ═══════════════════════════════════════════════════════════════════════════
//  STORIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Uploader une image de story.
 * Chemin : stories/{userId}/{timestamp}.jpg
 */
export async function uploadStoryImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const path = `stories/${userId}/${generateTimestamp()}.jpg`;
  return uploadFile(path, file);
}

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supprimer un fichier du stockage par son chemin complet.
 */
export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    throw new StorageServiceError(
      `Impossible de supprimer le fichier : ${path}`,
      error
    );
  }
}

/**
 * Récupérer l'URL publique d'un fichier stocké.
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Supprimer toute la galerie d'un utilisateur du stockage.
 * Utile lors de la réinitialisation du profil.
 */
export async function deleteGallery(
  userId: string
): Promise<{ deleted: number; errors: string[] }> {
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`profiles/${userId}/gallery/`);

  if (listError || !files || files.length === 0) {
    return { deleted: 0, errors: listError ? [listError.message] : [] };
  }

  const paths = files.map((f) => `profiles/${userId}/gallery/${f.name}`);

  const { error: removeError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths);

  if (removeError) {
    return { deleted: 0, errors: [removeError.message] };
  }

  return { deleted: paths.length, errors: [] };
}
