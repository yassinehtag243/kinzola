'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { useAuth } from '@/lib/supabase/auth-context';
import WelcomeScreen from './auth/welcome-screen';
import LoginScreen from './auth/login-screen';
import RegisterScreen from './auth/register-screen';
import BottomNav from './bottom-nav';
import DiscoverScreen from './discover/discover-screen';
import NewsScreen from './news/news-screen';
import MessagesScreen from './messages/messages-screen';
import ProfileScreen from './profile/profile-screen';
import ProfileDetail from './discover/profile-detail';
import EditProfile from './profile/edit-profile';
import SettingsScreen from './profile/settings-screen';
import EditPersonalInfo from './profile/edit-personal-info';
import MatchModal from './messages/match-modal';
import SplashScreen from './splash-screen';
import NotificationSoundManager from './news/notification-sound-manager';
import MatchNotificationBanner from './match-notification-banner';
import MessageNotificationBanner from './messages/message-notification-banner';
import PwaInstallBanner from './shared/pwa-install-banner';
import { useBrowserNotifications } from '@/hooks/use-browser-notifications';
import { useRealtime } from '@/hooks/use-realtime';

// ─── Screen slide transition (left/right like mobile navigation) ───
const screenVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const screenTransition = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

// ─── Overlay slide-up transition (bottom sheet style) ───
const overlayVariants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

const overlayTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 350,
};

// ✅ Valeurs SSR stables (identiques serveur et client)
const SSR_THEME = 'dark';
const SSR_TEXT_SIZE = 16;

export default function AppShell() {
  const {
    currentScreen,
    currentTab,
    showProfileDetail,
    showEditProfile,
    showSettings,
    showEditPersonalInfo,
    showMatchModal,
    theme,
    textSize,
    hydrate,
    isAuthenticated,
    setTab,
    openChat,
    markConversationRead,
    setPendingNotificationReply,
  } = useKinzolaStore();

  // Register Service Worker for background notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[SW] Service Worker registered, scope:', reg.scope);
      }).catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    }
  }, []);

  // Browser push notifications (real phone notifications)
  useBrowserNotifications();

  // ─── Supabase Realtime — Phase 5 ──────────────────────────────────
  // Abonnements temps réel : messages, conversations, notifications,
  // matchs, presence (online/offline), heartbeat
  useRealtime();

  // Handle URL params when opening from notification (outside app)
  // SW sends: ?action=reply&conv=xxx&name=xxx or ?action=open-chat&conv=xxx
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const convId = params.get('conv');
    const name = params.get('name');

    if (!action || !convId) return;

    // Wait for hydration + authentication state to be ready
    const timer = setTimeout(() => {
      const state = useKinzolaStore.getState();
      if (state.currentScreen !== 'main') return; // Not logged in yet

      if (action === 'reply') {
        state.setTab('messages');
        state.openChat(convId);
        state.setPendingNotificationReply({ conversationId: convId, participantName: name || '' });
      } else if (action === 'open-chat') {
        state.setTab('messages');
        state.openChat(convId);
      } else if (action === 'mark-read') {
        state.markConversationRead(convId);
        state.setTab('messages');
      }

      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    }, 1500); // Wait for auth + store hydration

    return () => clearTimeout(timer);
  }, []);

  // Listen for Service Worker messages (notification actions)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'NOTIFICATION_ACTION') return;

      const { action, conversationId, participantName } = data;

      if (action === 'reply') {
        // Open chat and set focus for reply
        setTab('messages');
        openChat(conversationId);
        setPendingNotificationReply({ conversationId, participantName: participantName || '' });
      } else if (action === 'mark-read') {
        markConversationRead(conversationId);
        setTab('messages');
      } else if (action === 'open-chat') {
        setTab('messages');
        openChat(conversationId);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [setTab, openChat, markConversationRead, setPendingNotificationReply]);

  // ─── Supabase ↔ Zustand Auth Synchronization ───
  const { isAuthenticated: supabaseAuthenticated, profile: supabaseProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return; // Wait until AuthProvider has finished bootstrap

    if (supabaseAuthenticated && supabaseProfile) {
      const storeState = useKinzolaStore.getState();
      // Sync: if Supabase says logged in but Zustand doesn't know yet
      if (!storeState.isAuthenticated || !storeState.user || storeState.user.id !== supabaseProfile.id) {
        useKinzolaStore.setState({
          isAuthenticated: true,
          user: {
            id: supabaseProfile.id,
            pseudo: supabaseProfile.pseudo || '',
            name: supabaseProfile.name || '',
            email: supabaseProfile.email || '',
            phone: supabaseProfile.phone || '',
            age: supabaseProfile.age || 18,
            gender: (supabaseProfile.gender || 'homme') as 'homme' | 'femme',
            city: supabaseProfile.city || 'Kinshasa',
            profession: supabaseProfile.profession || '',
            religion: supabaseProfile.religion || '',
            bio: supabaseProfile.bio || '',
            photoUrl: supabaseProfile.photo_url || '',
            photoGallery: (supabaseProfile.photo_gallery as string[]) || [],
            interests: (supabaseProfile.interests as string[]) || [],
            online: supabaseProfile.online ?? true,
            verified: supabaseProfile.verified ?? false,
            preferences: { ageMin: 18, ageMax: 50, city: 'Kinshasa', gender: 'tous', religion: '' },
            createdAt: supabaseProfile.created_at || new Date().toISOString(),
            lastSeen: supabaseProfile.last_seen || new Date().toISOString(),
          },
          currentScreen: 'main',
        });
        // Charger toutes les données (profils, matchs, messages, etc.)
        useKinzolaStore.getState().fetchAllData().catch(console.error);
      }
    } else if (!supabaseAuthenticated && !authLoading) {
      const storeState = useKinzolaStore.getState();
      // Reset Zustand if Supabase says logged out and Zustand thinks logged in
      if (storeState.isAuthenticated) {
        useKinzolaStore.setState({
          isAuthenticated: false,
          user: null,
          currentScreen: 'welcome',
          currentTab: 'discover',
        });
      }
    }
  }, [supabaseAuthenticated, supabaseProfile, authLoading]);

  // ✅ Hydration-safe mounted pattern
  // Avant mounted: SSR et client rendent les mêmes valeurs par défaut
  // Après mounted: les vraies valeurs (localStorage) sont appliquées
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  // Realtime remplace les faux messages simulés (Phase 5)
  // Les messages arrivent maintenant en temps réel via Supabase Realtime

  // ✅ Utilise les vraies valeurs uniquement après le premier render client
  const safeTheme = mounted ? theme : SSR_THEME;
  const safeTextSize = mounted ? textSize : SSR_TEXT_SIZE;
  const isLight = safeTheme === 'light';

  return (
    <div
      className="w-full h-[100dvh] overflow-hidden transition-colors duration-500"
      data-theme={safeTheme}
      data-text-size={String(safeTextSize)}
      suppressHydrationWarning
      style={{
        backgroundColor: isLight ? '#FFFFFF' : '#060E1A',
        color: isLight ? '#1a1a2e' : '#FFFFFF',
        fontSize: `${safeTextSize}px`,
        '--font-scale': safeTextSize / 16,
      } as React.CSSProperties}
    >
      {/* ─── Splash Screen — vidéo d'intro sur fond noir (z-200 au-dessus de tout) ─── */}
      <SplashScreen />

      {/* ─── Global Notification Sound Manager (invisible) ─── */}
      <NotificationSoundManager />

      {/* ─── Match Notification Banner (in-app toast en haut) ─── */}
      <MatchNotificationBanner />

      {/* ─── Message Notification Banner (WhatsApp-style) ─── */}
      <MessageNotificationBanner />

      {/* ─── PWA Install Banner (Android Chrome) ─── */}
      <PwaInstallBanner />

      <AnimatePresence mode="wait">
        {currentScreen === 'welcome' && (
          <motion.div
            key="welcome"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className="h-full w-full"
          >
            <WelcomeScreen />
          </motion.div>
        )}
        {currentScreen === 'login' && (
          <motion.div
            key="login"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className="h-full w-full"
          >
            <LoginScreen />
          </motion.div>
        )}
        {currentScreen === 'register' && (
          <motion.div
            key="register"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className="h-full w-full"
          >
            <RegisterScreen />
          </motion.div>
        )}
        {currentScreen === 'main' && (
          <motion.div
            key="main"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className="flex flex-col h-full relative"
          >
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {currentTab === 'discover' && <DiscoverScreen />}
              {currentTab === 'news' && <NewsScreen />}
              {currentTab === 'messages' && <MessagesScreen />}
              {currentTab === 'profile' && <ProfileScreen />}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays — slide up from bottom like modal sheets */}
      <AnimatePresence mode="wait">
        {showEditPersonalInfo && (
          <motion.div
            key="edit-personal-info"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayTransition}
            className="fixed inset-0 z-50"
          >
            <EditPersonalInfo />
          </motion.div>
        )}
        {showSettings && (
          <motion.div
            key="settings"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayTransition}
            className="fixed inset-0 z-50"
          >
            <SettingsScreen />
          </motion.div>
        )}
        {showEditProfile && (
          <motion.div
            key="edit-profile"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayTransition}
            className="fixed inset-0 z-50"
          >
            <EditProfile />
          </motion.div>
        )}
        {showProfileDetail && (
          <motion.div
            key="profile-detail"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayTransition}
            className="fixed inset-0 z-50"
          >
            <ProfileDetail />
          </motion.div>
        )}
        {showMatchModal && (
          <motion.div
            key="match-modal"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayTransition}
            className="fixed inset-0 z-50"
          >
            <MatchModal />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
