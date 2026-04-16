import { isFirebaseConfigured, auth } from './config';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

let currentUser: User | null = null;
const listeners: Set<(user: User | null) => void> = new Set();
let authInitialized = false;

// Initialize auth state listener ONLY if Firebase is properly configured
if (typeof window !== 'undefined' && isFirebaseConfigured && auth) {
  try {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authInitialized = true;
      listeners.forEach(fn => fn(user));
    });
  } catch (err) {
    console.error('❌ Firebase auth listener failed to initialize:', err);
    authInitialized = true; // Still mark as initialized to prevent hanging
  }
} else {
  // Mark as initialized in demo mode so callbacks fire immediately
  if (typeof window !== 'undefined') {
    authInitialized = true;
  }
}

export function getFirebaseUser(): User | null {
  return currentUser;
}

export function onFirebaseAuthChange(fn: (user: User | null) => void): () => void {
  listeners.add(fn);

  if (!isFirebaseConfigured) {
    // In demo mode, call immediately with null so the app proceeds
    fn(null);
  } else if (authInitialized) {
    // Already initialized, call with current value
    fn(currentUser);
  }

  return () => listeners.delete(fn);
}

export async function signInAnonymouslyAsUser(): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase non configuré — impossible de se connecter');
  }

  if (currentUser) return currentUser;

  try {
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    return result.user;
  } catch (error: any) {
    console.error('❌ Firebase signInAnonymously error:', error?.code || error);
    throw error;
  }
}

export function getUserId(): string {
  if (currentUser) return currentUser.uid;

  // Fallback: check localStorage for demo UID
  if (typeof window !== 'undefined') {
    const demoId = localStorage.getItem('kinzola_demo_uid');
    if (demoId) return demoId;
  }

  return 'anonymous';
}
