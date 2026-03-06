import { type ReactNode } from "react";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import { PROOF_LAST_CHECKED } from "@/lib/marketing/proof-data";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type SourceItem = {
  label: string;
  href: string;
  note: string;
};

type Stage = "orientierung" | "bewertung" | "entscheidung";

type AiDiscoveryPageTemplateProps = {
  breadcrumbItems: BreadcrumbItem[];
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stage: Stage;
  stageContext: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  stageSectionId?: string;
  children: ReactNode;
  sources: SourceItem[];
  sourcesTitle?: string;
  sourcesDescription?: string;
  afterSources?: ReactNode;
  withFinalCta?: boolean;
  proofContext?: string;
  withProofLayer?: boolean;
  withMarketingRails?: boolean;
};

export default function AiDiscoveryPageTemplate({
  breadcrumbItems,
  schema,
  kicker,
  title,
  description,
  actions,
  stage,
  stageContext,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  stageSectionId = "stage-cta",
  children,
  sources,
  sourcesTitle = "Quellen & Einordnung",
  sourcesDescription = "Die Quellen unterstützen die Einordnung und stehen bewusst am Seitenende für eine saubere Leseführung. Sie ersetzen keine individuelle Rechts-, Steuer- oder Unternehmensberatung.",
  afterSources,
  withFinalCta = true,
  proofContext,
  withProofLayer,
  withMarketingRails,
}: AiDiscoveryPageTemplateProps) {
  const schemaList = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <PageShell proofContext={proofContext} withProofLayer={withProofLayer} withMarketingRails={withMarketingRails}>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {schemaList.map((entry, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}

      <PageIntro kicker={kicker} title={title} description={description} actions={actions} />

      <StageCTA
        stage={stage}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        context={stageContext}
        sectionId={stageSectionId}
      />

      {children}

      <section className="marketing-section-clear py-16 md:py-20">
        <Container>
          <article className="card-base relative overflow-hidden p-6 md:p-8">
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(11,15,23,0),rgba(201,162,39,0.55),rgba(11,15,23,0))]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h3">{sourcesTitle}</h2>
              <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                Quellenstand: {PROOF_LAST_CHECKED}
              </span>
            </div>
            <p className="helper mt-3">{sourcesDescription}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {sources.map((source) => (
                <article
                  key={source.href}
                  className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
                >
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--text)] underline underline-offset-4"
                  >
                    {source.label}
                  </a>
                  <p className="helper mt-2">{source.note}</p>
                </article>
              ))}
            </div>
          </article>
        </Container>
      </section>

      {afterSources}
      {withFinalCta ? <FinalCTA /> : null}
    </PageShell>
  );
}
