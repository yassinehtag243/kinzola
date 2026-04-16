'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Star,
  ChevronRight,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';
import type { Profile } from '@/types';

// ---------------------------------------------------------------------------
// SimpleProfileCard — static card with profile info (no drag)
// ---------------------------------------------------------------------------
function SimpleProfileCard({
  profile,
  isTop,
  stackIndex,
}: {
  profile: Profile;
  isTop: boolean;
  stackIndex: number;
}) {
  if (!isTop) {
    // Background cards: small stack effect
    const scale = 1 - stackIndex * 0.05;
    const yOffset = stackIndex * -10;
    return (
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          transform: `translateY(${yOffset}px) scale(${scale})`,
          zIndex: 10 - stackIndex,
        }}
      >
        <img
          src={profile.photoUrl}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/50 rounded-3xl" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 rounded-3xl overflow-hidden"
      style={{
        zIndex: 10,
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Photo */}
      <img
        src={profile.photoUrl}
        alt={profile.name}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Dark bottom gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-[65%]"
        style={{
          background:
            'linear-gradient(to top, rgba(6, 14, 26, 0.95) 0%, rgba(6, 14, 26, 0.6) 50%, transparent 100%)',
        }}
      />

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Name & age */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[22px] font-bold text-white">
            {profile.name}, {profile.age}
          </h3>
          {profile.verified && <VerifiedBadgeStatic size="md" />}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-3.5 h-3.5 text-white/60" />
          <p className="text-white/70 text-sm">
            {profile.city}
            {profile.distance ? ` \u2022 ${profile.distance}km` : ''}
          </p>
        </div>

        {/* Profession */}
        <p className="text-white/60 text-sm mb-3">{profile.profession}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-white/50 text-xs mb-3 line-clamp-2">
            {profile.bio}
          </p>
        )}

        {/* Interest tags */}
        <div className="flex flex-wrap gap-1.5">
          {profile.interests.slice(0, 3).map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium text-white/80"
              style={{
                background: 'rgba(15, 25, 50, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'rgba(255, 77, 141, 0.08)',
            border: '2px solid rgba(255, 77, 141, 0.15)',
          }}
        >
          <Heart className="w-12 h-12 text-kinzola-pink animate-heartbeat" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Plus de profils pour le moment
        </h3>
        <p className="text-kinzola-muted text-sm max-w-[260px] leading-relaxed">
          Revenez plus tard pour découvrir de nouveaux profils dans votre zone
        </p>

        <div className="flex items-center gap-2 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-kinzola-pink/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-kinzola-blue/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-kinzola-pink/40" />
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SwipeView — simplified: cards + big buttons, no drag
// ---------------------------------------------------------------------------
export default function SwipeView() {
  const {
    profiles,
    likeProfile,
    passProfile,
    useSuperLike: superLikeProfile,
    selectProfile,
    discoverIntent,
    superLikesRemaining,
  } = useKinzolaStore();

  const isAnimatingRef = useRef(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const visibleProfiles = profiles.slice(0, 3);

  // Handle action button press
  const handleAction = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (isAnimatingRef.current || visibleProfiles.length === 0) return;
      isAnimatingRef.current = true;

      const topProfile = visibleProfiles[0];

      // Trigger exit animation
      setExitDir(direction);

      // Execute the store action immediately
      setTimeout(() => {
        if (direction === 'right') {
          likeProfile(topProfile.id);
        } else if (direction === 'left') {
          passProfile(topProfile.id);
        } else {
          superLikeProfile(topProfile.id);
        }

        setExitDir(null);
        setAnimKey((k) => k + 1);
        isAnimatingRef.current = false;
      }, 300);
    },
    [visibleProfiles, likeProfile, passProfile, superLikeProfile],
  );

  if (visibleProfiles.length === 0) {
    return <EmptyState />;
  }

  // Exit animation variants
  const exitVariants = {
    left: { x: -500, opacity: 0, rotate: -15 },
    right: { x: 500, opacity: 0, rotate: 15 },
    up: { y: -500, opacity: 0, scale: 0.5 },
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
      {/* ===================== ACTION BUTTONS (top) ===================== */}
      <div className="flex items-center gap-5 mb-4">
        {/* ---- Pass (red X) ---- */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleAction('left')}
          disabled={!!exitDir}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: 'rgba(15, 25, 50, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)',
          }}
          aria-label="Passer"
        >
          <X className="w-5 h-5 text-red-400" />
        </motion.button>

        {/* ---- Super Like (blue star) ---- */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleAction('up')}
          disabled={!!exitDir || superLikesRemaining <= 0}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none relative"
          style={{
            background: 'rgba(15, 25, 50, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(43, 127, 255, 0.4)',
            boxShadow: '0 0 12px rgba(43, 127, 255, 0.15)',
          }}
          aria-label="Super like"
        >
          <Star className="w-5 h-5 text-kinzola-blue" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-kinzola-blue text-[8px] font-bold text-white flex items-center justify-center px-0.5 shadow-lg">
            {superLikesRemaining}
          </span>
        </motion.button>

        {/* ---- Like / Amour / Amitié (gradient) ---- */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleAction('right')}
          disabled={!!exitDir}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background:
              discoverIntent === 'amitie'
                ? 'linear-gradient(135deg, #2B7FFF, #1B8FFF)'
                : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            boxShadow:
              discoverIntent === 'amitie'
                ? '0 0 20px rgba(43, 127, 255, 0.5)'
                : '0 0 20px rgba(255, 77, 141, 0.5)',
          }}
          aria-label={
            discoverIntent === 'amitie'
              ? "Demande d'amitié"
              : "J'aime"
          }
        >
          {discoverIntent === 'amitie' ? (
            <UserPlus className="w-5 h-5 text-white" />
          ) : (
            <Heart className="w-5 h-5 text-white fill-white" />
          )}
        </motion.button>
      </div>

      {/* ===================== CARD STACK ===================== */}
      <div
        className="relative w-full max-w-md"
        style={{ height: 'min(60vh, 500px)' }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={visibleProfiles[0]?.id ?? animKey}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={
              exitDir
                ? {
                    ...exitVariants[exitDir],
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  }
                : { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }
            }
            exit={
              exitDir
                ? {
                    ...exitVariants[exitDir],
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  }
                : undefined
            }
            className="absolute inset-0"
            style={{ zIndex: 10 }}
          >
            <SimpleProfileCard
              profile={visibleProfiles[0]}
              isTop
              stackIndex={0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Background cards */}
        {visibleProfiles.slice(1).map((profile, i) => (
          <SimpleProfileCard
            key={profile.id}
            profile={profile}
            isTop={false}
            stackIndex={i + 1}
          />
        ))}

        {/* View profile button */}
        {visibleProfiles.length > 0 && !exitDir && (
          <button
            onClick={() => selectProfile(visibleProfiles[0])}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors duration-200"
            aria-label="Voir le profil"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
