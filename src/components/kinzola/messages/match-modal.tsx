'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Compass } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

const CONFETTI_COLORS = ['#FF4D8D', '#2B7FFF', '#FFD84D'];

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function ConfettiParticle({ index }: { index: number }) {
  // Pre-compute stable values (no Math.random in render)
  const left = seededRandom(index * 2 + 1) * 100;
  const top = seededRandom(index * 2 + 2) * 100;
  const xOffset1 = seededRandom(index * 3 + 1) * 60 - 30;
  const xOffset2 = seededRandom(index * 3 + 2) * 60 - 30;

  return (
    <motion.div
      key={index}
      className="absolute w-2 h-2 rounded-full"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        backgroundColor: CONFETTI_COLORS[index % 3],
      }}
      animate={{
        y: [0, -100, 50],
        x: [0, xOffset1, xOffset2],
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        rotate: [0, 360],
      }}
      transition={{
        type: 'tween' as const,
        duration: 2,
        delay: index * 0.1,
        repeat: Infinity,
        repeatDelay: 1,
      }}
    />
  );
}

export default function MatchModal() {
  const { showMatchModal, matchProfile, setShowMatchModal, setTab, conversations, openChat } = useKinzolaStore();

  if (!showMatchModal || !matchProfile) return null;

  const handleClose = () => setShowMatchModal(false, null);

  const handleMessage = () => {
    const { conversations, openChat, setTab } = useKinzolaStore.getState();
    const conv = conversations.find(c => c.participant.id === matchProfile.id);
    if (conv) {
      setTab('messages');
      openChat(conv.id);
    } else {
      // No conversation yet — switch to messages, fetchAllData will load it
      setTab('messages');
      // Try to reload conversations
      useKinzolaStore.getState().fetchAllData().catch(console.error);
    }
    handleClose();
  };

  const handleContinue = () => {
    setTab('discover');
    handleClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

      {/* Confetti particles */}
      {Array.from({ length: 24 }, (_, i) => (
        <ConfettiParticle key={`confetti-${i}`} index={i} />
      ))}

      {/* Content */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative z-10 w-80 flex flex-col items-center text-center px-6"
      >
        {/* Large animated heart with gradient fill */}
        <motion.div
          className="relative mb-6"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ type: 'tween' as const, duration: 1, repeat: Infinity }}
        >
          <Heart
            className="w-20 h-20 text-kinzola-pink fill-kinzola-pink"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(255, 77, 141, 0.5))',
            }}
          />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[32px] font-bold mb-2 text-white"
        >
          C&apos;est un match! 🎉
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-kinzola-muted text-sm mb-8"
        >
          Vous vous plaisez mutuellement
        </motion.p>

        {/* Profile photos side by side with gradient rings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 mb-6"
        >
          <div
            className="w-24 h-24 rounded-full p-[3px]"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            }}
          >
            <img
              src="https://i.pravatar.cc/300?img=44"
              alt="You"
              className="w-full h-full rounded-full object-cover"
              style={{ border: '2px solid #060E1A' }}
            />
          </div>

          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ type: 'tween' as const, duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Heart className="w-8 h-8 text-kinzola-pink fill-kinzola-pink" />
          </motion.div>

          <div
            className="w-24 h-24 rounded-full p-[3px]"
            style={{
              background: 'linear-gradient(135deg, #FF4D8D, #2B7FFF)',
            }}
          >
            <img
              src={matchProfile.photoUrl}
              alt={matchProfile.name}
              className="w-full h-full rounded-full object-cover"
              style={{ border: '2px solid #060E1A' }}
            />
          </div>
        </motion.div>

        {/* Name */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg font-semibold mb-8 text-white"
        >
          Vous et {matchProfile.name}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-3"
        >
          <button
            onClick={handleMessage}
            className="w-full h-12 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FF4D8D 0%, #FF2D6D 100%)',
              boxShadow: '0 0 30px rgba(255, 77, 141, 0.4)',
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Envoyer un message
          </button>
          <button
            onClick={handleContinue}
            className="w-full h-12 rounded-2xl glass text-white font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/10"
          >
            <Compass className="w-4 h-4" />
            Continuer à découvrir
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
