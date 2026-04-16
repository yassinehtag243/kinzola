// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Supabase Database Types (auto-generated base)
//
//  Types TypeScript pour toutes les tables Supabase.
//  À générer avec : npx supabase gen types typescript > src/lib/supabase/database.types.ts
//  En attendant, on définit les types manuellement.
// ═══════════════════════════════════════════════════════════════════════════

export type Gender = 'homme' | 'femme';

export type DiscoverIntent = 'amitie' | 'amour';

export type PostVisibility = 'public' | 'friends';

export type MessageType = 'text' | 'image' | 'voice' | 'video';

export type NotificationType =
  | 'match'
  | 'friend_request'
  | 'love_interest'
  | 'like'
  | 'comment_mention'
  | 'name_change'
  | 'password_change'
  | 'badge_obtained';

export type ReportReason =
  | 'Faux profil'
  | 'Harcèlement'
  | 'Contenu inapproprié'
  | 'Autre';

// ═══════════════════════════════════════════════════════════════════════════
//  Tables
// ═══════════════════════════════════════════════════════════════════════════

export interface Profile {
  id: string;               // = auth.uid
  email: string;
  phone: string;
  pseudo: string;           // Pseudonyme publique
  name: string;             // Nom complet (privé)
  age: number;
  gender: Gender;
  city: string;
  profession: string;
  religion: string;
  bio: string;
  photo_url: string;        // Photo de profil principale
  photo_gallery: string[];  // Autres photos (URLs stockage)
  verified: boolean;
  badge_status: 'none' | 'uploading_id' | 'uploading_selfie' | 'processing' | 'approved' | 'rejected';
  interests: string[];
  online: boolean;
  last_seen: string;
  discover_intent: DiscoverIntent;
  text_size: number;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  user1_id: string;
  user2_id: string;
  is_super_match: boolean;
  intent: DiscoverIntent;
  new_match: boolean;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface ConversationRow {
  id: string;
  match_id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string;
  last_message_time: string;
  participant1_unread: number;
  participant2_unread: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  read: boolean;
  important: boolean;
  deleted_for_sender: boolean;
  deleted_for_receiver: boolean;
  reply_to_id?: string | null;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  views: number;
  likes: number;
  visibility: PostVisibility;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  author?: Profile;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_public: boolean;
  created_at: string;
  // Joined
  author?: Profile;
}

export interface StoryRow {
  id: string;
  author_id: string;
  image_url?: string | null;
  content: string;
  type: 'photo' | 'text';
  views: number;
  likes: number;
  expires_at: string;
  created_at: string;
  // Joined
  author?: Profile;
}

export interface NotificationRow {
  id: string;
  user_id: string;         // Destinataire
  from_user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  // Joined
  from_user?: Profile;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  target_id: string;
  reason: ReportReason;
  created_at: string;
}

export interface CustomNickname {
  id: string;
  user_id: string;         // Qui définit le pseudo
  target_id: string;        // Pour qui le pseudo est défini
  nickname: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Database type aggregate for Supabase client
// ═══════════════════════════════════════════════════════════════════════════

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Profile, 'id' | 'created_at'>> };
      matches: { Row: MatchRow; Insert: Omit<MatchRow, 'id' | 'created_at'>; Update: Partial<Omit<MatchRow, 'id' | 'created_at'>> };
      conversations: { Row: ConversationRow; Insert: Omit<ConversationRow, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ConversationRow, 'id' | 'created_at' | 'updated_at'>> };
      messages: { Row: MessageRow; Insert: Omit<MessageRow, 'id' | 'created_at'>; Update: Partial<Omit<MessageRow, 'id' | 'created_at'>> };
      posts: { Row: PostRow; Insert: Omit<PostRow, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<PostRow, 'id' | 'created_at' | 'updated_at'>> };
      post_likes: { Row: PostLike; Insert: Omit<PostLike, 'id' | 'created_at'>; Update: Partial<PostLike> };
      comments: { Row: CommentRow; Insert: Omit<CommentRow, 'id' | 'created_at'>; Update: Partial<Omit<CommentRow, 'id' | 'created_at'>> };
      stories: { Row: StoryRow; Insert: Omit<StoryRow, 'id' | 'created_at'>; Update: Partial<Omit<StoryRow, 'id' | 'created_at'>> };
      notifications: { Row: NotificationRow; Insert: Omit<NotificationRow, 'id' | 'created_at'>; Update: Partial<Omit<NotificationRow, 'id' | 'created_at'>> };
      blocked_users: { Row: BlockedUser; Insert: Omit<BlockedUser, 'id' | 'created_at'>; Update: Partial<BlockedUser> };
      reports: { Row: ReportRow; Insert: Omit<ReportRow, 'id' | 'created_at'>; Update: Partial<ReportRow> };
      custom_nicknames: { Row: CustomNickname; Insert: Omit<CustomNickname, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<CustomNickname, 'id' | 'created_at' | 'updated_at'>> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      gender: Gender[];
      discover_intent: DiscoverIntent[];
      post_visibility: PostVisibility[];
      message_type: MessageType[];
      notification_type: NotificationType[];
      report_reason: ReportReason[];
    };
  };
}
