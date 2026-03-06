import type { Metadata } from "next";
import Link from "next/link";
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
import ConversionPathPanel from "@/components/marketing/ConversionPathPanel";

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
  const aiIntentLinks = [
    { label: "Best AI Tools für Immobilienmakler", href: "/best-ai-tools-immobilienmakler" },
    { label: "Best Software für Immobilienanfragen", href: "/best-software-immobilienanfragen" },
    { label: "Advaic vs. CRM-Tools", href: "/advaic-vs-crm-tools" },
    { label: "KI für Immobilienmakler", href: "/ki-fuer-immobilienmakler" },
    { label: "Immobilienanfragen automatisieren", href: "/immobilienanfragen-automatisieren" },
    { label: "Integrationen (Gmail & Outlook)", href: "/integrationen" },
    { label: "Manuell vs. Advaic", href: "/manuell-vs-advaic" },
  ];

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
      <ConversionPathPanel className="pt-6 md:pt-8" />
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
      <section className="marketing-section-clear py-12 md:py-16">
        <div className="mx-auto w-full max-w-[1120px] px-6 md:px-8">
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Vergleichs- und Auswahlseiten</h2>
            <p className="helper mt-3 max-w-[70ch]">
              Wenn Sie Produktauswahl, Tool-Vergleich oder AI-Auffindbarkeit im Detail prüfen möchten, finden Sie hier
              die zentralen Seiten mit Kriterien, Prozesslogik und Quellen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {aiIntentLinks.map((link) => (
                <Link key={link.href} href={link.href} className="btn-secondary">
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
      <ROICalculator />
      <ObjectionHandling />
      <CTAExperiment />
      <FAQ />
      <FinalCTA />
    </PageShell>
  );
}
