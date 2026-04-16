import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── GET: Get all custom nicknames set by a user ──
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const nicknames = await db.customNickname.findMany({
      where: { userId },
      include: {
        target: {
          select: { id: true, name: true, pseudo: true, photoUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const serialized = nicknames.map((n) => ({
      id: n.id,
      userId: n.userId,
      targetId: n.targetId,
      nickname: n.nickname,
      target: n.target,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return NextResponse.json({ nicknames: serialized });
  } catch (error) {
    console.error('[NICKNAMES GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Set or update a nickname (upsert) ──
export async function POST(req: NextRequest) {
  try {
    const { userId, targetId, nickname } = await req.json();

    if (!userId || !targetId || !nickname) {
      return NextResponse.json(
        { error: 'userId, targetId, and nickname are required' },
        { status: 400 }
      );
    }

    const result = await db.customNickname.upsert({
      where: {
        userId_targetId: { userId, targetId },
      },
      create: {
        userId,
        targetId,
        nickname,
      },
      update: {
        nickname,
      },
    });

    return NextResponse.json(
      {
        nickname: {
          id: result.id,
          userId: result.userId,
          targetId: result.targetId,
          nickname: result.nickname,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[NICKNAMES POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: Remove a nickname ──
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const targetId = req.nextUrl.searchParams.get('targetId');

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'userId and targetId are required' },
        { status: 400 }
      );
    }

    const existing = await db.customNickname.findUnique({
      where: { userId_targetId: { userId, targetId } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Nickname not found' },
        { status: 404 }
      );
    }

    await db.customNickname.delete({
      where: { userId_targetId: { userId, targetId } },
    });

    return NextResponse.json({ success: true, message: 'Nickname removed' });
  } catch (error) {
    console.error('[NICKNAMES DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
