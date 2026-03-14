import Link from "next/link";
import Container from "./Container";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

const footerGroups = [
  {
    title: "Produkt",
    links: [
      { label: "Produkt", href: "/produkt" },
      { label: "So funktioniert's", href: "/so-funktionierts" },
      { label: "Preise", href: "/preise" },
      { label: "Integrationen", href: "/integrationen" },
    ],
  },
  {
    title: "Vertrauen",
    links: [
      { label: "Sicherheit", href: "/sicherheit" },
      { label: "Trust-Hub", href: "/trust" },
      { label: "FAQ", href: "/faq" },
      { label: "Datenschutz", href: "/datenschutz" },
    ],
  },
  {
    title: "Vergleiche & Guides",
    links: [
      { label: "Manuell vs. Advaic", href: "/manuell-vs-advaic" },
      { label: "Advaic vs. CRM-Tools", href: "/advaic-vs-crm-tools" },
      { label: "Best Software Immobilienanfragen", href: "/best-software-immobilienanfragen" },
      { label: "Branchen", href: "/branchen" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Nutzungsbedingungen", href: "/nutzungsbedingungen" },
      { label: "Cookie & Storage", href: "/cookie-und-storage" },
      { label: "Unterauftragsverarbeiter", href: "/unterauftragsverarbeiter" },
    ],
  },
] as const;

export default function MarketingFooter() {
  return (
    <footer
      className="border-t border-[var(--border)] bg-white py-14"
      data-tour="marketing-footer"
    >
      <Container>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <section className="space-y-5" data-tour="marketing-footer-brand">
            <div>
              <Link
                href="/"
                className="focus-ring inline-flex text-3xl font-semibold tracking-[-0.04em] text-[var(--text)]"
              >
                advaic
              </Link>
              <p className="mt-3 max-w-[30ch] text-sm leading-7 text-[var(--muted)]">
                E-Mail-Autopilot für Immobilienmakler mit Freigabe, Guardrails und Qualitätschecks vor dem Versand.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Support & Einstieg
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Fragen zur Einführung, zu Guardrails oder zur Testphase beantworten wir direkt.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="mailto:support@advaic.com" className="btn-secondary">
                  support@advaic.com
                </a>
                <Link href="/login" className="btn-secondary">
                  Login
                </Link>
              </div>
              <div className="mt-3">
                <Link href="/signup" className="btn-primary">
                  {MARKETING_PRIMARY_CTA_LABEL}
                </Link>
              </div>
            </div>
          </section>

          <nav
            className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Footer-Navigation"
            data-tour="marketing-footer-groups"
          >
            {footerGroups.map((group) => (
              <section key={group.title} data-tour="marketing-footer-group">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {group.title}
                </p>
                <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className="focus-ring block link-subtle">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Advaic. Alle Rechte vorbehalten.</p>
          <p className="max-w-[56ch] md:text-right">
            Weiterführende Detailseiten zu Branchen, Use Cases und Leitfäden bleiben über die kuratierten Hub-Seiten
            erreichbar statt global als Linkliste im Footer verteilt.
          </p>
        </div>
      </Container>
    </footer>
  );
}
