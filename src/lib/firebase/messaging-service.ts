import { isFirebaseConfigured, db } from './config';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { getUserId } from './auth-service';

// ─── Firestore Collections ───
const CONVERSATIONS_COL = 'conversations';
const MESSAGES_COL = 'messages';

// ─── Types (internal to Firebase, mapped to app types) ───

export interface FirebaseConversation {
  id: string;
  participants: string[];  // Array of user UIDs
  participantNames: Record<string, string>;  // uid -> name
  participantPhotos: Record<string, string>; // uid -> photoUrl
  lastMessage: string;
  lastMessageType: 'text' | 'image' | 'voice';
  lastMessageTime: any; // Firestore Timestamp
  unreadCount: Record<string, number>; // uid -> count
  createdAt: any;
  updatedAt: any;
}

export interface FirebaseMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: string;
  type: 'text' | 'image' | 'voice';
  read: boolean;
  createdAt: any; // Firestore Timestamp
}

// ─── Safety Guard ───
// All functions return safe defaults when Firebase is not configured

function requireFirebase(operation: string): boolean {
  if (!isFirebaseConfigured || !db) {
    console.warn(`⚠️ Firebase: ${operation} ignoré — Firebase non configuré`);
    return false;
  }
  return true;
}

// ─── Conversation Helpers ───

/**
 * Get or create a conversation between current user and another user
 */
export async function getOrCreateConversation(
  otherUserId: string,
  otherUserName: string,
  otherUserPhoto: string,
): Promise<string> {
  if (!requireFirebase('getOrCreateConversation')) {
    // Return a fake conversation ID in demo mode
    return 'demo_conv_' + otherUserId;
  }

  const myId = getUserId();

  // Check if conversation already exists
  const q = query(
    collection(db, CONVERSATIONS_COL),
    where('participants', 'array-contains', myId),
    limit(20)
  );

  try {
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => {
      const data = d.data();
      return data.participants && data.participants.includes(otherUserId);
    });

    if (existing) {
      return existing.id;
    }
  } catch (err) {
    console.error('⚠️ Firebase: Erreur lors de la recherche de conversation:', err);
  }

  // Create new conversation
  try {
    const convRef = await addDoc(collection(db, CONVERSATIONS_COL), {
      participants: [myId, otherUserId],
      participantNames: { [myId]: 'Moi', [otherUserId]: otherUserName },
      participantPhotos: { [myId]: '', [otherUserId]: otherUserPhoto },
      lastMessage: '',
      lastMessageType: 'text',
      lastMessageTime: serverTimestamp(),
      unreadCount: { [myId]: 0, [otherUserId]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return convRef.id;
  } catch (err) {
    console.error('⚠️ Firebase: Erreur lors de la création de conversation:', err);
    return 'demo_conv_' + otherUserId;
  }
}

/**
 * Subscribe to conversations list for current user (real-time)
 * Returns unsubscribe function
 */
export function subscribeToConversations(
  callback: (conversations: FirebaseConversation[]) => void,
): () => void {
  if (!requireFirebase('subscribeToConversations')) {
    // Return empty list in demo mode
    callback([]);
    return () => {}; // noop unsubscribe
  }

  const myId = getUserId();

  const q = query(
    collection(db, CONVERSATIONS_COL),
    where('participants', 'array-contains', myId),
    orderBy('updatedAt', 'desc'),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const convs: FirebaseConversation[] = [];
    snapshot.forEach((docSnap) => {
      convs.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as FirebaseConversation);
    });
    callback(convs);
  }, (error) => {
    console.error('⚠️ Firestore conversations listener error:', error);
    // Return empty array on error (e.g., index not created yet)
    callback([]);
  });

  return unsubscribe;
}

// ─── Message Helpers ───

/**
 * Send a text message
 */
export async function sendTextMessage(
  conversationId: string,
  text: string,
): Promise<string> {
  if (!requireFirebase('sendTextMessage')) {
    return 'demo_msg_' + Date.now();
  }

  const msgRef = await addDoc(collection(db, MESSAGES_COL), {
    conversationId,
    senderId: getUserId(),
    text,
    type: 'text',
    read: false,
    createdAt: serverTimestamp(),
  });

  // Update conversation's lastMessage
  await updateConversation(conversationId, {
    lastMessage: text,
    lastMessageType: 'text',
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  conversationId: string,
  imageUrl: string,
): Promise<string> {
  if (!requireFirebase('sendImageMessage')) {
    return 'demo_msg_' + Date.now();
  }

  const msgRef = await addDoc(collection(db, MESSAGES_COL), {
    conversationId,
    senderId: getUserId(),
    imageUrl,
    type: 'image',
    read: false,
    createdAt: serverTimestamp(),
  });

  await updateConversation(conversationId, {
    lastMessage: '📷 Photo',
    lastMessageType: 'image',
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

/**
 * Send a voice message
 */
export async function sendVoiceMessage(
  conversationId: string,
  audioUrl: string,
  duration: string,
): Promise<string> {
  if (!requireFirebase('sendVoiceMessage')) {
    return 'demo_msg_' + Date.now();
  }

  const msgRef = await addDoc(collection(db, MESSAGES_COL), {
    conversationId,
    senderId: getUserId(),
    audioUrl,
    audioDuration: duration,
    type: 'voice',
    read: false,
    createdAt: serverTimestamp(),
  });

  await updateConversation(conversationId, {
    lastMessage: '🎤 Message vocal',
    lastMessageType: 'voice',
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

/**
 * Subscribe to messages of a specific conversation (real-time)
 * Returns unsubscribe function
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: FirebaseMessage[]) => void,
): () => void {
  if (!requireFirebase('subscribeToMessages')) {
    callback([]);
    return () => {}; // noop unsubscribe
  }

  const q = query(
    collection(db, MESSAGES_COL),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
    limit(100),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs: FirebaseMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as FirebaseMessage);
    });
    callback(msgs);
  }, (error) => {
    console.error('⚠️ Firestore messages listener error:', error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Mark all messages in a conversation as read for current user
 */
export async function markMessagesAsRead(conversationId: string): Promise<void> {
  if (!requireFirebase('markMessagesAsRead')) return;

  const myId = getUserId();
  await updateConversation(conversationId, {
    [`unreadCount.${myId}`]: 0,
  });
}

// ─── Internal Helpers ───

async function updateConversation(
  conversationId: string,
  data: Record<string, any>,
): Promise<void> {
  if (!requireFirebase('updateConversation')) return;

  try {
    const convRef = doc(db, CONVERSATIONS_COL, conversationId);
    await updateDoc(convRef, data);
  } catch (err) {
    console.error('⚠️ Firebase: Erreur updateConversation:', err);
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversationFromFirebase(
  conversationId: string,
): Promise<void> {
  if (!requireFirebase('deleteConversation')) return;

  try {
    // Delete conversation
    await deleteDoc(doc(db, CONVERSATIONS_COL, conversationId));

    // Delete all messages in this conversation
    const q = query(
      collection(db, MESSAGES_COL),
      where('conversationId', '==', conversationId),
    );
    const snapshot = await getDocs(q);
    const batchPromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(batchPromises);
  } catch (err) {
    console.error('⚠️ Firebase: Erreur deleteConversation:', err);
  }
}
