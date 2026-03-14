import { type ReactNode } from "react";
import Container from "./Container";
import ProofLayer from "./ProofLayer";

type PageIntroProps = {
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  mobileQuickActions?: ReactNode;
  showProofLayer?: boolean;
  proofContext?: string;
};

export default function PageIntro({
  kicker,
  title,
  description,
  actions,
  mobileQuickActions,
  showProofLayer = false,
  proofContext = "marketing",
}: PageIntroProps) {
  return (
    <section className="marketing-hero-bg py-14 md:py-22">
      <Container>
        <div className="card-base relative overflow-hidden p-6 md:p-10">
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(11,15,23,0),rgba(201,162,39,0.55),rgba(11,15,23,0))]" />
          <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[var(--gold-soft)] blur-3xl" aria-hidden />
          <div className="relative max-w-3xl">
            {kicker ? <p className="section-kicker">{kicker}</p> : null}
            <h1 className="h1 mt-4 text-balance">{title}</h1>
            <p className="body-lg mt-5 max-w-[68ch] text-[var(--muted)] text-measure">{description}</p>
            {actions ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
                {actions}
              </div>
            ) : null}
            {mobileQuickActions ? <div className="mt-4 md:hidden">{mobileQuickActions}</div> : null}
          </div>
        </div>
        {showProofLayer ? <ProofLayer context={proofContext} className="mt-7" /> : null}
      </Container>
    </section>
  );
}
