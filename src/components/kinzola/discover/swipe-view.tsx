'use client';

import { useRef, memo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Heart, Star, ChevronRight, CheckCircle2, MapPin, UserPlus } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';
import type { Profile } from '@/types';

const SwipeCard = memo(function SwipeCard({ profile, onSwipe, isTop, stackIndex, intentLabel, intentColor }: { profile: Profile; onSwipe: (dir: 'left' | 'right' | 'up') => void; isTop: boolean; stackIndex: number; intentLabel: string; intentColor: string }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    } else if (info.offset.y < -threshold) {
      onSwipe('up');
    }
  };

  if (!isTop) {
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
        <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing swipe-card"
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden" style={{
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
      }}>
        <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        
        {/* Very dark bottom gradient for readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-[65%]"
          style={{
            background: 'linear-gradient(to top, rgba(6, 14, 26, 0.95) 0%, rgba(6, 14, 26, 0.6) 50%, transparent 100%)',
          }}
        />
        
        {/* Like indicator - shows Amitié or Amour */}
        <motion.div
          className="absolute top-8 right-6 px-6 py-2 rounded-xl border-[3px] font-bold text-2xl rotate-12"
          style={{ opacity: likeOpacity, borderColor: intentColor, color: intentColor }}
        >
          {intentLabel}
        </motion.div>
        
        {/* Pass indicator */}
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-8 left-6 px-6 py-2 rounded-xl border-[3px] border-red-400 text-red-400 font-bold text-2xl -rotate-12"
        >
          PASS
        </motion.div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[22px] font-bold text-white">{profile.name}, {profile.age}</h3>
            {profile.verified && (
              <VerifiedBadgeStatic size="md" />
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-white/60" />
            <p className="text-white/70 text-sm">
              {profile.city}{profile.distance ? ` • ${profile.distance}km` : ''}
            </p>
          </div>
          <p className="text-white/60 text-sm mb-3">{profile.profession}</p>
          {profile.bio && (
            <p className="text-white/50 text-xs mb-3 line-clamp-2">{profile.bio}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map(interest => (
              <span
                key={interest}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium text-white/80"
                style={{
                  background: 'rgba(15, 25, 50, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function SwipeView() {
  const { profiles, likeProfile, passProfile, selectProfile, discoverIntent } = useKinzolaStore();
  const stackRef = useRef<HTMLDivElement>(null);

  const visibleProfiles = profiles.slice(0, 3);

  // Determine intent label and color for swipe card indicator
  const intentLabel = discoverIntent === 'amitie' ? 'AMITIÉ' : 'AMOUR';
  const intentColor = discoverIntent === 'amitie' ? '#2B7FFF' : '#FF4D8D';

  if (visibleProfiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Heart className="w-16 h-16 text-kinzola-pink mx-auto mb-4 animate-heartbeat" />
          <h3 className="text-xl font-bold mb-2">Plus de profils pour le moment</h3>
          <p className="text-kinzola-muted text-sm">Revenez plus tard pour découvrir de nouveaux profils</p>
        </div>
      </div>
    );
  }

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const topProfile = visibleProfiles[0];
    if (direction === 'right') {
      likeProfile(topProfile.id);
    } else if (direction === 'left') {
      passProfile(topProfile.id);
    } else {
      likeProfile(topProfile.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2">
      {/* Card stack */}
      <div ref={stackRef} className="relative w-full max-w-md" style={{ height: 'min(55vh, 430px)' }}>
        {[...visibleProfiles].reverse().map((profile, index) => {
          const stackIndex = visibleProfiles.length - 1 - index;
          return (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={index === visibleProfiles.length - 1}
              stackIndex={stackIndex}
              intentLabel={intentLabel}
              intentColor={intentColor}
            />
          );
        })}
        {/* View profile button */}
        {visibleProfiles.length > 0 && (
          <button
            onClick={() => selectProfile(visibleProfiles[0])}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Action Buttons - OVERLAID on bottom of card */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-4">
          {/* Pass */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('left')}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: 'rgba(10, 20, 40, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <X className="w-6 h-6 text-red-400" />
          </motion.button>

          {/* Star / Super Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('up')}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: 'rgba(10, 20, 40, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(43, 127, 255, 0.4)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <Star className="w-5 h-5 text-kinzola-blue" />
          </motion.button>

          {/* Like / Amitié */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('right')}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: discoverIntent === 'amitie'
                ? 'linear-gradient(135deg, #2B7FFF, #1B8FFF)'
                : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              boxShadow: discoverIntent === 'amitie'
                ? '0 0 25px rgba(43, 127, 255, 0.5)'
                : '0 0 25px rgba(255, 77, 141, 0.5)',
              border: 'none',
            }}
          >
            {discoverIntent === 'amitie'
              ? <UserPlus className="w-6 h-6 text-white" />
              : <Heart className="w-6 h-6 text-white fill-white" />
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}
