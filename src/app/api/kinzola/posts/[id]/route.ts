import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ── PATCH: Like or view a post ──
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

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // ── TOGGLE LIKE ──
    if (action === 'like') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required to like a post' },
          { status: 400 }
        );
      }

      // Check if already liked
      const existingLike = await db.postLike.findUnique({
        where: { postId_userId: { postId: id, userId } },
      });

      if (existingLike) {
        // Unlike
        await db.postLike.delete({
          where: { id: existingLike.id },
        });

        const updated = await db.post.update({
          where: { id },
          data: { likes: { decrement: 1 } },
        });

        return NextResponse.json({
          post: {
            ...updated,
            expiresAt: updated.expiresAt.toISOString(),
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
          liked: false,
        });
      }

      // Like
      await db.postLike.create({
        data: { postId: id, userId },
      });

      const updated = await db.post.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });

      // Notify the author
      if (userId !== post.authorId) {
        const liker = await db.user.findUnique({ where: { id: userId } });
        await db.notification.create({
          data: {
            userId: post.authorId,
            fromUserId: userId,
            type: 'like',
            title: 'Nouveau like',
            message: `${liker?.pseudo || liker?.name || 'Quelqu\'un'} a aimé ta publication.`,
          },
        });
      }

      return NextResponse.json({
        post: {
          ...updated,
          expiresAt: updated.expiresAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
        liked: true,
      });
    }

    // ── INCREMENT VIEWS ──
    if (action === 'view') {
      const updated = await db.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      return NextResponse.json({
        post: {
          ...updated,
          expiresAt: updated.expiresAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "like" or "view".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[POST PATCH ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: Delete a post (only if author) ──
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { authorId } = body;

    if (!authorId) {
      return NextResponse.json(
        { error: 'authorId is required' },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Only the author can delete this post' },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('[POST DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
