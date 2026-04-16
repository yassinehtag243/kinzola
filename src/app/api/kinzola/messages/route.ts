import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── GET: Fetch messages in a conversation ──
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get('conversationId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'conversationId and userId are required' },
        { status: 400 }
      );
    }

    const messages = await db.message.findMany({
      where: {
        conversationId,
        AND: [
          { OR: [{ deletedForSender: false }] },
          { OR: [{ deletedForReceiver: false }] },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, pseudo: true, photoUrl: true } },
        replyTo: {
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter out messages deleted for the requesting user
    const filtered = messages.filter((msg) => {
      if (msg.senderId === userId && msg.deletedForSender) return false;
      if (msg.senderId !== userId && msg.deletedForReceiver) return false;
      return true;
    });

    const serialized = filtered.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type,
      read: msg.read,
      important: msg.important,
      replyTo: msg.replyTo
        ? { ...msg.replyTo, createdAt: msg.replyTo.createdAt.toISOString() }
        : null,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender,
    }));

    return NextResponse.json({ messages: serialized });
  } catch (error) {
    console.error('[MESSAGES GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Create a new message ──
export async function POST(req: NextRequest) {
  try {
    const { conversationId, senderId, content, type, replyToId } = await req.json();

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: 'conversationId, senderId, and content are required' },
        { status: 400 }
      );
    }

    // Get the conversation to determine the receiver
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Determine which participant is the receiver
    const receiverId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

    // Create the message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type || 'text',
        replyToId: replyToId || null,
      },
    });

    // Determine which unread counter to increment
    const isParticipant1 = senderId === conversation.participant1Id;

    // Update conversation's lastMessage, lastMessageTime, and unread count
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageTime: new Date(),
        ...(isParticipant1
          ? { participant2Unread: { increment: 1 } }
          : { participant1Unread: { increment: 1 } }),
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          read: message.read,
          important: message.important,
          replyToId: message.replyToId,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[MESSAGES POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
