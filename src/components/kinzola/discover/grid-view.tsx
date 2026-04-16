'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, X, Star, MessageCircle } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';

export default function GridView() {
  const { profiles, likeProfile, passProfile, selectProfile, discoverIntent } = useKinzolaStore();

  if (profiles.length === 0) {
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

  return (
    <div
      className="scroll-optimized flex-1 overflow-y-auto px-3 pb-4"
      style={{ willChange: 'transform' }}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 25, 50, 0.6)',
            }}
          >
            {/* Photo - 3:4 aspect ratio */}
            <div
              className="aspect-[3/4] relative overflow-hidden cursor-pointer"
              onClick={() => selectProfile(profile)}
            >
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
              {/* Bottom gradient */}
              <div
                className="absolute inset-x-0 bottom-0 h-[65%]"
                style={{
                  background: 'linear-gradient(to top, rgba(6, 14, 26, 0.92) 0%, rgba(6, 14, 26, 0.4) 60%, transparent 100%)',
                }}
              />
              
              {/* Online indicator */}
              {profile.online && (
                <motion.div
                  className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-green-400"
                  style={{
                    boxShadow: '0 0 0 2px rgba(6, 14, 26, 0.8), 0 0 8px rgba(74, 222, 128, 0.6)',
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ type: 'tween', duration: 2, repeat: Infinity }}
                />
              )}

              {/* Verified badge */}
              {profile.verified && (
                <div className="absolute top-2.5 left-2.5">
                  <VerifiedBadgeStatic size="sm" />
                </div>
              )}

              {/* Distance badge */}
              {profile.distance != null && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white"
                  style={{ background: 'rgba(43, 127, 255, 0.7)', backdropFilter: 'blur(8px)' }}>
                  {profile.distance} km
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="text-[13px] font-bold text-white">{profile.name}, {profile.age}</h3>
                </div>
                <p className="text-[10px] text-white/50 mb-0.5">{profile.city}</p>
                {profile.profession && (
                  <p className="text-[9px] text-white/40 mb-1.5">{profile.profession}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {profile.interests.slice(0, 2).map(interest => (
                    <span
                      key={interest}
                      className="px-1.5 py-0.5 rounded-full text-[8px] font-medium text-white/60"
                      style={{
                        background: 'rgba(15, 25, 50, 0.6)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons - always visible at bottom */}
            <div className="flex items-center justify-around py-2 px-1"
              style={{ background: 'rgba(10, 20, 40, 0.8)' }}>
              {/* Pass */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); passProfile(profile.id); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </motion.button>

              {/* Like / Amitié */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); likeProfile(profile.id); }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: discoverIntent === 'amitie'
                    ? 'linear-gradient(135deg, #2B7FFF, #1B8FFF)'
                    : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  boxShadow: '0 0 15px rgba(255, 77, 141, 0.3)',
                }}
              >
                {discoverIntent === 'amitie'
                  ? <MessageCircle className="w-4 h-4 text-white" />
                  : <Heart className="w-4 h-4 text-white fill-white" />
                }
              </motion.button>

              {/* Super Like */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); likeProfile(profile.id); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(43, 127, 255, 0.15)',
                  border: '1px solid rgba(43, 127, 255, 0.3)',
                }}
              >
                <Star className="w-3.5 h-3.5 text-kinzola-blue" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
