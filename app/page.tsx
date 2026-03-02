import type { Metadata } from "next";
import MarketingNavbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import TrustStats from "@/components/marketing/TrustStats";
import PublicEvidenceGap from "@/components/marketing/PublicEvidenceGap";
import Problem from "@/components/marketing/Problem";
import Solution from "@/components/marketing/Solution";
import HowItWorks from "@/components/marketing/HowItWorks";
import StickyTour from "@/components/marketing/StickyTour";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import Rules from "@/components/marketing/Rules";
import QualityChecks from "@/components/marketing/QualityChecks";
import Control from "@/components/marketing/Control";
import Guarantee from "@/components/marketing/Guarantee";
import TransparencyBox from "@/components/marketing/TransparencyBox";
import Security from "@/components/marketing/Security";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import Pricing from "@/components/marketing/Pricing";
import UseCasesTeaser from "@/components/marketing/UseCasesTeaser";
import ROICalculator from "@/components/marketing/ROICalculator";
import SearchIntentTeaser from "@/components/marketing/SearchIntentTeaser";
import MarketingFAQ from "@/components/marketing/FAQ";
import ObjectionHandling from "@/components/marketing/ObjectionHandling";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import FinalCTA from "@/components/marketing/FinalCTA";
import ProofLayer from "@/components/marketing/ProofLayer";
import MarketingFooter from "@/components/marketing/Footer";
import MessageArchitectureBand from "@/components/marketing/MessageArchitectureBand";
import ConversionPathPanel from "@/components/marketing/ConversionPathPanel";
import ProductVisualAuthority from "@/components/marketing/ProductVisualAuthority";
import PublicClientWidgets from "@/components/marketing/PublicClientWidgets";

export const metadata: Metadata = {
  title: "Autopilot für Makler-E-Mails mit klaren Guardrails",
  description:
    "Advaic beantwortet Interessenten-Anfragen automatisch in Ihrem Stil. Unklare Fälle gehen zur Freigabe, vor Auto-Versand greifen Qualitätschecks.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Advaic | Autopilot für Makler-E-Mails mit klaren Guardrails",
    description:
      "Advaic beantwortet Interessenten-Anfragen automatisch in Ihrem Stil. Unklare Fälle gehen zur Freigabe, vor Auto-Versand greifen Qualitätschecks.",
    url: "/",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Advaic | Autopilot für Makler-E-Mails mit klaren Guardrails",
    description:
      "Advaic beantwortet Interessenten-Anfragen automatisch in Ihrem Stil. Unklare Fälle gehen zur Freigabe, vor Auto-Versand greifen Qualitätschecks.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function HomePage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Advaic",
    url: "https://advaic.com",
    inLanguage: "de-DE",
    description:
      "Autopilot für Interessenten-Anfragen per E-Mail mit Guardrails, Freigabe-Logik und Qualitätschecks vor Versand.",
  };

  return (
    <main className="marketing-page-bg bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <MarketingNavbar />
      <Hero />
      <ProductVisualAuthority
        id="produkt-autoritaet"
        title="So sieht der Ablauf im Produkt aus"
        description="Keine abstrakten Versprechen: Sie sehen die Mechanik direkt im Interface und im Verlauf."
      />
      <TrustStats />
      <PublicEvidenceGap />
      <Problem />
      <Solution />
      <HowItWorks />
      <StickyTour />
      <DecisionSimulator />
      <Rules />
      <QualityChecks />
      <Control />
      <Guarantee />
      <TransparencyBox />
      <Security />
      <TrustByDesign />
      <Pricing />
      <UseCasesTeaser />
      <SearchIntentTeaser />
      <ROICalculator />
      <MarketingFAQ />
      <ObjectionHandling />
      <CTAExperiment />
      <FinalCTA />
      <MessageArchitectureBand compact />
      <ConversionPathPanel />
      <section className="py-10 md:py-12">
        <div className="mx-auto w-full max-w-[1120px] px-6 md:px-8">
          <ProofLayer context="marketing" />
        </div>
      </section>
      <MarketingFooter />
      <PublicClientWidgets />
    </main>
  );
}
