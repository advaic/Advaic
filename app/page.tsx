import MarketingNavbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import TrustStats from "@/components/marketing/TrustStats";
import Problem from "@/components/marketing/Problem";
import Solution from "@/components/marketing/Solution";
import HowItWorks from "@/components/marketing/HowItWorks";
import StickyTour from "@/components/marketing/StickyTour";
import Rules from "@/components/marketing/Rules";
import QualityChecks from "@/components/marketing/QualityChecks";
import Control from "@/components/marketing/Control";
import Guarantee from "@/components/marketing/Guarantee";
import TransparencyBox from "@/components/marketing/TransparencyBox";
import Security from "@/components/marketing/Security";
import Pricing from "@/components/marketing/Pricing";
import MarketingFAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";
import MarketingFooter from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <main className="marketing-page-bg bg-[var(--bg)] text-[var(--text)]">
      <MarketingNavbar />
      <Hero />
      <TrustStats />
      <Problem />
      <Solution />
      <HowItWorks />
      <StickyTour />
      <Rules />
      <QualityChecks />
      <Control />
      <Guarantee />
      <TransparencyBox />
      <Security />
      <Pricing />
      <MarketingFAQ />
      <FinalCTA />
      <MarketingFooter />
    </main>
  );
}
