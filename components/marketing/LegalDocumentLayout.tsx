import Link from "next/link";
import type { ReactNode } from "react";
import Container from "./Container";

export type LegalDocumentLink = {
  href: string;
  label: string;
  description: string;
};

export type LegalJumpLink = {
  id: string;
  label: string;
};

export type LegalSummaryItem = {
  title?: string;
  body: string;
};

export const LEGAL_DOCUMENT_LINKS: LegalDocumentLink[] = [
  {
    href: "/datenschutz",
    label: "Datenschutz",
    description: "Rollen, Zwecke, Rechtsgrundlagen und Betroffenenrechte.",
  },
  {
    href: "/unterauftragsverarbeiter",
    label: "Unterauftragsverarbeiter",
    description: "Anbieter, Datenkategorien, Regionen und Schutzmaßnahmen.",
  },
  {
    href: "/cookie-und-storage",
    label: "Cookie & Storage",
    description: "Browser-Speicher, Zweck, Rechtsgrundlage und Speicherdauer.",
  },
  {
    href: "/nutzungsbedingungen",
    label: "Nutzungsbedingungen",
    description: "B2B-Regelwerk, Haftung, Versandpfade und Vertragslogik.",
  },
];

type LegalDocumentLayoutProps = {
  currentPath: string;
  summaryTitle: string;
  summaryItems: LegalSummaryItem[];
  jumpLinks?: LegalJumpLink[];
  asideExtras?: ReactNode;
  children: ReactNode;
};

export default function LegalDocumentLayout({
  currentPath,
  summaryTitle,
  summaryItems,
  jumpLinks,
  asideExtras,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <section className="marketing-section-clear py-16 md:py-24">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[290px,minmax(0,1fr)] xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-28 self-start">
            <article className="card-base p-5">
              <p className="section-kicker">Dokumentfamilie</p>
              <div className="mt-4 space-y-3">
                {LEGAL_DOCUMENT_LINKS.map((link) => {
                  const isActive = link.href === currentPath;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={[
                        "block rounded-[20px] border p-4 transition-colors",
                        isActive
                          ? "border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--text)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--gold)]/50",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[var(--text)]">{link.label}</span>
                        {isActive ? (
                          <span className="rounded-full bg-[var(--gold)]/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold-strong)]">
                            aktiv
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{link.description}</p>
                    </Link>
                  );
                })}
              </div>
            </article>

            {jumpLinks?.length ? (
              <article className="card-base p-5">
                <p className="section-kicker">Auf dieser Seite</p>
                <nav className="mt-4 space-y-2" aria-label="Sprungnavigation">
                  {jumpLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className="block rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] transition-colors hover:border-[var(--gold)]/50 hover:text-[var(--text)]"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </article>
            ) : null}

            <article className="card-base p-5">
              <h2 className="h3">{summaryTitle}</h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                {summaryItems.map((item) => (
                  <li key={`${item.title || "item"}-${item.body}`} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>
                      {item.title ? <strong className="text-[var(--text)]">{item.title}: </strong> : null}
                      {item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            {asideExtras}
          </aside>

          <div className="space-y-5">{children}</div>
        </div>
      </Container>
    </section>
  );
}
