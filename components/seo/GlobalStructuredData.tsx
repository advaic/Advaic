import { getSiteUrl } from "@/lib/seo/site-url";

const NAV_ITEMS = [
  { name: "Produkt", path: "/produkt" },
  { name: "Branchen", path: "/branchen" },
  { name: "So funktioniert's", path: "/so-funktionierts" },
  { name: "Sicherheit", path: "/sicherheit" },
  { name: "Preise", path: "/preise" },
  { name: "FAQ", path: "/faq" },
  { name: "Trust Center", path: "/trust" },
];

export default function GlobalStructuredData() {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Advaic",
        url: siteUrl,
        email: "support@advaic.com",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/brand/advaic-icon.png`,
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: "Advaic",
        inLanguage: "de-DE",
        description:
          "Autopilot für Interessenten-Anfragen per E-Mail mit Guardrails, Freigabe-Logik und Qualitätschecks vor Versand.",
        publisher: { "@id": organizationId },
      },
      ...NAV_ITEMS.map((item) => ({
        "@type": "SiteNavigationElement",
        name: item.name,
        url: `${siteUrl}${item.path}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
