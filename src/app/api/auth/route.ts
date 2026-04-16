import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/auth
 *
 * Body must contain an `action` field:
 *   - "login"    – find an existing user by email (mock: any password is accepted)
 *   - "register" – create a new user if the email is not already taken
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name, age, gender, city, profession, religion, bio, phone } = body;

    // ---- Login ----
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email et mot de passe sont requis.' },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Aucun compte trouvé avec cet email.' },
          { status: 404 }
        );
      }

      // Mock implementation – any password is accepted
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone ?? '',
          name: user.name,
          age: user.age,
          gender: user.gender,
          city: user.city,
          profession: user.profession ?? '',
          religion: user.religion ?? '',
          bio: user.bio ?? '',
          photoUrl: user.photoUrl ?? '',
          verified: user.verified,
          interests: user.interests ? JSON.parse(user.interests) : [],
          online: user.online,
          createdAt: user.createdAt.toISOString(),
        },
      });
    }

    // ---- Register ----
    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json(
          { success: false, error: 'Email, mot de passe et nom sont requis.' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase();

      // Check if the email is already taken
      const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Un compte avec cet email existe déjà.' },
          { status: 409 }
        );
      }

      // Build interests JSON string if provided
      const interestsStr = body.interests
        ? JSON.stringify(body.interests)
        : JSON.stringify([]);

      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          phone: phone ?? null,
          name,
          age: age ?? 18,
          gender: gender ?? 'femme',
          city: city ?? 'Kinshasa',
          profession: profession ?? null,
          religion: religion ?? null,
          bio: bio ?? null,
          interests: interestsStr,
          online: true,
          preferences: body.preferences
            ? JSON.stringify(body.preferences)
            : null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone ?? '',
            name: user.name,
            age: user.age,
            gender: user.gender,
            city: user.city,
            profession: user.profession ?? '',
            religion: user.religion ?? '',
            bio: user.bio ?? '',
            photoUrl: user.photoUrl ?? '',
            verified: user.verified,
            interests: user.interests ? JSON.parse(user.interests) : [],
            online: user.online,
            createdAt: user.createdAt.toISOString(),
          },
        },
        { status: 201 }
      );
    }

    // ---- Unknown action ----
    return NextResponse.json(
      { success: false, error: `Action "${action}" non reconnue. Utilisez "login" ou "register".` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
