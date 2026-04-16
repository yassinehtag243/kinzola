'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-provider';

export default function FirebaseStatusBanner() {
  const { firebaseAvailable, error } = useFirebase();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show banner after a short delay and only on main screen
    if (!firebaseAvailable && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [firebaseAvailable, dismissed]);

  if (visible && !firebaseAvailable && !dismissed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-down">
        <div
          className="flex items-center gap-2 px-4 py-2.5 text-xs"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.15), rgba(255, 77, 141, 0.1))',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 165, 0, 0.2)',
          }}
        >
          {/* Indicator dot */}
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <span className="text-amber-300 font-medium">
              Mode démo
            </span>
            <span className="text-amber-200/70 ml-1.5">
              — Messagerie locale. Pour la messagerie en temps réel, configurez Firebase.
            </span>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-amber-300/50 hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}
