import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── POST /api/delete-account ─────────────────────────────────────────
//  Supprime le compte utilisateur côté serveur avec la clé service_role.
//  Le cascade sur profiles.id supprime toutes les données liées.
//
//  Body : { userId: string }
//  Auth : vérifie que l'appelant est connecté via Authorization header
// ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xchfycabaaqzfmjxkvnu.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!serviceRoleKey) {
      console.error('[delete-account] SUPABASE_SERVICE_ROLE non configurée côté serveur');
      return NextResponse.json(
        { error: 'Configuration serveur manquante. Contactez le support.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── 1. Vérifier l'authentification de l'appelant ──
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Extraire le token Bearer
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // ── 2. Extraire le userId du body ──
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    // ── 3. Vérifier que l'utilisateur supprime SON PROPRE compte ──
    if (authUser.id !== userId) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    // ── 4. Supprimer les fichiers du storage (profil + galerie) ──
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('kinzola-photos')
        .list(userId);

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage
          .from('kinzola-photos')
          .remove(filesToDelete);
        console.log(`[delete-account] ${filesToDelete.length} fichier(s) storage supprimé(s)`);
      }
    } catch (storageErr) {
      console.warn('[delete-account] Erreur suppression storage:', storageErr);
      // On continue même si le storage échoue
    }

    // ── 5. Supprimer l'utilisateur auth (cascade supprimera le profil + données) ──
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[delete-account] Erreur suppression:', deleteError.message);
      return NextResponse.json(
        { error: deleteError.message || 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    console.log(`[delete-account] Compte ${userId} supprimé avec succès`);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[delete-account] Erreur inattendue:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
