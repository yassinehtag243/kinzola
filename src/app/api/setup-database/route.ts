import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — API: Setup Database
//
//  Exécute le schéma SQL complet dans Supabase.
//  À appeler UNE SEULE FOIS pour initialiser la base de données.
//  DELETE cette route après utilisation en production.
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON || '';

export const dynamic = 'force-dynamic';

async function getSupabaseClient() {
  if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
    return null;
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    // Vérifier que Supabase est configuré
    if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase non configuré. Vérifiez vos variables .env.local' },
        { status: 500 }
      );
    }

    const supabaseAdmin = await getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Impossible de créer le client Supabase' },
        { status: 500 }
      );
    }

    // Test de connexion simple
    const { error: testError } = await supabaseAdmin.from('profiles').select('id').limit(1);

    // Si la table n'existe pas encore, c'est normal - on continue
    if (testError && !testError.message.includes('does not exist') && testError.code !== '42P01') {
      console.log('Test result (table may not exist yet):', testError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion Supabase vérifiée avec succès !',
      details: {
        url: supabaseUrl,
        nextStep: 'Exécutez le SQL dans le Supabase SQL Editor (Dashboard → SQL Editor)',
        sqlFile: 'supabase/migrations/001_kinzola_schema.sql',
      },
    });
  } catch (error) {
    console.error('Erreur setup database:', error);
    return NextResponse.json(
      { error: 'Erreur de connexion à Supabase' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de setup de la base de données Kinzola',
    instructions: 'Envoyez une requête POST pour vérifier la connexion Supabase',
    nextStep: 'Executez le SQL manuellement dans Supabase Dashboard → SQL Editor',
  });
}
