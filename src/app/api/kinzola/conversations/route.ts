import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        match: true,
      },
      orderBy: { lastMessageTime: 'desc' },
    });

    // Get the other participant's profile for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id;

        const otherUser = await db.user.findUnique({
          where: { id: otherUserId },
        });

        const unreadCount =
          conv.participant1Id === userId
            ? conv.participant1Unread
            : conv.participant2Unread;

        if (!otherUser) {
          return {
            id: conv.id,
            matchId: conv.matchId,
            otherUser: null,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime.toISOString(),
            unreadCount,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            isSuperMatch: conv.match?.isSuperMatch ?? false,
            intent: conv.match?.intent ?? 'amour',
            newMatch: conv.match?.newMatch ?? false,
          };
        }

        const { passwordHash, ...safeUser } = otherUser;

        return {
          id: conv.id,
          matchId: conv.matchId,
          otherUser: {
            ...safeUser,
            photoGallery: tryParse(safeUser.photoGallery),
            interests: tryParse(safeUser.interests),
            lastSeen: safeUser.lastSeen?.toISOString(),
            createdAt: safeUser.createdAt?.toISOString(),
            updatedAt: safeUser.updatedAt?.toISOString(),
          },
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime.toISOString(),
          unreadCount,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          isSuperMatch: conv.match?.isSuperMatch ?? false,
          intent: conv.match?.intent ?? 'amour',
          newMatch: conv.match?.newMatch ?? false,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error('[CONVERSATIONS ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function tryParse(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}
