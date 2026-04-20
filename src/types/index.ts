export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  pseudo: string;
  age: number;
  gender: 'homme' | 'femme';
  city: string;
  profession: string;
  religion: string;
  bio: string;
  photoUrl: string;
  photoGallery: string[];
  verified: boolean;
  interests: string[];
  preferences: {
    ageMin: number;
    ageMax: number;
    city: string;
    gender: 'homme' | 'femme' | 'tous';
    religion: string;
  };
  lookingFor?: string;
  height?: number;
  education?: string;
  languages?: string[];
  relationshipStatus?: string;
  lifestyle?: string;
  createdAt: string;
  online: boolean;
  lastSeen: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  pseudo: string;
  age: number;
  gender: 'homme' | 'femme';
  city: string;
  profession: string;
  religion: string;
  bio: string;
  photoUrl: string;
  photoGallery: string[];
  verified: boolean;
  interests: string[];
  distance?: number;
  online: boolean;
  lastSeen: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  profile: Profile;
  createdAt: string;
  newMatch: boolean;
  isSuperMatch?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video';
  read: boolean;
  timestamp: string;
  important?: boolean;
  deletedForMe?: boolean;
  deletedForAll?: boolean;
  replyTo?: { messageId: string; senderName: string; content: string } | null;
}

export interface Conversation {
  id: string;
  matchId: string;
  participant: Profile;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  lastSeen: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  imageUrl?: string;
  content: string;
  views: number;
  likes: number;
  comments: Comment[];
  createdAt: string;
  expiresAt: string;
  type: 'photo' | 'text';
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: string;
  isPublic?: boolean;
}

export interface Notification {
  id: string;
  type: 'name_change' | 'password_change' | 'mention' | 'badge_obtained' | 'comment_mention' | 'like' | 'match' | 'friend_request' | 'love_interest' | 'system' | 'profile_view';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserPhoto?: string;
  read: boolean;
  createdAt: string;
  category?: 'social' | 'system' | 'promo';
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface FilterState {
  ageMin: number;
  ageMax: number;
  cities: string[];
  religions: string[];
  interests: string[];
  gender: 'homme' | 'femme' | 'tous';
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  imageUrl?: string;
  views: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: string;
  expiresAt: string;
  type: 'photo' | 'text';
  visibility: 'public' | 'friends';
}

export type ScreenType = 'welcome' | 'login' | 'register' | 'main';
export type TabType = 'discover' | 'news' | 'messages' | 'profile';
export type DiscoverMode = 'swipe' | 'grid';
