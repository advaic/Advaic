import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import ROICalculator from "@/components/marketing/ROICalculator";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const exampleScenario = {
  title: "Beispiel: kleines Maklerteam mit 58 Anfragen pro Woche",
  setup: [
    "2 Personen bearbeiten gemeinsam das Postfach.",
    "Viele Fragen drehen sich um Verfügbarkeit, Unterlagen und Besichtigung.",
    "Heute liegt die Median-Erstreaktion bei rund 85 Minuten.",
  ],
  assumptions: [
    "72 % der Anfragen sind wiederkehrende Erstantworten.",
    "62 % davon könnten in einem engen Auto-Senden-Korridor laufen.",
    "Beschwerden, fehlende Angaben und Sonderfälle bleiben in der Freigabe, sparen aber trotzdem bereits Zeit durch Vorqualifizierung und vorbereiteten Kontext.",
  ],
  readout: [
    "Der Rechner zeigt daraus zuerst gesparte Stunden pro Monat.",
    "Dann sehen Sie, wie weit die Erstreaktion Richtung 60-Minuten-Fenster sinken kann.",
    "Erst danach bewerten Sie, ob ein 14-Tage-Pilot diese Annahmen im echten Betrieb bestätigt.",
  ],
};

const methodRows = [
  {
    title: "Zeitmodell pro Anfrage",
    text: "Wir trennen in wiederkehrende Erstantworten (potenziell Auto-Senden) und übrige Fälle (Assistenz/Freigabe). Auto-Senden-Fälle werden nicht mit null Minuten gerechnet, Freigabe-Fälle aber auch nicht mehr als voll manuell bewertet, weil Sortierung, Kontext und Entwurf bereits Zeit sparen.",
  },
  {
    title: "Erstreaktionsmodell",
    text: "Die Rechnung startet mit Ihrem eingegebenen Ist-Median. Es wird kein versteckter Zusatzpuffer addiert. Der Effekt ergibt sich aus Auto-Senden plus schnellerer Vorqualifizierung und Freigabe unter Guardrails.",
  },
  {
    title: "SLA-Fenster innerhalb 60 Minuten",
    text: "Zusätzlich wird geschätzt, wie stabil Ihr Team Anfragen innerhalb von 60 Minuten beantworten kann. Das ist ein früher Qualitätsindikator für den operativen Rollout.",
  },
  {
    title: "Monetäre Einordnung",
    text: "Gesparte Stunden werden mit Ihrem internen Stundensatz bewertet. So sehen Sie neben Zeit-KPI auch ein konservatives wirtschaftliches Potenzial pro Monat.",
  },
  {
    title: "Optionales Conversion-Szenario",
    text: "Zusätzlich können Sie ein offenes Szenario für Besichtigungsquote, relativen Uplift und Deckungsbeitrag pro Abschluss einblenden. Diese Ebene ist bewusst separat und kein verstecktes Umsatzversprechen.",
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
    title: "Auto-Senden-Quote mit Guardrails",
    text: "Nicht maximale Automatisierung, sondern sichere Automatisierung ist das Ziel. Eine gute Auto-Senden-Quote ist immer an Freigabe und QA gekoppelt.",
  },
  {
    title: "Monetäres Potenzial",
    text: "Zeigt den Gegenwert der freiwerdenden Zeit auf Basis Ihres Stundensatzes. Das ist eine Arbeitswert-Schätzung, keine Umsatzgarantie.",
  },
  {
    title: "Optionales Umsatzszenario",
    text: "Wenn Sie die Szenario-Ebene aktivieren, sehen Sie zusätzlich mögliche Mehrbesichtigungen, zusätzliche Abschlüsse und einen transparenten optionalen Umsatzhebel.",
  },
];

const limits = [
  "Der Rechner bildet operativen Arbeitswert ab, nicht garantierten Mehrumsatz.",
  "Saisonale Volumenschwankungen, Teamwechsel und Objektmix können Abweichungen erzeugen.",
  "Die tatsächliche Auto-Senden-Quote hängt von Ihrer Regelqualität und Datenlage ab.",
  "Auch das optionale Conversion-Szenario bleibt nur eine Modellannahme und ersetzt keinen echten Pilot mit Live-Daten.",
  "Deshalb gilt: erst 14 Tage pilotieren, dann Regeln und Auto-Senden-Anteil stufenweise ausbauen.",
];

const rollout = [
  "Woche 1: konservativ starten, hohe Freigabequote aktiv.",
  "Woche 2: wiederkehrende Erstantworten schärfen, Ton- und Regelwerk nachziehen.",
  "Woche 3: Auto-Senden-Anteil nur bei stabiler Qualität erhöhen.",
  "Woche 4: Erstreaktionszeit, Freigabequote und QA-Verlauf gemeinsam prüfen.",
];

const quickTake = [
  "Der Rechner soll keine Umsatzfantasie verkaufen, sondern eine belastbare Pilotentscheidung vorbereiten.",
  "Wichtig sind gesparte Stunden, Reaktionszeit, 60-Minuten-Quote und die tatsächliche Auto-Senden-Quote unter Guardrails.",
  "Zusätzlich können Sie ein separates Conversion-Szenario einblenden, ohne den konservativen Arbeitswert künstlich aufzublähen.",
  "Wenn die Modellannahmen nicht zu Ihrem Anfragevolumen oder Teamprozess passen, ist die Rechnung nur eine grobe Orientierung.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "ROI-Rechner für Makler: Zeitgewinn realistisch bewerten",
  ogTitle: "ROI-Rechner | Advaic",
  description:
    "Interaktiver ROI-Rechner für Makler: Zeitersparnis, Erstreaktionszeit und Arbeitswert über Auto-Senden, Freigabe und Vorqualifizierung nachvollziehbar berechnen.",
  path: "/roi-rechner",
  template: "pricing",
  eyebrow: "ROI-Rechner",
  proof: "Konservative Modelllogik, offene Grenzen und KPI für eine belastbare Pilotentscheidung.",
});

export default function ROIRechnerPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="ROI-Rechner"
        title="Zeitgewinn und Reaktionsgeschwindigkeit realistisch berechnen"
        description="Starten Sie am besten mit dem Beispielpfad eines kleinen Maklerteams. Danach passen Sie die Werte auf Ihr reales Anfragevolumen, Ihre Reaktionszeit und Ihren sicheren Auto-Senden-Korridor an."
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

      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-8 md:py-10">
        <Container>
          <article className="card-base p-6 md:p-8">
            <p className="section-kicker">Beispielpfad</p>
            <h2 className="h3 mt-2">{exampleScenario.title}</h2>
            <p className="helper mt-3 max-w-[74ch]">
              Wenn Sie den Rechner zum ersten Mal nutzen, starten Sie mit diesem Beispiel. So verstehen Sie die Logik
              in unter zwei Minuten, bevor Sie Ihre eigenen Zahlen eintragen.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Ausgangslage</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {exampleScenario.setup.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Konservative Annahmen</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {exampleScenario.assumptions.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">So lesen Sie das Ergebnis</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {exampleScenario.readout.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#roi" className="btn-secondary">
                Beispiel im Rechner laden
              </a>
              <Link href="/produkt#setup" className="btn-secondary">
                Safe-Start danach prüfen
              </Link>
            </div>
          </article>
        </Container>
      </section>

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
