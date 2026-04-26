'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Eye, Settings, Edit3, CheckCircle2, MapPin,
  Briefcase, Plus, X, ChevronDown, ChevronUp, Camera,
  Sparkles, Users, ArrowLeft, MessageCircle, Star,
  Phone, Mail, GraduationCap, Ruler, Globe, Search, HeartPulse, Palette,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';
import type { Profile } from '@/types';

// ─── Count-up hook ───
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target <= 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

// ─── Bio component with expand/collapse ───
function BioSection({ bio, isLight }: { bio: string; isLight: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // Check if text exceeds ~3 lines (approx 72px at 14px line-height)
      setNeedsCollapse(textRef.current.scrollHeight > 72);
    }
  }, [bio]);

  return (
    <div className="mb-6">
      <h4 className="text-[11px] font-semibold text-kinzola-muted uppercase tracking-wider mb-2">
        À propos de moi
      </h4>
      <div className="relative">
        <AnimatePresence initial={false}>
          <motion.p
            ref={textRef}
            key={expanded ? 'expanded' : 'collapsed'}
            initial={{ height: expanded ? 72 : 'auto' }}
            animate={{ height: expanded ? 'auto' : 72 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="text-sm leading-relaxed overflow-hidden"
            style={{ color: isLight ? 'rgba(26,26,46,0.75)' : 'rgba(255,255,255,0.75)' }}
          >
            {bio}
          </motion.p>
        </AnimatePresence>
        {needsCollapse && (
          <motion.button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-xs font-medium cursor-pointer transition-colors"
            style={{ color: '#2B7FFF' }}
            whileTap={{ scale: 0.95 }}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Voir plus
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Image preview overlay ───
function ImagePreview({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full glass-strong flex items-center justify-center z-10 cursor-pointer"
        onClick={onClose}
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <motion.img
        key={src}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        src={src}
        alt="Aperçu"
        className="max-w-full max-h-[80vh] rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

// ─── Stat Card with count-up ───
function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: number; icon: typeof Heart; color: string; delay: number;
}) {
  const count = useCountUp(value, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' as const }}
      className="glass-card p-4 text-center flex-1 min-w-0"
    >
      <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color }} />
      <p
        className="text-2xl font-bold tabular-nums"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {count}
      </p>
      <p className="text-[10px] text-kinzola-muted mt-0.5">{label}</p>
    </motion.div>
  );
}

// ─── Container variants for stagger children ───
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

// ─── Profile List Modal (Matches / Likes / Views) ───
function ProfileListModal({
  title,
  profiles,
  icon: Icon,
  color,
  onClose,
  isLight,
}: {
  title: string;
  profiles: Profile[];
  icon: typeof Heart;
  color: string;
  onClose: () => void;
  isLight: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60]"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl overflow-hidden"
        style={{
          background: isLight
            ? 'linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 250, 0.98))'
            : 'linear-gradient(165deg, rgba(20, 25, 40, 0.98), rgba(10, 14, 26, 0.98))',
          boxShadow: isLight ? '0 -10px 50px rgba(0,0,0,0.1)' : '0 -10px 50px rgba(0,0,0,0.5)',
          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: color + '20', color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: isLight ? '#111' : '#fff' }}>{title}</h3>
              <p className="text-[10px] text-kinzola-muted">{profiles.length} personne{profiles.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={isLight ? {} : {}}>
            <X className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-white/70'}`} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto px-4 py-3 space-y-2" style={{ maxHeight: 'calc(80vh - 70px)' }}>
          {profiles.map((profile, i) => (
            <motion.div
              key={`${profile.id}-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'}`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{ border: isLight ? '2px solid rgba(0,0,0,0.08)' : '2px solid rgba(255,255,255,0.1)' }}
                />
                {profile.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500" style={{ border: isLight ? '2px solid #f5f7fa' : '2px solid #0A0E1A' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate" style={{ color: isLight ? '#111' : '#fff' }}>{profile.name}</p>
                  {profile.verified && <VerifiedBadgeStatic />}
                  <span className="text-xs text-kinzola-muted">{profile.age}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-kinzola-muted flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {profile.city}
                  </span>
                  {profile.distance != null && profile.distance < 100 && (
                    <span className="text-[10px]" style={{ color }}>{profile.distance} km</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

export default function ProfileScreen() {
  const { user, matches, totalLikesReceived, totalViews, likesReceived, profileVisitors, updateProfile, setShowEditProfile, setShowSettings, theme } = useKinzolaStore();
  const isLight = theme === 'light';
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'matches' | 'likes' | 'views' | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handlePreview = useCallback((src: string) => setPreviewImage(src), []);

  const handleAddPhoto = useCallback(() => {
    if (!user || user.photoGallery.length >= 5) return;
    galleryInputRef.current?.click();
  }, [user]);

  const handleGalleryFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        updateProfile({ photoGallery: [...user.photoGallery, ev.target.result as string] });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [user, updateProfile]);

  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const newPhoto = ev.target.result as string;
        const gallery = [...user.photoGallery];
        if (gallery.length > 1) {
          gallery[1] = newPhoto;
        } else {
          gallery.push(newPhoto);
        }
        updateProfile({ photoGallery: gallery });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [user, updateProfile]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        updateProfile({ photoUrl: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [user, updateProfile]);

  // Build profiles list for each modal
  const matchProfiles = matches.map(m => m.profile);
  
  if (!user) return null;

  // Cover: use a different gallery image (index 1 if available, else photoUrl)
  const coverPhoto = user.photoGallery.length > 1 ? user.photoGallery[1] : user.photoUrl;

  // Stats — from store (added by batch1-b)

  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      {/* ══════════════════════════════════════════
          1. COVER PHOTO SECTION
          ══════════════════════════════════════════ */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      <div className="relative h-[180px] flex-shrink-0 overflow-hidden">
        <img
          src={coverPhoto}
          alt="Couverture"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(15, 25, 50, 0.85) 0%, rgba(15, 25, 50, 0.3) 50%, transparent 100%)',
          }}
        />
        {/* "Changer la couverture" button - top-right */}
        <button onClick={() => coverInputRef.current?.click()} className="absolute top-3 right-3 glass px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-all hover:bg-white/15 z-10">
          <Camera className="w-3.5 h-3.5" />
          Changer la couverture
        </button>
        {/* Animated gradient border at bottom */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(90deg, #2B7FFF, #FF4D8D, #a855f7, #2B7FFF)',
            backgroundSize: '300% 100%',
            animation: 'gradient-slide 3s ease infinite',
          }}
        />
      </div>

      {/* ══════════════════════════════════════════
          2. AVATAR + NAME (overlapping cover)
          ══════════════════════════════════════════ */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 -mt-10 relative z-10"
      >
        <div className="flex items-end gap-4">
          {/* Avatar with gradient ring + camera overlay */}
          <div className="flex-shrink-0 relative">
            <button onClick={() => avatarInputRef.current?.click()} className="cursor-pointer">
              <div
                className="w-[100px] h-[100px] rounded-full p-[3px]"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-kinzola-bg">
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </button>
            {/* Small camera badge on avatar */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer z-10"
              style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', boxShadow: '0 2px 6px rgba(43, 127, 255, 0.4)' }}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Name + info */}
          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-xl font-bold truncate">{user.name}, {user.age}</h3>
              {user.verified && (
                <VerifiedBadgeStatic size="sm" />
              )}
            </div>
            {user.pseudo && (
              <p className="text-xs text-kinzola-muted/70 mb-0.5">@{user.pseudo}</p>
            )}
            <span className="flex items-center gap-1 text-sm text-kinzola-muted">
              <MapPin className="w-3.5 h-3.5" />
              {user.city}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-kinzola-muted/80">
                <Briefcase className="w-3 h-3" />
                {user.profession}
              </span>
              {user.religion && (
                <span className="flex items-center gap-1 text-xs text-kinzola-muted/80">
                  <Sparkles className="w-3 h-3" />
                  {user.religion}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          3. INFO CARDS SECTION
          ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-5 mt-4"
      >
        <div className="grid grid-cols-2 gap-2">
          {user.lookingFor && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 77, 141, 0.12)' }}>
                <Search className="w-4 h-4" style={{ color: '#FF4D8D' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Je cherche</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.lookingFor}</p>
              </div>
            </div>
          )}
          {user.height && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.12)' }}>
                <Ruler className="w-4 h-4" style={{ color: '#2B7FFF' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Taille</p>
                <p className="text-xs font-semibold" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.height} cm</p>
              </div>
            </div>
          )}
          {user.education && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.12)' }}>
                <GraduationCap className="w-4 h-4" style={{ color: '#a855f7' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Études</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.education}</p>
              </div>
            </div>
          )}
          {user.languages && user.languages.length > 0 && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74, 222, 128, 0.12)' }}>
                <Globe className="w-4 h-4" style={{ color: '#4ade80' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Langues</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.languages.join(', ')}</p>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.12)' }}>
                <Phone className="w-4 h-4" style={{ color: '#2B7FFF' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Téléphone</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.phone}</p>
              </div>
            </div>
          )}
          {user.email && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 77, 141, 0.12)' }}>
                <Mail className="w-4 h-4" style={{ color: '#FF4D8D' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.email}</p>
              </div>
            </div>
          )}
          {user.relationshipStatus && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 77, 141, 0.12)' }}>
                <HeartPulse className="w-4 h-4" style={{ color: '#FF4D8D' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Situation</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.relationshipStatus}</p>
              </div>
            </div>
          )}
          {user.lifestyle && (
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.12)' }}>
                <Palette className="w-4 h-4" style={{ color: '#a855f7' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-kinzola-muted uppercase tracking-wider">Style de vie</p>
                <p className="text-xs font-semibold truncate" style={{ color: isLight ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.9)' }}>{user.lifestyle}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          3.5 BIO SECTION
          ══════════════════════════════════════════ */}
      {user.bio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="px-5 mt-4"
        >
          <BioSection bio={user.bio} isLight={isLight} />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          4. STATS ROW
          ══════════════════════════════════════════ */}
      <div className="px-5 mb-6">
        <div className="flex gap-3">
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('matches')}
            className="flex-1 min-w-0"
          >
            <StatCard label="Matchs" value={matches.length} icon={Heart} color="#FF4D8D" delay={0.25} />
          </motion.div>
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('likes')}
            className="flex-1 min-w-0"
          >
            <StatCard label="Likes reçus" value={totalLikesReceived} icon={Heart} color="#2B7FFF" delay={0.35} />
          </motion.div>
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('views')}
            className="flex-1 min-w-0"
          >
            <StatCard label="Vues" value={totalViews} icon={Eye} color="#4ade80" delay={0.45} />
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          5. PHOTO GALLERY
          ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold text-kinzola-muted uppercase tracking-wider">
            Mes photos <span className="text-kinzola-muted/60">({user.photoGallery.length})</span>
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {user.photoGallery.map((photo, i) => (
            <motion.div
              key={`photo-${photo}-${i}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePreview(photo)}
              className={`aspect-square rounded-xl overflow-hidden cursor-pointer relative group ${i === 0 ? 'col-span-2 row-span-1' : ''}`}
            >
              <img
                src={photo}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Delete button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateProfile({ photoGallery: user.photoGallery.filter((_, idx) => idx !== i) });
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </motion.div>
          ))}
          {/* Ajouter button — only if < 5 photos */}
          {user.photoGallery.length < 5 && (
            <>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryFileChange}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddPhoto}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  border: isLight ? '2px dashed rgba(0,0,0,0.15)' : '2px dashed rgba(255,255,255,0.15)',
                  background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <Plus className="w-6 h-6 text-kinzola-muted" />
                <span className="text-[10px] text-kinzola-muted font-medium">
                  {user.photoGallery.length}/5
                </span>
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          6. INTERESTS SECTION
          ══════════════════════════════════════════ */}
      {user.interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="px-5 mb-6"
        >
          <h4 className="text-[11px] font-semibold text-kinzola-muted uppercase tracking-wider mb-3">
            Centres d&apos;intérêt
          </h4>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {user.interests.map((interest) => (
              <motion.span
                key={interest}
                variants={itemVariants}
                className="glass px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.12), rgba(255, 77, 141, 0.12))',
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                  color: isLight ? '#4B5563' : '#8899B4',
                }}
              >
                {interest}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          7. ACTION BUTTONS
          ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-5 pb-28"
      >
        <div className="flex items-center gap-3">
          {/* Modifier mon profil — gradient primary */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEditProfile(true)}
            className="flex-1 h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
            }}
          >
            <Edit3 className="w-4 h-4" />
            Modifier mon profil
          </motion.button>

          {/* Settings — glass circular */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className={`w-12 h-12 rounded-full glass flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${isLight ? 'hover:bg-black/[0.06]' : 'hover:bg-white/10'}`}
          >
            <Settings className="w-5 h-5 text-kinzola-muted" />
          </motion.button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          IMAGE PREVIEW OVERLAY
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          PROFILE LIST MODALS (Matches / Likes / Views)
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === 'matches' && (
          <ProfileListModal
            title="Mes Matchs"
            profiles={matchProfiles}
            icon={Heart}
            color="#FF4D8D"
            onClose={() => setActiveModal(null)}
            isLight={isLight}
          />
        )}
        {activeModal === 'likes' && (
          <ProfileListModal
            title="Likes reçus"
            profiles={likesReceived}
            icon={Heart}
            color="#2B7FFF"
            onClose={() => setActiveModal(null)}
            isLight={isLight}
          />
        )}
        {activeModal === 'views' && (
          <ProfileListModal
            title="Vues du profil"
            profiles={profileVisitors}
            icon={Eye}
            color="#4ade80"
            onClose={() => setActiveModal(null)}
            isLight={isLight}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
