'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2 } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';

export default function GridView() {
  const { profiles, likeProfile, selectProfile } = useKinzolaStore();

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
      className="scroll-optimized flex-1 overflow-y-auto px-4 pb-4"
      style={{ willChange: 'transform' }}
    >
      <div className="grid grid-cols-2 gap-3">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(15, 25, 50, 0.6)',
            }}
            onClick={() => selectProfile(profile)}
          >
            {/* Photo - 3:4 aspect ratio */}
            <div className="aspect-[3/4] relative overflow-hidden">
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Bottom gradient */}
              <div
                className="absolute inset-x-0 bottom-0 h-[60%]"
                style={{
                  background: 'linear-gradient(to top, rgba(6, 14, 26, 0.9) 0%, transparent 100%)',
                }}
              />
              
              {/* Online indicator - green dot with ring */}
              {profile.online && (
                <motion.div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                  }}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400" style={{
                    boxShadow: '0 0 6px rgba(74, 222, 128, 0.6)',
                  }} />
                  <span className="text-[9px] font-medium text-green-400">En ligne</span>
                </motion.div>
              )}

              {/* Verified - blue check top-left */}
              {profile.verified && (
                <div className="absolute top-3 left-3">
                  <VerifiedBadgeStatic size="sm" />
                </div>
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-bold text-white">{profile.name}, {profile.age}</h3>
                </div>
                <p className="text-[11px] text-white/60 mb-2">{profile.city}</p>
                <div className="flex flex-wrap gap-1">
                  {profile.interests.slice(0, 2).map(interest => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium text-white/70"
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

            {/* Like button - appears on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                likeProfile(profile.id);
              }}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              }}
            >
              <Heart className="w-4 h-4 text-white fill-white" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
