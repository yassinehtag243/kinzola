// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Server-side Registration API
//
//  Crée le profil utilisateur côté serveur avec le service_role key,
//  ce qui contourne RLS et fonctionne même si la confirmation email
//  est activée (la session n'est pas encore active côté client).
//
//  Utilise fetch direct vers Supabase REST API (pas le client JS)
//  pour une fiabilité maximale en environnement serverless (Vercel).
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      email,
      pseudo,
      name,
      age,
      gender,
      city,
      phone,
      profession,
      religion,
      bio,
    } = body;

    // Validation minimale
    if (!userId || !email || !pseudo || !name || !gender || !city) {
      return NextResponse.json(
        { error: 'Données manquantes pour la création du profil' },
        { status: 400 }
      );
    }

    // Vérifier que les variables d'environnement sont disponibles
    if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) {
      console.error('[REGISTER API] NEXT_PUBLIC_SUPABASE_URL not configured');
      return NextResponse.json(
        { error: 'Configuration serveur manquante (SUPABASE_URL)' },
        { status: 500 }
      );
    }

    // Utiliser le service_role si disponible, sinon l'anon key
    const apiKey = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
    const isServiceRole = !!SUPABASE_SERVICE_ROLE;

    // Appel direct à Supabase REST API via fetch
    const profileUrl = `${SUPABASE_URL}/rest/v1/profiles`;

    const profileData = {
      id: userId,
      email,
      pseudo,
      name,
      age: parseInt(age) || 25,
      gender,
      city,
      profession: profession || '',
      religion: religion || '',
      bio: bio || '',
      phone: phone || '',
      photo_url: '',
      photo_gallery: [],
      verified: false,
      badge_status: 'none',
      interests: [],
      online: true,
      last_seen: new Date().toISOString(),
      discover_intent: 'amitie',
      text_size: 16,
    };

    const response = await fetch(profileUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Prefer': 'resolution=merge-duplicate,return=representation',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => 'Unknown error');
      console.error('[REGISTER API] Supabase error:', response.status, errorData);

      // Si RLS bloque (401/403) et qu'on n'a pas le service_role
      if ((response.status === 401 || response.status === 403) && !isServiceRole) {
        console.warn('[REGISTER API] RLS block detected — SUPABASE_SERVICE_ROLE not set on Vercel');
        return NextResponse.json(
          { error: 'Permissions insuffisantes. Contactez le support.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Erreur création profil (HTTP ${response.status})` },
        { status: response.status }
      );
    }

    const profile = await response.json().catch(() => null);

    return NextResponse.json({ profile, serviceRole: isServiceRole }, { status: 201 });
  } catch (err) {
    console.error('[REGISTER API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
