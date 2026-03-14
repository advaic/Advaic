import "../styles/globals.css";
import SupabaseProvider from "./supabase-provider";
import ClientRootLayout from "@/app/ClientRootLayout";
import GlobalStructuredData from "@/components/seo/GlobalStructuredData";
import { buildOgImageUrl, DEFAULT_MARKETING_SHARE_IMAGE_ALT } from "@/lib/seo/marketing-metadata";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();
const googleSiteVerification = String(
  process.env.GOOGLE_SITE_VERIFICATION || "",
).trim();
const bingSiteVerification = String(
  process.env.BING_SITE_VERIFICATION || "",
).trim();

const defaultShareImage = buildOgImageUrl({
  template: "brand",
  eyebrow: "Advaic",
  title: "E-Mail-Autopilot für Immobilienmakler",
  proof: "Guardrails, Freigabe-Logik und Qualitätschecks vor dem Versand.",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Advaic",
  title: "Advaic",
  description: "E-Mail-Autopilot für Immobilienmakler mit Guardrails, Freigabe-Logik und Qualitätschecks vor dem Versand.",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Advaic",
    title: "Advaic | E-Mail-Autopilot für Immobilienmakler",
    description: "E-Mail-Autopilot für Immobilienmakler mit Guardrails, Freigabe-Logik und Qualitätschecks vor dem Versand.",
    images: [
      {
        url: defaultShareImage,
        alt: DEFAULT_MARKETING_SHARE_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advaic | E-Mail-Autopilot für Immobilienmakler",
    description: "E-Mail-Autopilot für Immobilienmakler mit Guardrails, Freigabe-Logik und Qualitätschecks vor dem Versand.",
    images: [defaultShareImage],
  },
  verification: {
    google: googleSiteVerification || undefined,
    other: bingSiteVerification
      ? {
          "msvalidate.01": bingSiteVerification,
        }
      : undefined,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/advaic-icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/brand/advaic-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/advaic-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/advaic-icon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <GlobalStructuredData />
        <SupabaseProvider initialSession={null}>
          <ClientRootLayout session={null}>{children}</ClientRootLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
