import Link from "next/link";
import Container from "./Container";
import TrackedLink from "./TrackedLink";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

type DetailCard = {
  title: string;
  text: string;
};

type SourceItem = {
  label: string;
  href: string;
  note: string;
};

type RelatedItem = {
  label: string;
  href: string;
};

type ObjectionArticleProps = {
  context: string;
  concern: string;
  concernSummary: string;
  mechanicsTitle: string;
  mechanics: DetailCard[];
  implementation: string[];
  kpis: string[];
  relatedLinks: RelatedItem[];
  sources: SourceItem[];
};

export default function ObjectionArticle({
  context,
  concern,
  concernSummary,
  mechanicsTitle,
  mechanics,
  implementation,
  kpis,
  relatedLinks,
  sources,
}: ObjectionArticleProps) {
  return (
    <>
      <section className="marketing-section-clear py-16 md:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-7 md:p-8">
              <h2 className="h3">Einwand konkret</h2>
              <p className="body mt-4 text-[var(--muted)]">{concern}</p>
              <article className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="helper">{concernSummary}</p>
              </article>
            </article>

            <article className="card-base p-6 lg:col-span-5 md:p-8">
              <h2 className="h3">Direkter nächster Schritt</h2>
              <p className="helper mt-3">
                Wenn dieser Punkt für Sie kaufentscheidend ist, starten Sie mit einem konservativen Setup und prüfen Sie
                zuerst nur den Bereich, auf den sich Ihr Einwand bezieht.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <TrackedLink
                  href={`/signup?entry=objection-${context}`}
                  className="btn-primary"
                  event="marketing_objection_signup_click"
                  source="website"
                  pageGroup="marketing"
                  section={`objection-${context}`}
                  meta={{ objection: context }}
                >
                  {MARKETING_PRIMARY_CTA_LABEL}
                </TrackedLink>
                <Link href="/produkt#setup" className="btn-secondary">
                  Safe-Start-Konfiguration
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-soft-cool py-20 md:py-24">
        <Container>
          <h2 className="h2">{mechanicsTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {mechanics.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-7 md:p-8">
              <h2 className="h3">So setzen Sie das operativ um</h2>
              <ol className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {implementation.map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="card-base p-6 lg:col-span-5 md:p-8">
              <h2 className="h3">Messbare KPI</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {kpis.map((kpi) => (
                  <li key={kpi} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{kpi}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="btn-secondary">
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-16 md:py-20">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Diese Quellen unterstützen die Einordnung für den jeweiligen Einwand. Sie ersetzen keine individuelle
              Rechts-, Steuer- oder Unternehmensberatung.
            </p>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <article key={source.href} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
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
    </>
  );
}
