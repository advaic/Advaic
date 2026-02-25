import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const cases = [
  {
    title: "Vermietung mit hohem Anfragevolumen",
    text: "Viele ähnliche Anfragen in kurzer Zeit. Fokus auf schnelle Erstreaktion bei sauberer Freigabelogik.",
    href: "/use-cases/vermietung",
    fit: "Wenn täglich viele Erstkontakte mit ähnlichen Kernfragen eingehen.",
    caution: "Wenn nahezu jede Antwort individuell verhandelt werden muss.",
  },
  {
    title: "Kleine Teams mit knapper Zeit",
    text: "Wenige Personen, viele parallele Aufgaben. Fokus auf Entlastung ohne Kontrollverlust.",
    href: "/use-cases/kleines-team",
    fit: "Wenn Postfacharbeit regelmäßig operative Kernaufgaben verdrängt.",
    caution: "Wenn kaum Anfragevolumen vorhanden ist.",
  },
  {
    title: "Mittelpreisige Objekte",
    text: "Wiederkehrende Fragen zu Verfügbarkeit, Unterlagen, Besichtigung und Ablauf.",
    href: "/use-cases/mittelpreisige-objekte",
    fit: "Wenn Standardfragen einen hohen Anteil der Eingangsmails ausmachen.",
    caution: "Wenn der Objektbezug in Eingängen häufig unklar bleibt.",
  },
  {
    title: "Neubau-Vertrieb",
    text: "Projektanfragen mit hohem Informationsbedarf und klaren Freigabepfaden bei Sonderfällen.",
    href: "/branchen/neubau-vertrieb",
    fit: "Wenn strukturierte Projektantworten pro Bauabschnitt benötigt werden.",
    caution: "Wenn jede Anfrage ohne Vorlagen vollständig neu beantwortet werden muss.",
  },
];

const chooser = [
  "Wie hoch ist Ihr tägliches Anfragevolumen pro Objektsegment?",
  "Wie hoch ist der Anteil wiederkehrender Standardfragen?",
  "Wie oft entstehen Sonderfälle mit Konflikt- oder Eskalationspotenzial?",
  "Wie viel Zeit pro Tag bindet aktuell die reine Postfacharbeit?",
];

const rolloutRules = [
  "Konservativ starten: hoher Freigabeanteil, niedriger Auto-Anteil.",
  "Erst stabilen Erstantwort-Prozess aufbauen, dann Follow-ups aktivieren.",
  "Autopilot nur anhand messbarer Qualität erhöhen, nicht aus Bauchgefühl.",
];

const kpis = [
  {
    title: "Zeit bis Erstantwort",
    text: "Sinkt diese Kennzahl, wird Ihre Reaktionsfähigkeit für Interessenten spürbar besser.",
  },
  {
    title: "Freigabequote",
    text: "Zeigt, wie viel Unsicherheit aktuell im Eingang liegt und wie reif die Regeln sind.",
  },
  {
    title: "QA-Auffälligkeiten",
    text: "Muss niedrig bleiben, bevor der Autopilot-Anteil erhöht wird.",
  },
  {
    title: "Antwortabdeckung",
    text: "Anteil der relevanten Eingänge, die innerhalb des Zielzeitraums beantwortet werden.",
  },
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
  title: "Anwendungsfälle | Advaic",
  description:
    "Detaillierte Anwendungsfälle für Makler: Wann Advaic besonders sinnvoll ist, wie Guardrails greifen und wie ein sicherer Start aussieht.",
};

export default function UseCasesPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Anwendungsfälle"
        title="Wo Advaic im Makleralltag den größten Hebel hat"
        description="Diese Seiten zeigen konkrete Einsatzszenarien statt allgemeiner Marketingversprechen: klare Vorteile, klare Grenzen, klarer Start."
        actions={
          <>
            <Link href="/branchen" className="btn-secondary">
              Branchenprofile
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
        primaryLabel="14 Tage testen"
        secondaryHref="/produkt#setup"
        secondaryLabel="Safe-Start ansehen"
        context="use-cases"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">So wählen Sie den passenden Anwendungsfall</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Nutzen Sie diese Seite wie einen Entscheidungsfilter. Nicht die Branche allein ist entscheidend, sondern
              Ihr tatsächlicher Anfrage-Mix, Ihre Teamgröße und Ihr Risiko-Profil bei Sonderfällen.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {chooser.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Besonders passend, wenn:</p>
                <p className="helper mt-1">{item.fit}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Weniger passend, wenn:</p>
                <p className="helper mt-1">{item.caution}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Anwendungsfall öffnen
                </Link>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Rollout-Regeln für alle Anwendungsfälle</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {rolloutRules.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {kpis.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Anwendungsfälle basieren auf öffentlicher Forschung zu Reaktionsgeschwindigkeit, Arbeitslast in der
              Kommunikation und risikobewusster Automatisierung.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
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

      <FinalCTA />
    </PageShell>
  );
}
