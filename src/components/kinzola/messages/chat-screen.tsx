'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  MoreVertical, ArrowLeft, Phone, Video, Flag, Ban, Play, Pause, X, Download,
  Star, Trash2, Reply, Forward, Copy, BookmarkMinus, CheckCheck, Share2, Info, MessageCircle,
  ShieldOff,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { formatLastSeen } from '@/lib/format-time';
import type { Message, Conversation } from '@/types';
import ChatInputBar from './chat-input-bar';
import ChatContactDetail from './chat-contact-detail';
import StoryViewerModal from './story-viewer-modal';

// ─── Stable animation constants (no Math.random in render) ───
const VOICE_WAVEFORM = [4, 8, 14, 10, 6, 12, 16, 8, 4, 10, 14, 6, 8, 12, 16, 10, 4, 14, 8, 6, 12, 10, 8, 4];
const TYPING_DELAYS = [0, 0.15, 0.3];

// ─── Simple client time hook (null on SSR to avoid hydration mismatch) ───
function useClientTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getRelativeTime(dateStr: string, now: Date): string {
  return formatLastSeen(dateStr, now);
}

// ─── Parse voice message content ───
function parseVoiceContent(content: string): { duration: string; audioUrl: string | null } {
  const pipeIndex = content.indexOf('|');
  if (pipeIndex === -1 || pipeIndex >= content.length - 1) {
    return { duration: content, audioUrl: null };
  }
  return {
    duration: content.substring(0, pipeIndex),
    audioUrl: content.substring(pipeIndex + 1),
  };
}

// ─── Validate audio URL — permissive check ───
function isValidAudioUrl(url: string): boolean {
  if (!url || url.length < 30) return false;
  if (url.startsWith('data:audio/') && url.includes(';base64,')) return true;
  if (url.startsWith('http')) return true;
  return false;
}

function downloadImage(dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `kinzola-photo-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ═══════════════════════════════════════════════════════════════════════════
//  useLongPress — hook isolé, SAFE: appelé uniquement au top-level de MessageBubble
// ═══════════════════════════════════════════════════════════════════════════
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancelled = useRef(false);
  const callbackRef = useRef(callback);
  const pressingRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  const start = useCallback(() => {
    isCancelled.current = false;
    pressingRef.current = true;
    timerRef.current = setTimeout(() => {
      if (!isCancelled.current) {
        callbackRef.current();
      }
    }, ms);
  }, [ms]);

  const cancel = useCallback(() => {
    isCancelled.current = true;
    pressingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Detect when pressing starts to show visual feedback
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPressing(true);
    start();
  }, [start]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPressing(true);
    start();
  }, [start]);

  return {
    isPressing,
    onTouchStart, onTouchEnd: cancel, onTouchMove: cancel,
    onMouseDown, onMouseUp: cancel, onMouseLeave: cancel,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MessageBubble — composant enfant DÉDIÉ avec son propre useLongPress
//  ✅ RESPECT des Règles de Hooks: useLongPress appelé au top-level, JAMAIS
//     dans une boucle, une condition, ou un map.
// ═══════════════════════════════════════════════════════════════════════════
interface VoicePlayback {
  playingId: string | null;
  progress: number;
  currentTime: number;
  duration: number;
  status: 'idle' | 'loading' | 'playing' | 'error';
}

interface MessageBubbleProps {
  msg: Message;
  isSent: boolean;
  isLight: boolean;
  online: boolean;
  voicePlayback: VoicePlayback;
  swipedMessageId: string | null;
  receivedBubbleBg: string;
  receivedBubbleBorder: string;
  receivedTextColor: string;
  receivedTimeColor: string;
  dividerColor: string;
  reaction?: string;
  isBlurred?: boolean;
  onLongPress: () => void;
  onSwipeStart: (msgId: string) => void;
  onSwipeEnd: (msgId: string, info?: PanInfo) => void;
  onPreviewImage: (url: string) => void;
  onToggleVoice: (msgId: string) => void;
}

const MessageBubble = memo(function MessageBubble({
  msg, isSent, isLight, online,
  voicePlayback,
  swipedMessageId, receivedBubbleBg, receivedBubbleBorder,
  receivedTextColor, receivedTimeColor, dividerColor,
  reaction, isBlurred, onLongPress, onSwipeStart, onSwipeEnd, onPreviewImage, onToggleVoice,
}: MessageBubbleProps) {
  // ✅ HOOK appelé au top-level du composant — ordre STABLE à chaque render
  const { isPressing, ...longPressHandlers } = useLongPress(onLongPress, 1000);

  const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isImportant = msg.important ?? false;

  const getReceipt = () => {
    if (!isSent) return null;
    if (msg.read) return '❤️❤️';
    if (online) return '🤍🤍';
    return '🤍';
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Voice rendering helper — synced with real audio state
  const renderVoice = (msgData: Message) => {
    const { duration: labelDuration, audioUrl } = parseVoiceContent(msgData.content);
    const isPlaying = voicePlayback.playingId === msgData.id;
    const status = isPlaying ? voicePlayback.status : 'idle';
    const isLoading = status === 'loading';
    const hasError = status === 'error';
    const isActivePlaying = status === 'playing';
    const voiceColor = isSent ? 'rgba(255,255,255,' : (isLight ? 'rgba(0,0,0,' : 'rgba(128,128,128,');
    // Use real duration from audio if available, otherwise label
    const realDuration = isPlaying && voicePlayback.duration > 0 ? voicePlayback.duration : 0;
    const displayDuration = realDuration > 0 ? formatSeconds(realDuration) : labelDuration;

    // Check if audio URL is valid
    const hasValidUrl = audioUrl ? isValidAudioUrl(audioUrl) : false;

    return (
      <div
        role="button" tabIndex={0}
        onClick={() => onToggleVoice(msgData.id)}
        onKeyDown={(e) => { if (e.key === 'Enter') onToggleVoice(msgData.id); }}
        className="flex items-center gap-3 min-w-[200px] max-w-[260px] cursor-pointer"
      >
        {/* Play/Pause button */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: hasError
            ? 'rgba(239, 68, 68, 0.15)'
            : isSent ? 'rgba(255,255,255,0.2)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(128,128,128,0.1)') }}>
          {!hasValidUrl
            ? <span className="text-xs text-red-300">!</span>
            : isLoading
            ? <motion.div className="w-4 h-4 border-2 border-t-transparent rounded-full"
                style={{ borderColor: isSent ? 'rgba(255,255,255,0.8)' : receivedTextColor, borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            : hasError
            ? <motion.button
                onClick={(e) => { e.stopPropagation(); onToggleVoice(msgData.id); }}
                className="w-full h-full flex items-center justify-center"
                aria-label="Reessayer la lecture">
                <motion.div
                  animate={{ rotate: [0, -15, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: 1, ease: 'easeInOut' }}
                >
                  <span className="text-xs" style={{ color: isSent ? '#fff' : receivedTextColor }}>↻</span>
                </motion.div>
              </motion.button>
            : isActivePlaying
            ? <Pause className="w-4 h-4" style={{ color: isSent ? '#fff' : receivedTextColor }} />
            : <Play className="w-4 h-4 ml-0.5" style={{ color: isSent ? '#fff' : receivedTextColor }} />
          }
        </div>

        {/* Waveform + Progress */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-end gap-[2px] h-5">
            {VOICE_WAVEFORM.map((h, wi) => {
              const barIndex = wi / VOICE_WAVEFORM.length;
              const isActive = isActivePlaying && hasValidUrl && barIndex <= (voicePlayback.progress / 100);
              const animH = isActivePlaying ? h + 4 : h;
              return (
                <div key={wi} className="w-[3px] rounded-full transition-all duration-150"
                  style={{
                    height: isActive ? animH : h,
                    background: hasError || !hasValidUrl
                      ? 'rgba(239, 68, 68, 0.3)'
                      : isActive
                        ? (isSent ? 'rgba(255,255,255,0.95)' : (isLight ? '#2B7FFF' : 'rgba(43,127,255,0.9)'))
                        : `${voiceColor}${isSent ? '0.4)' : '0.15)'}`,
                  }}
                />
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="w-full h-[3px] rounded-full overflow-hidden"
            style={{ background: hasError || !hasValidUrl
              ? 'rgba(239, 68, 68, 0.15)'
              : `${voiceColor}${isSent ? '0.15)' : '0.06)'}` }}>
            <div className="h-full rounded-full transition-[width] duration-100"
              style={{
                background: hasError || !hasValidUrl
                  ? 'rgba(239, 68, 68, 0.5)'
                  : (isSent ? 'rgba(255,255,255,0.8)' : (isLight ? '#2B7FFF' : 'rgba(43,127,255,0.8)')),
                width: `${isActivePlaying && !hasError && hasValidUrl ? voicePlayback.progress : 0}%`,
              }} />
          </div>
          {/* Time display */}
          <span className="text-[10px]" style={{ color: hasError || !hasValidUrl
            ? 'rgba(239, 68, 68, 0.7)'
            : (isSent ? 'rgba(255,255,255,0.6)' : receivedTimeColor) }}>
            {!hasValidUrl
              ? 'Audio indisponible'
              : hasError
              ? 'Erreur - Appuyez pour reessayer'
              : isLoading
              ? 'Chargement...'
              : isActivePlaying
              ? `${formatSeconds(voicePlayback.currentTime)} / ${displayDuration}`
              : displayDuration}
          </span>
        </div>
      </div>
    );
  };

  // Image rendering helper
  const renderImage = (msgData: Message) => {
    const isBase64 = msgData.content.startsWith('data:');
    const imgSrc = isBase64 ? msgData.content : msgData.content;
    return (
      <div role="button" tabIndex={0}
        onClick={() => onPreviewImage(msgData.content)}
        onKeyDown={(e) => { if (e.key === 'Enter') onPreviewImage(msgData.content); }}
        className="cursor-pointer -mx-1 -my-1 relative"
      >
        <img
          src={imgSrc}
          alt="Photo"
          className="max-h-64 rounded-xl object-cover w-full"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.img-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'img-fallback flex items-center justify-center rounded-xl';
              fallback.style.cssText = 'min-height:120px;background:rgba(128,128,128,0.15);';
              fallback.innerHTML = '<span style="color:rgba(128,128,128,0.5);font-size:13px;">Image indisponible</span>';
              parent.insertBefore(fallback, target.nextSibling);
            }
          }}
        />
        {isBase64 && (
          <button onClick={(e) => { e.stopPropagation(); downloadImage(msgData.content); }}
            className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            aria-label="Télécharger la photo"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>
    );
  };

  // Reply reference — inline-flex pour ne pas stretcher
  const renderReplyRef = () => {
    if (!msg.replyTo) return null;
    return (
      <div className={`inline-flex flex-col mb-1 max-w-[220px] px-2.5 py-1.5 rounded-lg border-l-[3px] overflow-hidden ${
        isSent ? 'border-white/50' : 'border-kinzola-blue'
      }`} style={{
        background: isSent ? 'rgba(255,255,255,0.15)' : (isLight ? 'rgba(43,127,255,0.06)' : 'rgba(43,127,255,0.1)'),
      }}>
        <p className={`text-[10px] font-semibold truncate ${isSent ? 'text-white/80' : 'text-kinzola-blue'}`}>
          {msg.replyTo.senderName}
        </p>
        <p className={`text-[10px] truncate ${isSent ? 'text-white/60' : 'text-kinzola-muted'}`}>
          {msg.replyTo.content}
        </p>
      </div>
    );
  };

  // Important badge
  const renderImportantBadge = () => {
    if (!isImportant) return null;
    return (
      <div className="flex items-center gap-1 mb-1">
        <Star className={`w-3 h-3 ${isSent ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-500 fill-yellow-500'}`} />
        <span className="text-[9px] font-semibold" style={{ color: isSent ? 'rgba(255,255,255,0.8)' : (isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)') }}>Important</span>
      </div>
    );
  };

  return (
    <div className="max-w-[80%] w-fit" style={isBlurred ? { filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none', transition: 'filter 0.2s ease, opacity 0.2s ease' } : { transition: 'filter 0.2s ease, opacity 0.2s ease' }}>
      {isSent ? (
        /* ─── SENT MESSAGE ─── */
        <div {...longPressHandlers} className="cursor-pointer select-none">
          <div className={`text-white rounded-2xl rounded-br-sm shadow-sm transition-all duration-200 ${msg.replyTo ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              boxShadow: isPressing ? '0 0 0 3px rgba(43, 127, 255, 0.4), 0 2px 8px rgba(43, 127, 255, 0.2)' : '0 2px 8px rgba(43, 127, 255, 0.2)',
              transform: isPressing ? 'scale(0.97)' : 'scale(1)',
              opacity: isPressing ? 0.9 : 1,
            }}>
            {renderImportantBadge()}
            {renderReplyRef()}
            {msg.type === 'text' && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
            {msg.type === 'voice' && renderVoice(msg)}
            {msg.type === 'image' && renderImage(msg)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <span className="text-[10px] text-kinzola-muted/60">{time}</span>
            <span className="text-[10px]">{getReceipt()}</span>
          </div>
          {reaction && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-end mt-0.5"
            >
              <span className="text-sm leading-none px-1.5 py-0.5 rounded-full"
                style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }}>
                {reaction}
              </span>
            </motion.div>
          )}
        </div>
      ) : (
        /* ─── RECEIVED MESSAGE (swipeable) ─── */
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 100 }}
          dragElastic={0.3}
          onDragStart={() => onSwipeStart(msg.id)}
          onDragEnd={(_e, info) => onSwipeEnd(msg.id, info)}
          whileDrag={{ scale: 0.98 }}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
          {...longPressHandlers}
          className="cursor-pointer select-none relative"
        >
          {/* Swipe hint */}
          <AnimatePresence>
            {swipedMessageId === msg.id && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute -left-1 top-0 bottom-0 w-8 flex items-center justify-center"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
                  <Reply className="w-3.5 h-3.5 text-kinzola-blue" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`rounded-2xl rounded-bl-sm shadow-sm transition-all duration-200 ${msg.replyTo ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
            style={{
              background: receivedBubbleBg, border: receivedBubbleBorder, color: receivedTextColor,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              outline: isPressing ? '3px solid rgba(43, 127, 255, 0.35)' : 'none',
              outlineOffset: '-1px',
              transform: isPressing ? 'scale(0.97)' : 'scale(1)',
              opacity: isPressing ? 0.85 : 1,
            }}>
            {renderImportantBadge()}
            {renderReplyRef()}
            {msg.type === 'text' && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
            {msg.type === 'voice' && renderVoice(msg)}
            {msg.type === 'image' && renderImage(msg)}
          </div>

          <div className="flex items-center gap-1.5 mt-1 justify-start">
            <span className="text-[10px]" style={{ color: receivedTimeColor }}>{time}</span>
          </div>
          {reaction && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-start mt-0.5"
            >
              <span className="text-sm leading-none px-1.5 py-0.5 rounded-full"
                style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }}>
                {reaction}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  MessageActionSheet — menu contextuel vertical style WhatsApp
// ═══════════════════════════════════════════════════════════════════════════
const REACTION_EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}'];

function MessageActionSheet({
  message, isSent, isImportant: isMsgImportant, onClose, onCopy, onDeleteForMe,
  onDeleteForAll, onToggleImportant, onReply, onForward, onResend, onReact, isLight,
}: {
  message: { id: string; content: string; type: string; important?: boolean; timestamp: string };
  isSent: boolean;
  isImportant: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDeleteForMe: () => void;
  onDeleteForAll: () => void;
  onToggleImportant: () => void;
  onReply: () => void;
  onForward: () => void;
  onResend: () => void;
  onReact: (emoji: string) => void;
  isLight: boolean;
}) {
  const isTextMessage = message.type === 'text';

  const actionItems = [
    { icon: Reply, label: 'Répondre', action: onReply },
    { icon: Share2, label: 'Transférer', action: onForward },
    { icon: Copy, label: isTextMessage ? 'Copier' : 'Copier le texte', action: onCopy },
    { icon: isMsgImportant ? Star : BookmarkMinus, label: isMsgImportant ? 'Retirer des favoris' : 'Ajouter aux favoris', action: onToggleImportant, iconFill: isMsgImportant },
    { icon: MessageCircle, label: 'Renvoyer', action: onResend },
    { icon: Trash2, label: 'Supprimer pour moi', action: onDeleteForMe, danger: true },
  ];

  // Ajouter "Supprimer pour tout le monde" uniquement pour les messages envoyés
  if (isSent) {
    actionItems.push({ icon: Trash2, label: 'Supprimer pour tout le monde', action: onDeleteForAll, danger: true });
  }

  return (
    <>
      {/* Fond sombre SANS flou — le message reste intact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0, 0, 0, 0.35)' }}
        onClick={onClose}
      />

      {/* Emoji reaction bar — en bas de l'écran */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
        className="fixed bottom-24 left-0 right-0 z-[72] flex justify-center px-6"
      >
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-full"
          style={{
            background: isLight ? '#FFFFFF' : 'rgba(20, 35, 65, 0.97)',
            boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.12)' : '0 4px 24px rgba(0,0,0,0.4)',
          }}>
          {REACTION_EMOJIS.map((emoji, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.04 * i, type: 'spring', damping: 20, stiffness: 500 }}
              whileTap={{ scale: 1.4 }}
              onClick={() => { onReact(emoji); onClose(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer transition-colors active:scale-125"
              style={{ background: 'transparent' }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Menu vertical — ancré en haut au centre */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="fixed top-0 left-0 right-0 z-[71] flex justify-center pt-3 safe-top"
      >
        <div className="rounded-2xl overflow-hidden w-[85%] max-w-[300px]"
          style={{ background: isLight ? '#FFFFFF' : 'rgba(20, 35, 65, 0.97)', boxShadow: isLight ? '0 8px 40px rgba(0,0,0,0.15)' : '0 8px 40px rgba(0,0,0,0.5)' }}>

          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-black/40' : 'text-white/30'}`}>Options</span>
            <button onClick={onClose} className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isLight ? 'hover:bg-black/5 active:bg-black/10' : 'hover:bg-white/10 active:bg-white/15'}`}>
              <X className={`w-3.5 h-3.5 ${isLight ? 'text-black/40' : 'text-white/40'}`} />
            </button>
          </div>

          {/* Liste verticale des actions — avec icônes Lucide */}
          <div className="py-1">
            {actionItems.map((item, index) => {
              const IconComp = item.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * index, type: 'spring', damping: 25, stiffness: 400 }}
                  onClick={() => { item.action(); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-left ${
                    item.danger
                      ? (isLight ? 'hover:bg-red-50 active:bg-red-100' : 'hover:bg-red-500/10 active:bg-red-500/20')
                      : (isLight ? 'hover:bg-black/[0.03] active:bg-black/[0.06]' : 'hover:bg-white/[0.04] active:bg-white/[0.08]')
                  }`}
                >
                  <IconComp className={`w-4 h-4 flex-shrink-0 ${
                    item.danger
                      ? (isLight ? 'text-red-500' : 'text-red-400')
                      : (isLight ? 'text-black/50' : 'text-white/50')
                  } ${item.iconFill ? 'fill-current' : ''}`} />
                  <span className={`text-[12px] font-medium leading-none ${
                    item.danger
                      ? (isLight ? 'text-red-500' : 'text-red-400')
                      : (isLight ? 'text-black' : 'text-white/85')
                  }`}>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ForwardPickerOverlay — liste des conversations pour transférer
// ═══════════════════════════════════════════════════════════════════════════
function ForwardPickerOverlay({
  conversations,
  currentConvId,
  customNicknames,
  onClose,
  onForward,
}: {
  conversations: Conversation[];
  currentConvId: string;
  customNicknames: Record<string, string>;
  onClose: () => void;
  onForward: (targetConvId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = conversations.filter(c =>
    c.id !== currentConvId && c.participant.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="mt-auto max-h-[70vh] rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--card-bg, #fff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(128,128,128,0.15)' }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold flex-1">Transférer le message</h3>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Rechercher un contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'rgba(128,128,128,0.08)', border: '1px solid rgba(128,128,128,0.1)' }}
            autoFocus
          />
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-kinzola-muted">
              <Forward className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Aucun contact disponible</p>
            </div>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { onForward(conv.id); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors cursor-pointer text-left"
            >
              <div className="relative flex-shrink-0">
                <img src={conv.participant.photoUrl} alt={conv.participant.name} className="w-11 h-11 rounded-full object-cover" />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{customNicknames[conv.id] || conv.participant.name}</p>
                <p className="text-[11px] text-kinzola-muted truncate">{conv.lastMessage || 'Aucun message'}</p>
              </div>
              <Forward className="w-4 h-4 text-kinzola-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ReplyPreviewBar
// ═══════════════════════════════════════════════════════════════════════════
function ReplyPreviewBar({ senderName, content, onClear }: {
  senderName: string; content: string; onClear: () => void;
}) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-l-[3px] border-kinzola-blue" style={{ background: 'rgba(43, 127, 255, 0.06)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-kinzola-blue">{senderName}</p>
          <p className="text-[11px] text-kinzola-muted truncate">{content}</p>
        </div>
        <button onClick={onClear} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5">
          <X className="w-3.5 h-3.5 text-kinzola-muted" />
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ChatScreen — composant principal
//  ✅ Plus AUCUN hook appelé dans un map/condition/loop
// ═══════════════════════════════════════════════════════════════════════════
export default function ChatScreen() {
  // ─── Zustand selectors ───
  const currentChatId = useKinzolaStore((s) => s.currentChatId);
  const conversations = useKinzolaStore((s) => s.conversations);
  const sendMessage = useKinzolaStore((s) => s.sendMessage);
  const sendMessageWithType = useKinzolaStore((s) => s.sendMessageWithType);
  const sendReplyMessage = useKinzolaStore((s) => s.sendReplyMessage);
  const closeChat = useKinzolaStore((s) => s.closeChat);
  const deleteConversation = useKinzolaStore((s) => s.deleteConversation);
  const deleteMessageForMe = useKinzolaStore((s) => s.deleteMessageForMe);
  const deleteMessageForAll = useKinzolaStore((s) => s.deleteMessageForAll);
  const toggleMessageImportant = useKinzolaStore((s) => s.toggleMessageImportant);
  const forwardMessageToConversation = useKinzolaStore((s) => s.forwardMessageToConversation);
  const theme = useKinzolaStore((s) => s.theme);
  const isLight = theme === 'light';
  const setShowChatContactDetail = useKinzolaStore((s) => s.setShowChatContactDetail);
  const customNicknames = useKinzolaStore((s) => s.customNicknames);
  const blockedUserIds = useKinzolaStore((s) => s.blockedUserIds);
  const simulateReply = useKinzolaStore((s) => s.simulateReply);
  const unblockUser = useKinzolaStore((s) => s.unblockUser);
  const storeStories = useKinzolaStore((s) => s.stories);

  // ─── Local state ───
  const [showMenu, setShowMenu] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [voicePlayback, setVoicePlayback] = useState<VoicePlayback>({
    playingId: null, progress: 0, currentTime: 0, duration: 0,
    status: 'idle',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomedMessage, setZoomedMessage] = useState<{ message: Message; isSent: boolean } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ message: Message; isSent: boolean } | null>(null);
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderName: string; content: string } | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [viewingStoryUserId, setViewingStoryUserId] = useState<string | null>(null);

  // ─── Derived values ───
  const conversation = conversations.find((c) => c.id === currentChatId);
  const conversationId = conversation?.id ?? '';
  const messages = conversation?.messages ?? [];
  const participant = conversation?.participant ?? null;
  const online = participant?.online ?? false;
  const displayName = customNicknames[conversationId] || participant.name;
  const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : '';
  const isUserBlocked = participant ? blockedUserIds.includes(participant.userId) : false;

  // Check if this participant has stories
  const participantStories = useMemo(() => {
    if (!participant) return [];
    return storeStories.filter((s) => s.authorId === participant.userId);
  }, [participant, storeStories]);
  const hasStory = participantStories.length > 0;

  // ─── Refs ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingVoiceIdRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const voicePlaybackRef = useRef(voicePlayback);
  const clientNow = useClientTime();
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ─── Scroll to bottom ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(timer);
  }, [conversationId]);

  // ─── Typing indicator ───
  useEffect(() => {
    if (!lastMsgId) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.senderId !== 'user-me') return;
    let cancelled = false;
    const start = setTimeout(() => { if (!cancelled) setShowTyping(true); }, 300);
    const stop = setTimeout(() => { if (!cancelled) setShowTyping(false); }, 2500);
    return () => { cancelled = true; clearTimeout(start); clearTimeout(stop); };
  }, [lastMsgId]);

  // ─── Keep voicePlayback ref in sync ───
  useEffect(() => { voicePlaybackRef.current = voicePlayback; }, [voicePlayback]);

  // ─── Audio cleanup on unmount ───
  useEffect(() => {
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.oncanplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const resetVoiceState = useCallback(() => {
    stopRaf();
    playingVoiceIdRef.current = null;
    setVoicePlayback({ playingId: null, progress: 0, currentTime: 0, duration: 0, status: 'idle' });
  }, [stopRaf]);

  const stopVoicePlayback = useCallback(() => {
    stopRaf();
    if (audioRef.current) {
      const audio = audioRef.current;
      audioRef.current = null;
      audio.pause();
      audio.oncanplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.src = '';
      audio.load();
    }
    playingVoiceIdRef.current = null;
    setVoicePlayback({ playingId: null, progress: 0, currentTime: 0, duration: 0, status: 'idle' });
  }, [stopRaf]);

  const toggleVoice = useCallback((msgId: string) => {
    // Toggle off if same message is currently playing
    if (playingVoiceIdRef.current === msgId) { stopVoicePlayback(); return; }

    // ─── FULL cleanup of any previous audio ───
    stopRaf();
    if (audioRef.current) {
      const old = audioRef.current;
      audioRef.current = null;
      old.pause();
      old.oncanplay = null;
      old.onended = null;
      old.onerror = null;
      old.src = '';
    }
    playingVoiceIdRef.current = null;

    // Find message
    const msg = messagesRef.current.find((m) => m.id === msgId);
    if (!msg || msg.type !== 'voice') return;

    const { audioUrl } = parseVoiceContent(msg.content);

    if (!audioUrl || !isValidAudioUrl(audioUrl)) {
      console.warn('[Voice] Invalid audio for', msgId);
      return;
    }

    // Set loading state immediately
    playingVoiceIdRef.current = msgId;
    setVoicePlayback({ playingId: msgId, progress: 0, currentTime: 0, duration: 0, status: 'loading' });

    // ─── Create fresh Audio element ───
    const audio = new Audio();
    audioRef.current = audio;

    // ─── RAF progress tracking ───
    const updateProgress = () => {
      if (!audioRef.current || playingVoiceIdRef.current !== msgId) return;
      const dur = audioRef.current.duration || 0;
      if (dur > 0 && isFinite(dur)) {
        setVoicePlayback(prev => prev.playingId === msgId ? {
          ...prev,
          currentTime: audioRef.current!.currentTime,
          duration: dur,
          progress: (audioRef.current!.currentTime / dur) * 100,
          status: 'playing',
        } : prev);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    // ─── Audio event handlers — MUST be attached BEFORE setting src ───
    // For data URLs, the browser loads instantly, so events fire immediately.
    // If we set src first, oncanplay fires before we attach the listener.

    const cleanupAudio = () => {
      audio.oncanplay = null;
      audio.onended = null;
      audio.onerror = null;
    };

    audio.onended = () => {
      if (playingVoiceIdRef.current !== msgId) return;
      stopRaf();
      cleanupAudio();
      if (audioRef.current === audio) audioRef.current = null;
      playingVoiceIdRef.current = null;
      setVoicePlayback({ playingId: null, progress: 0, currentTime: 0, duration: 0, status: 'idle' });
    };

    audio.onerror = () => {
      if (playingVoiceIdRef.current !== msgId) return;
      console.error('[Voice] Audio error:', audio.error?.code, audio.error?.message);
      stopRaf();
      cleanupAudio();
      setVoicePlayback(prev => prev.playingId === msgId ? { ...prev, status: 'error' } : prev);
    };

    // Use canplay (not canplaythrough) — fires as soon as enough data is available.
    // For data URLs this fires almost immediately, which is what we want.
    audio.oncanplay = () => {
      if (playingVoiceIdRef.current !== msgId) return;
      console.log('[Voice] canplay fired, duration:', audio.duration);
      audio.play().then(() => {
        if (playingVoiceIdRef.current !== msgId) return;
        setVoicePlayback(prev => prev.playingId === msgId ? { ...prev, status: 'playing' } : prev);
        // Start RAF progress polling
        rafRef.current = requestAnimationFrame(updateProgress);
      }).catch((err) => {
        console.error('[Voice] Play failed:', err.name, err.message);
        if (playingVoiceIdRef.current !== msgId) return;
        setVoicePlayback(prev => prev.playingId === msgId ? { ...prev, status: 'error' } : prev);
      });
    };

    // NOW set src — events are already listening
    audio.preload = 'auto';
    audio.src = audioUrl;
  }, [stopVoicePlayback, stopRaf]);

  // ─── Message handlers ───
  const handleSendMessage = useCallback(async (text: string) => {
    if (!conversationId) return;
    if (replyTo) {
      sendReplyMessage(conversationId, text, replyTo);
      setReplyTo(null);
    } else {
      sendMessage(conversationId, text);
    }
    // Simulate auto-reply from the other person (2-5s delay)
    simulateReply(conversationId, text);
  }, [conversationId, sendMessage, sendReplyMessage, replyTo, simulateReply]);

  const handleSendVoice = useCallback((content: string) => {
    if (!conversationId) return;
    sendMessageWithType(conversationId, content, 'voice');
  }, [conversationId, sendMessageWithType]);

  const handleSendImage = useCallback((base64DataUrl: string) => {
    if (!conversationId) return;
    sendMessageWithType(conversationId, base64DataUrl, 'image');
  }, [conversationId, sendMessageWithType]);

  const handleDelete = useCallback(() => {
    if (!conversationId) return;
    deleteConversation(conversationId);
    closeChat();
  }, [conversationId, deleteConversation, closeChat]);

  // ─── Zoom handlers ───
  const openZoomedMessage = useCallback((message: Message, isSent: boolean) => {
    setZoomedMessage({ message, isSent });
    setSwipedMessageId(null);
  }, []);

  const closeZoomedMessage = useCallback(() => setZoomedMessage(null), []);

  const handleForwardToConversation = useCallback((targetConvId: string) => {
    if (!zoomedMessage) return;
    forwardMessageToConversation(targetConvId, zoomedMessage.message.content);
    setShowForwardPicker(false);
    setZoomedMessage(null);
  }, [zoomedMessage, forwardMessageToConversation]);

  // ─── Swipe handler ───
  const handleSwipeStart = useCallback((msgId: string) => {
    setSwipedMessageId(msgId);
  }, []);

  const handleSwipeEnd = useCallback((messageId: string, info?: PanInfo) => {
    // ✅ Sécurisation défensive : info peut être undefined
    if (!info?.offset?.x || info.offset.x <= 60) {
      setSwipedMessageId(null);
      return;
    }
    setSwipedMessageId(null);
    // ✅ Sécurisation messagesRef
    const msg = messagesRef.current?.find(m => m.id === messageId);
    if (!msg) return;
    setReplyTo({
      messageId: msg.id,
      senderName: displayName,
      content: msg.content.substring(0, 80),
    });
  }, [displayName]);

  const handleMessageLongPress = useCallback((message: Message, isSent: boolean) => {
    setActionMessage({ message, isSent });
    setSwipedMessageId(null);
  }, []);

  const closeActionMessage = useCallback(() => setActionMessage(null), []);

  const handleCopyMessage = useCallback(() => {
    if (!actionMessage) return;
    const text = actionMessage.message.type === 'text'
      ? actionMessage.message.content
      : actionMessage.message.content;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setActionMessage(null);
  }, [actionMessage]);

  const handleDeleteMessageForMe = useCallback(() => {
    if (!conversationId || !actionMessage) return;
    deleteMessageForMe(conversationId, actionMessage.message.id);
    setActionMessage(null);
  }, [conversationId, actionMessage, deleteMessageForMe]);

  const handleDeleteMessageForAll = useCallback(() => {
    if (!conversationId || !actionMessage) return;
    deleteMessageForAll(conversationId, actionMessage.message.id);
    setActionMessage(null);
  }, [conversationId, actionMessage, deleteMessageForAll]);

  const handleToggleImportant = useCallback(() => {
    if (!conversationId || !actionMessage) return;
    toggleMessageImportant(conversationId, actionMessage.message.id);
    setActionMessage(null);
  }, [conversationId, actionMessage, toggleMessageImportant]);

  const handleReplyFromAction = useCallback(() => {
    if (!actionMessage) return;
    setReplyTo({
      messageId: actionMessage.message.id,
      senderName: actionMessage.isSent ? 'Moi' : displayName,
      content: actionMessage.message.content.substring(0, 80),
    });
    setActionMessage(null);
  }, [actionMessage, displayName]);

  const handleForwardFromAction = useCallback(() => {
    if (!actionMessage) return;
    setZoomedMessage(actionMessage);
    setShowForwardPicker(true);
    setActionMessage(null);
  }, [actionMessage]);

  const handleResendMessage = useCallback(() => {
    if (!conversationId || !actionMessage) return;
    sendMessageWithType(conversationId, actionMessage.message.content, actionMessage.message.type as 'text' | 'image' | 'voice');
    setActionMessage(null);
  }, [conversationId, actionMessage, sendMessageWithType]);

  const handleReactToMessage = useCallback((emoji: string) => {
    if (!actionMessage) return;
    setMessageReactions(prev => {
      const newReactions = { ...prev };
      if (prev[actionMessage.message.id] === emoji) {
        delete newReactions[actionMessage.message.id];
      } else {
        newReactions[actionMessage.message.id] = emoji;
      }
      return newReactions;
    });
    setActionMessage(null);
  }, [actionMessage]);

  // ─── Early return ───
  if (!conversation || !participant) return null;

  // ─── Theme colors ───
  const chatBg = isLight ? '#F0F2F5' : '#0A1F3C';
  const headerBg = isLight ? '#FFFFFF' : 'rgba(10, 31, 60, 0.92)';
  const onlineDotBorder = isLight ? '#FFFFFF' : '#0A1F3C';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
  const receivedBubbleBg = isLight ? '#FFFFFF' : 'rgba(20, 35, 65, 0.7)';
  const receivedBubbleBorder = isLight ? 'none' : '1px solid rgba(255,255,255,0.08)';
  const receivedTextColor = isLight ? '#1F2937' : 'rgba(255,255,255,0.9)';
  const receivedTimeColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)';

  // Filter out deleted messages
  const visibleMessages = messages.filter(m => !m.deletedForMe);

  return (
    <motion.div
      initial={{ x: '100%', scale: 0.96, opacity: 0.8 }}
      animate={{ x: 0, scale: 1, opacity: 1 }}
      exit={{ x: '100%', scale: 0.96, opacity: 0.8 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="h-full w-full flex flex-col relative z-10"
      style={{ backgroundColor: chatBg }}
    >
      {/* ─── Header ─── */}
      <div className="p-3 flex items-center gap-3 relative z-20 transition-colors duration-500"
        style={{ background: headerBg, backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderBottom: `1px solid ${dividerColor}` }}>
        <button onClick={closeChat} className="w-9 h-9 rounded-full glass flex items-center justify-center cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <button className="relative flex-shrink-0 cursor-pointer" onClick={() => {
              if (hasStory) {
                setViewingStoryUserId(participant.userId);
              } else {
                setShowChatContactDetail(true);
              }
            }}>
            {hasStory ? (
              <div
                className="w-10 h-10 rounded-full p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #FF4D8D, #FFD700, #2B7FFF, #FF4D8D)',
                  boxShadow: '0 0 10px rgba(255, 77, 141, 0.4)',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <img src={participant.photoUrl} alt={participant.name} className="w-10 h-10 rounded-full object-cover" />
            )}
            {online ? (
              <motion.div className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded-full flex items-center justify-center" style={{ background: onlineDotBorder }}
                animate={{ scale: [1, 1.2, 1], boxShadow: ['0 0 4px rgba(255,45,111,0.3)', '0 0 12px rgba(255,45,111,0.7)', '0 0 4px rgba(255,45,111,0.3)'] }}
                transition={{ type: 'tween', duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <span className="text-[13px] leading-none" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 45, 111, 0.9))' }}>❤️</span>
              </motion.div>
            ) : (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full" style={{ background: 'rgba(136,153,180,0.3)', border: `2px solid ${onlineDotBorder}` }} />
            )}
          </button>
          <button className="min-w-0 text-left cursor-pointer" onClick={() => setShowChatContactDetail(true)}>
            <h3 className="text-sm font-bold truncate flex items-center gap-1.5">
              {displayName}
              <span className="text-xs">{online ? '❤️' : '🤍'}</span>
            </h3>
            <p className="text-[11px] text-kinzola-muted truncate">
              {online ? <span className="flex items-center gap-1" style={{ color: '#FF2D6F' }}><span style={{ filter: 'drop-shadow(0 0 4px rgba(255, 45, 111, 0.7))' }}>❤️</span><span className="font-semibold" style={{ textShadow: '0 0 8px rgba(255, 45, 111, 0.5)' }}>En ligne</span></span> : clientNow ? <span>Dernière connexion {getRelativeTime(participant.lastSeen, clientNow)}</span> : '…'}
            </p>
          </button>
        </div>
        <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-kinzola-muted cursor-pointer"><Phone className="w-4 h-4" /></button>
        <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-kinzola-muted cursor-pointer"><Video className="w-4 h-4" /></button>
        <div className="relative">
          <button onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-full glass flex items-center justify-center cursor-pointer">
            <MoreVertical className="w-4 h-4 text-kinzola-muted" />
          </button>
          <AnimatePresence mode="wait">
            {showMenu && (
              <motion.div key="menu" initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -8 }}
                className="absolute top-12 right-0 glass-strong rounded-xl overflow-hidden min-w-[160px] z-50">
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowMenu(false)} />
                <button onClick={() => setShowMenu(false)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-400 hover:bg-white/5 transition-colors cursor-pointer"><Flag className="w-4 h-4" /> Signaler</button>
                <div className="h-px" style={{ background: dividerColor }} />
                <button onClick={() => { setShowMenu(false); if (participant) useKinzolaStore.getState().blockUser(participant.userId); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-400 hover:bg-white/5 transition-colors cursor-pointer"><Ban className="w-4 h-4" /> Bloquer</button>
                <div className="h-px" style={{ background: dividerColor }} />
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"><X className="w-4 h-4" /> Supprimer</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Zone messages ─── */}
      <div className="scroll-optimized flex-1 overflow-y-auto px-3 pt-2 pb-1" style={{ willChange: 'transform' }}>
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: dividerColor }} />
          <span className="text-[10px] text-kinzola-muted font-medium">Aujourd&apos;hui</span>
          <div className="flex-1 h-px" style={{ background: dividerColor }} />
        </div>

        {/* ✅ MessageBubble est un composant enfant — useLongPress est au top-level de CE composant */}
        <AnimatePresence>
          {visibleMessages.map((msg, i) => (
            <motion.div
              key={`${msg.id}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.senderId === 'user-me' ? 'justify-end' : 'justify-start'} mb-2.5`}
            >
              <MessageBubble
                msg={msg}
                isSent={msg.senderId === 'user-me'}
                isLight={isLight}
                online={online}
                voicePlayback={voicePlayback}
                swipedMessageId={swipedMessageId}
                receivedBubbleBg={receivedBubbleBg}
                receivedBubbleBorder={receivedBubbleBorder}
                receivedTextColor={receivedTextColor}
                receivedTimeColor={receivedTimeColor}
                dividerColor={dividerColor}
                reaction={messageReactions[msg.id]}
                isBlurred={isUserBlocked || (actionMessage !== null && actionMessage.message.id !== msg.id)}
                onLongPress={() => handleMessageLongPress(msg, msg.senderId === 'user-me')}
                onSwipeStart={handleSwipeStart}
                onSwipeEnd={handleSwipeEnd}
                onPreviewImage={setPreviewImage}
                onToggleVoice={toggleVoice}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence mode="wait">
          {showTyping && (
            <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-start mb-2.5">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: receivedBubbleBg, border: receivedBubbleBorder }}>
                <div className="flex items-center gap-1">
                  {TYPING_DELAYS.map((d, i) => (
                    <motion.div key={i}
                      animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ type: 'tween', duration: 0.8, repeat: Infinity, delay: d }}
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ background: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(128,128,128,0.5)' }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Reply bar ─── */}
      <AnimatePresence mode="wait">
        {replyTo && <ReplyPreviewBar key="reply-bar" senderName={replyTo.senderName} content={replyTo.content} onClear={() => setReplyTo(null)} />}
      </AnimatePresence>

      {/* ─── Message Action Sheet (WhatsApp style) ─── */}
      <AnimatePresence mode="wait">
        {actionMessage && (
          <MessageActionSheet
            key="action-sheet"
            message={actionMessage.message}
            isSent={actionMessage.isSent}
            isImportant={actionMessage.message.important ?? false}
            onClose={closeActionMessage}
            onCopy={handleCopyMessage}
            onDeleteForMe={handleDeleteMessageForMe}
            onDeleteForAll={handleDeleteMessageForAll}
            onToggleImportant={handleToggleImportant}
            onReply={handleReplyFromAction}
            onForward={handleForwardFromAction}
            onResend={handleResendMessage}
            onReact={handleReactToMessage}
            isLight={isLight}
          />
        )}
      </AnimatePresence>

      {/* ─── Forward Picker Overlay ─── */}
      <AnimatePresence mode="wait">
        {showForwardPicker && zoomedMessage && (
          <ForwardPickerOverlay
            key="forward-picker"
            conversations={conversations}
            currentConvId={conversationId}
            customNicknames={customNicknames}
            onClose={() => { setShowForwardPicker(false); setZoomedMessage(null); }}
            onForward={handleForwardToConversation}
          />
        )}
      </AnimatePresence>

      {/* ─── Image preview overlay ─── */}
      <AnimatePresence mode="wait">
        {previewImage && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setPreviewImage(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full glass-strong flex items-center justify-center z-10 cursor-pointer" onClick={() => setPreviewImage(null)}>
              <X className="w-5 h-5 text-white" />
            </button>
            <button className="absolute top-4 left-4 w-10 h-10 rounded-full glass-strong flex items-center justify-center z-10 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); downloadImage(previewImage); }} aria-label="Télécharger la photo">
              <Download className="w-5 h-5 text-white" />
            </button>
            <img src={previewImage} alt="Aperçu" className="max-w-full max-h-[80vh] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Blocked user banner ─── */}
      <AnimatePresence>
        {isUserBlocked && (
          <motion.div
            key="blocked-banner"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm flex-shrink-0">🚫</span>
              <span className="text-xs font-medium text-red-400 truncate">
                Vous avez bloqué cet utilisateur
              </span>
            </div>
            <button
              onClick={() => participant && unblockUser(participant.userId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0 cursor-pointer transition-transform active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <ShieldOff className="w-3 h-3" />
              Débloquer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Input bar ─── */}
      {!isUserBlocked && <ChatInputBar onSendMessage={handleSendMessage} onSendVoice={handleSendVoice} onSendImage={handleSendImage} />}

      {/* ─── Chat Contact Detail Overlay ─── */}
      <AnimatePresence>
        <ChatContactDetail />
      </AnimatePresence>

      {/* ─── Story Viewer Modal ─── */}
      <AnimatePresence>
        {viewingStoryUserId && (
          <StoryViewerModal
            key={`chat-story-${viewingStoryUserId}`}
            userId={viewingStoryUserId}
            onClose={() => setViewingStoryUserId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
