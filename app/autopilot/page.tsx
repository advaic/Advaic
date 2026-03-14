import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import Rules from "@/components/marketing/Rules";
import QualityChecks from "@/components/marketing/QualityChecks";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import Guarantee from "@/components/marketing/Guarantee";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const principles = [
  "Automatisch gesendet wird nur bei prüfbarem Objektbezug, ausreichenden Angaben und passender Versandfreigabe.",
  "Fehlende Informationen, Beschwerden, Ausnahmen oder rechtlich sensible Aussagen gehen in die Freigabe.",
  "Spam, Newsletter und sonstige Nicht-Anfragen werden ignoriert statt beantwortet.",
  "Jede Entscheidung muss als Regel beschreibbar und im Verlauf nachvollziehbar sein.",
];

const summary = [
  "Ein brauchbarer Autopilot beantwortet nicht möglichst viele Nachrichten, sondern nur die fachlich sauberen Fälle.",
  "Freigabe ist kein Fehlerzustand, sondern die notwendige Schutzschicht bei fehlenden Angaben, Konflikten oder Ausnahmen.",
  "Für den Betrieb zählt, ob Regeln, Gründe und Eingriffe pro Nachricht prüfbar bleiben.",
];

const decisionMatrix = [
  {
    title: "Automatisch senden",
    text: "Bei echter Interessenten-Anfrage mit belegbarem Objektbezug, vorhandenen Pflichtangaben und bestandenen Qualitätschecks.",
  },
  {
    title: "Zur Freigabe",
    text: "Bei fehlenden Angaben, Beschwerden, Ausnahmewünschen, nicht prüfbarem Absender oder rechtlich sensibler Aussage.",
  },
  {
    title: "Ignorieren",
    text: "Bei Spam, Newslettern, Systemmails oder sonstigen E-Mails ohne operativen Antwortbedarf.",
  },
];

const beforeStart = [
  "Welche Antworttypen dürfen automatisch raus und welche nicht?",
  "Welche Pflichtangaben müssen pro Nachricht vorhanden sein?",
  "Welche Ausnahmen, Beschwerden oder Preisfragen bleiben grundsätzlich manuell?",
  "Wer prüft Freigaben und wie wird im Verlauf dokumentiert?",
];

const redFlags = [
  "Das Tool kann Auto-Fälle nicht mit konkreten Kriterien erklären.",
  "Es gibt keinen klaren Unterschied zwischen Freigabe und automatischem Versand.",
  "Blockierende Gründe pro Nachricht sind im Verlauf nicht sichtbar.",
  "Der Pilot startet sofort mit zu viel Auto-Anteil statt mit konservativen Grenzen.",
];

const deepDives = [
  {
    title: "Autopilot-Regeln im Detail",
    text: "Signal-zu-Aktion Matrix für Auto, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks im Detail",
    text: "Alle Prüfungen mit Zweck, Beispiel und Fail-Safe-Verhalten.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox im Detail",
    text: "Wie Nachrichten mit fehlenden Angaben, Konflikten oder Ausnahmen strukturiert geprüft und sauber entschieden werden.",
    href: "/freigabe-inbox",
  },
  {
    title: "Follow-up-Logik im Detail",
    text: "Stufenmodell, Guardrails und Stop-Kriterien für Nachfassmails.",
    href: "/follow-up-logik",
  },
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie ein Makler-Autopilot entscheiden sollte",
  ogTitle: "Autopilot mit Guardrails | Advaic",
  description:
    "Wie ein sinnvoller E-Mail-Autopilot für Makler aufgebaut sein sollte: klare Auto-Kriterien, Freigabe bei fehlenden Angaben oder Konflikten und nachvollziehbare Regeln pro Nachricht.",
  path: "/autopilot",
  template: "guide",
  eyebrow: "Leitfaden Autopilot",
  proof: "Automatik nur mit Objektbezug, Pflichtangaben und nachvollziehbaren Regeln.",
});

export default function AutopilotPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Leitfaden Autopilot"
        title="Wie ein Makler-Autopilot entscheiden sollte"
        description="Ein brauchbarer Autopilot beantwortet nur Nachrichten, die fachlich und operativ sauber prüfbar sind. Alles andere wird ignoriert oder zur Freigabe vorgelegt."
        actions={
          <>
            <Link href="/autopilot-regeln" className="btn-secondary">
              Regeln im Detail
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzfassung in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {summary.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#autopilot-details" className="btn-secondary">
                Detail-Logik
              </a>
              <a href="#autopilot-quellen" className="btn-secondary">
                Quellen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="autopilot-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-8 md:p-10">
            <h2 className="h2">Woran Sie einen belastbaren Autopiloten erkennen</h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {principles.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="helper mt-6">
              Gute Systeme beantworten nicht einfach viel, sondern treffen je Nachricht eine saubere Entscheidung
              zwischen Auto, Freigabe und Ignorieren.
            </p>
          </article>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {decisionMatrix.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Vor dem Start festlegen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {beforeStart.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Warnzeichen im Auswahlprozess</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {redFlags.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {deepDives.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Detailseite öffnen
                </Link>
              </article>
            ))}
          </div>

          <article id="autopilot-quellen" className="card-base mt-8 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Autopilot-Logik ist auf kontrollierte, risikobewusste Automatisierung ausgelegt. Die verlinkten
              Quellen unterstützen die Einordnung von Reaktionsgeschwindigkeit und Risiko-Governance.
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

      <DecisionSimulator
        title="Regel-Simulator für den Autopilot"
        description="Anhand typischer Eingänge sehen Sie, wie die Entscheidung zwischen Auto, Freigabe und Ignorieren konkret zustande kommt."
      />
      <Rules />
      <QualityChecks />
      <Guarantee />
      <FinalCTA />
    </PageShell>
  );
}
