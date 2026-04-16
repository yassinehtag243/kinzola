import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel gère automatiquement le format de sortie
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
