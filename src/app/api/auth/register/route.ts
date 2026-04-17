// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Server-side Registration API
//
//  Crée le profil utilisateur côté serveur avec le service_role key,
//  ce qui contourne RLS et fonctionne même si la confirmation email
//  est activée (la session n'est pas encore active côté client).
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

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

    // Créer/mettre à jour le profil avec le service_role (bypass RLS)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
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
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[REGISTER API] Profile creation error:', error);
      return NextResponse.json(
        { error: `Erreur création profil: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    console.error('[REGISTER API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
