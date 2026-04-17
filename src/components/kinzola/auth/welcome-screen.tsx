'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// Deterministic pseudo-random based on seed (avoids hydration mismatch)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function WelcomeScreen() {
  const { setScreen } = useKinzolaStore();

  // Generate floating items once on client with stable seed (no hydration mismatch)
  const [mounted, setMounted] = useState(false);
  const floatingItems = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: `${10 + seededRandom(i * 3 + 1) * 80}%`,
      y: `${10 + seededRandom(i * 3 + 2) * 80}%`,
      delay: i * 0.3,
      duration: 3 + seededRandom(i * 3 + 3) * 2,
      type: i % 3 === 0 ? 'heart' : i % 3 === 1 ? 'star' : 'dot',
      size: i % 3 === 0 ? 'w-3 h-3' : i % 3 === 1 ? 'w-2 h-2' : 'w-1.5 h-1.5',
    }));
  }, [mounted]);

  // Ensure client-only mount for floating items (useEffect, not useState initializer)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Subtle radial vignette for depth */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(43, 127, 255, 0.06) 0%, transparent 70%)' }} />

      {/* Floating hearts/stars — only rendered client-side */}
      {floatingItems.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.size} rounded-full pointer-events-none`}
          style={{
            left: item.x,
            top: item.y,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            type: 'tween' as const,
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut' as const,
          }}
        >
          {item.type === 'heart' ? (
            <Heart
              className="w-full h-full fill-kinzola-pink/40 text-kinzola-pink/40"
            />
          ) : item.type === 'star' ? (
            <Sparkles className="w-full h-full text-kinzola-blue/40" />
          ) : (
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
      >
        {/* Logo — prominent on black background */}
        <motion.div
          className="relative mb-4"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
        >
          {/* Soft glow behind logo */}
          <div
            className="absolute inset-0 -m-6 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(43, 127, 255, 0.2) 0%, rgba(255, 77, 141, 0.15) 50%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
          <div className="relative w-36 h-36">
            <img
              src="/kinzola-logo.png"
              alt="Kinzola"
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* App Name — full gradient on black background */}
        <motion.h1
          className="text-6xl font-bold mb-4 tracking-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span
            className="gradient-text"
            style={{
              textShadow: '0 0 30px rgba(43, 127, 255, 0.5), 0 0 60px rgba(255, 77, 141, 0.3)',
            }}
          >
            Kinzola
          </span>
        </motion.h1>

        {/* Slogan */}
        <motion.p
          className="text-sm font-medium tracking-wide mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Connexion d&apos;âmes au Congo
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px', fontStyle: 'italic', fontWeight: 300 }}
        >
          Des rencontres sérieuses,
        </motion.p>
        <motion.p
          className="mb-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px', fontStyle: 'italic', fontWeight: 300 }}
        >
          des relations durables
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="w-full max-w-xs space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          {/* Primary gradient button with glow */}
          <button
            onClick={() => setScreen('login')}
            className="w-full h-14 rounded-2xl text-white font-semibold text-lg transition-all duration-300 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FF4D8D 0%, #FF2D6D 100%)',
              boxShadow: '0 0 30px rgba(255, 77, 141, 0.4), 0 8px 32px rgba(255, 77, 141, 0.2)',
            }}
          >
            Se connecter
          </button>

          {/* Outlined glass button with gradient border */}
          <div className="gradient-border">
            <button
              onClick={() => setScreen('register')}
              className="w-full h-14 rounded-2xl glass text-white font-semibold text-lg transition-all duration-300 hover:bg-white/8 active:scale-[0.98]"
            >
              Créer un compte
            </button>
          </div>
        </motion.div>

        {/* Terms */}
        <motion.p
          className="mt-10 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '11px' }}
        >
          En continuant, vous acceptez nos Conditions d&apos;utilisation et notre Politique de confidentialité
        </motion.p>
      </motion.div>
    </div>
  );
}
