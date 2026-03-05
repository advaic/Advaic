import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import PageShell from "@/components/marketing/PageShell";
import Hero from "@/components/marketing/produkt/Hero";
import TrustFoundations from "@/components/marketing/produkt/TrustFoundations";
import QuickNav from "@/components/marketing/produkt/QuickNav";
import DeepDives from "@/components/marketing/produkt/DeepDives";
import WhyNow from "@/components/marketing/produkt/WhyNow";
import PublicEvidenceGap from "@/components/marketing/PublicEvidenceGap";
import WhatItDoes from "@/components/marketing/produkt/WhatItDoes";
import StickyTour from "@/components/marketing/produkt/StickyTour";
import PolicyRules from "@/components/marketing/produkt/PolicyRules";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import QualityChecks from "@/components/marketing/produkt/QualityChecks";
import DashboardStatuses from "@/components/marketing/produkt/DashboardStatuses";
import ApprovalInbox from "@/components/marketing/produkt/ApprovalInbox";
import ToneAndStyle from "@/components/marketing/produkt/ToneAndStyle";
import Setup from "@/components/marketing/produkt/Setup";
import SafeStartConfigurator from "@/components/marketing/SafeStartConfigurator";
import FollowUps from "@/components/marketing/produkt/FollowUps";
import SecurityPrivacy from "@/components/marketing/produkt/SecurityPrivacy";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import IdealFit from "@/components/marketing/produkt/IdealFit";
import UseCasesTeaser from "@/components/marketing/UseCasesTeaser";
import SearchIntentTeaser from "@/components/marketing/SearchIntentTeaser";
import ROICalculator from "@/components/marketing/ROICalculator";
import ObjectionHandling from "@/components/marketing/ObjectionHandling";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import FAQ from "@/components/marketing/produkt/FAQ";
import FinalCTA from "@/components/marketing/produkt/FinalCTA";
import ProductVisualAuthority from "@/components/marketing/ProductVisualAuthority";

export const metadata: Metadata = {
  title: "Produkt für Immobilienmakler",
  description:
    "Verstehen Sie exakt, wann Advaic automatisch sendet, wann Freigabe greift und welche Qualitätschecks jeden Versand absichern.",
  alternates: {
    canonical: "/produkt",
  },
  openGraph: {
    title: "Produkt | Advaic für Immobilienmakler",
    description:
      "Verstehen Sie exakt, wann Advaic automatisch sendet, wann Freigabe greift und welche Qualitätschecks jeden Versand absichern.",
    url: "/produkt",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Produkt | Advaic für Immobilienmakler",
    description:
      "Verstehen Sie exakt, wann Advaic automatisch sendet, wann Freigabe greift und welche Qualitätschecks jeden Versand absichern.",
    images: ["/brand/advaic-icon.png"],
  },
};

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
      price: "0",
      priceCurrency: "EUR",
      description: "14 Tage Testphase",
    },
  };

  return (
    <PageShell proofContext="produkt">
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
      <TrustFoundations />
      <QuickNav />
      <DeepDives />
      <WhyNow />
      <PublicEvidenceGap />
      <WhatItDoes />
      <ProductVisualAuthority
        id="produkt-visualproof"
        title="Direkter Blick in die Entscheidungs- und Qualitätslogik"
        description="Sie sehen, wie Eingang, Regelentscheidung und Qualitätsprüfung im Produktfluss sichtbar zusammenlaufen."
      />
      <StickyTour />
      <PolicyRules />
      <DecisionSimulator
        id="simulator"
        title="Praxis-Simulator: Wann sendet Advaic automatisch?"
        description="Testen Sie typische Makler-Eingänge und sehen Sie sofort, ob Auto, Freigabe oder Ignorieren greift und warum."
      />
      <QualityChecks />
      <DashboardStatuses />
      <ApprovalInbox />
      <ToneAndStyle />
      <Setup />
      <SafeStartConfigurator />
      <FollowUps />
      <SecurityPrivacy />
      <TrustByDesign />
      <IdealFit />
      <UseCasesTeaser />
      <SearchIntentTeaser />
      <ROICalculator />
      <ObjectionHandling />
      <CTAExperiment />
      <FAQ />
      <FinalCTA />
    </PageShell>
  );
}
