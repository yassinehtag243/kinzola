// ═══════════════════════════════════════════════════════════════
//  KINZOLA — Supabase Barrel Export
//  Point d'entrée unique pour tous les services Supabase
// ═══════════════════════════════════════════════════════════════

// Client
export { supabase, supabaseAdmin, checkSupabaseConnection, isSupabaseConfigured } from './client';

// Types
export type {
  Gender, DiscoverIntent, PostVisibility, MessageType,
  NotificationType, ReportReason,
  Profile, MatchRow, ConversationRow, MessageRow,
  PostRow, PostLike, CommentRow, NotificationRow,
  BlockedUser, ReportRow, CustomNickname,
  Database,
} from './database.types';

// Auth
export {
  register, login, logout, getSession, getUser,
  updateProfile as updateAuthProfile, changePassword,
  onAuthStateChange, resetPassword, deleteAccount,
} from './auth-service';
export type { RegisterData, ProfileUpdate, AuthResult, UserWithProfile } from './auth-service';
export { AuthProvider, useAuth } from './auth-context';

// Messages
export {
  getConversations, getMessages, sendMessage, sendReplyMessage,
  deleteMessageForMe, toggleMessageImportant, markMessagesAsRead,
  deleteConversation, subscribeToMessages, subscribeToConversations,
} from './messages-service';

// Matches
export {
  getMatches, getNewMatches, createMatch, markMatchSeen,
  checkMatchExists, likeProfile, superLikeProfile,
  getBlockedUsers, blockUser, unblockUser, reportUser,
} from './matches-service';

// Posts
export {
  getPosts, createPost, likePost, checkPostLiked,
  addComment, getComments, deletePost, getUserPosts, incrementPostViews,
} from './posts-service';

// Notifications
export {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications, subscribeToNotifications,
} from './notifications-service';

// Discover
export {
  getDiscoverProfiles,
} from './discover-service';

// Storage
export {
  uploadProfilePhoto, uploadGalleryPhoto, uploadMessageImage,
  uploadPostImage, uploadStoryImage, deletePhoto, getPublicUrl,
  updateProfilePhoto, updateGallery, deleteGallery,
} from './storage-service';
