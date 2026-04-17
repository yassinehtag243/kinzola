'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, Heart, MessageCircle, Award, Star, Shield, UserPlus,
  Eye, Sparkles, Trash2, CheckCheck, Volume2, VolumeX, Zap,
  Users, Flame, Gift
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { useNotificationSound, getSoundType } from '@/hooks/use-notification-sound';
import type { Notification } from '@/types';

type FilterTab = 'all' | 'social' | 'system' | 'unread';

// ─── Icon by notification type ───
function getNotificationIcon(type: Notification['type'], size = 'md') {
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const containerClass = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';

  const iconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    like: {
      icon: <Heart className={`${iconClass}`} />,
      color: '#FF4D8D',
      bg: 'rgba(255, 77, 141, 0.12)',
    },
    comment_mention: {
      icon: <MessageCircle className={`${iconClass}`} />,
      color: '#2B7FFF',
      bg: 'rgba(43, 127, 255, 0.12)',
    },
    mention: {
      icon: <MessageCircle className={`${iconClass}`} />,
      color: '#2B7FFF',
      bg: 'rgba(43, 127, 255, 0.12)',
    },
    badge_obtained: {
      icon: <Award className={`${iconClass}`} />,
      color: '#4DFFB4',
      bg: 'rgba(77, 255, 180, 0.12)',
    },
    match: {
      icon: <Star className={`${iconClass}`} />,
      color: '#FFD84D',
      bg: 'rgba(255, 216, 77, 0.12)',
    },
    name_change: {
      icon: <UserPlus className={`${iconClass}`} />,
      color: '#2B7FFF',
      bg: 'rgba(43, 127, 255, 0.12)',
    },
    password_change: {
      icon: <Shield className={`${iconClass}`} />,
      color: '#FFD84D',
      bg: 'rgba(255, 216, 77, 0.12)',
    },
    friend_request: {
      icon: <UserPlus className={`${iconClass}`} />,
      color: '#2B7FFF',
      bg: 'rgba(43, 127, 255, 0.12)',
    },
    love_interest: {
      icon: <Heart className={`${iconClass}`} />,
      color: '#FF4D8D',
      bg: 'rgba(255, 77, 141, 0.12)',
    },
    system: {
      icon: <Sparkles className={`${iconClass}`} />,
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.12)',
    },
    profile_view: {
      icon: <Eye className={`${iconClass}`} />,
      color: '#22D3EE',
      bg: 'rgba(34, 211, 238, 0.12)',
    },
  };

  const config = iconMap[type] || {
    icon: <Bell className={`${iconClass}`} />,
    color: '#8899B4',
    bg: 'rgba(136, 153, 180, 0.12)',
  };

  return (
    <div
      className={`${containerClass} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ background: config.bg, color: config.color }}
    >
      {config.icon}
    </div>
  );
}

// ─── Priority indicator ───
function getPriorityStyle(priority?: Notification['priority']) {
  switch (priority) {
    case 'high':
      return { border: '2px solid rgba(255, 77, 141, 0.3)', glow: '0 0 20px rgba(255, 77, 141, 0.08)' };
    case 'low':
      return { border: 'none', glow: 'none' };
    default:
      return { border: 'none', glow: 'none' };
  }
}

// ─── Time formatting ───
function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return `Il y a ${Math.floor(diffDays / 7)}sem`;
}

// ─── Single notification item ───
function NotificationItem({
  notification,
  onAction,
  onDelete,
}: {
  notification: Notification;
  onAction: (notif: Notification) => void;
  onDelete: (notifId: string) => void;
}) {
  const { markNotificationRead, playNotificationSound } = useKinzolaStore() as any;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const priorityStyle = getPriorityStyle(notification.priority);

  const handleMarkRead = useCallback(() => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  }, [notification.id, notification.read, markNotificationRead]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => onDelete(notification.id), 300);
  }, [notification.id, onDelete]);

  const handleLongPress = useCallback(() => {
    setShowSwipeHint(true);
    setTimeout(() => setShowSwipeHint(false), 2000);
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(handleLongPress, 500);
  }, [handleLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={isDeleting ? { opacity: 0, x: -100, height: 0 } : { opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, height: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Priority glow */}
      {notification.priority === 'high' && !notification.read && (
        <div
          className="absolute inset-0 rounded-xl opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.05), rgba(43, 127, 255, 0.05))',
            borderRadius: '16px',
          }}
        />
      )}

      <motion.button
        onClick={() => {
          handleMarkRead();
          if (notification.actionLabel) {
            onAction(notification);
          }
        }}
        className="w-full text-left relative overflow-hidden rounded-xl"
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="flex gap-3 items-start p-3.5 transition-all duration-200"
          style={{
            background: !notification.read
              ? 'rgba(43, 127, 255, 0.06)'
              : 'rgba(255, 255, 255, 0.02)',
            border: priorityStyle.border,
            boxShadow: priorityStyle.glow,
            borderRadius: '16px',
          }}
        >
          {/* Avatar / Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {notification.fromUserPhoto ? (
              <div className="relative">
                <img
                  src={notification.fromUserPhoto}
                  alt={notification.fromUserName || ''}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid rgba(255, 255, 255, 0.1)' }}
                />
                {/* Online indicator for recent notifications */}
                {notification.priority === 'high' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500" style={{ border: '2px solid #0A0E1A' }} />
                )}
              </div>
            ) : (
              getNotificationIcon(notification.type)
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {!notification.read && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: notification.priority === 'high'
                        ? 'linear-gradient(135deg, #FF4D8D, #FF2D6D)'
                        : '#2B7FFF',
                    }}
                  />
                )}
                <h4
                  className={`text-sm font-semibold leading-tight truncate ${
                    !notification.read ? 'text-white' : 'text-white/70'
                  }`}
                >
                  {notification.title}
                </h4>
              </div>

              {/* Delete button */}
              <motion.button
                onClick={handleDelete}
                whileTap={{ scale: 0.8 }}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                style={{ background: 'rgba(255, 77, 141, 0.15)' }}
              >
                <Trash2 className="w-3 h-3" style={{ color: '#FF4D8D' }} />
              </motion.button>
            </div>

            <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
              {notification.message}
            </p>

            {/* Bottom row: time + action */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-kinzola-muted">{getTimeAgo(notification.createdAt)}</span>
                {notification.category === 'social' && notification.fromUserName && (
                  <span className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    · {notification.fromUserName.split(' ')[0]}
                  </span>
                )}
              </div>

              {notification.actionLabel && !notification.read && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(43, 127, 255, 0.3)',
                  }}
                >
                  {notification.actionLabel}
                </motion.span>
              )}
            </div>

            {/* Swipe hint (long press) */}
            <AnimatePresence>
              {showSwipeHint && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-[9px] text-center mt-1"
                  style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  Appuyez pour supprimer
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ─── Main Notification Panel ───
export default function NotificationPanel() {
  const {
    notifications,
    showNotifications,
    setShowNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  } = useKinzolaStore() as any;

  const { playSound } = useNotificationSound();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  // Filter notifications
  const filteredNotifications = notifications.filter((n: Notification) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'social') return n.category === 'social';
    if (activeFilter === 'system') return n.category === 'system';
    return true;
  });

  // Play sound when panel opens with unread notifications
  useEffect(() => {
    if (showNotifications && unreadCount > 0 && soundEnabled) {
      playSound('default', 0.3);
    }
  }, [showNotifications, soundEnabled, playSound, unreadCount]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    if (showNotifications) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showNotifications, setShowNotifications]);

  const handleAction = useCallback((notification: Notification) => {
    markNotificationRead(notification.id);
    // The action would navigate to the relevant screen in a real app
    console.log(`[Notification Action] ${notification.type}: ${notification.actionLabel}`);
    setShowNotifications(false);
  }, [markNotificationRead, setShowNotifications]);

  const handleDelete = useCallback((notifId: string) => {
    deleteNotification(notifId);
  }, [deleteNotification]);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
    if (soundEnabled) playSound('like', 0.2);
  }, [markAllNotificationsRead, soundEnabled, playSound]);

  const handleClearAll = useCallback(() => {
    clearAllNotifications();
    setShowConfirmClear(false);
    setShowNotifications(false);
  }, [clearAllNotifications, setShowNotifications]);

  const filterTabs: { key: FilterTab; label: string; count?: number; icon: React.ReactNode }[] = [
    {
      key: 'all',
      label: 'Tout',
      count: notifications.length,
      icon: <Bell className="w-3 h-3" />,
    },
    {
      key: 'unread',
      label: 'Non lu',
      count: unreadCount,
      icon: <Zap className="w-3 h-3" />,
    },
    {
      key: 'social',
      label: 'Social',
      count: notifications.filter((n: Notification) => n.category === 'social').length,
      icon: <Users className="w-3 h-3" />,
    },
    {
      key: 'system',
      label: 'Système',
      count: notifications.filter((n: Notification) => n.category === 'system').length,
      icon: <Sparkles className="w-3 h-3" />,
    },
  ];

  return (
    <AnimatePresence>
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 bottom-0 z-[60]"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowNotifications(false)}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="absolute top-3 right-2 left-2 max-w-lg mx-auto rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(165deg, rgba(20, 25, 40, 0.98), rgba(10, 14, 26, 0.98))',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              maxHeight: '85vh',
            }}
          >
            {/* ─── Header ─── */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <div className="flex items-center gap-3">
                {/* Animated bell */}
                <div className="relative">
                  <motion.div
                    animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Bell className="w-5 h-5" style={{ color: '#FFD84D' }} />
                  </motion.div>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                      style={{
                        background: 'linear-gradient(135deg, #FF4D8D, #FF2D6D)',
                        fontSize: '9px',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(255, 77, 141, 0.4)',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Notifications</h3>
                  <p className="text-[10px] text-kinzola-muted">
                    {unreadCount > 0
                      ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                      : 'Tout est à jour'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Sound toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                  title={soundEnabled ? 'Son activé' : 'Son désactivé'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" style={{ color: '#4DFFB4' }} />
                  ) : (
                    <VolumeX className="w-4 h-4 text-kinzola-muted" />
                  )}
                </motion.button>

                {/* Close */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </motion.button>
              </div>
            </div>

            {/* ─── Filter Tabs ─── */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto no-scrollbar"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
            >
              {filterTabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 ${
                    activeFilter === tab.key ? 'text-white' : 'text-kinzola-muted hover:text-white/70'
                  }`}
                  style={
                    activeFilter === tab.key
                      ? {
                          background: 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                          boxShadow: '0 2px 10px rgba(43, 127, 255, 0.25)',
                        }
                      : { background: 'rgba(255, 255, 255, 0.04)' }
                  }
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        activeFilter === tab.key
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-kinzola-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* ─── Action buttons bar ─── */}
            {notifications.length > 0 && (
              <div
                className="flex items-center justify-between px-5 py-2"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1.5 text-[11px] font-medium transition-all disabled:opacity-30"
                  style={{ color: unreadCount > 0 ? '#4DFFB4' : '#8899B4' }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout marquer lu
                </motion.button>

                <AnimatePresence mode="wait">
                  {!showConfirmClear ? (
                    <motion.button
                      key="clear"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowConfirmClear(true)}
                      className="flex items-center gap-1.5 text-[11px] font-medium transition-all hover:text-red-400"
                      style={{ color: '#FF6B6B' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Tout effacer
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-[11px] text-white/60">Confirmer ?</span>
                      <button
                        onClick={handleClearAll}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255, 77, 77, 0.15)', color: '#FF6B6B' }}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setShowConfirmClear(false)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#8899B4' }}
                      >
                        Non
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ─── Notification List ─── */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 170px)' }}>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 px-5"
                >
                  {activeFilter === 'unread' ? (
                    <>
                      <CheckCheck className="w-12 h-12 mb-3" style={{ color: '#4DFFB4' }} />
                      <p className="text-sm font-medium text-white/70 text-center">
                        Tout est lu !
                      </p>
                      <p className="text-xs text-kinzola-muted mt-1 text-center">
                        Vous n&apos;avez pas de notifications non lues
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        <Bell className="w-12 h-12 text-kinzola-muted/40" />
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' as const }}
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                        />
                      </div>
                      <p className="text-sm font-medium text-white/70 text-center">
                        Aucune notification
                      </p>
                      <p className="text-xs text-kinzola-muted mt-1 text-center">
                        {activeFilter === 'all'
                          ? 'Vos notifications apparaîtront ici'
                          : `Pas de notifications ${activeFilter === 'social' ? 'sociales' : 'système'} pour le moment`}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="p-3 space-y-2">
                  {/* Today section header */}
                  {activeFilter === 'all' && (
                    <div className="px-2 py-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                        Récent
                      </p>
                    </div>
                  )}
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification: Notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onAction={handleAction}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ─── Footer ─── */}
            {notifications.length > 0 && (
              <div
                className="px-5 py-3"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-kinzola-muted">
                    {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
                  </p>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3" style={{ color: '#FF4D8D' }} />
                      <span className="text-[10px] font-medium" style={{ color: '#FF4D8D' }}>
                        {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
