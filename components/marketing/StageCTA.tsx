import TrackedLink from "./TrackedLink";
import Container from "./Container";

type Stage = "orientierung" | "bewertung" | "entscheidung";

type StageCTAProps = {
  stage: Stage;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  context?: string;
  sectionId?: string;
};

const stageConfig: Record<
  Stage,
  {
    label: string;
    goal: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
  }
> = {
  orientierung: {
    label: "Funnel-Stufe: Orientierung",
    goal: "Ziel: Produktlogik und Sicherheitsprinzipien verstehen.",
    primaryHref: "/produkt",
    primaryLabel: "Produkt im Detail",
    secondaryHref: "/so-funktionierts",
    secondaryLabel: "Ablauf ansehen",
  },
  bewertung: {
    label: "Funnel-Stufe: Bewertung",
    goal: "Ziel: Eignung für Ihren Alltag mit klaren Regeln und Grenzen prüfen.",
    primaryHref: "/signup",
    primaryLabel: "14 Tage testen",
    secondaryHref: "/autopilot-regeln",
    secondaryLabel: "Regeln prüfen",
  },
  entscheidung: {
    label: "Funnel-Stufe: Entscheidung",
    goal: "Ziel: kontrolliert starten und erste Ergebnisse im eigenen Prozess sehen.",
    primaryHref: "/signup",
    primaryLabel: "Jetzt starten",
    secondaryHref: "/faq",
    secondaryLabel: "Offene Fragen klären",
  },
};

export default function StageCTA({
  stage,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  context = "marketing",
  sectionId = "stage-cta",
}: StageCTAProps) {
  const config = stageConfig[stage];

  return (
    <section className="py-8 md:py-10">
      <Container>
        <article className="card-base p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
              {config.label}
            </span>
            <p className="w-full text-xs text-[var(--muted)] md:w-auto md:text-right">{config.goal}</p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href={primaryHref || config.primaryHref}
              className="btn-primary"
              event="marketing_stage_primary_click"
              source="website"
              pageGroup="marketing"
              section={sectionId}
              meta={{ stage, context, section: sectionId }}
            >
              {primaryLabel || config.primaryLabel}
            </TrackedLink>

            <TrackedLink
              href={secondaryHref || config.secondaryHref}
              className="btn-secondary"
              event="marketing_stage_secondary_click"
              source="website"
              pageGroup="marketing"
              section={sectionId}
              meta={{ stage, context, section: sectionId }}
            >
              {secondaryLabel || config.secondaryLabel}
            </TrackedLink>
          </div>
        </article>
      </Container>
    </section>
  );
}
