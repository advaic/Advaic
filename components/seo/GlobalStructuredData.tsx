import { getSiteUrl } from "@/lib/seo/site-url";
import {
  STARTER_PUBLIC_BILLING_CYCLE_LABEL,
  STARTER_PUBLIC_PLAN_NAME,
  STARTER_PUBLIC_PRICE_EUR,
  STARTER_PUBLIC_TRIAL_LABEL,
} from "@/lib/billing/public-pricing";

const NAV_ITEMS = [
  { name: "Produkt", path: "/produkt" },
  { name: "Branchen", path: "/branchen" },
  { name: "Anwendungsfälle", path: "/use-cases" },
  { name: "Einwände", path: "/einwaende" },
  { name: "So funktioniert's", path: "/so-funktionierts" },
  { name: "Sicherheit", path: "/sicherheit" },
  { name: "Preise", path: "/preise" },
  { name: "FAQ", path: "/faq" },
  { name: "Trust-Hub", path: "/trust" },
  { name: "Manuell vs. Advaic", path: "/manuell-vs-advaic" },
  { name: "Maklersoftware Vergleich", path: "/maklersoftware-vergleich" },
  { name: "CRM für Immobilienmakler", path: "/crm-fuer-immobilienmakler" },
  { name: "Tools für Immobilienmakler", path: "/tools-fuer-immobilienmakler" },
  { name: "ImmoScout-Anfragen automatisieren", path: "/immobilienscout-anfragen-automatisieren" },
  { name: "Anfragenqualifizierung Immobilienmakler", path: "/anfragenqualifizierung-immobilienmakler" },
  { name: "Besichtigungsanfragen automatisieren", path: "/besichtigungsanfragen-automatisieren" },
  { name: "Maklersoftware kleine Maklerbüros", path: "/maklersoftware-fuer-kleine-maklerbueros" },
  { name: "Immobilienanfragen priorisieren", path: "/immobilienanfragen-priorisieren" },
  { name: "Besichtigungstermine koordinieren", path: "/besichtigungstermine-koordinieren" },
  { name: "Maklersoftware Preise vergleichen", path: "/maklersoftware-preise-vergleichen" },
  { name: "Besichtigungserinnerungen automatisieren", path: "/besichtigungserinnerungen-automatisieren" },
  { name: "No-Shows bei Besichtigungen reduzieren", path: "/no-show-besichtigungen-reduzieren" },
  { name: "Besichtigung-Absagen reduzieren", path: "/besichtigung-absagen-reduzieren" },
  { name: "Besichtigung bestätigen", path: "/besichtigung-bestaetigen" },
  { name: "Massenbesichtigungen organisieren", path: "/massenbesichtigungen-organisieren" },
  { name: "CRM vs Maklersoftware", path: "/crm-vs-maklersoftware" },
  { name: "KI-Tools für Immobilienmakler", path: "/best-ai-tools-immobilienmakler" },
  { name: "Software für Immobilienanfragen", path: "/best-software-immobilienanfragen" },
  { name: "Anfragenmanagement Immobilienmakler", path: "/anfragenmanagement-immobilienmakler" },
  { name: "Antwortzeit Immobilienanfragen", path: "/antwortzeit-immobilienanfragen" },
  { name: "Follow-up-E-Mails Immobilienmakler", path: "/follow-up-emails-immobilienmakler" },
  { name: "Immobilienanfragen nachfassen", path: "/immobilienanfragen-nachfassen" },
  { name: "ImmoScout-Anfragen nachfassen", path: "/immobilienscout-anfragen-nachfassen" },
  { name: "Portalanfragen priorisieren", path: "/portalanfragen-priorisieren" },
  { name: "ImmoScout-Anfragen qualifizieren", path: "/immobilienscout-anfragen-qualifizieren" },
  { name: "Advaic vs CRM Tools", path: "/advaic-vs-crm-tools" },
  { name: "KI für Immobilienmakler", path: "/ki-fuer-immobilienmakler" },
  { name: "Immobilienanfragen automatisieren", path: "/immobilienanfragen-automatisieren" },
  { name: "Integrationen", path: "/integrationen" },
  { name: "Gmail-Integration", path: "/integrationen/gmail" },
  { name: "Outlook-Integration", path: "/integrationen/outlook" },
];

export default function GlobalStructuredData() {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const softwareId = `${siteUrl}/#software`;
  const offerId = `${siteUrl}/#starter-offer`;

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
      {
        "@type": "SoftwareApplication",
        "@id": softwareId,
        name: "Advaic",
        url: `${siteUrl}/produkt`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "de-DE",
        brand: { "@id": organizationId },
        provider: { "@id": organizationId },
        audience: {
          "@type": "Audience",
          audienceType: "Immobilienmakler und kleine Maklerteams in Deutschland",
        },
        description:
          "Advaic beantwortet Interessenten-Anfragen im Maklerstil, sendet nur bei klarem Objektbezug automatisch und leitet Fälle mit fehlenden Angaben oder Risikosignalen in die Freigabe weiter.",
        featureList: [
          "Autopilot mit Guardrails",
          "Freigabe-Inbox für unklare Fälle",
          "Qualitätschecks vor Versand",
          "Dashboard-Status und Verlauf mit Zeitstempeln",
          "Steuerbare Follow-up-Logik mit Stop-Regeln",
        ],
        offers: { "@id": offerId },
      },
      {
        "@type": "Offer",
        "@id": offerId,
        url: `${siteUrl}/preise`,
        name: STARTER_PUBLIC_PLAN_NAME,
        price: String(STARTER_PUBLIC_PRICE_EUR),
        priceCurrency: "EUR",
        category: "SaaS",
        availability: "https://schema.org/InStock",
        description: `${STARTER_PUBLIC_TRIAL_LABEL}, danach ${STARTER_PUBLIC_PRICE_EUR} € ${STARTER_PUBLIC_BILLING_CYCLE_LABEL}.`,
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
