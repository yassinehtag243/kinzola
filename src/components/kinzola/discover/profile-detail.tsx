'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, X, CheckCircle2, MapPin, Briefcase, MoreVertical, Flag, Ban, Star } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';
import { formatLastSeen } from '@/lib/format-time';

// ─── Gold particle burst for super like animation ───
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i * 360) / 8,
  distance: 40 + Math.random() * 20,
}));

export default function ProfileDetail() {
  // All hooks must be called before any early return
  const selectedProfile = useKinzolaStore((s) => s.selectedProfile);
  const setShowProfileDetail = useKinzolaStore((s) => s.setShowProfileDetail);
  const likeProfile = useKinzolaStore((s) => s.likeProfile);
  const passProfile = useKinzolaStore((s) => s.passProfile);
  const openChat = useKinzolaStore((s) => s.openChat);
  const superLikeAction = useKinzolaStore((s) => s.useSuperLike);
  const superLikesRemaining = useKinzolaStore((s) => s.superLikesRemaining);
  const theme = useKinzolaStore((s) => s.theme);

  const isLight = theme === 'light';

  const [showMenu, setShowMenu] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [superLikeAnimating, setSuperLikeAnimating] = useState(false);
  const [showSuperLikeToast, setShowSuperLikeToast] = useState(false);
  const [clientNow, setClientNow] = useState(() => new Date());

  const likeAnimatingRef = useRef(false);
  const superLikeAnimatingRef = useRef(false);

  // Update client time every minute for last seen
  useEffect(() => {
    const id = setInterval(() => setClientNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const handleLike = useCallback(() => {
    const profile = useKinzolaStore.getState().selectedProfile;
    if (!profile || likeAnimatingRef.current) return;
    likeAnimatingRef.current = true;
    setLikeAnimating(true);
    useKinzolaStore.getState().likeProfile(profile.id);
    setTimeout(() => {
      likeAnimatingRef.current = false;
      setLikeAnimating(false);
      useKinzolaStore.getState().setShowProfileDetail(false);
    }, 500);
  }, []);

  const handlePass = useCallback(() => {
    const profile = useKinzolaStore.getState().selectedProfile;
    if (!profile) return;
    useKinzolaStore.getState().passProfile(profile.id);
    useKinzolaStore.getState().setShowProfileDetail(false);
  }, []);

  const handleSuperLike = useCallback(() => {
    const state = useKinzolaStore.getState();
    const profile = state.selectedProfile;
    if (!profile || superLikeAnimatingRef.current || state.superLikesRemaining <= 0) return;
    superLikeAnimatingRef.current = true;
    setSuperLikeAnimating(true);
    setShowSuperLikeToast(true);
    state.useSuperLike(profile.id);
    setTimeout(() => {
      superLikeAnimatingRef.current = false;
      setSuperLikeAnimating(false);
      useKinzolaStore.getState().setShowProfileDetail(false);
    }, 1200);
    setTimeout(() => setShowSuperLikeToast(false), 2000);
  }, []);

  const handleMessage = useCallback(() => {
    const store = useKinzolaStore.getState();
    const profile = store.selectedProfile;
    if (!profile) return;
    const conv = store.conversations.find(c => c.participant.id === profile.id);
    if (conv) {
      store.openChat(conv.id);
    }
    store.setShowProfileDetail(false);
  }, []);

  // Early return AFTER all hooks
  if (!selectedProfile) return null;

  const photos = selectedProfile.photoGallery.length > 0
    ? selectedProfile.photoGallery
    : [selectedProfile.photoUrl];

  const overlayGradient = isLight
    ? 'linear-gradient(to top, #FFFFFF 0%, rgba(255, 255, 255, 0.85) 30%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)'
    : 'linear-gradient(to top, #060E1A 0%, rgba(6, 14, 26, 0.8) 30%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-kinzola-bg flex flex-col"
    >
      {/* ─── Super Like Toast ─── */}
      <AnimatePresence>
        {showSuperLikeToast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #2B7FFF)',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
            }}
          >
            <span className="text-sm font-bold text-white">Super Like envoyé ! ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Photo Section ─── */}
      <div className="relative aspect-[4/5] max-h-[60vh] flex-shrink-0">
        <img
          src={photos[currentPhoto] || selectedProfile.photoUrl}
          alt={selectedProfile.name}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: overlayGradient }}
        />

        {/* Back button */}
        <button
          onClick={() => setShowProfileDetail(false)}
          className="absolute top-5 left-5 w-10 h-10 rounded-full glass flex items-center justify-center z-10 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* More menu */}
        <div className="absolute top-5 right-5 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-12 right-0 glass-strong rounded-xl overflow-hidden min-w-[160px] z-20"
            >
              <button className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer">
                <Flag className="w-4 h-4" />
                Signaler
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer">
                <Ban className="w-4 h-4" />
                Bloquer
              </button>
            </motion.div>
          )}
        </div>

        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={`photo-dot-${i}`}
                onClick={() => setCurrentPhoto(i)}
                className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: i === currentPhoto ? '24px' : '8px',
                  background: i === currentPhoto ? 'white' : 'rgba(255, 255, 255, 0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Info Section ─── */}
      <div className="flex-1 overflow-y-auto -mt-4 relative z-10 px-5">
        {/* Name & badges & online indicator */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[26px] font-bold">{selectedProfile.name}, {selectedProfile.age}</h2>
          {selectedProfile.verified && <VerifiedBadgeStatic size="md" />}
          {selectedProfile.online ? (
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0"
              animate={{
                boxShadow: [
                  '0 0 6px rgba(74, 222, 128, 0.4)',
                  '0 0 12px rgba(74, 222, 128, 0.7)',
                  '0 0 6px rgba(74, 222, 128, 0.4)',
                ],
              }}
              transition={{ type: 'tween' as const, duration: 2, repeat: Infinity }}
            />
          ) : null}
        </div>

        {/* Online / Last seen */}
        <div className="mb-3">
          {selectedProfile.online ? (
            <span className="text-xs font-medium" style={{ color: '#4ade80' }}>En ligne</span>
          ) : (
            <span className="text-xs text-kinzola-muted">
              Dernière connexion {formatLastSeen(selectedProfile.lastSeen, clientNow)}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-sm text-kinzola-muted">
            <MapPin className="w-3.5 h-3.5" />
            {selectedProfile.city}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-kinzola-muted">
            <Briefcase className="w-3.5 h-3.5" />
            {selectedProfile.profession}
          </span>
        </div>

        {/* Bio */}
        {selectedProfile.bio && (
          <div className="mb-4">
            <p className="text-sm text-white/80 leading-relaxed">{selectedProfile.bio}</p>
          </div>
        )}

        {/* Interests */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-kinzola-muted mb-2">Centres d&apos;intérêt</h3>
          <div className="flex flex-wrap gap-2">
            {selectedProfile.interests.map(interest => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(255, 77, 141, 0.15))',
                  color: '#8899B4',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Action Bar ─── */}
      <div className="flex items-center gap-3 px-5 py-4 safe-bottom flex-shrink-0">
        {/* Pass button - Red border with X */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handlePass}
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{
            background: 'rgba(15, 25, 50, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <X className="w-5 h-5 text-red-400" />
        </motion.button>

        {/* Super Like button - Gradient gold/blue with star */}
        <div className="relative">
          {/* Gold/blue gradient flash behind button on animate */}
          <AnimatePresence>
            {superLikeAnimating && (
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' as const }}
                className="absolute inset-0 rounded-full z-0"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #2B7FFF)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Gold particles burst */}
          <AnimatePresence>
            {superLikeAnimating && PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' as const }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full z-20"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)',
                  marginLeft: '-4px',
                  marginTop: '-4px',
                }}
              />
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleSuperLike}
            disabled={superLikesRemaining <= 0}
            className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #2B7FFF)',
              boxShadow: superLikesRemaining > 0
                ? '0 0 25px rgba(255, 215, 0, 0.3)'
                : 'none',
            }}
          >
            <motion.div
              animate={superLikeAnimating ? { rotate: 360 } : { rotate: 0 }}
              transition={superLikeAnimating ? { duration: 0.5, ease: 'easeInOut' as const } : { duration: 0 }}
            >
              <Star className="w-5 h-5 text-white fill-white" />
            </motion.div>
          </motion.button>
          {/* Super likes remaining count */}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center z-20 text-[9px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              boxShadow: '0 0 6px rgba(255, 215, 0, 0.5)',
            }}
          >
            {superLikesRemaining}
          </div>
        </div>

        {/* Like button - Gradient blue→pink with animation */}
        <div className="relative">
          {/* Glow burst behind heart on animate */}
          <AnimatePresence>
            {likeAnimating && (
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className="absolute inset-0 rounded-full z-0"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              />
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              boxShadow: '0 0 30px rgba(255, 77, 141, 0.4)',
            }}
          >
            <motion.div
              animate={likeAnimating ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={likeAnimating ? {
                type: 'tween' as const,
                ease: 'easeInOut' as const,
                duration: 0.4,
              } : { duration: 0 }}
            >
              <Heart className="w-5 h-5 text-white fill-white" />
            </motion.div>
          </motion.button>
        </div>

        {/* Message button - Glass pill */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMessage}
          className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(15, 25, 50, 0.6)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          }}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Message</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
