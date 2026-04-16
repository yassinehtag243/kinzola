import { create } from 'zustand';
import type { ScreenType, TabType, DiscoverMode, User, Profile, Match, Message, Conversation, Post, Story, FilterState, Notification } from '@/types';

// ─── Imports Supabase (services) ────────────────────────────────────────
import {
  login as supabaseLogin,
  register as supabaseRegister,
  logout as supabaseLogout,
  getUser as supabaseGetUser,
  updateProfile as supabaseUpdateProfile,
  changePassword as supabaseChangePassword,
} from '@/lib/supabase/auth-service';

import {
  getConversations,
  getMessages,
  sendMessage as supabaseSendMessage,
  sendReplyMessage as supabaseSendReplyMessage,
  deleteMessageForMe as supabaseDeleteMessageForMe,
  toggleMessageImportant as supabaseToggleMessageImportant,
  markMessagesAsRead,
  deleteConversation as supabaseDeleteConversation,
} from '@/lib/supabase/messages-service';

import {
  getMatches,
  likeProfile as supabaseLikeProfile,
  superLikeProfile as supabaseSuperLikeProfile,
  getBlockedUsers,
  blockUser as supabaseBlockUser,
  unblockUser as supabaseUnblockUser,
  reportUser as supabaseReportUser,
} from '@/lib/supabase/matches-service';

import {
  getPosts,
  createPost as supabaseCreatePost,
  likePost as supabaseLikePost,
  addComment as supabaseAddComment,
  checkPostLiked,
  getComments,
} from '@/lib/supabase/posts-service';

import {
  getNotifications,
  markNotificationRead as supabaseMarkNotificationRead,
  markAllNotificationsRead as supabaseMarkAllNotificationsRead,
  deleteNotification as supabaseDeleteNotification,
  clearAllNotifications as supabaseClearAllNotifications,
} from '@/lib/supabase/notifications-service';

import { getDiscoverProfiles } from '@/lib/supabase/discover-service';

// ─── Imports Adapter (DB ↔ Frontend) ─────────────────────────────────────
import {
  dbProfileToProfile,
  dbProfileToUser,
  dbMessageToMessage,
  dbConversationToConversation,
  dbNotificationToNotification,
  dbMatchToMatch,
  userProfileToDbUpdate,
} from '@/lib/supabase/adapter';

import {
  dbPostToPost,
  dbCommentToComment,
} from '@/lib/supabase/adapter';

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
  mutedConversationIds: string[];
  reports: Array<{ id: string; targetUserId: string; reason: string; createdAt: string }>;

  // Notification Reply
  pendingNotificationReply: { conversationId: string; participantName: string } | null;

  // Async states
  loading: boolean;
  error: string | null;

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
  startRandomMessages: () => void;

  // Actions - Posts
  createPost: (content: string, imageUrl?: string, visibility?: 'public' | 'friends') => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string, isPublic: boolean) => void;
  setCommentingPostId: (postId: string | null) => void;

  // Actions - Stories
  createStory: (content: string, imageUrl?: string) => void;

  // Actions - Theme
  setTheme: (theme: 'light' | 'dark') => void;

  // Actions - Text Size
  setTextSize: (size: number) => void;

  // Actions - Hydrate (charge les préférences localStorage côté client)
  hydrate: () => void;

  // Actions - Password
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error: string }>;

  // Actions - Badge
  setBadgeStatus: (status: 'none' | 'uploading_id' | 'uploading_selfie' | 'processing' | 'approved' | 'rejected') => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;

  // Actions - Chat Contact Detail
  setShowChatContactDetail: (show: boolean) => void;
  setCustomNickname: (conversationId: string, nickname: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  muteConversation: (conversationId: string) => void;
  unmuteConversation: (conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  setPendingNotificationReply: (data: { conversationId: string; participantName: string } | null) => void;
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

  // Actions - Data
  fetchAllData: () => Promise<void>;
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
  // ─── État initial (vides — données chargées via Supabase) ────────────
  currentScreen: 'welcome',
  currentTab: 'discover',
  previousScreen: null,
  theme: 'dark',
  user: null,
  isAuthenticated: false,
  profiles: [],
  matches: [],
  messages: [],
  conversations: [],
  posts: [],
  stories: [],
  notifications: [],
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
  mutedConversationIds: [],
  reports: [],
  pendingNotificationReply: null,
  superLikesRemaining: 5,
  totalLikesReceived: 0,
  totalViews: 0,
  likesReceived: [],
  profileVisitors: [],
  textSize: 16,
  badgeStatus: 'none',
  badgeRequestTime: null,
  loading: false,
  error: null,

  // ─── Navigation Actions ─────────────────────────────────────────────
  setScreen: (screen) => set((state) => ({ currentScreen: screen, previousScreen: state.currentScreen })),
  setTab: (tab) => set({ currentTab: tab }),
  goBack: () => set((state) => ({
    currentScreen: state.previousScreen || 'welcome',
    previousScreen: null,
  })),

  // ─── Auth Actions ───────────────────────────────────────────────────
  login: async (identifier, password) => {
    set({ loading: true, error: null });
    try {
      // identifier peut être un téléphone → convertir en email@kinzola.app
      const isEmail = identifier.includes('@');
      const email = isEmail ? identifier : `${identifier.replace(/\D/g, '')}@kinzola.app`;

      const result = await supabaseLogin(email, password);
      if (result.error) {
        set({ error: result.error.message, loading: false });
        return;
      }

      // Récupérer le profil complet
      const userResult = await supabaseGetUser();
      if (userResult.error || !userResult.profile) {
        set({ error: 'Impossible de charger le profil', loading: false });
        return;
      }

      const user = dbProfileToUser(userResult.profile, result.user?.email);

      set({
        isAuthenticated: true,
        user,
        currentScreen: 'main',
        loading: false,
        error: null,
      });

      // Charger toutes les données en arrière-plan
      get().fetchAllData().catch(console.error);
    } catch (err: any) {
      set({ error: err?.message || 'Erreur de connexion', loading: false });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      // Construire les données d'inscription Supabase
      const email = data.email || `${(data.phone || '').replace(/\D/g, '')}@kinzola.app`;
      const password = (data as any).password || 'Kinzola2024';

      const result = await supabaseRegister({
        email,
        password,
        pseudo: data.pseudo || data.name || '',
        name: data.name || '',
        age: data.age || 18,
        gender: (data.gender as any) || 'homme',
        city: data.city || 'Kinshasa',
        phone: data.phone,
        profession: data.profession,
        religion: data.religion,
        bio: data.bio,
      });

      if (result.error) {
        set({ error: result.error.message, loading: false });
        return;
      }

      // Récupérer le profil créé
      const userResult = await supabaseGetUser();
      if (userResult.error || !userResult.profile) {
        set({ error: 'Impossible de charger le profil', loading: false });
        return;
      }

      const user = dbProfileToUser(userResult.profile, email);

      set({
        isAuthenticated: true,
        user,
        currentScreen: 'main',
        loading: false,
        error: null,
      });

      // Charger toutes les données en arrière-plan
      get().fetchAllData().catch(console.error);
    } catch (err: any) {
      set({ error: err?.message || "Erreur lors de l'inscription", loading: false });
    }
  },

  logout: async () => {
    try {
      await supabaseLogout();
    } catch {
      // Même si la déconnexion Supabase échoue, on nettoie l'état local
    }
    set({
      user: null,
      isAuthenticated: false,
      currentScreen: 'welcome',
      currentTab: 'discover',
      profiles: [],
      matches: [],
      messages: [],
      conversations: [],
      posts: [],
      stories: [],
      notifications: [],
      likesReceived: [],
      profileVisitors: [],
      blockedUserIds: [],
      loading: false,
      error: null,
    });
  },

  // ─── fetchAllData — charge toutes les données depuis Supabase ───────
  fetchAllData: async () => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return;

    set({ loading: true });

    try {
      // Charger les données en parallèle
      const [
        discoverProfilesResult,
        matchesResult,
        conversationsResult,
        postsResult,
        notificationsResult,
        blockedUsersResult,
      ] = await Promise.allSettled([
        getDiscoverProfiles(user.id),
        getMatches(user.id),
        getConversations(user.id),
        getPosts(user.id),
        getNotifications(user.id),
        getBlockedUsers(user.id),
      ]);

      // Profils découverte
      let profiles: Profile[] = [];
      if (discoverProfilesResult.status === 'fulfilled') {
        profiles = discoverProfilesResult.value.map(dbProfileToProfile);
      }

      // Matchs
      let matches: Match[] = [];
      if (matchesResult.status === 'fulfilled') {
        matches = matchesResult.value.map((m) =>
          dbMatchToMatch(m, m.profile)
        );
      }

      // Conversations avec messages
      let conversations: Conversation[] = [];
      if (conversationsResult.status === 'fulfilled') {
        // Charger les messages pour chaque conversation
        const convs = conversationsResult.value;
        conversations = await Promise.all(
          convs.map(async (conv) => {
            try {
              const msgs = await getMessages(conv.id, user.id);
              return dbConversationToConversation(conv, conv.participant, msgs);
            } catch {
              return dbConversationToConversation(conv, conv.participant, []);
            }
          })
        );
      }

      // Posts avec likes et commentaires
      let posts: Post[] = [];
      if (postsResult.status === 'fulfilled') {
        const postsData = postsResult.value;
        posts = await Promise.all(
          postsData.map(async (post) => {
            try {
              const [liked, comments] = await Promise.all([
                checkPostLiked(post.id, user.id),
                getComments(post.id, user.id),
              ]);
              const p = dbPostToPost(post);
              p.liked = liked;
              p.comments = comments.map(dbCommentToComment);
              return p;
            } catch {
              const p = dbPostToPost(post);
              return p;
            }
          })
        );
      }

      // Notifications
      let notifications: Notification[] = [];
      if (notificationsResult.status === 'fulfilled') {
        notifications = notificationsResult.value.map((n) => dbNotificationToNotification(n as any));
      }

      // Utilisateurs bloqués
      let blockedUserIds: string[] = [];
      if (blockedUsersResult.status === 'fulfilled') {
        blockedUserIds = blockedUsersResult.value;
      }

      // Trier les profils par compatibilité
      const sortedProfiles = user
        ? sortProfilesByCompatibility(user, profiles)
        : profiles;

      set({
        profiles: sortedProfiles,
        matches,
        conversations,
        posts,
        notifications,
        blockedUserIds,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('[fetchAllData] Erreur:', err);
      set({ loading: false, error: err?.message || 'Erreur de chargement des données' });
    }
  },

  // ─── Discover Actions ───────────────────────────────────────────────
  setDiscoverMode: (mode) => set({ discoverMode: mode }),
  setDiscoverIntent: (intent) => set({ discoverIntent: intent }),

  likeProfile: async (profileId) => {
    const { user, profiles, discoverIntent } = get();
    if (!user) return;

    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    try {
      const result = await supabaseLikeProfile(user.id, profile.userId);

      // Supprimer le profil de la liste découverte
      const updatedProfiles = profiles.filter(p => p.id !== profileId);

      if (result.matched && profile) {
        // Créer un nouveau match local
        const newMatch: Match = {
          id: result.matchId || `match-${Date.now()}`,
          user1Id: user.id,
          user2Id: profile.userId,
          profile,
          createdAt: new Date().toISOString(),
          newMatch: true,
        };

        set({
          profiles: updatedProfiles,
          matches: [...get().matches, newMatch],
          showMatchModal: true,
          matchProfile: profile,
        });

        // Recharger les conversations pour inclure la nouvelle
        get().fetchAllData().catch(console.error);
      } else {
        set({ profiles: updatedProfiles });
      }
    } catch (err) {
      console.error('[likeProfile] Erreur:', err);
    }
  },

  passProfile: (profileId) => {
    const updatedProfiles = get().profiles.filter(p => p.id !== profileId);
    set({ profiles: updatedProfiles });
  },

  useSuperLike: async (profileId) => {
    const { user, profiles, superLikesRemaining } = get();
    if (!user || superLikesRemaining <= 0) return;

    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    try {
      const result = await supabaseSuperLikeProfile(user.id, profile.userId);

      // Supprimer le profil de la liste découverte
      const updatedProfiles = profiles.filter(p => p.id !== profileId);

      if (result.matched && profile) {
        const newMatch: Match = {
          id: result.matchId || `match-${Date.now()}`,
          user1Id: user.id,
          user2Id: profile.userId,
          profile,
          createdAt: new Date().toISOString(),
          newMatch: true,
          isSuperMatch: true,
        };

        set({
          profiles: updatedProfiles,
          matches: [...get().matches, newMatch],
          superLikesRemaining: superLikesRemaining - 1,
          showMatchModal: true,
          matchProfile: profile,
        });

        // Recharger les conversations
        get().fetchAllData().catch(console.error);
      } else {
        set({
          profiles: updatedProfiles,
          superLikesRemaining: superLikesRemaining - 1,
        });
      }
    } catch (err) {
      console.error('[useSuperLike] Erreur:', err);
    }
  },

  resetDailySuperLikes: () => set({ superLikesRemaining: 5 }),
  tickOnlineStatus: () => {
    // No-op — remplacé par realtime (Phase 5)
  },

  selectProfile: (profile) => set({ selectedProfile: profile, showProfileDetail: profile !== null }),

  applyFilters: async (filters) => {
    const { user } = get();
    set({ filters, showFilters: false });

    // Recharger les profils avec les nouveaux filtres
    if (user) {
      try {
        const dbProfiles = await getDiscoverProfiles(user.id, filters);
        const profiles = dbProfiles.map(dbProfileToProfile);
        const sorted = user ? sortProfilesByCompatibility(user, profiles) : profiles;
        set({ profiles: sorted });
      } catch (err) {
        console.error('[applyFilters] Erreur:', err);
      }
    }
  },

  resetFilters: async () => {
    const { user } = get();
    set({ filters: defaultFilters });

    if (user) {
      try {
        const dbProfiles = await getDiscoverProfiles(user.id);
        const profiles = dbProfiles.map(dbProfileToProfile);
        const sorted = user ? sortProfilesByCompatibility(user, profiles) : profiles;
        set({ profiles: sorted });
      } catch (err) {
        console.error('[resetFilters] Erreur:', err);
      }
    }
  },

  setShowFilters: (show) => set({ showFilters: show }),

  // ─── Messages Actions ───────────────────────────────────────────────
  openChat: (conversationId) => set({ currentChatId: conversationId }),
  closeChat: () => set({ currentChatId: null }),

  sendMessage: async (conversationId, content) => {
    const { user, conversations } = get();
    if (!user) return;

    try {
      await supabaseSendMessage(conversationId, user.id, content, 'text');

      // Mettre à jour la conversation locale
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        const newMessage: Message = {
          id: `msg-local-${Date.now()}`,
          senderId: user.id,
          receiverId: conv.participant.userId,
          content,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
        };
        const updatedConversations = conversations.map(c => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: content,
              lastMessageTime: 'Maintenant',
            };
          }
          return c;
        });
        set({ conversations: updatedConversations });
      }
    } catch (err) {
      console.error('[sendMessage] Erreur:', err);
    }
  },

  sendMessageWithType: async (conversationId, content, type) => {
    const { user, conversations } = get();
    if (!user) return;

    try {
      await supabaseSendMessage(conversationId, user.id, content, type as any);

      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        const newMessage: Message = {
          id: `msg-local-${Date.now()}`,
          senderId: user.id,
          receiverId: conv.participant.userId,
          content,
          type: type as Message['type'],
          read: false,
          timestamp: new Date().toISOString(),
        };
        const updatedConversations = conversations.map(c => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: type === 'voice' ? '🎤 Message vocal' : type === 'image' ? '📷 Photo' : type === 'video' ? '🎬 Vidéo' : content,
              lastMessageTime: 'Maintenant',
            };
          }
          return c;
        });
        set({ conversations: updatedConversations });
      }
    } catch (err) {
      console.error('[sendMessageWithType] Erreur:', err);
    }
  },

  sendReplyMessage: async (conversationId, content, replyTo) => {
    const { user, conversations } = get();
    if (!user) return;

    try {
      await supabaseSendReplyMessage(conversationId, user.id, content, replyTo.messageId);

      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        const newMessage: Message = {
          id: `msg-local-${Date.now()}`,
          senderId: user.id,
          receiverId: conv.participant.userId,
          content,
          type: 'text',
          read: false,
          timestamp: new Date().toISOString(),
          replyTo,
        };
        const updatedConversations = conversations.map(c => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: content,
              lastMessageTime: 'Maintenant',
            };
          }
          return c;
        });
        set({ conversations: updatedConversations });
      }
    } catch (err) {
      console.error('[sendReplyMessage] Erreur:', err);
    }
  },

  deleteMessageForMe: async (conversationId, messageId) => {
    const { user } = get();
    if (!user) return;

    try {
      await supabaseDeleteMessageForMe(messageId, user.id);

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
    } catch (err) {
      console.error('[deleteMessageForMe] Erreur:', err);
    }
  },

  deleteMessageForAll: async (conversationId, messageId) => {
    const { user } = get();
    if (!user) return;

    try {
      // Supprimer pour soi-même (des deux côtés non gérés côté client)
      await supabaseDeleteMessageForMe(messageId, user.id);

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
    } catch (err) {
      console.error('[deleteMessageForAll] Erreur:', err);
    }
  },

  toggleMessageImportant: async (conversationId, messageId) => {
    const { conversations } = get();

    try {
      const msg = conversations
        .find(c => c.id === conversationId)
        ?.messages.find(m => m.id === messageId);

      if (!msg) return;

      await supabaseToggleMessageImportant(messageId, !msg.important);

      const updatedConversations = conversations.map(conv => {
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
    } catch (err) {
      console.error('[toggleMessageImportant] Erreur:', err);
    }
  },

  forwardMessageToConversation: (targetConversationId, content) => {
    const { user, conversations } = get();
    if (!user) return;

    // Envoyer via sendMessage en arrière-plan
    supabaseSendMessage(targetConversationId, user.id, `▶ ${content}`, 'text')
      .catch(console.error);

    const updatedConversations = conversations.map(conv => {
      if (conv.id === targetConversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: user.id,
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

  deleteConversation: async (conversationId) => {
    try {
      await supabaseDeleteConversation(conversationId);
      const updatedConversations = get().conversations.filter(c => c.id !== conversationId);
      set({ conversations: updatedConversations, currentChatId: null });
    } catch (err) {
      console.error('[deleteConversation] Erreur:', err);
    }
  },

  // No-op — remplacé par realtime (Phase 5)
  simulateReply: (_conversationId: string, _sentContent: string) => {},

  // No-op — remplacé par realtime (Phase 5)
  startRandomMessages: () => {},

  // ─── Posts Actions ──────────────────────────────────────────────────
  createPost: async (content, imageUrl, visibility = 'public') => {
    const { user, posts } = get();
    if (!user) return;

    try {
      const dbPost = await supabaseCreatePost(user.id, content, imageUrl, visibility);
      const newPost = dbPostToPost(dbPost);
      newPost.liked = false;
      newPost.authorName = user.name;
      newPost.authorPhoto = user.photoUrl;
      set({ posts: [newPost, ...posts] });
    } catch (err) {
      console.error('[createPost] Erreur:', err);
    }
  },

  createStory: (content, imageUrl) => {
    const { user, stories } = get();
    if (!user) return;
    // Les stories seront gérées par Supabase dans une phase future
    const newStory: Story = {
      id: `story-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorPhoto: user.photoUrl,
      content,
      imageUrl,
      views: 0,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      type: imageUrl ? 'photo' : 'text',
    };
    set({ stories: [newStory, ...stories] });
  },

  likePost: async (postId) => {
    const { user, posts } = get();
    if (!user) return;

    try {
      const result = await supabaseLikePost(postId, user.id);

      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: result.liked,
            likes: result.totalLikes,
          };
        }
        return post;
      });
      set({ posts: updatedPosts });
    } catch (err) {
      console.error('[likePost] Erreur:', err);
    }
  },

  addComment: async (postId, content, isPublic) => {
    const { user, posts } = get();
    if (!user) return;

    try {
      const dbComment = await supabaseAddComment(postId, user.id, content, isPublic);
      const newComment = dbCommentToComment(dbComment);

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
    } catch (err) {
      console.error('[addComment] Erreur:', err);
    }
  },

  setCommentingPostId: (postId) => set({ commentingPostId: postId }),

  // ─── Text Size Actions ──────────────────────────────────────────────
  setTextSize: (size) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-text-size', String(size));
    }
    set({ textSize: size });
  },

  // ─── Hydrate Actions ────────────────────────────────────────────────
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

  // ─── Password Actions ───────────────────────────────────────────────
  changePassword: async (userId, oldPassword, newPassword) => {
    try {
      const result = await supabaseChangePassword(userId, oldPassword, newPassword);
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true, error: '' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors du changement de mot de passe' };
    }
  },

  // ─── Notification Actions ───────────────────────────────────────────
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set({ notifications: [newNotification, ...get().notifications] });
  },

  markAllNotificationsRead: async () => {
    const { user } = get();
    if (!user) return;

    try {
      await supabaseMarkAllNotificationsRead(user.id);
      const updatedNotifications = get().notifications.map(n => ({ ...n, read: true }));
      set({ notifications: updatedNotifications });
    } catch (err) {
      console.error('[markAllNotificationsRead] Erreur:', err);
    }
  },

  markNotificationRead: async (notifId) => {
    try {
      await supabaseMarkNotificationRead(notifId);
      const updatedNotifications = get().notifications.map(n => {
        if (n.id === notifId) return { ...n, read: true };
        return n;
      });
      set({ notifications: updatedNotifications });
    } catch (err) {
      console.error('[markNotificationRead] Erreur:', err);
    }
  },

  deleteNotification: async (notifId) => {
    try {
      await supabaseDeleteNotification(notifId);
      set({ notifications: get().notifications.filter(n => n.id !== notifId) });
    } catch (err) {
      console.error('[deleteNotification] Erreur:', err);
    }
  },

  clearAllNotifications: async () => {
    const { user } = get();
    if (!user) return;

    try {
      await supabaseClearAllNotifications(user.id);
      set({ notifications: [] });
    } catch (err) {
      console.error('[clearAllNotifications] Erreur:', err);
    }
  },

  setShowNotifications: (show) => {
    if (show) {
      // Marquer toutes comme lues à l'ouverture
      get().markAllNotificationsRead();
    }
    set({ showNotifications: show });
  },

  // ─── Badge Actions ──────────────────────────────────────────────────
  setBadgeStatus: (status) => {
    const updates: Partial<KinzolaState> = { badgeStatus: status };
    if (status === 'processing') {
      updates.badgeRequestTime = new Date().toISOString();
    }
    if (status === 'approved') {
      const { user } = get();
      if (user) {
        updates.user = { ...user, verified: true };
      }
    }
    set(updates);
  },

  // ─── Theme Actions ──────────────────────────────────────────────────
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-theme', theme);
    }
    set({ theme });
  },

  // ─── UI Actions ─────────────────────────────────────────────────────
  setShowMatchModal: (show, profile) => set({ showMatchModal: show, matchProfile: profile || null }),
  setShowNewPost: (show) => set({ showNewPost: show }),
  setShowProfileDetail: (show) => set({ showProfileDetail: show }),
  setShowEditProfile: (show) => set({ showEditProfile: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowEditPersonalInfo: (show) => set({ showEditPersonalInfo: show }),
  setRegisterStep: (step) => set({ registerStep: step }),

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;

    try {
      const dbUpdate = userProfileToDbUpdate(data);
      const { profile: updated, error } = await supabaseUpdateProfile(user.id, dbUpdate as any);
      if (error) {
        console.error('[updateProfile] Erreur:', error);
        return;
      }
      if (updated) {
        const updatedUser = dbProfileToUser(updated, user.email);
        set({ user: updatedUser });
      }
    } catch (err) {
      console.error('[updateProfile] Erreur:', err);
    }
  },

  // ─── Chat Contact Detail Actions ────────────────────────────────────
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

  blockUser: async (userId) => {
    const { user, blockedUserIds } = get();
    if (!user) return;

    try {
      await supabaseBlockUser(user.id, userId);
      if (!blockedUserIds.includes(userId)) {
        set({ blockedUserIds: [...blockedUserIds, userId] });
      }
    } catch (err) {
      console.error('[blockUser] Erreur:', err);
    }
  },

  unblockUser: async (userId) => {
    const { user, blockedUserIds } = get();
    if (!user) return;

    try {
      await supabaseUnblockUser(user.id, userId);
      set({ blockedUserIds: blockedUserIds.filter(id => id !== userId) });
    } catch (err) {
      console.error('[unblockUser] Erreur:', err);
    }
  },

  muteConversation: (conversationId) => {
    const { mutedConversationIds } = get();
    if (!mutedConversationIds.includes(conversationId)) {
      set({ mutedConversationIds: [...mutedConversationIds, conversationId] });
    }
  },

  unmuteConversation: (conversationId) => {
    const { mutedConversationIds } = get();
    set({ mutedConversationIds: mutedConversationIds.filter(id => id !== conversationId) });
  },

  markConversationRead: async (conversationId) => {
    const { user } = get();
    if (!user) return;

    try {
      await markMessagesAsRead(conversationId, user.id);
      const updatedConvs = get().conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      set({ conversations: updatedConvs });
    } catch (err) {
      console.error('[markConversationRead] Erreur:', err);
    }
  },

  setPendingNotificationReply: (data) => set({ pendingNotificationReply: data }),

  reportUser: async (targetUserId, reason) => {
    const { user, reports } = get();
    if (!user) return;

    try {
      await supabaseReportUser(user.id, targetUserId, reason as any);
      set({
        reports: [
          ...reports,
          {
            id: `report-${Date.now()}`,
            targetUserId,
            reason,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } catch (err) {
      console.error('[reportUser] Erreur:', err);
    }
  },
}));
