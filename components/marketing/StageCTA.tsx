import TrackedLink from "./TrackedLink";
import Container from "./Container";
import { MARKETING_FAQ_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

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
    label: "Nächster Schritt",
    goal: "Verstehen Sie zuerst Ablauf, Regeln und Sicherheitsprinzipien im Detail.",
    primaryHref: "/produkt",
    primaryLabel: "Produkt im Detail",
    secondaryHref: "/so-funktionierts",
    secondaryLabel: "So funktioniert's",
  },
  bewertung: {
    label: "Nächster Prüfpunkt",
    goal: "Prüfen Sie jetzt, ob die Logik zu Ihrem Makleralltag und Ihrem Anfragevolumen passt.",
    primaryHref: "/signup",
    primaryLabel: MARKETING_PRIMARY_CTA_LABEL,
    secondaryHref: "/autopilot-regeln",
    secondaryLabel: "Regeln prüfen",
  },
  entscheidung: {
    label: "Nächste Entscheidung",
    goal: "Starten Sie kontrolliert mit Safe-Start und messen Sie die ersten Effekte im echten Betrieb.",
    primaryHref: "/signup",
    primaryLabel: MARKETING_PRIMARY_CTA_LABEL,
    secondaryHref: "/faq",
    secondaryLabel: MARKETING_FAQ_CTA_LABEL,
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
    <section id={sectionId} className="py-8 md:py-10">
      <Container>
        <article className="card-base relative overflow-hidden p-5 md:p-6">
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(11,15,23,0),rgba(201,162,39,0.5),rgba(11,15,23,0))]" />
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
                {config.label}
              </span>
              <p className="mt-3 text-sm text-[var(--muted)] md:max-w-[64ch]">{config.goal}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
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
          </div>
        </article>
      </Container>
    </section>
  );
}
