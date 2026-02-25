import { type ReactNode } from "react";
import MarketingNavbar from "./Navbar";
import MarketingFooter from "./Footer";
import MobileConversionBar from "./MobileConversionBar";
import Container from "./Container";
import ProofLayer from "./ProofLayer";
import MessageArchitectureBand from "./MessageArchitectureBand";
import ConversionPathPanel from "./ConversionPathPanel";
import PublicExperienceTracker from "./PublicExperienceTracker";

type PageShellProps = {
  children: ReactNode;
  withFooter?: boolean;
  withProofLayer?: boolean;
  proofContext?: string;
  withMarketingRails?: boolean;
};

export default function PageShell({
  children,
  withFooter = true,
  withProofLayer = true,
  proofContext = "marketing",
  withMarketingRails,
}: PageShellProps) {
  const showMarketingRails = withMarketingRails ?? withProofLayer;

  return (
    <main className="marketing-page-bg bg-[var(--bg)] text-[var(--text)]">
      <MarketingNavbar />
      {children}
      {showMarketingRails ? <MessageArchitectureBand compact /> : null}
      {showMarketingRails ? <ConversionPathPanel /> : null}
      {withProofLayer ? (
        <section className="py-10 md:py-12">
          <Container>
            <ProofLayer context={proofContext} />
          </Container>
        </section>
      ) : null}
      {withFooter ? <MarketingFooter /> : null}
      <MobileConversionBar />
      <PublicExperienceTracker />
    </main>
  );
}
