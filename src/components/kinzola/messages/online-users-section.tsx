'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Conversation, Match } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
//  Scoring algorithm for smart online user sorting
//
//  Priority 1: Interaction volume  — 10 pts per message exchanged
//  Priority 2: Recency             — bonus for recent last message
//  Priority 3: New match bonus     — 50 pts for new matches
//  Priority 4: Unread messages     — 5 pts per unread message
// ═══════════════════════════════════════════════════════════════════════════
interface OnlineUserEntry {
  conversation: Conversation;
  match: Match | undefined;
  score: number;
  displayName: string;
}

function computeOnlineScore(
  conv: Conversation,
  match: Match | undefined,
  displayName: string,
  now: number
): number {
  // Priority 1: Total interaction volume (messages exchanged)
  const messageCount = conv.messages.length;
  const interactionScore = messageCount * 10;

  // Priority 2: Recency — how recent is the last message?
  let recencyScore = 0;
  if (conv.messages.length > 0) {
    const lastMsg = conv.messages[conv.messages.length - 1];
    const lastMsgTime = new Date(lastMsg.timestamp).getTime();
    const hoursSince = (now - lastMsgTime) / (1000 * 60 * 60);
    if (hoursSince < 1) recencyScore = 40;       // Last hour
    else if (hoursSince < 4) recencyScore = 30;   // Last 4 hours
    else if (hoursSince < 12) recencyScore = 20;  // Last 12 hours
    else if (hoursSince < 24) recencyScore = 10;  // Last 24 hours
    else recencyScore = 5;                         // Older
  } else {
    recencyScore = 2; // No messages yet
  }

  // Priority 3: New match bonus
  const newMatchScore = (match && match.newMatch) ? 50 : 0;

  // Priority 4: Unread messages urgency
  const unreadScore = (conv.unreadCount || 0) * 5;

  return interactionScore + recencyScore + newMatchScore + unreadScore;
}

// ═══════════════════════════════════════════════════════════════════════════
//  OnlineUsersSection — Horizontal scrollable online users
// ═══════════════════════════════════════════════════════════════════════════
interface OnlineUsersSectionProps {
  conversations: Conversation[];
  matches: Match[];
  customNicknames: Record<string, string>;
  isLight: boolean;
  onOpenChat: (conversationId: string) => void;
}

export default function OnlineUsersSection({
  conversations,
  matches,
  customNicknames,
  isLight,
  onOpenChat,
}: OnlineUsersSectionProps) {
  // ─── Build sorted online users list ───
  const onlineUsers = useMemo(() => {
    const now = Date.now();

    // 1. Online conversations
    const entries: OnlineUserEntry[] = conversations
      .filter((c) => c.online)
      .map((conv) => {
        const match = matches.find(
          (m) =>
            m.user2Id === conv.participant.userId ||
            m.profile.id === conv.participant.id
        );
        const displayName = customNicknames[conv.id] || conv.participant.name;
        const score = computeOnlineScore(conv, match, displayName, now);
        return { conversation: conv, match, score, displayName };
      });

    // 2. New matches that are online but have no conversation yet
    const existingConvUserIds = new Set(
      conversations.map((c) => c.participant.userId)
    );
    const newMatchEntries: OnlineUserEntry[] = matches
      .filter((m) => m.newMatch && m.profile.online && !existingConvUserIds.has(m.profile.userId))
      .map((match) => {
        const score = 50 + Math.random() * 5; // New match high priority, slight randomness
        return {
          conversation: {
            id: match.id,
            matchId: match.id,
            participant: match.profile,
            messages: [],
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
            online: true,
            lastSeen: new Date().toISOString(),
          },
          match,
          score,
          displayName: match.profile.name.split(' ')[0],
        };
      });

    // Merge & sort by score descending
    const all = [...entries, ...newMatchEntries];
    all.sort((a, b) => b.score - a.score);
    return all;
  }, [conversations, matches, customNicknames]);

  // Don't render if no one is online
  if (onlineUsers.length === 0) return null;

  return (
    <div className="mb-5">
      {/* Section title with sparkle */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-kinzola-blue" />
        <h3 className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider">
          Utilisateurs en ligne
        </h3>
        <span
          className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: isLight
              ? 'rgba(43, 127, 255, 0.1)'
              : 'rgba(43, 127, 255, 0.15)',
            color: '#2B7FFF',
          }}
        >
          {onlineUsers.length}
        </span>
      </div>

      {/* Horizontal scrollable list */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {onlineUsers.map((entry, index) => {
          const { conversation: conv, displayName } = entry;
          const isSuperMatch = entry.match?.isSuperMatch;

          return (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'tween',
                duration: 0.3,
                delay: index * 0.04,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onOpenChat(conv.id)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div
                  className="w-[58px] h-[58px] rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: isSuperMatch
                      ? 'linear-gradient(135deg, #FFD700, #FF4D8D, #2B7FFF)'
                      : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    boxShadow: '0 0 18px rgba(43, 127, 255, 0.2)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-full p-[2px]"
                    style={{
                      background: isLight ? '#FFFFFF' : '#0A1F3C',
                    }}
                  >
                    <img
                      src={conv.participant.photoUrl}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Online indicator — ❤️ red heart */}
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  style={{
                    background: isLight ? '#FFFFFF' : '#0A1F3C',
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    type: 'tween',
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.2,
                  }}
                >
                  <span className="text-[11px] leading-none">❤️</span>
                </motion.div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D8D, #FF2D6F)',
                      boxShadow: '0 2px 8px rgba(255, 77, 141, 0.4)',
                      fontSize: '9px',
                      fontWeight: 800,
                      color: 'white',
                      border: `2px solid ${isLight ? '#FFFFFF' : '#0A1F3C'}`,
                    }}
                  >
                    {conv.unreadCount}
                  </div>
                )}
              </div>

              {/* Display name */}
              <div className="w-[64px] text-center">
                <p
                  className="text-[10px] font-medium truncate leading-tight"
                  style={{
                    color: isLight ? '#374151' : 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  {displayName.length > 10
                    ? displayName.substring(0, 9) + '…'
                    : displayName}
                </p>
                {conv.unreadCount > 0 && (
                  <p
                    className="text-[9px] mt-0.5 truncate"
                    style={{
                      color: '#FF4D8D',
                      fontWeight: 600,
                    }}
                  >
                    {conv.lastMessage || 'Nouveau'}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
