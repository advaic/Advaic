import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const repeatTopics = [
  "Verfügbarkeit und aktueller Status",
  "Erforderliche Unterlagen",
  "Besichtigungstermine und Ablauf",
  "Nächste Schritte nach Erstkontakt",
];

const nonAutoCases = [
  "Unklarer Objektbezug trotz Anfrage",
  "Beschwerde, Konflikt oder Eskalation",
  "Sonderwunsch mit individueller Prüfung",
  "Kritische Informationslücke im Kontext",
];

const rollout = [
  "Woche 1: Nur klarste Standardfragen auf Auto, Rest in die Freigabe.",
  "Woche 2: Häufige Freigabegründe clustern und Regeln nachschärfen.",
  "Woche 3: Tonalität und Vollständigkeit anhand realer Verläufe finalisieren.",
  "Woche 4: Auto-Anteil kontrolliert erhöhen, wenn QA stabil bleibt.",
];

const kpis = [
  "Anteil automatisch beantworteter Standardfragen",
  "Quote unklarer Objektbezüge im Eingang",
  "Freigabe-Durchlaufzeit bei Sonderfällen",
  "Korrekturrate nach Auto-Versand",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
];

export const metadata: Metadata = {
  title: "Anwendungsfall Mittelpreisige Objekte | Advaic",
  description:
    "Wie Advaic bei mittelpreisigen Objekten wiederkehrende Standardfragen automatisiert und bei Sonderfällen zuverlässig auf Freigabe umschaltet.",
  alternates: {
    canonical: "/use-cases/mittelpreisige-objekte",
  },
  openGraph: {
    title: "Anwendungsfall Mittelpreisige Objekte | Advaic",
    description:
      "Wie Advaic bei mittelpreisigen Objekten wiederkehrende Standardfragen automatisiert und bei Sonderfällen zuverlässig auf Freigabe umschaltet.",
    url: "/use-cases/mittelpreisige-objekte",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Anwendungsfall Mittelpreisige Objekte | Advaic",
    description:
      "Wie Advaic bei mittelpreisigen Objekten wiederkehrende Standardfragen automatisiert und bei Sonderfällen zuverlässig auf Freigabe umschaltet.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function UseCaseMittelpreisigeObjektePage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Anwendungsfall mittelpreisige Objekte",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/use-cases/mittelpreisige-objekte`,
    about: ["mittelpreisige Objekte", "Anfrageautomatisierung", "Freigabe", "Maklerprozess"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Anwendungsfall"
        title="Mittelpreisige Objekte mit wiederkehrenden Fragen"
        description="In diesem Segment ist der Anteil standardisierbarer Kommunikation oft hoch. Advaic nutzt das Potenzial, ohne die Sicherheitslogik aufzugeben."
        actions={
          <>
            <Link href="/use-cases" className="btn-secondary">
              Alle Anwendungsfälle
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />
      <StageCTA
        stage="bewertung"
        primaryHref="/signup"
        primaryLabel="Segment testen"
        secondaryHref="/produkt#setup"
        secondaryLabel="Safe-Start planen"
        context="use-case-mittelpreisige-objekte"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Kurzfassung für dieses Segment</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Bei mittelpreisigen Objekten ist der Anteil wiederkehrender Erstfragen oft hoch. Der größte Effekt
              entsteht, wenn diese Fälle verlässlich automatisiert werden und unsichere Fälle konsequent in die
              Freigabe laufen.
            </p>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Typisch automatisierbar</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {repeatTopics.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Bewusst nicht automatisch</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {nonAutoCases.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Empfohlener Rollout</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Mit einem Objektsegment starten und Regeln dafür scharf definieren.</li>
              <li>Freigabe-Feedback nutzen, um Ton und Vollständigkeit zu stabilisieren.</li>
              <li>Autopilot nur für klar wiederkehrende Fälle schrittweise ausweiten.</li>
            </ol>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">4-Wochen-Umsetzung</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {rollout.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">KPI-Set für den Ausbau</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {kpis.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Der Use Case basiert auf publizierter Forschung zu Reaktionsgeschwindigkeit und produktiver
              Kommunikationslast sowie auf einer konservativen Risk-Governance-Logik.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
