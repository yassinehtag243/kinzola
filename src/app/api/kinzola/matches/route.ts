import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function tryParse(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function sanitizeProfile(user: Record<string, unknown>) {
  const { passwordHash, ...safe } = user;
  if (typeof safe.photoGallery === 'string') {
    safe.photoGallery = tryParse(safe.photoGallery);
  }
  if (typeof safe.interests === 'string') {
    safe.interests = tryParse(safe.interests);
  }
  if (safe.lastSeen instanceof Date) {
    safe.lastSeen = safe.lastSeen.toISOString();
  }
  if (safe.createdAt instanceof Date) {
    safe.createdAt = safe.createdAt.toISOString();
  }
  if (safe.updatedAt instanceof Date) {
    safe.updatedAt = safe.updatedAt.toISOString();
  }
  return safe;
}

// ── GET: Fetch matches for a user ──
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const matches = await db.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: true,
        user2: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = matches.map((match) => {
      const otherUser =
        match.user1Id === userId ? match.user2 : match.user1;
      const { passwordHash, ...safeUser } = otherUser as Record<string, unknown>;

      return {
        id: match.id,
        otherUser: sanitizeProfile(safeUser as Record<string, unknown>),
        isSuperMatch: match.isSuperMatch,
        intent: match.intent,
        newMatch: match.newMatch,
        createdAt: match.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ matches: enriched });
  } catch (error) {
    console.error('[MATCHES GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Like or SuperLike with 40% match chance ──
export async function POST(req: NextRequest) {
  try {
    const { action, userId, targetId, intent } = await req.json();

    if (!action || !userId || !targetId) {
      return NextResponse.json(
        { error: 'action, userId, and targetId are required' },
        { status: 400 }
      );
    }

    if (userId === targetId) {
      return NextResponse.json(
        { error: 'Cannot match with yourself' },
        { status: 400 }
      );
    }

    // Check if a match already exists
    const existingMatch = await db.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetId },
          { user1Id: targetId, user2Id: userId },
        ],
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match already exists' },
        { status: 409 }
      );
    }

    // 40% chance of a match
    const isMatch = Math.random() < 0.4;

    if (isMatch) {
      const isSuperMatch = action === 'superLike';

      // Create the match
      const match = await db.match.create({
        data: {
          user1Id: userId,
          user2Id: targetId,
          isSuperMatch,
          intent: intent || 'amour',
          newMatch: true,
        },
      });

      // Create the conversation
      await db.conversation.create({
        data: {
          matchId: match.id,
          participant1Id: userId,
          participant2Id: targetId,
        },
      });

      // Create notifications for both users
      const targetUser = await db.user.findUnique({ where: { id: targetId } });
      const actingUser = await db.user.findUnique({ where: { id: userId } });

      await db.notification.create({
        data: {
          userId: targetId,
          fromUserId: userId,
          type: 'match',
          title: 'Nouveau match !',
          message: `Tu as un nouveau match avec ${actingUser?.pseudo || actingUser?.name || 'quelqu\'un'} !`,
        },
      });

      await db.notification.create({
        data: {
          userId: userId,
          fromUserId: targetId,
          type: 'match',
          title: 'Nouveau match !',
          message: `Tu as un nouveau match avec ${targetUser?.pseudo || targetUser?.name || 'quelqu\'un'} !`,
        },
      });

      return NextResponse.json({
        matched: true,
        isSuperMatch,
        match: {
          id: match.id,
          user1Id: match.user1Id,
          user2Id: match.user2Id,
          isSuperMatch: match.isSuperMatch,
          intent: match.intent,
          newMatch: match.newMatch,
          createdAt: match.createdAt.toISOString(),
        },
      });
    }

    // No match — return a gentle response
    return NextResponse.json({
      matched: false,
      message: action === 'superLike'
        ? 'Ton Super Like a été envoyé !'
        : 'Ton Like a été envoyé !',
    });
  } catch (error) {
    console.error('[MATCHES POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
