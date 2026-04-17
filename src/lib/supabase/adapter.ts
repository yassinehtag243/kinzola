// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Type Adapter
//
//  Bidirectional mapping between:
//    • Frontend types (camelCase, src/types/index.ts)
//    • Database types (snake_case, src/lib/supabase/database.types.ts)
//
//  Every Supabase call MUST pass through these adapters so the UI
//  never sees snake_case fields.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  Profile,
  MatchRow,
  ConversationRow,
  MessageRow,
  CommentRow,
  PostRow,
  NotificationRow,
} from './database.types';

import type {
  User,
  Profile as FProfile,
  Match as FMatch,
  Message as FMessage,
  Conversation as FConversation,
  Post as FPost,
  Comment as FComment,
  Notification as FNotification,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
//  DB  →  Frontend
// ═══════════════════════════════════════════════════════════════════════════

/** Convert a Supabase Profile row → frontend Profile */
export function dbProfileToProfile(db: Profile): FProfile {
  return {
    id: db.id,
    userId: db.id,
    name: db.name,
    age: db.age,
    gender: db.gender,
    city: db.city,
    profession: db.profession,
    religion: db.religion,
    bio: db.bio,
    photoUrl: db.photo_url,
    photoGallery: db.photo_gallery ?? [],
    verified: db.verified,
    interests: db.interests ?? [],
    online: db.online,
    lastSeen: db.last_seen,
  };
}

/** Convert a Supabase Profile row → frontend User (with preferences defaults) */
export function dbProfileToUser(db: Profile, email?: string): User {
  return {
    id: db.id,
    email: email ?? db.email,
    phone: db.phone,
    name: db.name,
    pseudo: db.pseudo,
    age: db.age,
    gender: db.gender,
    city: db.city,
    profession: db.profession,
    religion: db.religion,
    bio: db.bio,
    photoUrl: db.photo_url,
    photoGallery: db.photo_gallery ?? [],
    verified: db.verified,
    interests: db.interests ?? [],
    preferences: {
      ageMin: 18,
      ageMax: 50,
      city: db.city,
      gender: 'tous',
      religion: db.religion,
    },
    createdAt: db.created_at,
    online: db.online,
    lastSeen: db.last_seen,
  };
}

/** Convert a Supabase MessageRow → frontend Message */
export function dbMessageToMessage(db: MessageRow): FMessage {
  return {
    id: db.id,
    senderId: db.sender_id,
    receiverId: '', // Not stored in message row — resolved from conversation
    content: db.content,
    type: db.type,
    read: db.read,
    timestamp: db.created_at,
    important: db.important,
    deletedForMe: db.deleted_for_sender || db.deleted_for_receiver || false,
    replyTo: db.reply_to_id
      ? { messageId: db.reply_to_id, senderName: '', content: '' }
      : null,
  };
}

/** Convert a Supabase CommentRow → frontend Comment */
export function dbCommentToComment(db: CommentRow): FComment {
  return {
    id: db.id,
    authorId: db.author_id,
    authorName: db.author?.name ?? db.author?.pseudo ?? 'Anonyme',
    authorPhoto: db.author?.photo_url ?? '' as string,
    content: db.content,
    createdAt: db.created_at,
    isPublic: db.is_public,
  };
}

/** Convert a Supabase PostRow → frontend Post */
export function dbPostToPost(db: PostRow): FPost {
  return {
    id: db.id,
    authorId: db.author_id,
    authorName: db.author?.name ?? db.author?.pseudo ?? 'Anonyme',
    authorPhoto: db.author?.photo_url ?? '' as string,
    content: db.content,
    imageUrl: db.image_url ?? undefined,
    views: db.views,
    likes: db.likes,
    liked: false, // Resolved separately
    comments: [], // Loaded separately
    createdAt: db.created_at,
    expiresAt: db.expires_at,
    type: db.image_url ? 'photo' : 'text',
    visibility: db.visibility,
  };
}

/** Convert a Supabase NotificationRow → frontend Notification */
export function dbNotificationToNotification(db: NotificationRow): FNotification {
  return {
    id: db.id,
    type: db.type as FNotification['type'],
    title: db.title,
    message: db.message,
    fromUserId: db.from_user_id ?? undefined,
    fromUserName: db.from_user?.name ?? db.from_user?.pseudo ?? undefined,
    fromUserPhoto: db.from_user?.photo_url ?? undefined,
    read: db.read,
    createdAt: db.created_at,
  };
}

/** Convert a Supabase MatchRow + Profile → frontend Match */
export function dbMatchToMatch(
  db: MatchRow,
  otherProfile: Profile,
): FMatch {
  return {
    id: db.id,
    user1Id: db.user1_id,
    user2Id: db.user2_id,
    profile: dbProfileToProfile(otherProfile),
    createdAt: db.created_at,
    newMatch: db.new_match,
    isSuperMatch: db.is_super_match || undefined,
  };
}

/** Convert a Supabase ConversationRow + other participant profile → frontend Conversation */
export function dbConversationToConversation(
  db: ConversationRow,
  otherProfile: Pick<Profile, 'id' | 'pseudo' | 'photo_url' | 'online' | 'last_seen' | 'age'> | null,
  messages: MessageRow[] = [],
): FConversation {
  const participant: FProfile = otherProfile
    ? {
        id: otherProfile.id,
        userId: otherProfile.id,
        name: otherProfile.pseudo,
        age: otherProfile.age,
        gender: 'femme',
        city: '',
        profession: '',
        religion: '',
        bio: '',
        photoUrl: otherProfile.photo_url,
        photoGallery: [],
        verified: false,
        interests: [],
        online: otherProfile.online,
        lastSeen: otherProfile.last_seen,
      }
    : {
        id: '',
        userId: '',
        name: 'Inconnu',
        age: 0,
        gender: 'femme',
        city: '',
        profession: '',
        religion: '',
        bio: '',
        photoUrl: '',
        photoGallery: [],
        verified: false,
        interests: [],
        online: false,
        lastSeen: '',
      };

  return {
    id: db.id,
    matchId: db.match_id,
    participant,
    messages: messages.map(dbMessageToMessage),
    lastMessage: db.last_message,
    lastMessageTime: db.last_message_time,
    unreadCount: 0,
    online: otherProfile?.online ?? false,
    lastSeen: otherProfile?.last_seen ?? '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Frontend  →  DB  (for inserts / updates)
// ═══════════════════════════════════════════════════════════════════════════

/** Convert frontend User profile updates → database Profile update fields */
export function userProfileToDbUpdate(data: Partial<User>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.pseudo !== undefined) update.pseudo = data.pseudo;
  if (data.age !== undefined) update.age = data.age;
  if (data.gender !== undefined) update.gender = data.gender;
  if (data.city !== undefined) update.city = data.city;
  if (data.profession !== undefined) update.profession = data.profession;
  if (data.religion !== undefined) update.religion = data.religion;
  if (data.bio !== undefined) update.bio = data.bio;
  if (data.photoUrl !== undefined) update.photo_url = data.photoUrl;
  if (data.photoGallery !== undefined) update.photo_gallery = data.photoGallery;
  if (data.interests !== undefined) update.interests = data.interests;
  return update;
}
