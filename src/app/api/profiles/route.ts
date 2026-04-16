import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/profiles
 *
 * Query parameters (all optional):
 *   - ageMin    : number  – minimum age (inclusive)
 *   - ageMax    : number  – maximum age (inclusive)
 *   - city      : string  – exact city match
 *   - religion  : string  – exact religion match
 *   - gender    : string  – "homme" | "femme" | "tous"
 *   - interest  : string  – profiles must have this interest (repeatable)
 *   - userId    : string  – exclude this user from results
 *   - sort      : string  – "compatibility" (default) | "recent" | "age_asc" | "age_desc"
 *   - limit     : number  – max results to return (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const ageMin = searchParams.has('ageMin') ? Number(searchParams.get('ageMin')) : undefined;
    const ageMax = searchParams.has('ageMax') ? Number(searchParams.get('ageMax')) : undefined;
    const city = searchParams.get('city') || undefined;
    const religion = searchParams.get('religion') || undefined;
    const gender = searchParams.get('gender') || undefined;
    const excludeUserId = searchParams.get('userId') || undefined;
    const sortBy = searchParams.get('sort') || 'compatibility';
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : 50;

    // Collect interest filters (repeatable query param)
    const interests: string[] = searchParams.getAll('interest').filter(Boolean);

    // Build the Prisma where clause
    const where: Prisma.UserWhereInput = {};

    // Exclude the requesting user
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    // Age range
    if (ageMin !== undefined || ageMax !== undefined) {
      where.age = {};
      if (ageMin !== undefined) where.age.gte = ageMin;
      if (ageMax !== undefined) where.age.lte = ageMax;
    }

    // City
    if (city) {
      where.city = city;
    }

    // Religion
    if (religion) {
      where.religion = religion;
    }

    // Gender
    if (gender && gender !== 'tous') {
      where.gender = gender;
    }

    // Interests (JSON field – we filter in-memory after the query)
    // We cannot do a proper JSON contains query in SQLite, so we fetch and filter.

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit > 200 ? 200 : limit, // fetch up to 200 for interest filtering
    });

    // Post-process: parse JSON fields and apply interest filter
    const profiles = users
      .map((user) => ({
        id: user.id,
        userId: user.id,
        name: user.name,
        age: user.age,
        gender: user.gender as 'homme' | 'femme',
        city: user.city,
        profession: user.profession ?? '',
        religion: user.religion ?? '',
        bio: user.bio ?? '',
        photoUrl: user.photoUrl ?? '',
        photoGallery: user.photoGallery ? JSON.parse(user.photoGallery) : [],
        verified: user.verified,
        interests: user.interests ? JSON.parse(user.interests) : [],
        online: user.online,
        lastSeen: user.updatedAt.toISOString(),
      }))
      .filter((profile) => {
        // Interest filter
        if (interests.length > 0) {
          const hasAll = interests.every((interest) =>
            profile.interests.some(
              (pi: string) => pi.toLowerCase() === interest.toLowerCase()
            )
          );
          if (!hasAll) return false;
        }
        return true;
      });

    // Sort in-memory
    let sorted = profiles;

    if (sortBy === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
    } else if (sortBy === 'age_asc') {
      sorted.sort((a, b) => a.age - b.age);
    } else if (sortBy === 'age_desc') {
      sorted.sort((a, b) => b.age - a.age);
    } else {
      // "compatibility" – sort by online (active first), then verified, then city match
      // In a real implementation, the requesting user's data would be passed in.
      // For now we use a heuristic: online > verified > recently created.
      sorted.sort((a, b) => {
        // Online comes first
        if (a.online !== b.online) return a.online ? -1 : 1;
        // Verified comes next
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        // Then by most recently created
        return (
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
        );
      });
    }

    // Apply final limit
    const finalProfiles = sorted.slice(0, limit);

    return NextResponse.json({
      success: true,
      profiles: finalProfiles,
      total: finalProfiles.length,
    });
  } catch (error) {
    console.error('[API /profiles] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
