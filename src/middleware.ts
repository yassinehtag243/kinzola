// ═══════════════════════════════════════════════════════════════════════════
//  KINZOLA — Middleware de Production
//
//  Sécurité et performance :
//  1. Rate limiting par IP (fenêtre glissante en mémoire)
//  2. Protection de /api/setup-database (blocage total en production)
//  3. Headers de sécurité additionnels
//  4. Logging des requêtes suspectes
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";

// ─── Rate Limiter (en mémoire, fenêtre glissante) ──────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les 60 secondes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

/**
 * Vérifie si une requête est autorisée par le rate limiter.
 * @param key - Clé unique (IP + endpoint)
 * @param limit - Nombre max de requêtes dans la fenêtre
 * @param windowMs - Fenêtre en millisecondes
 */
function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

/** Extrait l'IP du client (gère les proxys) */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// ─── Configuration des limites ─────────────────────────────────────────

const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  // Auth : 5 requêtes / 15s par IP (anti brute-force)
  auth: { limit: 5, windowMs: 15_000 },
  // Messages : 30 requêtes / minute par IP
  messages: { limit: 30, windowMs: 60_000 },
  // API générale : 60 requêtes / minute par IP
  default: { limit: 60, windowMs: 60_000 },
  // Bloquages / Signalements : 10 / minute
  moderation: { limit: 10, windowMs: 60_000 },
};

// ─── Routes bloquées ──────────────────────────────────────────────────

const BLOCKED_ROUTES = ["/api/setup-database"];

// ─── Catégoriser la route ──────────────────────────────────────────────

function getRouteCategory(pathname: string): string {
  if (pathname.includes("/auth")) return "auth";
  if (pathname.includes("/messages")) return "messages";
  if (pathname.includes("/blocks") || pathname.includes("/reports")) return "moderation";
  return "default";
}

// ─── Middleware principal ─────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // ─── 1. Bloquer les routes dangereuses ───────────────────────────────
  if (BLOCKED_ROUTES.some((route) => pathname.startsWith(route))) {
    console.warn(`[SECURITY] Route bloquée: ${pathname} (IP: ${ip})`);
    return NextResponse.json(
      { error: "Cette route n'est pas disponible en production" },
      { status: 403 }
    );
  }

  // ─── 2. Rate limiting pour les routes API ────────────────────────────
  if (pathname.startsWith("/api/")) {
    const category = getRouteCategory(pathname);
    const config = RATE_LIMITS[category] || RATE_LIMITS.default;
    const key = `${ip}:${category}`;

    if (isRateLimited(key, config.limit, config.windowMs)) {
      console.warn(
        `[RATE LIMIT] ${category}: ${pathname} (IP: ${ip}) — limite ${config.limit}/${config.windowMs}ms dépassée`
      );
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(config.windowMs / 1000)),
          },
        }
      );
    }
  }

  // ─── 3. Headers de sécurité additionnels ─────────────────────────────
  const response = NextResponse.next();

  // Correlation ID pour le debugging
  response.headers.set("x-request-id", crypto.randomUUID().slice(0, 8));

  return response;
}

// ─── Matcher : appliquer uniquement aux routes API ─────────────────────

export const config = {
  matcher: [
    // Toutes les routes API
    "/api/:path*",
    // Protéger aussi les routes internes
    "/api/kinzola/:path*",
  ],
};
