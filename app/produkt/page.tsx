import PageShell from "@/components/marketing/PageShell";
import Hero from "@/components/marketing/produkt/Hero";
import TrustFoundations from "@/components/marketing/produkt/TrustFoundations";
import QuickNav from "@/components/marketing/produkt/QuickNav";
import WhyNow from "@/components/marketing/produkt/WhyNow";
import WhatItDoes from "@/components/marketing/produkt/WhatItDoes";
import StickyTour from "@/components/marketing/produkt/StickyTour";
import PolicyRules from "@/components/marketing/produkt/PolicyRules";
import QualityChecks from "@/components/marketing/produkt/QualityChecks";
import DashboardStatuses from "@/components/marketing/produkt/DashboardStatuses";
import ApprovalInbox from "@/components/marketing/produkt/ApprovalInbox";
import ToneAndStyle from "@/components/marketing/produkt/ToneAndStyle";
import Setup from "@/components/marketing/produkt/Setup";
import FollowUps from "@/components/marketing/produkt/FollowUps";
import SecurityPrivacy from "@/components/marketing/produkt/SecurityPrivacy";
import IdealFit from "@/components/marketing/produkt/IdealFit";
import FAQ from "@/components/marketing/produkt/FAQ";
import FinalCTA from "@/components/marketing/produkt/FinalCTA";

export default function ProduktPage() {
  return (
    <PageShell>
      <Hero />
      <TrustFoundations />
      <QuickNav />
      <WhyNow />
      <WhatItDoes />
      <StickyTour />
      <PolicyRules />
      <QualityChecks />
      <DashboardStatuses />
      <ApprovalInbox />
      <ToneAndStyle />
      <Setup />
      <FollowUps />
      <SecurityPrivacy />
      <IdealFit />
      <FAQ />
      <FinalCTA />
    </PageShell>
  );
}
