'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { supabase } from '@/lib/supabase/client';

/**
 * SplashScreen — écran d'intro avec vidéo sur fond noir.
 *
 * AFFICHÉ UNIQUEMENT AU PREMIER LANCEMENT.
 * Après ça, l'app vérifie la session Supabase et va directement
 * à l'écran principal (si connecté) ou à l'accueil (sinon).
 */
export default function SplashScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigatedRef = useRef(false);
  const { setScreen, setTab, isAuthenticated } = useKinzolaStore();

  const [step, setStep] = useState<'tap' | 'playing' | 'exiting'>('tap');
  const [visible, setVisible] = useState(true);
  const [skipSplash, setSkipSplash] = useState(false);

  // ─── Au montage : vérifier si le splash a déjà été vu ───
  useEffect(() => {
    const splashSeen = localStorage.getItem('kinzola-splash-seen');
    if (splashSeen) {
      // Le splash a déjà été vu → skip directement
      setSkipSplash(true);
      navigateAway();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Navigate to the correct screen after splash ───
  const navigateAway = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setStep('exiting');

    // Check Supabase session first (source of truth for auth)
    let hasSession = false;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      hasSession = !!sessionData.session;
    } catch {
      // If Supabase check fails, fall back to Zustand state
    }

    if (hasSession || isAuthenticated) {
      setTab('discover');
      setScreen('main');
    } else {
      setScreen('welcome');
    }

    // Petit délai pour la transition visuelle
    setTimeout(() => {
      setVisible(false);
    }, 300);
  }, [setScreen, setTab, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── On tap: unlock audio + play video ───
  const handleStart = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Marquer le splash comme vu pour les prochaines ouvertures
    localStorage.setItem('kinzola-splash-seen', 'true');

    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        ctx.close().catch(() => {});
      }
    } catch {
      // AudioContext non supporté
    }

    try {
      await video.play();
      setStep('playing');
    } catch {
      video.muted = true;
      try {
        await video.play();
        setStep('playing');
      } catch {
        navigateAway();
      }
    }
  }, [navigateAway]);

  // ─── Fallback : si la vidéo ne se lance pas après 4s ───
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (navigatedRef.current || step !== 'playing') return;
      const video = videoRef.current;
      if (video && video.readyState < 2) {
        navigateAway();
      }
    }, 4000);
    return () => clearTimeout(fallback);
  }, [navigateAway, step]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.src = '';
      }
    };
  }, []);

  // Si le splash doit être skippé, ne rien rendre
  if (skipSplash) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="kinzola-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' as const }}
          className="fixed inset-0 z-[200] flex items-center justify-center select-none"
          style={{ backgroundColor: '#000000', touchAction: 'manipulation' }}
        >
          {/* ─── Hidden video (preload, always ready) ─── */}
          <video
            ref={videoRef}
            src="/splash-intro.mp4"
            playsInline
            preload="auto"
            onEnded={navigateAway}
            onError={navigateAway}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              imageRendering: 'auto',
              opacity: step === 'tap' ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* ─── ÉTAPE 1 : Appuyez pour démarrer ─── */}
          {step === 'tap' && (
            <motion.button
              key="tap-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              onClick={handleStart}
              className="absolute inset-0 flex flex-col items-center justify-center z-10 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            >
              {/* Pulsating heartbeat icon */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ type: 'tween' as const, duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }}
                className="mb-8"
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </motion.div>

              {/* App name */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold mb-3"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Kinzola
              </motion.h1>

              {/* Tap instruction */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-sm mb-6"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Appuyez pour démarrer
              </motion.p>

              {/* Pulsating ring */}
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ type: 'tween' as const, duration: 2, repeat: Infinity, ease: 'easeOut' as const }}
                className="absolute w-24 h-24 rounded-full"
                style={{ border: '1px solid rgba(255, 77, 141, 0.3)' }}
              />
            </motion.button>
          )}

          {/* ─── ÉTAPE 2 : Bouton Passer (pendant la vidéo) ─── */}
          {step === 'playing' && (
            <motion.button
              key="skip-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              onClick={navigateAway}
              className="absolute bottom-8 right-5 px-5 py-2.5 rounded-full cursor-pointer z-10 active:scale-95 transition-transform"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Passer
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
