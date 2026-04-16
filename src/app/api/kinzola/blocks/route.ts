import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── GET: Get list of blocked user IDs ──
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const blocks = await db.block.findMany({
      where: { blockerId: userId },
      select: {
        blockedId: true,
        blocked: {
          select: { id: true, name: true, pseudo: true, photoUrl: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = blocks.map((b) => ({
      blockedId: b.blockedId,
      blocked: b.blocked,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ blocks: serialized });
  } catch (error) {
    console.error('[BLOCKS GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Block a user ──
export async function POST(req: NextRequest) {
  try {
    const { blockerId, blockedId } = await req.json();

    if (!blockerId || !blockedId) {
      return NextResponse.json(
        { error: 'blockerId and blockedId are required' },
        { status: 400 }
      );
    }

    if (blockerId === blockedId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Check if already blocked
    const existing = await db.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already blocked' },
        { status: 409 }
      );
    }

    const block = await db.block.create({
      data: { blockerId, blockedId },
    });

    return NextResponse.json(
      {
        block: {
          id: block.id,
          blockerId: block.blockerId,
          blockedId: block.blockedId,
          createdAt: block.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[BLOCKS POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: Unblock a user ──
export async function DELETE(req: NextRequest) {
  try {
    const { blockerId, blockedId } = await req.json();

    if (!blockerId || !blockedId) {
      return NextResponse.json(
        { error: 'blockerId and blockedId are required' },
        { status: 400 }
      );
    }

    const existing = await db.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    await db.block.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    return NextResponse.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('[BLOCKS DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
