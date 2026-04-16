'use client';

// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Global Providers
//
//  Wraps all client-side providers (Auth, etc.) into a single component
//  that can be used in the root layout.
// ═══════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/supabase/auth-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
