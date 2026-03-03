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
    text: "Wir trennen zwischen Standardfällen und Sonderfällen. Nur Standardfälle können automatisiert werden. Zusätzlich wird ein Sicherheitsabschlag angesetzt, damit die Rechnung konservativ bleibt.",
  },
  {
    title: "Erstreaktionsmodell",
    text: "Die Rechnung zeigt den erwarteten Median der Erstreaktionszeit bei gleichem Anfragevolumen. Auto-Fälle werden schneller beantwortet, unsichere Fälle bleiben bewusst in der Freigabe.",
  },
  {
    title: "SLA-Fenster innerhalb 60 Minuten",
    text: "Wir schätzen, wie viel Prozent der relevanten Anfragen innerhalb eines klaren Zeitfensters beantwortet werden können. Das ist ein operativer Frühindikator für bessere Abschlusschancen.",
  },
  {
    title: "Keine Überversprechen",
    text: "Die Ergebnisse sind Planungswerte. Sie ersetzen kein Pilotprojekt. Deshalb empfehlen wir einen Safe-Start mit enger Beobachtung und kontrollierter Skalierung.",
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
        description="Der Rechner zeigt, welchen operativen Effekt Advaic bei Ihrem Anfragevolumen haben kann. Fokus: weniger Postfachzeit, schnellere Erstantwort, stabile Qualität durch Guardrails."
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
