import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FAQDecisionTree from "@/components/marketing/FAQDecisionTree";
import MarketingFAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";

const detailLinks = [
  { title: "Autopilot-Regeln", href: "/autopilot-regeln" },
  { title: "Qualitätschecks", href: "/qualitaetschecks" },
  { title: "Freigabe-Inbox", href: "/freigabe-inbox" },
  { title: "Follow-up-Logik", href: "/follow-up-logik" },
  { title: "Anwendungsfälle", href: "/use-cases" },
  { title: "Vergleich", href: "/manuell-vs-advaic" },
  { title: "E-Mail-Automatisierung", href: "/email-automatisierung-immobilienmakler" },
];

const faqUse = [
  "Wenn Sie wissen wollen, ob der Autopilot sicher ist: mit Entscheidungsbaum und Regeln starten.",
  "Wenn Sie den operativen Ablauf planen: erst Setup, dann Follow-up-Logik und Freigabeprozess prüfen.",
  "Wenn Sie Compliance bewerten: Sicherheitsseite, DSGVO-Seite und Datenschutzerklärung gemeinsam lesen.",
];

const externalSources = [
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
];

export const metadata: Metadata = {
  title: "FAQ | Advaic",
  description:
    "Antworten zu Autopilot, Freigabe, Qualitätschecks, Follow-ups, Sicherheit und Testphase von Advaic für Immobilienmakler.",
};

export default function FAQPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="FAQ"
        title="Häufige Fragen zu Advaic"
        description="Hier finden Sie die wichtigsten Antworten zu Funktionsweise, Sicherheit, Steuerung und Testphase."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produktdetails
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-12 md:py-16">
        <Container>
          <article className="card-base p-5 md:p-6">
            <h2 className="h3">So nutzen Sie diese FAQ sinnvoll</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {faqUse.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="card-base p-5">
              <h2 className="h3">Autopilot</h2>
              <p className="helper mt-2">
                Wann automatisch gesendet wird, wann Freigabe greift und welche Guardrails aktiv sind.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Sicherheit</h2>
              <p className="helper mt-2">
                Welche Qualitätschecks vor Auto-Versand laufen und wie Transparenz im Verlauf aussieht.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Setup</h2>
              <p className="helper mt-2">
                Wie Sie starten, konservativ konfigurieren und Follow-ups kontrolliert aktivieren.
              </p>
            </article>
          </div>

          <div className="mt-6 card-base p-5">
            <h2 className="h3">Direkt zu den Detailseiten</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLinks.map((item) => (
                <Link key={item.href} href={item.href} className="btn-secondary">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <article className="card-base mt-6 p-5 md:p-6">
            <h2 className="h3">Externe Quellen zur Einordnung</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Diese Links helfen bei der Bewertung von Compliance, Risikosteuerung und Reaktionsgeschwindigkeit im
              Kontext automatisierter E-Mail-Prozesse.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {externalSources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FAQDecisionTree />
      <MarketingFAQ showDetailButton={false} />
      <FinalCTA />
    </PageShell>
  );
}
