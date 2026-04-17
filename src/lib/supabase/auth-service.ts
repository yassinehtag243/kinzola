// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Supabase Auth Service
//
//  Centralised authentication layer for the dating app.
//  Every auth-related call the UI makes should go through here.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase/client';
import type {
  User,
  Session,
  AuthError,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import type { Profile, Gender, DiscoverIntent } from './database.types';

// ─── Public types ──────────────────────────────────────────────────────────

export interface RegisterData {
  email: string;
  password: string;
  pseudo: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  phone?: string;
  profession?: string;
  religion?: string;
  bio?: string;
}

export type ProfileUpdate = Partial<{
  pseudo: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  profession: string;
  religion: string;
  bio: string;
  photo_url: string;
  interests: string[];
  text_size: number;
  discover_intent: DiscoverIntent;
}>;

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface UserWithProfile {
  user: User | null;
  profile: Profile | null;
  error: AuthError | null;
}

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

// ─── Register ──────────────────────────────────────────────────────────────

/**
 * Create a new auth user then insert a matching profile row.
 * The `data` object contains everything needed for both steps.
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  // 1 — Create the auth user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError || !authData.user) {
    return { user: null, session: null, error: authError };
  }

  // 2 — Le trigger "auto_create_profile()" (SECURITY DEFINER) crée
  //    automatiquement le profil dans la DB quand un user est créé.
  //    On essaie de le mettre à jour avec les données complètes.
  //    Si ça échoue (RLS, pas encore de session), ce n'est pas bloquant :
  //    le profil existe déjà avec les données par défaut du trigger.
  if (authData.session) {
    // Session active (pas de confirmation email requise) → on peut updater
    try {
      await supabase
        .from('profiles')
        .update({
          pseudo: data.pseudo,
          name: data.name,
          age: data.age,
          gender: data.gender,
          city: data.city,
          profession: data.profession || '',
          religion: data.religion || '',
          bio: data.bio || '',
          phone: data.phone || '',
          interests: [],
        })
        .eq('id', authData.user.id);
    } catch (updateErr) {
      console.warn('[AUTH] Profile update after register failed (non-blocking):', updateErr);
    }
  }

  return {
    user: authData.user,
    session: authData.session,
    error: null,
  };
}

// ─── Login ─────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, session: null, error };
  }

  // Update online status
  if (data.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .update({ online: true, last_seen: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

// ─── Logout ────────────────────────────────────────────────────────────────

export async function logout(): Promise<AuthError | null> {
  // Mark offline before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .update({ online: false, last_seen: new Date().toISOString() })
      .eq('id', user.id);
  }

  const { error } = await supabase.auth.signOut();
  return error;
}

// ─── Get Session ───────────────────────────────────────────────────────────

export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

// ─── Get User with Profile ────────────────────────────────────────────────

export async function getUser(): Promise<UserWithProfile> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null, error };
  }

  // Fetch the profile row
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { user, profile: null, error: profileError as unknown as AuthError };
  }

  return { user, profile, error: null };
}

// ─── Update Profile ───────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  data: ProfileUpdate,
): Promise<{ profile: Profile | null; error: AuthError | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase.from('profiles') as any)
    .update(data)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    return { profile: null, error: error as unknown as AuthError };
  }

  return { profile, error: null };
}

// ─── Change Password ──────────────────────────────────────────────────────

/**
 * Re-authenticates with the old password, then updates to the new one.
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error: AuthError | null }> {
  // Re-authenticate with the current password
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      success: false,
      error: { name: 'NoSession', message: 'No active session', status: 401 } as AuthError,
    };
  }

  // Re-authenticate with old password
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: session.user.email!,
    password: oldPassword,
  });

  if (reAuthError) {
    return {
      success: false,
      error: { name: 'InvalidPassword', message: 'Current password is incorrect', status: 401 } as AuthError,
    };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError };
  }

  return { success: true, error: null };
}

// ─── Auth State Change Listener ───────────────────────────────────────────

/**
 * Subscribe to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

// ─── Reset Password ───────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

// ─── Delete Account ───────────────────────────────────────────────────────

/**
 * Permanently deletes the auth user. The database cascade on `profiles.id`
 * should clean up all related rows.
 */
export async function deleteAccount(userId: string): Promise<{ error: AuthError | null }> {
  // First sign out so stale tokens aren't left around
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    return { error: signOutError };
  }

  // Use the admin client to delete the auth user (bypasses RLS)
  // We dynamically import to avoid circular dependency
  const { supabaseAdmin } = await import('@/lib/supabase/client');

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return { error };
  }

  return { error: null };
}
