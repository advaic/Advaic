import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import PageShell from "@/components/marketing/PageShell";
import Hero from "@/components/marketing/produkt/Hero";
import StickyTour from "@/components/marketing/produkt/StickyTour";
import PolicyRules from "@/components/marketing/produkt/PolicyRules";
import QualityChecks from "@/components/marketing/produkt/QualityChecks";
import ApprovalInbox from "@/components/marketing/produkt/ApprovalInbox";
import SystemOverview from "@/components/marketing/produkt/SystemOverview";
import Setup from "@/components/marketing/produkt/Setup";
import FAQ from "@/components/marketing/produkt/FAQ";
import FinalCTA from "@/components/marketing/produkt/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import {
  STARTER_PUBLIC_BILLING_CYCLE_LABEL,
  STARTER_PUBLIC_PRICE_EUR,
  STARTER_PUBLIC_TRIAL_LABEL,
} from "@/lib/billing/public-pricing";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Produkt: Auto-Antworten mit Freigabe und Qualitätschecks",
  ogTitle: "Produkt | Auto-Antworten mit Freigabe und Qualitätschecks",
  description:
    "Sehen Sie im Produkt, welche E-Mails Advaic automatisch beantwortet, wann Freigabe greift und wie Qualitätschecks jeden Versand absichern.",
  path: "/produkt",
  template: "product",
  eyebrow: "Produkt",
  proof: "Eingang, Regelprüfung, Freigabe und Versand im echten Produktfluss.",
});

export default function ProduktPage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Advaic",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "de-DE",
    description:
      "E-Mail-Autopilot für Immobilienmakler mit Freigabe-Logik, Qualitätschecks und nachvollziehbarem Versandverlauf.",
    offers: {
      "@type": "Offer",
      price: String(STARTER_PUBLIC_PRICE_EUR),
      priceCurrency: "EUR",
      description: `${STARTER_PUBLIC_TRIAL_LABEL}, danach ${STARTER_PUBLIC_PRICE_EUR} € ${STARTER_PUBLIC_BILLING_CYCLE_LABEL}.`,
    },
  };

  return (
    <PageShell proofContext="produkt" withMarketingRails={false}>
      <BreadcrumbJsonLd
        items={[
          { name: "Startseite", path: "/" },
          { name: "Produkt", path: "/produkt" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Hero />
      <StickyTour />
      <PolicyRules />
      <ApprovalInbox />
      <QualityChecks />
      <SystemOverview />
      <Setup />
      <FAQ />
      <FinalCTA />
    </PageShell>
  );
}
