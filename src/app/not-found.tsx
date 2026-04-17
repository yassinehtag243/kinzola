'use client';

import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#060E1A' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        {/* Icône */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(43, 127, 255, 0.1)' }}
        >
          <SearchX className="w-10 h-10" style={{ color: '#2B7FFF' }} />
        </div>

        {/* 404 */}
        <h1
          className="text-6xl font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>

        {/* Titre */}
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: '#FFFFFF' }}
        >
          Page introuvable
        </h2>

        {/* Description */}
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          La page que vous cherchez n&apos;existe pas
          ou a été déplacée.
        </p>

        {/* Bouton retour */}
        <a
          href="/"
          className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            boxShadow: '0 4px 15px rgba(43, 127, 255, 0.3)',
          }}
        >
          Retour à l&apos;accueil
        </a>
      </motion.div>
    </div>
  );
}
