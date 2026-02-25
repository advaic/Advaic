import { type ReactNode } from "react";
import Container from "./Container";
import ProofLayer from "./ProofLayer";

type PageIntroProps = {
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  showProofLayer?: boolean;
  proofContext?: string;
};

export default function PageIntro({
  kicker,
  title,
  description,
  actions,
  showProofLayer = false,
  proofContext = "marketing",
}: PageIntroProps) {
  return (
    <section className="marketing-hero-bg py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          {kicker ? <p className="label">{kicker}</p> : null}
          <h1 className="h1 mt-3">{title}</h1>
          <p className="body-lg mt-5 max-w-[68ch] text-[var(--muted)]">{description}</p>
          {actions ? (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
        {showProofLayer ? <ProofLayer context={proofContext} className="mt-7" /> : null}
      </Container>
    </section>
  );
}
