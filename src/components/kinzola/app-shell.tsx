'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKinzolaStore } from '@/store/use-kinzola-store';
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
  } = useKinzolaStore();

  // ✅ Hydration-safe mounted pattern
  // Avant mounted: SSR et client rendent les mêmes valeurs par défaut
  // Après mounted: les vraies valeurs (localStorage) sont appliquées
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

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
            className="flex flex-col h-full"
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
