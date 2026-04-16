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

export const metadata: Metadata = {
  title: "Kinzola - Rencontre Sérieuse",
  description: "Kinzola - Des rencontres sérieuses, des relations durables. Application de rencontre premium en République Démocratique du Congo.",
  keywords: ["Kinzola", "rencontre", "relation sérieuse", "Kinshasa", "RDC", "Congo", "dating"],
  authors: [{ name: "Kinzola Team" }],
  openGraph: {
    title: "Kinzola - Rencontre Sérieuse",
    description: "Des rencontres sérieuses, des relations durables",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060E1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-kinzola-bg text-kinzola-text overflow-hidden`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
