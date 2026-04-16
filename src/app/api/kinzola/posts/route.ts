import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function tryParse(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function sanitizeAuthor(user: Record<string, unknown>) {
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

// ── GET: Fetch non-expired posts ──
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    // Build the where clause
    const now = new Date();
    const where: Record<string, unknown> = {
      expiresAt: { gt: now },
    };

    if (userId) {
      // If userId provided, include public posts + friends-only from matches
      const userMatches = await db.match.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        select: { user1Id: true, user2Id: true },
      });

      const matchedUserIds = new Set<string>();
      userMatches.forEach((m) => {
        if (m.user1Id !== userId) matchedUserIds.add(m.user1Id);
        if (m.user2Id !== userId) matchedUserIds.add(m.user2Id);
      });

      // Also include the user's own posts
      matchedUserIds.add(userId);

      where.OR = [
        { visibility: 'public' },
        { visibility: 'friends', authorId: { in: Array.from(matchedUserIds) } },
      ];
    } else {
      // No userId — only public posts
      where.visibility = 'public';
    }

    const posts = await db.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, pseudo: true, photoUrl: true, age: true, gender: true, city: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = posts.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      imageUrl: post.imageUrl,
      views: post.views,
      likes: post.likes,
      visibility: post.visibility,
      expiresAt: post.expiresAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author,
    }));

    return NextResponse.json({ posts: serialized });
  } catch (error) {
    console.error('[POSTS GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: Create a new post ──
export async function POST(req: NextRequest) {
  try {
    const { authorId, content, imageUrl, visibility } = await req.json();

    if (!authorId || !content) {
      return NextResponse.json(
        { error: 'authorId and content are required' },
        { status: 400 }
      );
    }

    // 48-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const post = await db.post.create({
      data: {
        authorId,
        content,
        imageUrl: imageUrl || null,
        visibility: visibility || 'public',
        expiresAt,
      },
      include: {
        author: { select: { id: true, name: true, pseudo: true, photoUrl: true, age: true, gender: true, city: true, verified: true } },
      },
    });

    return NextResponse.json(
      {
        post: {
          ...post,
          expiresAt: post.expiresAt.toISOString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POSTS POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
