import "../styles/globals.css";
import SupabaseProvider from "./supabase-provider";
import ClientRootLayout from "@/app/ClientRootLayout";
import { Inter, Manrope } from "next/font/google";
import type { Metadata } from "next";

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
  title: "Advaic",
  description: "KI-gestützter Maklerassistent für sichere und nachvollziehbare E-Mail-Automatisierung",
  icons: {
    icon: [
      { url: "/icon?size=32", type: "image/png", sizes: "32x32" },
      { url: "/icon?size=192", type: "image/png", sizes: "192x192" },
      { url: "/icon?size=512", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon?size=32"],
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
