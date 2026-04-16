// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Service Découverte (Discover)
//
//  Récupération et filtrage des profils pour la page Découvrir :
//  - Exclut l'utilisateur courant et les utilisateurs bloqués
//  - Filtre par genre, âge, ville, religion, centres d'intérêt
//  - Score de compatibilité calculé côté client
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/database.types';
import type { FilterState } from '@/types';

// ─── Erreurs personnalisées ──────────────────────────────────────────────

export class DiscoverServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DiscoverServiceError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROFILS — Lecture
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer tous les profils visibles dans la section Découvrir.
 * Exclut l'utilisateur courant et les utilisateurs bloqués.
 * Le tri par compatibilité est fait côté client par le store.
 */
export async function getDiscoverProfiles(
  userId: string,
  filters?: FilterState
): Promise<Profile[]> {
  // 1. Récupérer la liste des utilisateurs bloqués par l'utilisateur courant
  const { data: blockedRows, error: blockedError } = await (supabase
    .from('blocked_users') as any)
    .select('blocked_id')
    .eq('blocker_id', userId);

  if (blockedError) {
    throw new DiscoverServiceError(
      'Impossible de charger la liste des utilisateurs bloqués',
      blockedError
    );
  }

  const blockedIds: string[] = blockedRows?.map((row: any) => row.blocked_id) ?? [];

  // 2. Récupérer les utilisateurs qui ont bloqué l'utilisateur courant
  const { data: blockedByRows, error: blockedByError } = await (supabase
    .from('blocked_users') as any)
    .select('blocker_id')
    .eq('blocked_id', userId);

  if (blockedByError) {
    throw new DiscoverServiceError(
      'Impossible de charger les blocages reçus',
      blockedByError
    );
  }

  const blockedMeIds: string[] = blockedByRows?.map((row: any) => row.blocker_id) ?? [];
  const allBlockedIds = [...new Set([...blockedIds, ...blockedMeIds])];

  // 3. Construire la requête des profils
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', userId); // Exclure l'utilisateur courant

  // Exclure les utilisateurs bloqués
  if (allBlockedIds.length > 0) {
    // Supabase doesn't support a `.not('id', 'in', ...)` directly with large arrays,
    // so we filter client-side if needed
  }

  // Appliquer les filtres de la base quand possible
  if (filters?.gender && filters.gender !== 'tous') {
    query = query.eq('gender', filters.gender);
  }
  if (filters?.ageMin && filters.ageMin > 0) {
    query = query.gte('age', filters.ageMin);
  }
  if (filters?.ageMax && filters.ageMax < 100) {
    query = query.lte('age', filters.ageMax);
  }
  if (filters?.cities && filters.cities.length > 0) {
    query = query.in('city', filters.cities);
  }
  if (filters?.religions && filters.religions.length > 0) {
    query = query.in('religion', filters.religions);
  }

  const { data, error } = await query;

  if (error) {
    throw new DiscoverServiceError(
      'Impossible de charger les profils',
      error
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  // 4. Filtrer les utilisateurs bloqués côté client
  let profiles = (data as Profile[]).filter(
    (p) => !allBlockedIds.includes(p.id)
  );

  // 5. Filtrer par centres d'intérêt côté client (tableau JSON)
  if (filters?.interests && filters.interests.length > 0) {
    profiles = profiles.filter((p) =>
      filters.interests.some((fi) =>
        (p.interests ?? []).some((pi) => pi.toLowerCase() === fi.toLowerCase())
      )
    );
  }

  return profiles;
}
