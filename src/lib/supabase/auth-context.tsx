'use client';

// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Auth Context Provider & Hook
//
//  Wraps the auth-service in a React context so any component can
//  access the current user, profile, session, and auth helpers.
// ═══════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';
import {
  register as registerUser,
  login as loginUser,
  logout as logoutUser,
  getUser,
  onAuthStateChange,
  updateProfile as updateProfileService,
  type RegisterData,
  type ProfileUpdate,
  type AuthResult,
} from '@/lib/supabase/auth-service';

// ─── Context shape ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<ProfileUpdate>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive authentication status
  const isAuthenticated = user !== null && session !== null;

  // ── Fetch profile for a given user ──
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const result = await getUser();
      if (result.profile) {
        setProfile(result.profile);
      }
    } catch {
      setProfile(null);
    }
  }, []);

  // ── Bootstrap: get session + profile on mount ──
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      // Get session first
      const { data: sessionData } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!sessionData.session) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(sessionData.session);

      // Get user with profile
      const authResult = await getUser();

      if (!mounted) return;

      if (authResult.error || !authResult.user) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
        return;
      }

      setUser(authResult.user);
      setProfile(authResult.profile);
      setLoading(false);
    }

    init();

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED': {
          const result = await getUser();
          if (mounted && result.user) {
            setUser(result.user);
            setProfile(result.profile);
          }
          break;
        }
        case 'SIGNED_OUT':
          setUser(null);
          setProfile(null);
          setSession(null);
          break;
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  // ── Action: login ──
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await loginUser(email, password);
    if (!result.error && result.user) {
      setUser(result.user);
      setSession(result.session);
      await fetchProfile(result.user.id);
    }
    return result;
  }, [fetchProfile]);

  // ── Action: register ──
  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const result = await registerUser(data);
    if (!result.error && result.user) {
      setUser(result.user);
      setSession(result.session);
      await fetchProfile(result.user.id);
    }
    return result;
  }, [fetchProfile]);

  // ── Action: logout ──
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // ── Action: updateProfile ──
  const updateProfile = useCallback(
    async (data: Partial<ProfileUpdate>) => {
      if (!user) throw new Error('Cannot update profile: not authenticated');
      const { profile: updated, error } = await updateProfileService(user.id, data);
      if (error) throw error;
      if (updated) setProfile(updated);
    },
    [user],
  );

  // ── Memoised context value ──
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      session,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, profile, session, loading, isAuthenticated, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
