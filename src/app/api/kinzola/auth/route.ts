import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper: strip sensitive fields from user
function sanitizeUser(user: Record<string, unknown>) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name, pseudo, age, gender, city } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ── LOGIN ──
    if (action === 'login') {
      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Plain-text comparison for demo
      if (user.passwordHash !== password) {
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }

      const sanitized = sanitizeUser(user as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, user: sanitized });
    }

    // ── REGISTER ──
    if (action === 'register') {
      if (!name || !age) {
        return NextResponse.json(
          { success: false, error: 'Name and age are required' },
          { status: 400 }
        );
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }

      const user = await db.user.create({
        data: {
          email,
          passwordHash: password,
          name,
          pseudo: pseudo || '',
          age: Number(age),
          gender: gender || 'femme',
          city: city || 'Kinshasa',
        },
      });

      const sanitized = sanitizeUser(user as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, user: sanitized }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "login" or "register".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
