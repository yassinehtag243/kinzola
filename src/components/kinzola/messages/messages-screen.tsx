'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, MoreVertical, Trash2, Ban } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { formatLastSeen } from '@/lib/format-time';
import ChatScreen from './chat-screen';
import OnlineUsersSection from './online-users-section';

export default function MessagesScreen() {
  const { conversations, matches, openChat, currentChatId, deleteConversation, tickOnlineStatus, theme, customNicknames, blockedUserIds } = useKinzolaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuConvId, setMenuConvId] = useState<string | null>(null);
  const [clientNow, setClientNow] = useState(() => new Date());

  const isLight = theme === 'light';

  // Update client time every 30s for last seen
  useEffect(() => {
    const id = setInterval(() => setClientNow(new Date()), 8000);
    return () => clearInterval(id);
  }, []);

  // Tick online status every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      tickOnlineStatus();
      setClientNow(new Date());
    }, 8000);
    return () => clearInterval(id);
  }, [tickOnlineStatus]);

  const newMatches = matches.filter(m => m.newMatch);
  const filteredConversations = conversations.filter(c => {
    // Hide blocked users
    if (blockedUserIds.includes(c.participant.userId)) return false;
    const displayN = customNicknames[c.id] || c.participant.name;
    return (
      displayN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const bgColor = isLight ? '#FFFFFF' : 'var(--color-kinzola-bg, #060E1A)';

  // ─── If a chat is open, show full ChatScreen ───
  if (currentChatId) {
    return <ChatScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-3 flex-shrink-0">
        <h2 className="text-2xl font-bold mb-3">Discussions</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-kinzola-muted" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full glass text-sm placeholder:text-kinzola-muted/50 focus:outline-none transition-all"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="scroll-optimized flex-1 overflow-y-auto px-5 pb-4"
        style={{ willChange: 'transform' }}
      >
        {/* Online Users Section */}
        <OnlineUsersSection
          conversations={conversations}
          matches={matches}
          customNicknames={customNicknames}
          isLight={isLight}
          onOpenChat={openChat}
        />

        {/* New Matches */}
        {newMatches.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3">Nouveaux matchs</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {newMatches.map(match => {
                const conv = conversations.find(c => c.participant.id === match.profile.id);
                return (
                  <button
                    key={match.id}
                    onClick={() => conv ? openChat(conv.id) : openChat(match.id)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <div
                      className="w-[60px] h-[60px] rounded-full p-[2px]"
                      style={{
                        background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                        boxShadow: '0 0 20px rgba(255, 77, 141, 0.3)',
                      }}
                    >
                      <div className="w-full h-full rounded-full p-[2px] bg-kinzola-bg">
                        <img
                          src={match.profile.photoUrl}
                          alt={match.profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-kinzola-muted truncate w-[60px] text-center">
                      {match.profile.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversations list */}
        <div className="space-y-1">
          {filteredConversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative"
            >
              <div
                onClick={() => openChat(conv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') openChat(conv.id); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.participant.photoUrl}
                    alt={conv.participant.name}
                    className="w-[52px] h-[52px] rounded-full object-cover"
                  />
                  {conv.online ? (
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                      style={{ background: bgColor }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ type: 'tween', duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span className="text-[12px] leading-none" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 45, 111, 0.8))' }}>❤️</span>
                    </motion.div>
                  ) : (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full"
                      style={{
                        background: 'rgba(136, 153, 180, 0.3)',
                        boxShadow: `0 0 0 2px ${bgColor}`,
                      }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-bold truncate">{customNicknames[conv.id] || conv.participant.name}</h4>
                    <span className="text-[11px] text-kinzola-muted flex-shrink-0 ml-2">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-kinzola-muted truncate pr-2">
                      {conv.online ? (
                        <span className="flex items-center gap-1" style={{ color: '#FF2D6F' }}>
                          <span style={{ filter: 'drop-shadow(0 0 4px rgba(255, 45, 111, 0.7))' }}>❤️</span>
                          <span className="font-semibold" style={{ textShadow: '0 0 8px rgba(255, 45, 111, 0.5)' }}>En ligne</span>
                        </span>
                      ) : (
                        <>
                          {conv.lastMessage}
                          <span className="block text-[10px] text-kinzola-muted/60">
                            Vu {formatLastSeen(conv.lastSeen, clientNow)}
                          </span>
                        </>
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span
                        className="min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuConvId(menuConvId === conv.id ? null : conv.id);
                  }}
                  className="flex-shrink-0 p-1 cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-kinzola-muted" />
                </button>
              </div>

              {/* Context Menu */}
              {menuConvId === conv.id && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-2 top-2 glass-strong rounded-xl overflow-hidden min-w-[140px] z-20"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useKinzolaStore.getState().blockUser(conv.participant.userId);
                      setMenuConvId(null);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquer
                  </button>
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                      setMenuConvId(null);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="w-14 h-14 text-kinzola-pink/30 mb-4" />
              <p className="text-kinzola-muted text-sm">Aucune conversation</p>
              <p className="text-kinzola-muted/60 text-xs mt-1">Découvrez des profils pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
