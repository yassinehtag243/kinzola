import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ─── Config Supabase (fallback direct si env vars absentes) ─────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xchfycabaaqzfmjxkvnu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaGZ5Y2FiYWFxemZtanhrdm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjc2MzgsImV4cCI6MjA5MDgwMzYzOH0.nH3J_3xPaL3JD1BrLUXbs0phemMvYDbx0hVhdYylGiQ';

// ─── Client public (côté client — React components, pages) ───
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── Client admin (côté serveur uniquement — API routes, middleware) ───
// ⚠️ NE JAMAIS utiliser côté client (expose le service_role key)
export const supabaseAdmin = (() => {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (serviceRole) {
    return createClient<Database>(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });
  }
  // En mode demo (pas de clé service_role), retourne le client public
  return supabase;
})();

// ─── Vérification rapide de connexion ───
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    // S'il n'y a pas de rows, c'est normal (table vide) — pas d'erreur
    return !error;
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey.length > 10
  );
}
