import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── GET: Fetch all notifications for a user ──
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      include: {
        fromUser: {
          select: { id: true, name: true, pseudo: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      fromUserId: n.fromUserId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      fromUser: n.fromUser,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: serialized });
  } catch (error) {
    console.error('[NOTIFICATIONS GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH: Mark notifications as read ──
export async function PATCH(req: NextRequest) {
  try {
    const { action, userId, notifId } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    // ── READ ALL ──
    if (action === 'readAll') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    // ── READ ONE ──
    if (action === 'readOne') {
      if (!notifId) {
        return NextResponse.json(
          { error: 'notifId is required' },
          { status: 400 }
        );
      }

      const notification = await db.notification.findUnique({
        where: { id: notifId },
      });

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      await db.notification.update({
        where: { id: notifId },
        data: { read: true },
      });

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "readAll" or "readOne".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[NOTIFICATIONS PATCH ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
