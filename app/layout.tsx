import "../styles/globals.css";
import SupabaseProvider from "./supabase-provider";
import ClientRootLayout from "@/app/ClientRootLayout";
import { Inter, Manrope } from "next/font/google";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://advaic.com";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Advaic",
  description: "KI-gestützter Maklerassistent für sichere und nachvollziehbare E-Mail-Automatisierung",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Advaic",
    title: "Advaic",
    description: "KI-gestützter Maklerassistent für sichere und nachvollziehbare E-Mail-Automatisierung",
    images: [
      {
        url: "/brand/advaic-icon.png",
        width: 1024,
        height: 1024,
        alt: "Advaic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advaic",
    description: "KI-gestützter Maklerassistent für sichere und nachvollziehbare E-Mail-Automatisierung",
    images: ["/brand/advaic-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/brand/advaic-icon.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/advaic-icon.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/advaic-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/advaic-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/brand/advaic-icon.png"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <SupabaseProvider initialSession={null}>
          <ClientRootLayout session={null}>{children}</ClientRootLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
