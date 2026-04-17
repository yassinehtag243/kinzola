'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  X,
  Download,
  Edit3,
  Check,
  Ban,
  ShieldOff,
  Flag,
  Mic,
  Image as ImageIcon,
  MapPin,
  Briefcase,
  Sparkles,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// ─── Download helper ───
function downloadImage(dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `kinzola-photo-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Report options (stable constant) ───
const REPORT_OPTIONS = [
  { label: 'Faux profil', value: 'Faux profil' },
  { label: 'Harcèlement', value: 'Harcèlement' },
  { label: 'Contenu inapproprié', value: 'Contenu inapproprié' },
  { label: 'Autre', value: 'Autre' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  Fullscreen Image Preview
// ═══════════════════════════════════════════════════════════════════════════
function ImagePreviewOverlay({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
        style={{ background: 'rgba(255,255,255,0.15)' }}
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          downloadImage(imageUrl);
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
        style={{ background: 'rgba(255,255,255,0.15)' }}
      >
        <Download className="w-5 h-5 text-white" />
      </button>
      <motion.img
        key={imageUrl}
        src={imageUrl}
        alt="Preview"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Section Title
// ═══════════════════════════════════════════════════════════════════════════
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h3 className="text-sm font-bold gradient-text">{children}</h3>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ChatContactDetail — Full-screen overlay
//  ✅ ALL hooks are called before the early return
// ═══════════════════════════════════════════════════════════════════════════
export default function ChatContactDetail() {
  // ─── Zustand selectors ───
  const currentChatId = useKinzolaStore((s) => s.currentChatId);
  const conversations = useKinzolaStore((s) => s.conversations);
  const showChatContactDetail = useKinzolaStore((s) => s.showChatContactDetail);
  const customNicknames = useKinzolaStore((s) => s.customNicknames);
  const blockedUserIds = useKinzolaStore((s) => s.blockedUserIds);
  const theme = useKinzolaStore((s) => s.theme);
  const isLight = theme === 'light';

  // ─── Store action refs (stable, never cause re-render) ───
  const storeRef = useRef(useKinzolaStore.getState());
  useEffect(() => {
    storeRef.current = useKinzolaStore.getState();
  });

  // ─── Local state ───
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // ─── Derived ───
  const conversation = conversations.find((c) => c.id === currentChatId) ?? null;
  const participant = conversation?.participant ?? null;
  const messages = conversation?.messages ?? [];
  const conversationId = conversation?.id ?? '';

  const isBlocked = participant ? blockedUserIds.includes(participant.userId) : false;
  const displayName = participant
    ? (customNicknames[conversationId] || participant.name)
    : '';
  const allPhotos = participant?.photoGallery ?? [];
  const imageMessages = messages.filter((m) => m.type === 'image' && !m.deletedForMe);
  const voiceMessages = messages.filter((m) => m.type === 'voice' && !m.deletedForMe);

  // ─── Handlers (all use storeRef for stable deps) ───
  const handleBack = useCallback(() => {
    storeRef.current.setShowChatContactDetail(false);
  }, []);

  const handleStartEditNickname = useCallback(() => {
    setNicknameInput(storeRef.current.customNicknames[conversationId] || '');
    setIsEditingNickname(true);
  }, [conversationId]);

  const handleSaveNickname = useCallback(() => {
    storeRef.current.setCustomNickname(conversationId, nicknameInput);
    setIsEditingNickname(false);
  }, [conversationId, nicknameInput]);

  const handleCancelNickname = useCallback(() => {
    setIsEditingNickname(false);
    setNicknameInput('');
  }, []);

  const handleBlock = useCallback(() => {
    if (!participant) return;
    storeRef.current.blockUser(participant.userId);
    storeRef.current.closeChat();
    storeRef.current.setShowChatContactDetail(false);
    setShowBlockConfirm(false);
  }, [participant]);

  const handleUnblock = useCallback(() => {
    if (!participant) return;
    storeRef.current.unblockUser(participant.userId);
  }, [participant]);

  const handleReport = useCallback(
    (reason: string) => {
      if (!participant) return;
      storeRef.current.reportUser(participant.userId, reason);
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
      }, 1500);
    },
    [participant]
  );

  // ─── Early return (after ALL hooks) ───
  if (!conversation || !participant) return null;

  // ─── Theme colors ───
  const bgBase = isLight ? '#F5F7FA' : '#060E1A';
  const cardBg = isLight ? '#FFFFFF' : 'rgba(15, 25, 50, 0.6)';
  const cardBorder = isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)';
  const textColor = isLight ? '#1a1a2e' : '#FFFFFF';
  const mutedColor = isLight ? '#64748b' : '#8899B4';

  return (
    <AnimatePresence>
      {showChatContactDetail && (
        <motion.div
          key="chat-contact-detail"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{ backgroundColor: bgBase }}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  SECTION 1: HEADER                                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            className="relative flex-shrink-0 pt-12 pb-6 flex flex-col items-center"
            style={{
              background: isLight
                ? 'linear-gradient(180deg, rgba(43,127,255,0.08) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(43,127,255,0.12) 0%, transparent 100%)',
            }}
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center cursor-pointer z-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Profile photo with gradient ring */}
            <div className="relative mb-3">
              <div
                className="w-28 h-28 rounded-full p-[3px]"
                style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
              >
                <img
                  src={participant.photoUrl}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                  style={{ border: `3px solid ${bgBase}` }}
                />
              </div>
              {/* Online status dot */}
              {participant.online && (
                <motion.div
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 border-[3px]"
                  style={{ borderColor: bgBase }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(74,222,128,0)',
                      '0 0 0 4px rgba(74,222,128,0.35)',
                      '0 0 0 0 rgba(74,222,128,0)',
                    ],
                  }}
                  transition={{ type: 'tween' as const, duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
                />
              )}
            </div>

            {/* Name with verified badge */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ color: textColor }}>
                {displayName}
              </h2>
              {participant.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Info row: city, profession, age */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap justify-center">
              <span className="text-xs flex items-center gap-1" style={{ color: mutedColor }}>
                <MapPin className="w-3 h-3" />
                {participant.city}
              </span>
              {participant.profession && (
                <span className="text-xs flex items-center gap-1" style={{ color: mutedColor }}>
                  <Briefcase className="w-3 h-3" />
                  {participant.profession}
                </span>
              )}
              <span className="text-xs" style={{ color: mutedColor }}>
                {participant.age} ans
              </span>
            </div>

            {/* Online status text */}
            {participant.online ? (
              <span className="text-xs mt-1.5 font-medium" style={{ color: '#4ade80' }}>
                En ligne
              </span>
            ) : (
              <span className="text-xs mt-1.5" style={{ color: mutedColor }}>
                Hors ligne
              </span>
            )}

            {/* Bio */}
            {participant.bio && (
              <p
                className="text-xs mt-2 px-6 text-center leading-relaxed max-w-xs"
                style={{ color: mutedColor }}
              >
                {participant.bio}
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  SCROLLABLE CONTENT                                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 scroll-optimized" style={{ willChange: 'transform' }}>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  SECTION 2: PHOTOS                                          */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {allPhotos.length > 0 && (
              <div className="mt-4">
                <SectionTitle icon="📸">Photos</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  {allPhotos.map((photo, idx) => (
                    <motion.div
                      key={`photo-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      className={`${idx === 0 ? 'col-span-2 row-span-2' : ''} relative group cursor-pointer`}
                      onClick={() => setPreviewImage(photo)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className={`w-full object-cover rounded-xl ${
                          idx === 0 ? 'h-full min-h-[200px]' : 'aspect-square'
                        }`}
                      />
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  SECTION 3: CUSTOM NICKNAME                                  */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="mt-6">
              <SectionTitle icon="✏️">Pseudonyme personnalisé</SectionTitle>
              <div
                className="glass-card rounded-2xl p-4"
                style={{ background: cardBg, border: cardBorder }}
              >
                {isEditingNickname ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder="Entrez un pseudonyme..."
                      autoFocus
                      maxLength={30}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                      style={{
                        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                        color: textColor,
                        border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNickname}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-transform active:scale-[0.97]"
                        style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
                      >
                        <Check className="w-4 h-4" />
                        Enregistrer
                      </button>
                      <button
                        onClick={handleCancelNickname}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-transform active:scale-[0.97]"
                        style={{
                          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                          color: mutedColor,
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 flex-shrink-0" style={{ color: '#2B7FFF' }} />
                      {customNicknames[conversationId] ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate" style={{ color: textColor }}>
                            {customNicknames[conversationId]}
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: mutedColor }}>
                          Aucun pseudonyme
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleStartEditNickname}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                      style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
                    >
                      <Edit3 className="w-4 h-4" style={{ color: '#2B7FFF' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  SECTION 4: SHARED MEDIA                                     */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="mt-6">
              <SectionTitle icon="🖼️">Médias</SectionTitle>

              {imageMessages.length === 0 && voiceMessages.length === 0 ? (
                <div
                  className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
                  style={{ background: cardBg, border: cardBorder }}
                >
                  <ImageIcon className="w-8 h-8 mb-2" style={{ color: mutedColor, opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: mutedColor }}>
                    Aucun média échangé
                  </p>
                </div>
              ) : (
                <div
                  className="glass-card rounded-2xl p-3"
                  style={{ background: cardBg, border: cardBorder }}
                >
                  {/* Voice messages count */}
                  {voiceMessages.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Mic className="w-4 h-4" style={{ color: '#FF4D8D' }} />
                      <span className="text-xs font-medium" style={{ color: mutedColor }}>
                        {voiceMessages.length} message{voiceMessages.length > 1 ? 's' : ''} vocal{voiceMessages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Image grid */}
                  {imageMessages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imageMessages.map((msg, idx) => (
                        <motion.div
                          key={`media-${msg.id}-${idx}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden"
                          onClick={() => setPreviewImage(msg.content)}
                        >
                          <img
                            src={msg.content}
                            alt={`Média ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.3)' }}
                          >
                            <div className="flex gap-2">
                              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                <Download className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Voice message placeholders */}
                      {voiceMessages.map((msg, idx) => (
                        <div
                          key={`voice-${msg.id}-${idx}`}
                          className="aspect-square flex flex-col items-center justify-center gap-1.5 rounded-lg"
                          style={{
                            background: isLight
                              ? 'rgba(43,127,255,0.06)'
                              : 'rgba(43,127,255,0.08)',
                          }}
                        >
                          <Mic className="w-5 h-5" style={{ color: '#2B7FFF' }} />
                          <span className="text-[10px] font-medium" style={{ color: mutedColor }}>
                            Vocal
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  SECTION 5: BLOCK                                            */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="mt-6">
              <SectionTitle icon="🚫">Bloquer</SectionTitle>
              <div
                className="glass-card rounded-2xl p-4"
                style={{ background: cardBg, border: cardBorder }}
              >
                {!isBlocked ? (
                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-transform active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  >
                    <Ban className="w-4 h-4" />
                    Bloquer cet utilisateur
                  </button>
                ) : (
                  <button
                    onClick={handleUnblock}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-transform active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    <ShieldOff className="w-4 h-4" />
                    Débloquer
                  </button>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  SECTION 6: REPORT                                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="mt-6 mb-4">
              <SectionTitle icon="⚠️">Signaler</SectionTitle>
              <div
                className="glass-card rounded-2xl p-4"
                style={{ background: cardBg, border: cardBorder }}
              >
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-transform active:scale-[0.97]"
                  style={{
                    background: isLight ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
                    color: '#eab308',
                    border: '1px solid rgba(234,179,8,0.2)',
                  }}
                >
                  <Flag className="w-4 h-4" />
                  Signaler cet utilisateur
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/*  OVERLAYS                                                      */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* ─── Fullscreen Image Preview ─── */}
          <AnimatePresence>
            {previewImage && (
              <ImagePreviewOverlay
                imageUrl={previewImage}
                onClose={() => setPreviewImage(null)}
              />
            )}
          </AnimatePresence>

          {/* ─── Block Confirmation Dialog ─── */}
          <AnimatePresence>
            {showBlockConfirm && (
              <motion.div
                key="block-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                onClick={() => setShowBlockConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="w-full max-w-sm rounded-2xl p-6"
                  style={{
                    background: isLight ? '#FFFFFF' : 'rgba(15, 25, 50, 0.95)',
                    border: isLight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'rgba(239,68,68,0.1)' }}
                    >
                      <Ban className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: textColor }}>
                      Bloquer cet utilisateur ?
                    </h3>
                    <p className="text-sm mb-5" style={{ color: mutedColor }}>
                      Voulez-vous vraiment bloquer cet utilisateur ? Il ne pourra plus vous envoyer de
                      messages.
                    </p>
                    <div className="w-full flex gap-3">
                      <button
                        onClick={() => setShowBlockConfirm(false)}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-transform active:scale-[0.97]"
                        style={{
                          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                          color: mutedColor,
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleBlock}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-transform active:scale-[0.97]"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                      >
                        Bloquer
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Report Modal ─── */}
          <AnimatePresence>
            {showReportModal && (
              <motion.div
                key="report-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                onClick={() => {
                  if (!reportSent) setShowReportModal(false);
                }}
              >
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6"
                  style={{
                    background: isLight ? '#FFFFFF' : 'rgba(15, 25, 50, 0.95)',
                    border: isLight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {reportSent ? (
                    /* ─── Success State ─── */
                    <motion.div
                      key="report-success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ background: 'rgba(34,197,94,0.1)' }}
                      >
                        <Check className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: textColor }}>
                        Signalement envoyé
                      </h3>
                      <p className="text-sm" style={{ color: mutedColor }}>
                        Merci pour votre signalement. Nous allons examiner cette situation.
                      </p>
                    </motion.div>
                  ) : (
                    /* ─── Report Options ─── */
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <Flag className="w-5 h-5" style={{ color: '#eab308' }} />
                          <h3 className="text-lg font-bold" style={{ color: textColor }}>
                            Signaler
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowReportModal(false)}
                          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                          style={{
                            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <X className="w-4 h-4" style={{ color: mutedColor }} />
                        </button>
                      </div>
                      <p className="text-sm mb-4" style={{ color: mutedColor }}>
                        Pourquoi signalez-vous {participant.name} ?
                      </p>
                      <div className="flex flex-col gap-2">
                        {REPORT_OPTIONS.map((option, idx) => (
                          <motion.button
                            key={option.value}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            onClick={() => handleReport(option.value)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-left cursor-pointer transition-all active:scale-[0.98]"
                            style={{
                              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                              border: isLight
                                ? '1px solid rgba(0,0,0,0.06)'
                                : '1px solid rgba(255,255,255,0.06)',
                              color: textColor,
                            }}
                          >
                            <Flag
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: mutedColor }}
                            />
                            {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
