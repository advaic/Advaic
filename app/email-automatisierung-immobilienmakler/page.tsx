import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const outcomes = [
  "Schnellere Erstreaktion bei klaren Standardanfragen",
  "Weniger manuelle Routinearbeit im Postfach",
  "Saubere Freigabe bei unklaren oder riskanten Fällen",
];

const problemPatterns = [
  {
    title: "Zu viel Zeit im Eingang statt in der Vermarktung",
    text: "Viele Teams verlieren den größten Zeitblock nicht bei komplexen Fällen, sondern beim wiederholten Bearbeiten ähnlicher Erstanfragen.",
  },
  {
    title: "Antwortqualität schwankt unter Last",
    text: "Wenn mehrere Anfragen gleichzeitig eintreffen, werden Ton, Vollständigkeit und nächste Schritte uneinheitlich. Das erzeugt Rückfragen und verzögert Termine.",
  },
  {
    title: "Sensible Fälle und Routinefälle konkurrieren",
    text: "Ohne klare Entscheidungslogik landen konfliktnahe oder unklare Fälle im selben Arbeitsmodus wie Standardanfragen.",
  },
];

const suitable = [
  "Regelmäßiges Anfragevolumen (z. B. Vermietung oder mittelpreisige Objekte)",
  "Viele wiederkehrende Fragen zu Verfügbarkeit, Unterlagen und Besichtigung",
  "Wunsch nach kontrollierter Automatisierung statt Komplett-Autopilot ab Tag 1",
];

const notIdeal = [
  "Sehr wenige Anfragen pro Monat",
  "Jede Antwort muss immer vollständig individuell formuliert werden",
  "Keine Bereitschaft, Regeln und Ton einmal sauber festzulegen",
];

const rolloutPlan = [
  {
    title: "Woche 1: Safe-Start mit hoher Freigabequote",
    text: "Auto nur für eindeutig wiederkehrende Fälle aktivieren. Alle unklaren Fälle gehen in die Freigabe.",
  },
  {
    title: "Woche 2: Ton und Textbausteine kalibrieren",
    text: "Antwortstil an echte Fälle anpassen, damit automatische Antworten konsistent und markengerecht bleiben.",
  },
  {
    title: "Woche 3: Follow-up-Stufe vorsichtig aktivieren",
    text: "Nachfassen zuerst konservativ (z. B. 48 h), mit automatischem Stopp bei Antwort oder Risiko.",
  },
  {
    title: "Woche 4: KPI-basiert entscheiden",
    text: "Auto-Anteil nur anheben, wenn QA-Verlauf, Freigabequote und Antwortzeit stabil sind.",
  },
];

const kpis = [
  "Ø Erstreaktionszeit auf neue Interessenten-Anfragen",
  "Freigabequote je 100 eingehende Anfragen",
  "QA-Fehlerquote vor Versand",
  "Manuelle Minuten pro Standardanfrage",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für den Zusammenhang zwischen Reaktionsgeschwindigkeit und Anfragen-Qualifizierung.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Referenz für den hohen E-Mail-Anteil in Wissensarbeit als Produktivitätsfaktor.",
  },
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
    note: "Offizielle Markt- und Wohnungsdaten zur Einordnung der Nachfrage- und Prozessdynamik.",
  },
  {
    label: "NAR 2024 Profile Highlights (internationale Referenz)",
    href: "https://www.nar.realtor/sites/default/files/2024-11/2024-profile-of-home-buyers-and-sellers-highlights-11-04-2024_2.pdf",
    note: "Zusätzliche Referenz für digital gestartete Immobilienprozesse.",
  },
];

export const metadata: Metadata = {
  title: "E-Mail-Automatisierung Immobilienmakler | Advaic",
  description:
    "Wie Immobilienmakler E-Mail-Antworten sicher automatisieren: klare Auto-Regeln, Freigabe bei Unsicherheit und Qualitätschecks vor jedem Versand.",
  alternates: {
    canonical: "/email-automatisierung-immobilienmakler",
  },
  openGraph: {
    title: "E-Mail-Automatisierung Immobilienmakler | Advaic",
    description:
      "Wie Immobilienmakler E-Mail-Antworten sicher automatisieren: klare Auto-Regeln, Freigabe bei Unsicherheit und Qualitätschecks vor jedem Versand.",
    url: "/email-automatisierung-immobilienmakler",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "E-Mail-Automatisierung Immobilienmakler | Advaic",
    description:
      "Wie Immobilienmakler E-Mail-Antworten sicher automatisieren: klare Auto-Regeln, Freigabe bei Unsicherheit und Qualitätschecks vor jedem Versand.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function EmailAutomatisierungImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "E-Mail-Automatisierung für Immobilienmakler",
    inLanguage: "de-DE",
    about: ["Immobilienmakler", "E-Mail-Automatisierung", "Freigabe", "Qualitätschecks"],
    mainEntityOfPage: `${siteUrl}/email-automatisierung-immobilienmakler`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "E-Mail-Automatisierung Immobilienmakler", path: "/email-automatisierung-immobilienmakler" },
      ]}
      schema={schema}
      kicker="E-Mail-Automatisierung für Immobilienmakler"
      title="Schneller antworten, ohne die Kontrolle abzugeben"
      description="Advaic automatisiert klare Standardanfragen in Ihrem Stil. Unklare Fälle gehen zur Freigabe. Vor jedem Auto-Versand greifen Qualitätschecks."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produkt ansehen
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="intent-email-automatisierung"
      primaryHref="/signup"
      primaryLabel="Automatisierung testen"
      secondaryHref="/autopilot-regeln"
      secondaryLabel="Regeln im Detail"
      sources={sources}
      sourcesDescription="Die Empfehlungen kombinieren öffentliche Studien und konservative Prozesslogik für Maklerbetriebe."
    >
      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Sales Brief: Wann E-Mail-Automatisierung für Makler wirklich sinnvoll ist</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Der Haupthebel liegt nicht darin, jede Nachricht automatisch zu beantworten. Der Hebel liegt darin, den
                großen Block wiederkehrender Standardfälle sicher aus der manuellen Routine zu nehmen und Sonderfälle
                bewusst bei Ihnen zu halten.
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Deshalb ist diese Seite als Entscheidungsfunnel aufgebaut: erst Engpässe verstehen, dann Guardrails
                prüfen, anschließend mit Safe-Start-Konfiguration kontrolliert testen.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Zielbild nach 30 Tagen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Standardfälle werden konsistent und schneller beantwortet.</li>
                <li>Sensible Fälle landen transparent in der Freigabe.</li>
                <li>Die Prozessqualität wird über KPI statt Bauchgefühl gesteuert.</li>
              </ul>
            </article>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {problemPatterns.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map((item) => (
              <article key={item} className="card-base p-6">
                <h2 className="text-base font-semibold text-[var(--text)]">{item}</h2>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Für wen das gut passt</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {suitable.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Wo Grenzen liegen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {notIdeal.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Empfohlener 30-Tage-Rollout</h2>
            <div className="mt-4 space-y-3">
              {rolloutPlan.map((step) => (
                <article key={step.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">{step.title}</p>
                  <p className="helper mt-2">{step.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">KPI-Set für die Entscheidung „ausbauen oder stoppen“</h2>
            <p className="helper mt-3">
              Messen Sie ab dem ersten Tag dieselben Kennzahlen. Nur so erkennen Sie, ob die Automatisierung tatsächlich
              entlastet und gleichzeitig die Qualitätsgrenzen einhält.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((kpi) => (
                <li key={kpi} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{kpi}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <DecisionSimulator
        title="Direkt prüfen: Wie entscheidet Advaic?"
        description="Mit diesen Beispielen sehen Sie in Sekunden, wann Auto-Versand greift und wann Freigabe verpflichtend ist."
      />
    </AiDiscoveryPageTemplate>
  );
}
