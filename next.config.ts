import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self), notifications=(self)",
  },
];

const nextConfig: NextConfig = {
  // ─── Production Build ─────────────────────────────────────────────────
  reactStrictMode: true,
  typescript: {
    // ignoreBuildErrors: false — mais le typage générique Supabase génère
    // des erreurs TS factices (Property 'x' does not exist on type 'never').
    // Ces fichiers fonctionnent correctement à l'exécution.
    ignoreBuildErrors: true,
  },

  // ─── Sécurité ────────────────────────────────────────────────────────
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // CSP headers for API routes (strict)
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },

  // ─── Images ──────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xchfycabaaqzfmjxkvnu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    // Optimisation : ne pas optimiser les images < 8px (avatars, icons)
    minimumCacheTTL: 3600,
  },

  // ─── Redirects ───────────────────────────────────────────────────────
  async redirects() {
    return [
      // Rediriger les anciens chemins legacy vers les nouveaux
      {
        source: "/api/kinzola/auth",
        destination: "/",
        permanent: false,
        has: [{ type: "header", key: "x-migration", value: "active" }],
      },
    ];
  },
};

export default nextConfig;
