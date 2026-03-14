import type { Metadata } from "next";
import MarketingNavbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import Pricing from "@/components/marketing/Pricing";
import ROICalculator from "@/components/marketing/ROICalculator";
import MarketingFAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";
import MarketingFooter from "@/components/marketing/Footer";
import ProductVisualAuthority from "@/components/marketing/ProductVisualAuthority";
import PublicClientWidgets from "@/components/marketing/PublicClientWidgets";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Immobilienanfragen automatisch beantworten | Advaic",
  ogTitle: "Advaic | Immobilienanfragen automatisch beantworten",
  description:
    "Advaic beantwortet neue Immobilienanfragen per E-Mail automatisch. Fehlen Angaben, ist der Absender nicht sauber prüfbar oder wird der Inhalt sensibel, greift die Freigabe.",
  path: "/",
  template: "home",
  eyebrow: "Homepage",
  proof: "Auto bei vollständigen Angaben. Freigabe bei fehlenden Informationen oder Risiko.",
});

export default function HomePage() {
  return (
    <main className="marketing-page-bg bg-[var(--bg)] text-[var(--text)]">
      <MarketingNavbar />
      <Hero />
      <ProductVisualAuthority
        id="produkt-autoritaet"
        title="Im Produkt sehen Sie, warum Advaic sendet oder stoppt"
        description="Eingang, Regelprüfung, Freigabe und Qualitätschecks sind direkt im Interface sichtbar."
      />
      <HowItWorks />
      <TrustByDesign />
      <ROICalculator />
      <Pricing />
      <MarketingFAQ />
      <FinalCTA />
      <MarketingFooter />
      <PublicClientWidgets />
    </main>
  );
}
