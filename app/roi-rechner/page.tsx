import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import ROICalculator from "@/components/marketing/ROICalculator";
import FinalCTA from "@/components/marketing/FinalCTA";

const methodRows = [
  {
    title: "Zeitmodell pro Anfrage",
    text: "Wir trennen in Standardfälle (potenziell Auto) und übrige Fälle (manuell/Freigabe). Auto-Fälle werden nicht mit null Minuten gerechnet, sondern mit Restaufwand plus QA-/Monitoring-Anteil.",
  },
  {
    title: "Erstreaktionsmodell",
    text: "Die Rechnung startet mit Ihrem eingegebenen Ist-Median. Es wird kein versteckter Zusatzpuffer addiert. Der Effekt ergibt sich aus der Auto-Quote unter Guardrails.",
  },
  {
    title: "SLA-Fenster innerhalb 60 Minuten",
    text: "Zusätzlich wird geschätzt, wie stabil Ihr Team Anfragen innerhalb von 60 Minuten beantworten kann. Das ist ein früher Qualitätsindikator für den operativen Rollout.",
  },
  {
    title: "Monetäre Einordnung",
    text: "Gesparte Stunden werden mit Ihrem internen Stundensatz bewertet. So sehen Sie neben Zeit-KPI auch ein konservatives wirtschaftliches Potenzial pro Monat.",
  },
];

const kpiInterpretation = [
  {
    title: "Gesparte Stunden pro Monat",
    text: "Zeigt, wie viel operative Zeit aus dem Postfach in Beratung, Besichtigung und Abschlussarbeit verschoben werden kann.",
  },
  {
    title: "Median Erstreaktion",
    text: "Je niedriger dieser Wert, desto schneller reagieren Sie auf neue Interessenten. Das ist im Wettbewerb oft entscheidend.",
  },
  {
    title: "Antworten im 60-Minuten-Fenster",
    text: "Misst, wie stabil Ihr Team auf Anfrage-Spitzen reagiert, ohne bei Qualität oder Sicherheit einzubrechen.",
  },
  {
    title: "Auto-Quote mit Guardrails",
    text: "Nicht maximale Automatisierung, sondern sichere Automatisierung ist das Ziel. Eine gute Quote ist immer an Freigabe und QA gekoppelt.",
  },
  {
    title: "Monetäres Potenzial",
    text: "Zeigt den Gegenwert der freiwerdenden Zeit auf Basis Ihres Stundensatzes. Das ist eine Arbeitswert-Schätzung, keine Umsatzgarantie.",
  },
];

const limits = [
  "Der Rechner bildet operativen Arbeitswert ab, nicht garantierten Mehrumsatz.",
  "Saisonale Volumenschwankungen, Teamwechsel und Objektmix können Abweichungen erzeugen.",
  "Die tatsächliche Auto-Quote hängt von Ihrer Regelqualität und Datenlage ab.",
  "Deshalb gilt: erst 14 Tage pilotieren, dann Regeln und Auto-Anteil stufenweise ausbauen.",
];

const rollout = [
  "Woche 1: konservativ starten, hohe Freigabequote aktiv.",
  "Woche 2: Standardfälle schärfen, Ton- und Regelwerk nachziehen.",
  "Woche 3: Auto-Anteil nur bei stabiler Qualität erhöhen.",
  "Woche 4: Erstreaktionszeit, Freigabequote und QA-Verlauf gemeinsam prüfen.",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz zur Wirkung schneller Erstantworten auf Kontakt- und Qualifizierungswahrscheinlichkeit.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Referenz zur Produktivitätsrelevanz digitaler Kommunikation und E-Mail-Arbeit.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewusste Einführung automatisierter Systeme.",
  },
];

export const metadata: Metadata = {
  title: "ROI-Rechner für Immobilienmakler",
  description:
    "Interaktiver ROI-Rechner für Makler: Zeitersparnis, Erstreaktionszeit und Antwortquote im Zielzeitfenster konservativ berechnen.",
  alternates: {
    canonical: "/roi-rechner",
  },
  openGraph: {
    title: "ROI-Rechner | Advaic",
    description:
      "Interaktiver ROI-Rechner für Makler: Zeitersparnis, Erstreaktionszeit und Antwortquote im Zielzeitfenster konservativ berechnen.",
    url: "/roi-rechner",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "ROI-Rechner | Advaic",
    description:
      "Interaktiver ROI-Rechner für Makler: Zeitersparnis, Erstreaktionszeit und Antwortquote im Zielzeitfenster konservativ berechnen.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function ROIRechnerPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="ROI-Rechner"
        title="Zeitgewinn und Reaktionsgeschwindigkeit realistisch berechnen"
        description="Der Rechner zeigt konservativ, wie sich Zeitaufwand, Erstreaktion und 60-Minuten-Quote entwickeln können. Alle Annahmen sind offen sichtbar."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produkt im Detail
            </Link>
            <Link href="/signup?entry=roi-page" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="entscheidung"
        primaryHref="/signup?entry=roi-stage"
        primaryLabel="Mit Ihren Werten testen"
        secondaryHref="/manuell-vs-advaic"
        secondaryLabel="Prozessvergleich ansehen"
        context="roi-rechner"
      />

      <ROICalculator />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-7 md:p-8">
              <h2 className="h3">Methodik: So lesen Sie den Rechner richtig</h2>
              <p className="helper mt-3">
                Die Modelllogik ist bewusst konservativ. Ziel ist eine belastbare Pilot-Entscheidung statt einer
                Marketingzahl.
              </p>
              <div className="mt-5 space-y-3">
                {methodRows.map((row) => (
                  <article key={row.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text)]">{row.title}</h3>
                    <p className="helper mt-2">{row.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="card-base p-6 lg:col-span-5 md:p-8">
              <h2 className="h3">Interpretation der KPI</h2>
              <div className="mt-4 space-y-3">
                {kpiInterpretation.map((item) => (
                  <article key={item.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                    <p className="helper mt-2">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Wichtige Grenzen der Modellrechnung</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {limits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Empfohlener Rollout nach der ROI-Berechnung</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {rollout.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/produkt#setup" className="btn-secondary">
                Setup im Detail
              </Link>
              <Link href="/freigabe-inbox" className="btn-secondary">
                Freigabe-Inbox verstehen
              </Link>
              <Link href="/follow-up-logik" className="btn-secondary">
                Follow-up-Logik prüfen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-16 md:py-20">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Methodik nutzt öffentliche Referenzen zu Reaktionszeit, digitaler Produktivität und kontrollierter
              Risikoeinführung. Die Berechnung ist eine operative Orientierung, keine Ergebnisgarantie.
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

      <FinalCTA />
    </PageShell>
  );
}
