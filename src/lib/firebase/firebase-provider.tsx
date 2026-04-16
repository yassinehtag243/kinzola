'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { isFirebaseConfigured } from './config';

interface FirebaseContextType {
  isReady: boolean;
  userId: string;
  isSignedIn: boolean;
  firebaseAvailable: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isReady: false,
  userId: '',
  isSignedIn: false,
  firebaseAvailable: false,
  error: null,
});

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If Firebase is not configured, immediately set ready in demo mode
    if (!isFirebaseConfigured) {
      console.log('📱 Kinzola: Mode démo activé — données locales uniquement');
      // Generate a stable demo user ID from localStorage
      let demoId = '';
      if (typeof window !== 'undefined') {
        demoId = localStorage.getItem('kinzola_demo_uid') || '';
        if (!demoId) {
          demoId = 'demo_' + Math.random().toString(36).slice(2, 10);
          localStorage.setItem('kinzola_demo_uid', demoId);
        }
      }
      setUserId(demoId);
      setIsReady(true);
      setError(null);
      return;
    }

    // Firebase IS configured — attempt real authentication
    let unsubscribe: (() => void) | null = null;

    async function initFirebase() {
      try {
        // Dynamic import to avoid crash if firebase auth is null in demo mode
        const { auth } = await import('./config');
        const { signInAnonymously, onAuthStateChanged } = await import('firebase/auth');

        if (!auth) {
          throw new Error('Firebase Auth non initialisé');
        }

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUserId(user.uid);
            setError(null);
            setIsReady(true);
          } else {
            // Auto sign in anonymously
            try {
              const result = await signInAnonymously(auth);
              setUserId(result.user.uid);
              setError(null);
              console.log('✅ Firebase: Connecté anonymement avec UID:', result.user.uid);
            } catch (authError: any) {
              console.error('❌ Firebase Auth error:', authError);
              const errorCode = authError?.code || '';

              if (errorCode === 'auth/api-key-not-valid') {
                setError('api-key-invalid');
                console.error(
                  '🔧 SOLUTION: Vérifiez votre NEXT_PUBLIC_FIREBASE_API_KEY dans .env.local\n' +
                  '   → Firebase Console → Paramètres du projet → Applications Web\n' +
                  '   → Copiez EXACTEMENT la valeur de apiKey'
                );
              } else if (errorCode === 'auth/invalid-tenant-id') {
                setError('tenant-invalid');
                console.error(
                  '🔧 SOLUTION: Vérifiez NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
                  '   → Format: votre-projet.firebaseapp.com'
                );
              } else if (errorCode?.includes('network')) {
                setError('network');
                console.error('🔧 SOLUTION: Vérifiez votre connexion internet');
              } else {
                setError('auth-failed');
              }

              // Still set ready so the app continues to function in demo mode
              let fallbackId = '';
              if (typeof window !== 'undefined') {
                fallbackId = localStorage.getItem('kinzola_demo_uid') || '';
                if (!fallbackId) {
                  fallbackId = 'demo_' + Math.random().toString(36).slice(2, 10);
                  localStorage.setItem('kinzola_demo_uid', fallbackId);
                }
              }
              setUserId(fallbackId);
              setIsReady(true);
            }
          }
        });
      } catch (initError) {
        console.error('❌ Firebase initialization error:', initError);
        setError('init-failed');

        // Fallback to demo mode
        let fallbackId = '';
        if (typeof window !== 'undefined') {
          fallbackId = localStorage.getItem('kinzola_demo_uid') || '';
          if (!fallbackId) {
            fallbackId = 'demo_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('kinzola_demo_uid', fallbackId);
          }
        }
        setUserId(fallbackId);
        setIsReady(true);
      }
    }

    initFirebase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        isReady,
        userId,
        isSignedIn: !!userId && isFirebaseConfigured,
        firebaseAvailable: isFirebaseConfigured && !error,
        error,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
