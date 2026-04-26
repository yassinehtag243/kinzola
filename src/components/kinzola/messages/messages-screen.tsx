'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, MoreVertical, Trash2, Ban, X } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { formatLastSeen } from '@/lib/format-time';
import ChatScreen from './chat-screen';
import OnlineUsersSection from './online-users-section';
import StoryViewerModal from './story-viewer-modal';

export default function MessagesScreen() {
  const { conversations, matches, openChat, currentChatId, deleteConversation, tickOnlineStatus, theme, customNicknames, blockedUserIds, stories } = useKinzolaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuConvId, setMenuConvId] = useState<string | null>(null);
  const [clientNow, setClientNow] = useState(() => new Date());
  const [viewingStoryUserId, setViewingStoryUserId] = useState<string | null>(null);

  const isLight = theme === 'light';

  // Build a set of userIds that have stories for quick lookup
  const storyUserIds = useMemo(() => {
    return new Set(stories.map((s) => s.authorId));
  }, [stories]);

  // Update client time every 30s for last seen
  useEffect(() => {
    const id = setInterval(() => setClientNow(new Date()), 8000);
    return () => clearInterval(id);
  }, []);

  // Tick online status every 6 seconds (fast)
  useEffect(() => {
    const id = setInterval(() => {
      tickOnlineStatus();
      setClientNow(new Date());
    }, 6000);
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
      (c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  });

  const bgColor = isLight ? '#FFFFFF' : 'var(--color-kinzola-bg, #060E1A)';

  // Handle photo click — open stories if available, otherwise open chat
  const handlePhotoClick = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv && storyUserIds.has(conv.participant.userId)) {
      setViewingStoryUserId(conv.participant.userId);
    } else {
      openChat(convId);
    }
  };

  // Handle conversation click (name/text area) — always open chat
  const handleConversationClick = (convId: string) => {
    openChat(convId);
  };

  // ─── If a chat is open, show full ChatScreen ───
  if (currentChatId) {
    return <ChatScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Discussions</h2>
          <span className="text-[11px] text-kinzola-muted flex items-center gap-1">
            {filteredConversations.length} conversation{filteredConversations.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-kinzola-muted" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-10 rounded-full glass text-sm placeholder:text-kinzola-muted/50 focus:outline-none transition-all"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {/* Clear button when search has text */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: 'rgba(128,128,128,0.2)' }}
              aria-label="Effacer la recherche"
            >
              <X className="w-3 h-3 text-kinzola-muted" />
            </button>
          )}
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
          onViewStory={(userId) => setViewingStoryUserId(userId)}
          storyUserIds={storyUserIds}
        />

        {/* New Matches */}
        {newMatches.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3">Nouveaux matchs</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {newMatches.map(match => {
                const conv = conversations.find(c => c.participant.id === match.profile.id);
                const hasStory = storyUserIds.has(match.profile.userId);
                const handleMatchClick = () => {
                  if (hasStory && conv) {
                    setViewingStoryUserId(match.profile.userId);
                  } else if (conv) {
                    openChat(conv.id);
                  } else {
                    // No conversation yet — try loading data first
                    const state = useKinzolaStore.getState();
                    state.fetchAllData().then(() => {
                      const updatedConv = state.conversations.find(c => c.participant.id === match.profile.id);
                      if (updatedConv) {
                        openChat(updatedConv.id);
                      }
                    }).catch(console.error);
                  }
                };
                return (
                  <button
                    key={match.id}
                    onClick={handleMatchClick}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <div
                      className="w-[60px] h-[60px] rounded-full p-[2px]"
                      style={{
                        background: hasStory
                          ? 'linear-gradient(135deg, #FF4D8D, #FFD700, #2B7FFF, #FF4D8D)'
                          : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                        boxShadow: hasStory
                          ? '0 0 20px rgba(255, 77, 141, 0.5)'
                          : '0 0 20px rgba(255, 77, 141, 0.3)',
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
          {filteredConversations.map((conv, index) => {
            const hasStory = storyUserIds.has(conv.participant.userId);
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="relative"
              >
                <div
                  onClick={() => handleConversationClick(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConversationClick(conv.id); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'}`}
                >
                  {/* Avatar with online dot + story ring — separate click handler */}
                  <div
                    className="relative flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoClick(conv.id);
                    }}
                  >
                    {hasStory ? (
                      <div
                        className="w-[52px] h-[52px] rounded-full p-[2px]"
                        style={{
                          background: 'linear-gradient(135deg, #FF4D8D, #FFD700, #2B7FFF, #FF4D8D)',
                          boxShadow: '0 0 12px rgba(255, 77, 141, 0.4)',
                        }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <img
                            src={conv.participant.photoUrl}
                            alt={conv.participant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={conv.participant.photoUrl}
                        alt={conv.participant.name}
                        className="w-[52px] h-[52px] rounded-full object-cover"
                        style={{ border: conv.online ? '2px solid rgba(74, 222, 128, 0.4)' : isLight ? '2px solid rgba(0,0,0,0.08)' : '2px solid rgba(255,255,255,0.08)' }}
                      />
                    )}
                    {conv.online ? (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-green-400"
                        style={{
                          boxShadow: '0 0 0 2.5px ' + bgColor + ', 0 0 6px rgba(74, 222, 128, 0.5)',
                        }}
                      />
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-sm font-bold truncate">{customNicknames[conv.id] || conv.participant.pseudo || conv.participant.name}</h4>
                        {!(customNicknames[conv.id]) && conv.participant.name && conv.participant.name !== conv.participant.pseudo && (
                          <span className="text-[10px] text-kinzola-muted truncate flex-shrink-0">({conv.participant.name})</span>
                        )}
                        {conv.online && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{ background: 'rgba(74, 222, 128, 0.12)', color: '#4ade80' }}>
                            En ligne
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-kinzola-muted flex-shrink-0 ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[12px] text-kinzola-muted truncate">
                          {conv.lastMessage}
                        </p>
                        {!conv.online && (
                          <span className="block text-[10px] text-kinzola-muted/50 mt-0.5">
                            Vu {formatLastSeen(conv.lastSeen, clientNow)}
                          </span>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(43, 127, 255, 0.3)',
                          }}
                        >
                          {conv.unreadCount}
                        </motion.span>
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
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-400 transition-colors cursor-pointer ${isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'}`}
                    >
                      <Ban className="w-4 h-4" />
                      Bloquer
                    </button>
                    <div className="h-px" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                        setMenuConvId(null);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 transition-colors cursor-pointer ${isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="w-14 h-14 text-kinzola-pink/30 mb-4" />
              <p className="text-kinzola-muted text-sm">Aucune conversation</p>
              <p className="text-kinzola-muted/60 text-xs mt-1">Découvrez des profils pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Story Viewer Modal ─── */}
      <AnimatePresence>
        {viewingStoryUserId && (
          <StoryViewerModal
            key={`story-viewer-${viewingStoryUserId}`}
            userId={viewingStoryUserId}
            onClose={() => setViewingStoryUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
