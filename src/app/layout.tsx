import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Production Metadata ───────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL("https://kinzola.app"),

  title: {
    default: "Kinzola - Rencontre Sérieuse",
    template: "%s | Kinzola",
  },

  description:
    "Kinzola - Des rencontres sérieuses, des relations durables. La première application de rencontres premium en République Démocratique du Congo. Inscription gratuite.",

  keywords: [
    "Kinzola",
    "rencontre",
    "relation sérieuse",
    "amitié",
    "amour",
    "Kinshasa",
    "RDC",
    "Congo",
    "dating app",
    "rencontre en ligne",
    "chat",
    "match",
  ],

  authors: [{ name: "Kinzola Team" }],
  creator: "Kinzola",
  publisher: "Kinzola",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // ─── Open Graph (partage social) ────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "fr_CD",
    url: "https://kinzola.app",
    siteName: "Kinzola",
    title: "Kinzola - Rencontre Sérieuse",
    description:
      "Des rencontres sérieuses, des relations durables. Rejoins des milliers de célibataires à Kinshasa et en RDC.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Kinzola - Rencontre Sérieuse",
      },
    ],
  },

  // ─── Twitter Card ───────────────────────────────────────────────────
  twitter: {
    card: "summary",
    title: "Kinzola - Rencontre Sérieuse",
    description:
      "Des rencontres sérieuses, des relations durables. La première app de rencontres en RDC.",
    images: ["/icon-512.png"],
    creator: "@kinzola_app",
  },

  // ─── Robots / SEO ───────────────────────────────────────────────────
  robots: {
    index: false,        // App derrière auth — pas d'indexation
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ─── Icons & Manifest ───────────────────────────────────────────────
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/icon-maskable-192.png",
      },
    ],
  },

  // ─── PWA ────────────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // ─── Misc ───────────────────────────────────────────────────────────
  category: "social",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#060E1A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect vers Supabase pour les images */}
        <link rel="preconnect" href="https://xchfycabaaqzfmjxkvnu.supabase.co" />
        <link rel="dns-prefetch" href="https://xchfycabaaqzfmjxkvnu.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-kinzola-bg text-kinzola-text overflow-hidden`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
