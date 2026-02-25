import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const workflow = [
  {
    title: "1) Erkennung",
    text: "Advaic erkennt unklare, heikle oder unvollständige Fälle und schiebt sie in die Freigabe.",
  },
  {
    title: "2) Sichtung",
    text: "Sie sehen Grund, Entwurf und Kontext gebündelt, statt verstreut im Postfach.",
  },
  {
    title: "3) Entscheidung",
    text: "Sie geben frei, bearbeiten oder lehnen ab. Der Versand passiert nur mit Ihrer finalen Entscheidung.",
  },
  {
    title: "4) Dokumentation",
    text: "Status und Zeitstempel bleiben im Verlauf nachvollziehbar.",
  },
];

const reasons = [
  "Objektbezug unklar",
  "Wichtige Angaben fehlen",
  "Beschwerde oder Konfliktthema",
  "Niedrige Sicherheit im Risiko-Check",
];

const priorityBands = [
  {
    title: "Hoch (sofort prüfen)",
    text: "Beschwerden, Konflikte, mögliche Fehladressierung, rechtlich sensible Aussagen.",
  },
  {
    title: "Mittel (heute prüfen)",
    text: "Unklarer Objektbezug oder fehlende Pflichtinfos bei grundsätzlich relevantem Lead.",
  },
  {
    title: "Niedrig (gebündelt prüfen)",
    text: "Leichte Kontextlücken ohne direktes Risikopotenzial.",
  },
];

const operationalRules = [
  "Jeder Freigabefall erhält einen klaren Grundcode.",
  "Priorität wird nach Risiko und nicht nach Lautstärke vergeben.",
  "Freigabeentscheidungen werden mit Zeitstempel dokumentiert.",
  "Bearbeitete Fälle fließen in die Regelkalibrierung zurück.",
];

const kpis = [
  "Median-Zeit bis Freigabeentscheidung",
  "Anteil Eskalationen pro 100 Freigabefälle",
  "Wiederholte Freigabegründe (Top-5) pro Woche",
  "Quote nachträglicher Korrekturen nach Freigabe",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Referenz für kontrollierte Mensch-im-Prozess-Steuerung bei risikobehafteten Automationsentscheidungen.",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Einordnung für nachvollziehbare, dokumentierte Verarbeitungs- und Entscheidungsprozesse.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Allgemeine Referenz für strukturiertes Risikomanagement und Betriebsprozesse.",
  },
];

export const metadata: Metadata = {
  title: "Makler Freigabe Workflow | Advaic",
  description:
    "So funktioniert ein professioneller Freigabe-Workflow für Immobilienmakler: Fälle erkennen, strukturiert entscheiden und revisionssicher dokumentieren.",
};

export default function MaklerFreigabeWorkflowPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Makler-Freigabe-Workflow"
        title="Sensible Fälle kontrolliert entscheiden"
        description="Der Freigabe-Workflow sorgt dafür, dass kritische Nachrichten nicht automatisch rausgehen, sondern strukturiert in Ihrer Entscheidung landen."
        actions={
          <>
            <Link href="/freigabe-inbox" className="btn-secondary">
              Freigabe-Inbox
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Warum ein sauberer Freigabe-Workflow ein Umsatzthema ist</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Ohne klare Freigabelogik verlieren Teams Zeit in unsortierten Sonderfällen. Gleichzeitig steigt das
                Risiko, dass unter Druck unvollständige oder unpassende Antworten gesendet werden.
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Ein guter Workflow ist daher kein Bremsfaktor, sondern ein Schutzsystem: Routinefälle laufen schnell,
                sensible Fälle werden strukturiert priorisiert und dokumentiert entschieden.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Entscheidungsziel</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Risikoarme Fälle zügig freigeben</li>
                <li>Risikofälle früh isolieren</li>
                <li>Entscheidungen reproduzierbar machen</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <StageCTA
        stage="bewertung"
        primaryHref="/signup"
        primaryLabel="Freigabe-Workflow testen"
        secondaryHref="/qualitaetschecks"
        secondaryLabel="Checks verstehen"
        context="intent-freigabe-workflow"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.title} className="card-base card-hover p-5">
                <h2 className="text-sm font-semibold text-[var(--text)]">{item.title}</h2>
                <p className="helper mt-2">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Typische Freigabegründe</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {reasons.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Prioritätslogik in der Freigabe-Inbox</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {priorityBands.map((band) => (
                <article key={band.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">{band.title}</p>
                  <p className="helper mt-2">{band.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Betriebsregeln für ein stabiles Freigabesystem</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {operationalRules.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">KPI-Set für den Freigabe-Workflow</h2>
            <p className="helper mt-3">
              Diese Kennzahlen zeigen, ob der Workflow Entscheidungen beschleunigt und gleichzeitig Risiken kontrolliert.
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

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <article key={source.href} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
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
