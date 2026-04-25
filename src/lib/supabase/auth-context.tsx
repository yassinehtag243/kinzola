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
import { useKinzolaStore } from '@/store/use-kinzola-store';
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
      // Charger le profil SYNCHRONEMENT avant de naviguer
      // Sinon app-shell voit supabaseProfile=null et force logout
      const profileResult = await getUser();

      setUser(result.user);
      setSession(result.session);
      if (profileResult.profile) {
        setProfile(profileResult.profile);
      }

      // Naviguer vers main avec les infos du profil si disponible
      const dbProfile = profileResult.profile;
      useKinzolaStore.setState({
        isAuthenticated: true,
        currentScreen: 'main',
        loading: false,
        error: null,
        user: {
          id: result.user.id,
          email: result.user.email || '',
          phone: dbProfile?.phone || '',
          name: dbProfile?.name || result.user.user_metadata?.name || result.user.email?.split('@')[0] || '',
          pseudo: dbProfile?.pseudo || result.user.user_metadata?.pseudo || '',
          age: dbProfile?.age || result.user.user_metadata?.age || 18,
          gender: (dbProfile?.gender || result.user.user_metadata?.gender || 'homme') as 'homme' | 'femme',
          city: dbProfile?.city || result.user.user_metadata?.city || 'Kinshasa',
          profession: dbProfile?.profession || '',
          religion: dbProfile?.religion || '',
          bio: dbProfile?.bio || '',
          photoUrl: dbProfile?.photo_url || result.user.user_metadata?.avatar_url || '',
          photoGallery: (dbProfile?.photo_gallery as string[]) || [],
          verified: dbProfile?.verified ?? false,
          interests: (dbProfile?.interests as string[]) || [],
          preferences: { ageMin: 18, ageMax: 50, city: 'Kinshasa', gender: 'tous', religion: '' },
          createdAt: dbProfile?.created_at || result.user.created_at || new Date().toISOString(),
          online: true,
          lastSeen: new Date().toISOString(),
        },
      });
      // Charger toutes les données en arrière-plan
      useKinzolaStore.getState().fetchAllData().catch(console.error);
    }
    return result;
  }, []);

  // ── Action: register ──
  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const result = await registerUser(data);
    if (!result.error && result.user) {
      // Charger le profil SYNCHRONEMENT avant de naviguer
      const profileResult = await getUser();

      setUser(result.user);
      setSession(result.session);
      if (profileResult.profile) {
        setProfile(profileResult.profile);
      }
      useKinzolaStore.setState({ isAuthenticated: true, currentScreen: 'main', loading: false, error: null });
      useKinzolaStore.getState().fetchAllData().catch(console.error);
    }
    return result;
  }, []);

  // ── Action: logout ──
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setSession(null);
    // Nettoyer le store Zustand
    useKinzolaStore.setState({
      user: null,
      isAuthenticated: false,
      currentScreen: 'welcome',
      currentTab: 'discover',
      profiles: [],
      matches: [],
      messages: [],
      conversations: [],
      posts: [],
      stories: [],
      notifications: [],
      likesReceived: [],
      profileVisitors: [],
      blockedUserIds: [],
      showSettings: false,
      showEditPersonalInfo: false,
      showEditProfile: false,
      _fetchingAll: false,
      loading: false,
    });
    // Supprimer le flag splash pour que l'écran d'accueil se montre au prochain lancement
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kinzola-splash-seen');
    }
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
