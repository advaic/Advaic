import { type ReactNode } from "react";
import Container from "./Container";

type PageIntroProps = {
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function PageIntro({ kicker, title, description, actions }: PageIntroProps) {
  return (
    <section className="marketing-hero-bg py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          {kicker ? <p className="label">{kicker}</p> : null}
          <h1 className="h1 mt-3">{title}</h1>
          <p className="body-lg mt-5 text-[var(--muted)]">{description}</p>
          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </Container>
    </section>
  );
}
