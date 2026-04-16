import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper: sanitize user object
function sanitizeProfile(user: Record<string, unknown>) {
  const { passwordHash, ...safe } = user;
  // Parse JSON fields
  try {
    if (typeof safe.photoGallery === 'string') {
      (safe as Record<string, unknown>).photoGallery = JSON.parse(safe.photoGallery);
    }
  } catch { /* ignore parse errors */ }
  try {
    if (typeof safe.interests === 'string') {
      (safe as Record<string, unknown>).interests = JSON.parse(safe.interests);
    }
  } catch { /* ignore parse errors */ }
  return safe;
}

function toISO(obj: Record<string, unknown>) {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Date) {
      result[key] = val.toISOString();
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (userId) {
      // Return single profile
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ profiles: [] }, { status: 404 });
      }
      const sanitized = toISO(sanitizeProfile(user as unknown as Record<string, unknown>));
      return NextResponse.json({ profiles: [sanitized] });
    }

    // Return all profiles (discover)
    const users = await db.user.findMany();
    const sanitized = users.map((u) =>
      toISO(sanitizeProfile(u as unknown as Record<string, unknown>))
    );
    return NextResponse.json({ profiles: sanitized });
  } catch (error) {
    console.error('[PROFILES ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
