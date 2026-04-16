import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ─── Firebase Configuration ───
// These values MUST come from environment variables (.env.local or .env)
// Get your credentials from: Firebase Console → Project Settings → Your apps → Config

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// ─── Configuration Validation ───
const DEMO_VALUES = [
  'AIzaSyDemoKey',
  'kinzola-demo',
  '000000000000',
  'abcdef1234567890',
];

function isDemoValue(value: string): boolean {
  if (!value) return true;
  return DEMO_VALUES.some(demo => value.includes(demo));
}

function isConfigValid(): boolean {
  const { apiKey, authDomain, projectId } = firebaseConfig;
  // Firebase requires at least apiKey, authDomain, projectId
  if (!apiKey || !authDomain || !projectId) return false;
  if (isDemoValue(apiKey) || isDemoValue(authDomain) || isDemoValue(projectId)) return false;
  // Real Firebase API keys always start with "AIzaSy"
  if (!apiKey.startsWith('AIzaSy') || apiKey.length < 30) return false;
  return true;
}

export const isFirebaseConfigured = isConfigValid();

// ─── Log Configuration Status ───
if (typeof window !== 'undefined') {
  if (isFirebaseConfigured) {
    console.log('✅ Firebase: Configuration valide – connexion en cours...');
  } else {
    console.warn(
      '⚠️ Firebase: Configuration invalide ou absente.\n' +
      '   L\'application fonctionnera en mode DÉMO (données locales uniquement).\n\n' +
      '   Pour activer Firebase :\n' +
      '   1. Créez un projet sur https://console.firebase.google.com\n' +
      '   2. Activez Authentication → Sign-in method → Anonyme\n' +
      '   3. Créez une base Firestore\n' +
      '   4. Activez Storage\n' +
      '   5. Copiez les variables dans .env.local :\n' +
      '      NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...\n' +
      '      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com\n' +
      '      NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-id\n' +
      '      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com\n' +
      '      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789\n' +
      '      NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123\n' +
      '   6. Redémarrez le serveur (npm run dev)'
    );
  }
}

// ─── Firebase App Initialization ───
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (isFirebaseConfigured) {
  // Real Firebase initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Demo mode: use dummy values that won't crash
  // We still create minimal objects to prevent import errors
  app = null as unknown as FirebaseApp;
  auth = null as unknown as Auth;
  db = null as unknown as Firestore;
  storage = null as unknown as FirebaseStorage;
}

export { app, auth, db, storage };
export default app;
