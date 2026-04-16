'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, BellOff, MessageCircle, CheckCheck, ChevronUp } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

interface IncomingMessage {
  id: string;
  conversationId: string;
  senderName: string;
  senderPhoto: string;
  message: string;
  timestamp: number;
}

/**
 * MessageNotificationBanner
 * WhatsApp-style notification that slides from top when a new message arrives.
 * Swipe left or right to dismiss. Auto-dismisses after 6 seconds.
 */
export default function MessageNotificationBanner() {
  const [activeNotification, setActiveNotification] = useState<IncomingMessage | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [exitDirection, setExitDirection] = useState<number>(0); // -1 = left, 1 = right, 0 = up
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNotifCount = useRef(0);

  const conversations = useKinzolaStore((s) => s.conversations);
  const notifications = useKinzolaStore((s) => s.notifications);
  const mutedConversationIds = useKinzolaStore((s) => s.mutedConversationIds);
  const currentChatId = useKinzolaStore((s) => s.currentChatId);
  const openChat = useKinzolaStore((s) => s.openChat);
  const setTab = useKinzolaStore((s) => s.setTab);
  const markConversationRead = useKinzolaStore((s) => s.markConversationRead);
  const muteConversation = useKinzolaStore((s) => s.muteConversation);
  const setPendingNotificationReply = useKinzolaStore((s) => s.setPendingNotificationReply);

  // Watch for new message notifications
  useEffect(() => {
    const currentCount = notifications.length;
    if (currentCount <= prevNotifCount.current) {
      prevNotifCount.current = currentCount;
      return;
    }
    prevNotifCount.current = currentCount;

    const newNotif = notifications[0];
    if (!newNotif || newNotif.type !== 'message') return;

    // Find the conversation
    const conv = conversations.find(c =>
      c.participant.userId === newNotif.fromUserId ||
      c.participant.name === newNotif.fromUserName
    );
    if (!conv) return;

    // Don't show if muted
    if (mutedConversationIds.includes(conv.id)) return;

    // Don't show if already in this chat
    if (currentChatId === conv.id) return;

    // Show notification
    const notif: IncomingMessage = {
      id: `msg-notif-${Date.now()}`,
      conversationId: conv.id,
      senderName: newNotif.fromUserName || conv.participant.name,
      senderPhoto: newNotif.fromUserPhoto || conv.participant.photoUrl,
      message: newNotif.message,
      timestamp: Date.now(),
    };

    setActiveNotification(notif);
    setExpanded(false);
    setExitDirection(0);

    // Auto dismiss after 6 seconds (slides back up)
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      setExitDirection(0); // default: slide up
      setActiveNotification(null);
    }, 6000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [notifications.length, conversations, mutedConversationIds, currentChatId]);

  const handleDismiss = useCallback((direction: number = 0) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setExitDirection(direction);
    setActiveNotification(null);
  }, []);

  const handleReply = useCallback(() => {
    if (!activeNotification) return;
    setTab('messages');
    openChat(activeNotification.conversationId);
    setPendingNotificationReply({
      conversationId: activeNotification.conversationId,
      participantName: activeNotification.senderName,
    });
    handleDismiss(0);
  }, [activeNotification, openChat, setTab, setPendingNotificationReply, handleDismiss]);

  const handleMarkRead = useCallback(() => {
    if (!activeNotification) return;
    markConversationRead(activeNotification.conversationId);
    handleDismiss(0);
  }, [activeNotification, markConversationRead, handleDismiss]);

  const handleSilence = useCallback(() => {
    if (!activeNotification) return;
    muteConversation(activeNotification.conversationId);
    handleDismiss(0);
  }, [activeNotification, muteConversation, handleDismiss]);

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Swipe handler — determine exit direction
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe threshold: either moved far enough OR moved fast enough
    if (Math.abs(offset) > 80 || Math.abs(velocity) > 400) {
      if (offset < 0) {
        handleDismiss(-1); // swipe left → exit left
      } else {
        handleDismiss(1); // swipe right → exit right
      }
    }
    // If not enough swipe, Framer Motion snaps back to center
  }, [handleDismiss]);

  // Exit animation variants based on swipe direction
  const exitVariants = {
    exit: exitDirection === -1
      ? { x: -500, opacity: 0, scale: 0.9, transition: { duration: 0.25, ease: 'easeOut' } }
      : exitDirection === 1
        ? { x: 500, opacity: 0, scale: 0.9, transition: { duration: 0.25, ease: 'easeOut' } }
        : { y: -120, opacity: 0, scale: 0.95, transition: { type: 'spring', damping: 25, stiffness: 350 } },
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div
          key={activeNotification.id}
          initial={{ y: -120, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={exitVariants.exit}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-2 left-2 right-2 z-[100] mx-auto max-w-[420px]"
          style={{ touchAction: 'pan-y' }}
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 0.97, cursor: 'grabbing' }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(18, 25, 42, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Top section - sender info */}
            <div className="flex items-start gap-3 p-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-full p-[2px]"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  }}
                >
                  <img
                    src={activeNotification.senderPhoto}
                    alt={activeNotification.senderName}
                    className="w-full h-full rounded-full object-cover"
                    style={{ border: '2px solid rgba(18, 25, 42, 1)' }}
                  />
                </div>
                {/* Online indicator */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400"
                  style={{
                    boxShadow: '0 0 0 2px rgba(18, 25, 42, 1), 0 0 6px rgba(74, 222, 128, 0.5)',
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-bold text-white truncate pr-2">
                    {activeNotification.senderName}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-kinzola-muted">maintenant</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(0); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-kinzola-muted" />
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1.5 mb-1"
                  style={{ color: 'rgba(136, 153, 180, 0.7)' }}
                >
                  <span className="text-[10px] font-medium" style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Kinzola
                  </span>
                  <span className="text-[10px]">•</span>
                  <span className="text-[10px]">Message</span>
                </div>

                {/* Message preview */}
                <AnimatePresence>
                  <motion.p
                    key={expanded ? 'expanded' : 'collapsed'}
                    initial={false}
                    animate={{
                      height: expanded ? 'auto' : 20,
                      overflow: 'hidden',
                    }}
                    className="text-xs text-white/70 leading-relaxed"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: expanded ? 99 : 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {activeNotification.message}
                  </motion.p>
                </AnimatePresence>

                {/* Expand button */}
                {activeNotification.message.length > 40 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                    className="flex items-center gap-0.5 mt-0.5 cursor-pointer"
                  >
                    <ChevronUp
                      className="w-3 h-3 text-kinzola-blue transition-transform"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                    <span className="text-[9px] text-kinzola-blue font-medium">
                      {expanded ? 'Réduire' : 'Développer'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div
              className="flex items-center justify-around px-3 py-2.5"
              style={{
                background: 'rgba(43, 127, 255, 0.08)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Répondre */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); handleReply(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                style={{
                  background: 'rgba(43, 127, 255, 0.15)',
                  border: '1px solid rgba(43, 127, 255, 0.3)',
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" style={{ color: '#2B7FFF' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#2B7FFF' }}>
                  Répondre
                </span>
              </motion.button>

              {/* Marquer comme lu */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); handleMarkRead(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                style={{
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                }}
              >
                <CheckCheck className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#4ade80' }}>
                  Lu
                </span>
              </motion.button>

              {/* Silence */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); handleSilence(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <BellOff className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#f87171' }}>
                  Silence
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
