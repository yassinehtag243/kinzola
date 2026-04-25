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
import type { User, Session, AuthError } from '@supabase/supabase-js';
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
  // CRITICAL: This function must return QUICKLY. Do NOT await getUser() here.
  // The profile is loaded in the background by onAuthStateChange (SIGNED_IN) + app-shell sync.
  // Awaiting getUser() here causes the LoginScreen spinner to spin forever if the
  // profile fetch is slow or fails.
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Add timeout to prevent infinite hanging on Supabase signInWithPassword
    const LOGIN_TIMEOUT_MS = 15000;
    const timeoutPromise = new Promise<AuthResult>((_, reject) =>
      setTimeout(() => reject(new Error('Délai de connexion dépassé. Vérifiez votre connexion internet.')), LOGIN_TIMEOUT_MS)
    );

    let result: AuthResult;
    try {
      result = await Promise.race([loginUser(email, password), timeoutPromise]);
    } catch (err: any) {
      return { user: null, session: null, error: { name: 'Timeout', message: err.message, status: 408 } as AuthError };
    }

    if (!result.error && result.user) {
      // Set basic auth state IMMEDIATELY — don't wait for profile
      setUser(result.user);
      setSession(result.session);

      // Navigate to main IMMEDIATELY with basic user data from login result
      const meta = result.user.user_metadata || {};
      useKinzolaStore.setState({
        isAuthenticated: true,
        currentScreen: 'main',
        loading: false,
        error: null,
        user: {
          id: result.user.id,
          email: result.user.email || '',
          phone: '',
          name: meta.name || result.user.email?.split('@')[0] || '',
          pseudo: meta.pseudo || '',
          age: meta.age || 18,
          gender: (meta.gender || 'homme') as 'homme' | 'femme',
          city: meta.city || 'Kinshasa',
          profession: '',
          religion: '',
          bio: '',
          photoUrl: meta.avatar_url || '',
          photoGallery: [],
          verified: false,
          interests: [],
          preferences: { ageMin: 18, ageMax: 50, city: 'Kinshasa', gender: 'tous', religion: '' },
          createdAt: result.user.created_at || new Date().toISOString(),
          online: true,
          lastSeen: new Date().toISOString(),
        },
      });

      // Fetch full profile in background — NON-BLOCKING
      // The onAuthStateChange(SIGNED_IN) handler also fetches the profile.
      // Whichever completes first sets the profile. The app-shell sync
      // will then update Zustand with the full profile data.
      getUser().then((profileResult) => {
        if (profileResult.profile) {
          setProfile(profileResult.profile);
        }
      }).catch(() => {});

      // Fetch all app data in background — NON-BLOCKING
      useKinzolaStore.getState().fetchAllData().catch(console.error);
    }
    return result;
  }, []);

  // ── Action: register ──
  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const result = await registerUser(data);
    if (!result.error && result.user) {
      // Set basic auth state IMMEDIATELY — don't wait for profile
      setUser(result.user);
      setSession(result.session);

      // Navigate to main immediately
      const meta = result.user.user_metadata || {};
      useKinzolaStore.setState({
        isAuthenticated: true,
        currentScreen: 'main',
        loading: false,
        error: null,
        user: {
          id: result.user.id,
          email: result.user.email || '',
          phone: '',
          name: data.name || meta.name || result.user.email?.split('@')[0] || '',
          pseudo: data.pseudo || meta.pseudo || '',
          age: data.age || meta.age || 18,
          gender: (data.gender || meta.gender || 'homme') as 'homme' | 'femme',
          city: data.city || meta.city || 'Kinshasa',
          profession: data.profession || '',
          religion: data.religion || '',
          bio: data.bio || '',
          photoUrl: meta.avatar_url || '',
          photoGallery: [],
          verified: false,
          interests: [],
          preferences: { ageMin: 18, ageMax: 50, city: 'Kinshasa', gender: 'tous', religion: '' },
          createdAt: result.user.created_at || new Date().toISOString(),
          online: true,
          lastSeen: new Date().toISOString(),
        },
      });

      // Fetch full profile in background — NON-BLOCKING
      getUser().then((profileResult) => {
        if (profileResult.profile) {
          setProfile(profileResult.profile);
        }
      }).catch(() => {});

      // Fetch all app data in background
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
