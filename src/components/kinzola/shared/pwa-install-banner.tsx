'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePwaInstall } from '@/hooks/use-pwa-install';

/**
 * Banner d'installation PWA — apparaît en bas de l'écran
 * uniquement si beforeinstallprompt est disponible (Android Chrome/Edge/Opera).
 *
 * Design : barre fixe en bas avec gradient Kinzola, discret mais visible.
 * Se souvient du dismiss pendant 7 jours via localStorage.
 */
export default function PwaInstallBanner() {
  const { isInstallable, isInstalled, install, dismiss } = usePwaInstall();

  // Ne rien afficher si :
  // - L'app est déjà installée
  // - beforeinstallprompt n'est pas disponible
  // - L'utilisateur a dismissé récemment
  if (!isInstallable || isInstalled) return null;

  const handleInstall = async () => {
    const accepted = await install();
    if (!accepted) {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[300] max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4 shadow-2xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, #0A1F3C 0%, #1a2744 50%, #0A1F3C 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Logo Kinzola */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  Installer Kinzola
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Accès rapide depuis l'écran d'accueil
                </p>
              </div>

              {/* Boutons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={dismiss}
                  className="text-white/40 hover:text-white/60 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstall}
                  className="text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #1a5fd4)',
                    boxShadow: '0 0 20px rgba(43, 127, 255, 0.3)',
                  }}
                >
                  Installer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
