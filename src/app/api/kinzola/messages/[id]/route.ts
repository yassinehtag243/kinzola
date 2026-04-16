import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ── PATCH: Read, important toggle, or delete for me ──
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { action, userId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    const message = await db.message.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // ── MARK AS READ ──
    if (action === 'read') {
      const updated = await db.message.update({
        where: { id },
        data: { read: true },
      });

      // Also decrement the unread count for the receiver in the conversation
      const conversation = await db.conversation.findUnique({
        where: { id: message.conversationId },
      });

      if (conversation) {
        // Determine which unread counter to decrement
        const isParticipant1 = message.senderId !== conversation.participant1Id;
        if (isParticipant1 && conversation.participant1Unread > 0) {
          await db.conversation.update({
            where: { id: message.conversationId },
            data: { participant1Unread: { decrement: 1 } },
          });
        } else if (!isParticipant1 && conversation.participant2Unread > 0) {
          await db.conversation.update({
            where: { id: message.conversationId },
            data: { participant2Unread: { decrement: 1 } },
          });
        }
      }

      return NextResponse.json({
        message: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    }

    // ── TOGGLE IMPORTANT ──
    if (action === 'important') {
      const updated = await db.message.update({
        where: { id },
        data: { important: !message.important },
      });

      return NextResponse.json({
        message: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    }

    // ── DELETE FOR ME ──
    if (action === 'deleteForMe') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required for deleteForMe' },
          { status: 400 }
        );
      }

      const isSender = message.senderId === userId;
      const updated = await db.message.update({
        where: { id },
        data: isSender
          ? { deletedForSender: true }
          : { deletedForReceiver: true },
      });

      return NextResponse.json({
        message: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "read", "important", or "deleteForMe".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[MESSAGE PATCH ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
