'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Kinzola] Erreur interceptée:', error);
  }, [error]);

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
          style={{ background: 'rgba(255, 77, 141, 0.1)' }}
        >
          <AlertTriangle
            className="w-10 h-10"
            style={{ color: '#FF4D8D' }}
          />
        </div>

        {/* Titre */}
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: '#FFFFFF' }}
        >
          Oups !
        </h1>

        {/* Description */}
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          Une erreur inattendue s&apos;est produite.
          Nos équipes ont été notifiées.
        </p>

        {/* Boutons d'action */}
        <div className="flex gap-3 w-full">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              boxShadow: '0 4px 15px rgba(43, 127, 255, 0.3)',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm cursor-pointer transition-all active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Home className="w-4 h-4" />
            Accueil
          </a>
        </div>

        {/* Error digest (debug) */}
        {error.digest && (
          <p
            className="text-[10px] mt-6 px-3 py-1.5 rounded-full"
            style={{
              color: 'rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            Code : {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
