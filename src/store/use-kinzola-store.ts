import { create } from 'zustand';
import type { ScreenType, TabType, DiscoverMode, User, Profile, Match, Message, Conversation, Post, Story, FilterState, Notification } from '@/types';
import { CURRENT_USER, MOCK_PROFILES, MOCK_CONVERSATIONS, MOCK_POSTS, MOCK_STORIES, MOCK_MATCHES, MOCK_NOTIFICATIONS, MOCK_LIKES_RECEIVED, MOCK_VISTORS } from '@/lib/mock-data';

type DiscoverIntent = 'amitie' | 'amour';

/**
 * Normalizes a religion string to its base family for compatibility comparison.
 * E.g., "Chrétien" / "Chrétienne" → "chrétien", "Musulman" / "Musulmane" → "musulman"
 */
function normalizeReligion(religion: string): string {
  const r = religion.toLowerCase().trim();
  // Strip trailing "e" / "ne" to group masculine & feminine forms
  if (r.endsWith('ienne') || r.endsWith('ien')) {
    return r.replace(/e?ne?$/, '');
  }
  if (r.endsWith('e') && r.length > 2) {
    return r.slice(0, -1);
  }
  return r;
}

/**
 * Computes a compatibility score for a profile relative to a user.
 *
 * Scoring breakdown:
 *  - Religious compatibility (same family): +30
 *  - Same city:                         +20
 *  - Online (recently active):           +15
 *  - Verified (more likes received):     +10
 *  - Each shared interest:               +5
 */
function scoreProfile(user: User, profile: Profile): number {
  let score = 0;

  // 1. Religious compatibility (+30)
  const userReligion = normalizeReligion(user.religion);
  const profileReligion = normalizeReligion(profile.religion);
  if (userReligion && profileReligion && userReligion === profileReligion) {
    score += 30;
  }

  // 2. Same city (+20)
  if (user.city.toLowerCase() === profile.city.toLowerCase()) {
    score += 20;
  }

  // 3. Recently active / online (+15)
  if (profile.online) {
    score += 15;
  }

  // 4. Verified profile (+10)
  if (profile.verified) {
    score += 10;
  }

  // 5. Shared interests (+5 each)
  const sharedInterests = user.interests.filter((interest) =>
    profile.interests.some((pi) => pi.toLowerCase() === interest.toLowerCase())
  );
  score += sharedInterests.length * 5;

  return score;
}

/**
 * Sorts an array of profiles by compatibility score (highest first)
 * relative to the given user.
 */
export function sortProfilesByCompatibility(user: User, profiles: Profile[]): Profile[] {
  return [...profiles].sort((a, b) => scoreProfile(user, b) - scoreProfile(user, a));
}

/**
 * Applies FilterState to a profiles array, then sorts by compatibility.
 */
export function filterAndSortProfiles(
  user: User | null,
  profiles: Profile[],
  filters: FilterState
): Profile[] {
  let filtered = profiles;

  if (filters.gender && filters.gender !== 'tous') {
    filtered = filtered.filter((p) => p.gender === filters.gender);
  }
  if (filters.ageMin > 0) {
    filtered = filtered.filter((p) => p.age >= filters.ageMin);
  }
  if (filters.ageMax < 100) {
    filtered = filtered.filter((p) => p.age <= filters.ageMax);
  }
  if (filters.cities.length > 0) {
    filtered = filtered.filter((p) => filters.cities.includes(p.city));
  }
  if (filters.religions.length > 0) {
    filtered = filtered.filter((p) => filters.religions.includes(p.religion));
  }
  if (filters.interests.length > 0) {
    filtered = filtered.filter((p) =>
      filters.interests.some((fi) =>
        p.interests.some((pi) => pi.toLowerCase() === fi.toLowerCase())
      )
    );
  }

  if (user) {
    filtered = sortProfilesByCompatibility(user, filtered);
  }

  return filtered;
}

interface KinzolaState {
  // Navigation
  currentScreen: ScreenType;
  currentTab: TabType;
  previousScreen: ScreenType | null;

  // Theme
  theme: 'light' | 'dark';

  // User
  user: User | null;
  isAuthenticated: boolean;

  // Data
  profiles: Profile[];
  matches: Match[];
  messages: Message[];
  conversations: Conversation[];
  posts: Post[];
  stories: Story[];
  notifications: Notification[];

  // Discover
  discoverMode: DiscoverMode;
  discoverIntent: DiscoverIntent;
  currentChatId: string | null;
  selectedProfile: Profile | null;
  filters: FilterState;

  // Super Likes & Stats
  superLikesRemaining: number;
  totalLikesReceived: number;
  totalViews: number;
  likesReceived: Profile[];
  profileVisitors: Profile[];

  // Text Size (in pixels, range 12-24)
  textSize: number;

  // Passwords (simulated per-user, hashed conceptually)
  userPasswords: Record<string, string>;

  // Badge Verification
  badgeStatus: 'none' | 'uploading_id' | 'uploading_selfie' | 'processing' | 'approved' | 'rejected';
  badgeRequestTime: string | null;

  // UI Modals
  showMatchModal: boolean;
  matchProfile: Profile | null;
  showFilters: boolean;
  showNewPost: boolean;
  showProfileDetail: boolean;
  showEditProfile: boolean;
  showSettings: boolean;
  showEditPersonalInfo: boolean;
  registerStep: number;

  // Commenting
  commentingPostId: string | null;

  // Notifications Panel
  showNotifications: boolean;

  // Chat Contact Detail
  showChatContactDetail: boolean;
  customNicknames: Record<string, string>; // conversationId -> custom name
  blockedUserIds: string[];
  reports: Array<{ id: string; targetUserId: string; reason: string; createdAt: string }>;

  // Actions - Navigation
  setScreen: (screen: ScreenType) => void;
  setTab: (tab: TabType) => void;
  goBack: () => void;

  // Actions - Auth
  login: (phone: string, password: string) => void;
  register: (data: Partial<User>) => void;
  logout: () => void;

  // Actions - Discover
  setDiscoverMode: (mode: DiscoverMode) => void;
  setDiscoverIntent: (intent: DiscoverIntent) => void;
  likeProfile: (profileId: string) => void;
  passProfile: (profileId: string) => void;
  useSuperLike: (profileId: string) => void;
  resetDailySuperLikes: () => void;
  tickOnlineStatus: () => void;
  selectProfile: (profile: Profile | null) => void;
  applyFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  setShowFilters: (show: boolean) => void;

  // Actions - Messages
  openChat: (conversationId: string) => void;
  closeChat: () => void;
  sendMessage: (conversationId: string, content: string) => void;
  sendMessageWithType: (conversationId: string, content: string, type: string) => void;
  sendReplyMessage: (conversationId: string, content: string, replyTo: { messageId: string; senderName: string; content: string }) => void;
  deleteMessageForMe: (conversationId: string, messageId: string) => void;
  deleteMessageForAll: (conversationId: string, messageId: string) => void;
  toggleMessageImportant: (conversationId: string, messageId: string) => void;
  forwardMessageToConversation: (targetConversationId: string, content: string) => void;
  deleteConversation: (conversationId: string) => void;
  simulateReply: (conversationId: string, sentContent: string) => void;

  // Actions - Posts
  createPost: (content: string, imageUrl?: string, visibility?: 'public' | 'friends') => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string, isPublic: boolean) => void;
  setCommentingPostId: (postId: string | null) => void;

  // Actions - Theme
  setTheme: (theme: 'light' | 'dark') => void;

  // Actions - Text Size
  setTextSize: (size: number) => void;

  // Actions - Hydrate (charge les préférences localStorage côté client)
  hydrate: () => void;

  // Actions - Password
  changePassword: (userId: string, oldPassword: string, newPassword: string) => { success: boolean; error: string };

  // Actions - Badge
  setBadgeStatus: (status: 'none' | 'uploading_id' | 'uploading_selfie' | 'processing' | 'approved' | 'rejected') => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;

  // Actions - Chat Contact Detail
  setShowChatContactDetail: (show: boolean) => void;
  setCustomNickname: (conversationId: string, nickname: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  reportUser: (targetUserId: string, reason: string) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (notifId: string) => void;
  deleteNotification: (notifId: string) => void;
  clearAllNotifications: () => void;
  setShowNotifications: (show: boolean) => void;

  // Actions - Profile
  setShowMatchModal: (show: boolean, profile?: Profile | null) => void;
  setShowNewPost: (show: boolean) => void;
  setShowProfileDetail: (show: boolean) => void;
  setShowEditProfile: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowEditPersonalInfo: (show: boolean) => void;
  setRegisterStep: (step: number) => void;
  updateProfile: (data: Partial<User>) => void;
}

const defaultFilters: FilterState = {
  ageMin: 18,
  ageMax: 50,
  cities: [],
  religions: [],
  interests: [],
  gender: 'tous',
};

export const useKinzolaStore = create<KinzolaState>((set, get) => ({
  // Initial State
  currentScreen: 'welcome',
  currentTab: 'discover',
  previousScreen: null,
  theme: 'dark',
  user: null,
  isAuthenticated: false,
  profiles: sortProfilesByCompatibility(CURRENT_USER, MOCK_PROFILES),
  matches: MOCK_MATCHES,
  messages: [],
  conversations: MOCK_CONVERSATIONS,
  posts: MOCK_POSTS,
  stories: MOCK_STORIES,
  notifications: MOCK_NOTIFICATIONS,
  discoverMode: 'swipe',
  discoverIntent: 'amour',
  currentChatId: null,
  selectedProfile: null,
  filters: defaultFilters,
  showMatchModal: false,
  matchProfile: null,
  showFilters: false,
  showNewPost: false,
  showProfileDetail: false,
  showEditProfile: false,
  showSettings: false,
  showEditPersonalInfo: false,
  registerStep: 1,
  commentingPostId: null,
  showNotifications: false,
  showChatContactDetail: false,
  customNicknames: {},
  blockedUserIds: [],
  reports: [],
  superLikesRemaining: 5,
  totalLikesReceived: 24,
  totalViews: 156,
  likesReceived: MOCK_LIKES_RECEIVED,
  profileVisitors: MOCK_VISTORS,
  textSize: 16, // ✅ Hydration-safe: toujours 16 côté SSR, hydraté depuis localStorage côté client
  userPasswords: { 'user-me': 'Kinzola2024' },
  badgeStatus: 'none',
  badgeRequestTime: null,

  // Navigation Actions
  setScreen: (screen) => set((state) => ({ currentScreen: screen, previousScreen: state.currentScreen })),
  setTab: (tab) => set({ currentTab: tab }),
  goBack: () => set((state) => ({
    currentScreen: state.previousScreen || 'welcome',
    previousScreen: null,
  })),

  // Auth Actions
  login: (identifier, _password) => {
    // identifier can be phone or email — auto-detect
    const isEmail = identifier.includes('@');
    const updates: Partial<KinzolaState> = {
      isAuthenticated: true,
      currentScreen: 'main',
      profiles: sortProfilesByCompatibility(CURRENT_USER, MOCK_PROFILES),
    };
    if (isEmail) {
      updates.user = { ...CURRENT_USER, email: identifier };
    } else {
      updates.user = { ...CURRENT_USER, phone: identifier };
    }
    set(updates);
  },
  register: (data) => {
    const newUser = { ...CURRENT_USER, ...data } as User;
    set({
      user: newUser,
      isAuthenticated: true,
      currentScreen: 'main',
      profiles: sortProfilesByCompatibility(newUser, MOCK_PROFILES),
    });
  },
  logout: () => set({
    user: null,
    isAuthenticated: false,
    currentScreen: 'welcome',
    currentTab: 'discover',
  }),

  // Discover Actions
  setDiscoverMode: (mode) => set({ discoverMode: mode }),
  setDiscoverIntent: (intent) => set({ discoverIntent: intent }),
  likeProfile: (profileId) => {
    const { profiles, discoverIntent, user, addNotification } = get();
    const newMatches = [...get().matches];
    const profile = profiles.find(p => p.id === profileId);

    // Simulate match with 40% probability
    const isMatch = Math.random() < 0.4;

    if (isMatch && profile) {
      newMatches.push({
        id: `match-${Date.now()}`,
        user1Id: 'user-me',
        user2Id: profile.userId,
        profile,
        createdAt: new Date().toISOString(),
        newMatch: true,
      });
    }

    // Send notification to the "recipient" based on discoverIntent
    if (profile) {
      const intentLabel = discoverIntent === 'amitie' ? 'amitié' : 'amour';
      const intentType = discoverIntent === 'amitie' ? 'friend_request' as const : 'love_interest' as const;
      addNotification({
        type: intentType,
        title: discoverIntent === 'amitie' ? `Demande d'amitié de ${user?.name || 'Quelqu\'un'}` : `${user?.name || 'Quelqu\'un'} s\'intéresse à vous`,
        message: discoverIntent === 'amitie'
          ? `${user?.name || 'Quelqu\'un'} souhaite être votre ami(e) sur Kinzola. Connectez-vous pour répondre.`
          : `${user?.name || 'Quelqu\'un'} a envoyé un signal d\'intérêt amoureux. Découvrez qui c'est !`,
        fromUserId: user?.id,
        fromUserName: user?.name,
        fromUserPhoto: user?.photoUrl,
      });
    }

    // Remove profile from discover list
    const updatedProfiles = profiles.filter(p => p.id !== profileId);

    set({
      profiles: updatedProfiles,
      matches: newMatches,
      showMatchModal: isMatch,
      matchProfile: isMatch ? profile : null,
    });
  },
  passProfile: (profileId) => {
    const updatedProfiles = get().profiles.filter(p => p.id !== profileId);
    set({ profiles: updatedProfiles });
  },
  useSuperLike: (profileId) => {
    const { profiles, superLikesRemaining } = get();
    if (superLikesRemaining <= 0) return;

    const newMatches = [...get().matches];
    const profile = profiles.find(p => p.id === profileId);

    // Guaranteed match for super like
    const isMatch = true;

    if (isMatch && profile) {
      newMatches.push({
        id: `match-${Date.now()}`,
        user1Id: 'user-me',
        user2Id: profile.userId,
        profile,
        createdAt: new Date().toISOString(),
        newMatch: true,
        isSuperMatch: true,
      });
    }

    const updatedProfiles = profiles.filter(p => p.id !== profileId);

    set({
      profiles: updatedProfiles,
      matches: newMatches,
      superLikesRemaining: superLikesRemaining - 1,
      showMatchModal: isMatch,
      matchProfile: isMatch ? profile : null,
    });
  },
  resetDailySuperLikes: () => set({ superLikesRemaining: 5 }),
  tickOnlineStatus: () => {
    const { profiles, conversations } = get();
    const now = new Date();

    // Randomly toggle some profiles' online status
    const updatedProfiles = profiles.map(p => {
      if (Math.random() < 0.2) { // 20% chance to toggle each profile
        const isNowOnline = !p.online;
        return {
          ...p,
          online: isNowOnline,
          lastSeen: isNowOnline ? p.lastSeen : now.toISOString(),
        };
      }
      return p;
    });

    const updatedConversations = conversations.map(c => {
      if (Math.random() < 0.2) {
        const isNowOnline = !c.online;
        return {
          ...c,
          online: isNowOnline,
          lastSeen: isNowOnline ? c.lastSeen : now.toISOString(),
        };
      }
      return c;
    });

    set({ profiles: updatedProfiles, conversations: updatedConversations });
  },
  selectProfile: (profile) => set({ selectedProfile: profile, showProfileDetail: profile !== null }),
  applyFilters: (filters) => {
    const { user } = get();
    const filtered = filterAndSortProfiles(user, MOCK_PROFILES, filters);
    set({ filters, profiles: filtered, showFilters: false });
  },
  resetFilters: () => {
    const { user } = get();
    const sorted = user
      ? sortProfilesByCompatibility(user, MOCK_PROFILES)
      : MOCK_PROFILES;
    set({ filters: defaultFilters, profiles: sorted });
  },
  setShowFilters: (show) => set({ showFilters: show }),

  // Messages Actions
  openChat: (conversationId) => set({ currentChatId: conversationId }),
  closeChat: () => set({ currentChatId: null }),
  sendMessage: (conversationId, content) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'user-me',
          receiverId: conv.participant.userId,
          content,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: content,
          lastMessageTime: 'Maintenant',
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  sendMessageWithType: (conversationId, content, type) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'user-me',
          receiverId: conv.participant.userId,
          content,
          type: type as Message['type'],
          read: false,
          timestamp: new Date().toISOString(),
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: type === 'voice' ? '🎤 Message vocal' : type === 'image' ? '📷 Photo' : type === 'video' ? '🎬 Vidéo' : content,
          lastMessageTime: 'Maintenant',
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  deleteMessageForMe: (conversationId, messageId) => {
    const updatedConversations = get().conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map(m =>
            m.id === messageId ? { ...m, deletedForMe: true } : m
          ),
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  deleteMessageForAll: (conversationId, messageId) => {
    const updatedConversations = get().conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map(m =>
            m.id === messageId ? { ...m, deletedForAll: true, content: 'Ce message a été supprimé', type: 'text' as const } : m
          ),
          lastMessage: conv.messages.find(m => m.id === messageId)
            ? 'Ce message a été supprimé'
            : conv.lastMessage,
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  toggleMessageImportant: (conversationId, messageId) => {
    const updatedConversations = get().conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map(m =>
            m.id === messageId ? { ...m, important: !m.important } : m
          ),
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  sendReplyMessage: (conversationId, content, replyTo) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'user-me',
          receiverId: conv.participant.userId,
          content,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
          replyTo,
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: content,
          lastMessageTime: 'Maintenant',
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  forwardMessageToConversation: (targetConversationId, content) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === targetConversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'user-me',
          receiverId: conv.participant.userId,
          content: `▶ ${content}`,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: `▶ ${content.substring(0, 40)}`,
          lastMessageTime: 'Maintenant',
        };
      }
      return conv;
    });
    set({ conversations: updatedConversations });
  },
  deleteConversation: (conversationId) => {
    const updatedConversations = get().conversations.filter(c => c.id !== conversationId);
    set({ conversations: updatedConversations, currentChatId: null });
  },

  // Simulate incoming reply from the other person (mock auto-reply)
  simulateReply: (conversationId: string, sentContent: string) => {
    const { conversations, user, blockedUserIds } = get();
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv || blockedUserIds.includes(conv.participant.userId)) return;

    // Generate a contextual reply based on what was sent
    const replies = [
      'Haha c\'est vrai 😂',
      'Oh j\'adore ça !',
      'Tu es très intéressant(e) 🥰',
      'On se voit quand ?',
      'Moi aussi je pense la même chose',
      'Trop bien ! Dis m\'en plus',
      'Je suis d\'accord avec toi 💯',
      'C\'est beau ce que tu dis ❤️',
      'Ah oui ? Et après ?',
      'Je n\'ai pas encore vu ça, raconte moi',
      'Tu me fais rire 😄',
      'C\'est gentil de ta part',
      'On a beaucoup en commun je trouve',
      'Je kiffe ta vibe 🙌',
      'C\'est cool, on devrait en parler plus',
    ];

    // Pick a reply (try to be contextually relevant sometimes)
    let replyContent: string;
    const lower = sentContent.toLowerCase();
    if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hey') || lower.includes('yo')) {
      replyContent = 'Salut ! Comment tu vas ? 😊';
    } else if (lower.includes('ça va') || lower.includes('comment') || lower.includes('how')) {
      replyContent = 'Je vais bien merci ! Et toi ?';
    } else if (lower.includes('nom') || lower.includes('appell')) {
      replyContent = `Moi c'est ${conv.participant.name}, enchanté(e) ! 😊`;
    } else if (lower.includes('match') || lower.includes('plais')) {
      replyContent = 'Oui je suis content(e) de ce match ! Tu me plais beaucoup ❤️';
    } else if (lower.includes('photo') || lower.includes('voir') || lower.includes('rencontr')) {
      replyContent = 'Oui avec plaisir ! On peut se voir un de ces jours 🥰';
    } else {
      replyContent = replies[Math.floor(Math.random() * replies.length)];
    }

    // Delay 2-5 seconds before "replying"
    const delay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      const currentConvs = get().conversations;
      const updatedConvs = currentConvs.map(c => {
        if (c.id !== conversationId) return c;
        const replyMsg: Message = {
          id: `msg-${Date.now()}`,
          senderId: c.participant.userId,
          receiverId: 'user-me',
          content: replyContent,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
        };
        return {
          ...c,
          messages: [...c.messages, replyMsg],
          lastMessage: replyContent,
          lastMessageTime: 'Maintenant',
          unreadCount: (c.unreadCount || 0) + 1,
        };
      });
      set({ conversations: updatedConvs });

      // Also add a notification for the incoming message
      get().addNotification({
        type: 'message',
        title: `${conv.participant.name} vous a envoyé un message`,
        message: replyContent,
        fromUserId: conv.participant.userId,
        fromUserName: conv.participant.name,
        fromUserPhoto: conv.participant.photoUrl,
      });

      // Direct browser notification for incoming message
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notif = new Notification(`💬 ${conv.participant.name}`, {
            body: replyContent,
            icon: '/favicon.ico',
            tag: `kinzola-msg-${Date.now()}`,
            renotify: true,
            vibrate: [200, 100, 200],
          });
          notif.onclick = () => { window.focus(); notif.close(); };
          setTimeout(() => notif.close(), 5000);
        }
      } catch {}
    }, delay);
  },

  // Posts Actions
  createPost: (content, imageUrl, visibility = 'public') => {
    const { user, posts } = get();
    if (!user) return;
    const postVisibility = visibility;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorPhoto: user.photoUrl,
      content,
      imageUrl,
      views: 0,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      type: imageUrl ? 'photo' : 'text',
      visibility: postVisibility,
    };
    set({ posts: [newPost, ...posts] });
  },
  likePost: (postId) => {
    const { posts } = get();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    });
    set({ posts: updatedPosts });
  },
  addComment: (postId, content, isPublic) => {
    const { user, posts, notifications } = get();
    if (!user) return;
    const newComment = {
      id: `comment-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorPhoto: user.photoUrl,
      content,
      createdAt: new Date().toISOString(),
      isPublic,
    };
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    });
    set({ posts: updatedPosts, commentingPostId: null });
  },
  setCommentingPostId: (postId) => set({ commentingPostId: postId }),

  // Text Size Actions
  setTextSize: (size) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-text-size', String(size));
    }
    set({ textSize: size });
  },

  // Hydrate Actions — charge les préférences depuis localStorage côté client uniquement
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const savedSize = parseInt(localStorage.getItem('kinzola-text-size') || '16', 10);
    const savedTheme = localStorage.getItem('kinzola-theme') as 'light' | 'dark' | null;
    const updates: Partial<KinzolaState> = {};
    if (!isNaN(savedSize) && savedSize >= 12 && savedSize <= 24) {
      updates.textSize = savedSize;
    }
    if (savedTheme === 'light' || savedTheme === 'dark') {
      updates.theme = savedTheme;
    }
    // Hydrate custom nicknames from localStorage
    try {
      const savedNicknames = localStorage.getItem('kinzola-nicknames');
      if (savedNicknames) {
        updates.customNicknames = JSON.parse(savedNicknames);
      }
    } catch {}
    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },

  // Password Actions
  changePassword: (userId, oldPassword, newPassword) => {
    const { userPasswords } = get();
    const currentPwd = userPasswords[userId];

    // Check old password
    if (oldPassword !== currentPwd) {
      return { success: false, error: 'Ancien mot de passe incorrect' };
    }

    // Check minimum length
    if (newPassword.length < 8) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
    }

    // Check contains at least one digit
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
    }

    // Check contains at least one letter
    if (!/[a-zA-Z]/.test(newPassword)) {
      return { success: false, error: 'Le mot de passe doit contenir au moins une lettre' };
    }

    // Check not same as old
    if (newPassword === currentPwd) {
      return { success: false, error: 'Le nouveau mot de passe doit être différent de l\'ancien' };
    }

    // Update password
    set({ userPasswords: { ...userPasswords, [userId]: newPassword } });
    return { success: true, error: '' };
  },

  // Notification Actions
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set({ notifications: [newNotification, ...get().notifications] });
  },
  markAllNotificationsRead: () => {
    const updatedNotifications = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updatedNotifications });
  },
  markNotificationRead: (notifId) => {
    const updatedNotifications = get().notifications.map(n => {
      if (n.id === notifId) return { ...n, read: true };
      return n;
    });
    set({ notifications: updatedNotifications });
  },
  deleteNotification: (notifId) => {
    set({ notifications: get().notifications.filter(n => n.id !== notifId) });
  },
  clearAllNotifications: () => {
    set({ notifications: [] });
  },
  setShowNotifications: (show) => {
    if (show) {
      // Mark all as read when opening
      get().markAllNotificationsRead();
    }
    set({ showNotifications: show });
  },

  // Badge Actions
  setBadgeStatus: (status) => {
    const updates: Partial<KinzolaState> = { badgeStatus: status };
    if (status === 'processing') {
      updates.badgeRequestTime = new Date().toISOString();
      // Auto-approve after 1 hour (simulated: check on init)
    }
    if (status === 'approved') {
      // Update user verified status
      const { user } = get();
      if (user) {
        updates.user = { ...user, verified: true };
      }
    }
    set(updates);
  },

  // Theme Actions
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-theme', theme);
    }
    set({ theme });
  },

  // UI Actions
  setShowMatchModal: (show, profile) => set({ showMatchModal: show, matchProfile: profile || null }),
  setShowNewPost: (show) => set({ showNewPost: show }),
  setShowProfileDetail: (show) => set({ showProfileDetail: show }),
  setShowEditProfile: (show) => set({ showEditProfile: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowEditPersonalInfo: (show) => set({ showEditPersonalInfo: show }),
  setRegisterStep: (step) => set({ registerStep: step }),
  updateProfile: (data) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  },

  // Chat Contact Detail Actions
  setShowChatContactDetail: (show) => set({ showChatContactDetail: show }),
  setCustomNickname: (conversationId, nickname) => {
    const { customNicknames } = get();
    const updated = { ...customNicknames };
    if (nickname.trim()) {
      updated[conversationId] = nickname.trim();
    } else {
      delete updated[conversationId];
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-nicknames', JSON.stringify(updated));
    }
    set({ customNicknames: updated });
  },
  blockUser: (userId) => {
    const { blockedUserIds } = get();
    if (!blockedUserIds.includes(userId)) {
      set({ blockedUserIds: [...blockedUserIds, userId] });
    }
  },
  unblockUser: (userId) => {
    const { blockedUserIds } = get();
    set({ blockedUserIds: blockedUserIds.filter(id => id !== userId) });
  },
  reportUser: (targetUserId, reason) => {
    const { reports } = get();
    const newReport = {
      id: `report-${Date.now()}`,
      targetUserId,
      reason,
      createdAt: new Date().toISOString(),
    };
    set({ reports: [newReport, ...reports] });
  },
}));
