'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, MessageCircle } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

/**
 * MatchNotificationBanner
 *
 * Bannière in-app qui glisse du haut de l'écran quand il y a un match.
 * Similaire aux notifications WhatsApp / Instagram / Tinder.
 *
 * - S'affiche pendant 5 secondes puis disparaît automatiquement
 * - Cliquable pour ouvrir la conversation
 * - Bouton fermer manuel
 * - Z-index très élevé pour être au-dessus de tout
 */
export default function MatchNotificationBanner() {
  const {
    showMatchModal,
    matchProfile,
    setShowMatchModal,
    setTab,
    conversations,
    openChat,
  } = useKinzolaStore();

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Réagir au match
  useEffect(() => {
    if (showMatchModal && matchProfile && !dismissed) {
      // Petit délai pour que la bannière apparaisse après le début du modal
      const showTimer = setTimeout(() => {
        setVisible(true);
      }, 300);

      // Auto-dismiss après 5 secondes
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setDismissed(false);
      }, 5300);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
      setDismissed(false);
    }
  }, [showMatchModal, matchProfile, dismissed]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  const handleTap = useCallback(() => {
    if (!matchProfile) return;
    const conv = conversations.find(c => c.participant.id === matchProfile.id);
    if (conv) {
      setTab('messages');
      openChat(conv.id);
    } else {
      setTab('messages');
    }
    setShowMatchModal(false, null);
    setVisible(false);
  }, [matchProfile, conversations, setTab, openChat, setShowMatchModal]);

  return (
    <AnimatePresence>
      {visible && matchProfile && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-2 right-2 z-[200] mx-auto max-w-md"
          style={{ marginTop: 'max(env(safe-area-inset-top, 8px), 8px)' }}
        >
          {/* Notification card */}
          <div
            className="relative overflow-hidden rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,141,0.95) 0%, rgba(255,45,109,0.95) 100%)',
              boxShadow: '0 8px 32px rgba(255,77,141,0.4), 0 2px 8px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={handleTap}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)',
              }}
            />

            {/* Match profile photo */}
            <div
              className="relative flex-shrink-0 w-12 h-12 rounded-full p-[2px]"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF, rgba(255,255,255,0.5))',
              }}
            >
              <img
                src={matchProfile.photoUrl}
                alt={matchProfile.name}
                className="w-full h-full rounded-full object-cover"
                style={{ border: '2px solid rgba(255,77,141,0.8)' }}
              />
              {/* Online dot */}
              {matchProfile.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-white fill-white flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  C&apos;est un match !
                </span>
              </div>
              <p className="text-white/90 text-xs mt-0.5 truncate">
                Tu et <span className="font-semibold">{matchProfile.name}</span> vous plaisez mutuellement
              </p>
              <div className="flex items-center gap-1 mt-1">
                <MessageCircle className="w-3 h-3 text-white/70" />
                <span className="text-white/70 text-[10px]">Appuie pour envoyer un message</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Animated pulse ring */}
            <motion.div
              className="absolute -left-1 -top-1 w-5 h-5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.3)' }}
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
