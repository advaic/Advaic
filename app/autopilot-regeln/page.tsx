import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FinalCTA from "@/components/marketing/FinalCTA";

const matrixRows = [
  {
    signal: "Eindeutige Interessenten-Anfrage, Standardfall, vollständiger Kontext",
    action: "Auto senden",
    reason: "Schnelle Reaktion ohne Qualitätsverlust.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    signal: "Unklarer Objektbezug oder fehlende kritische Angaben",
    action: "Zur Freigabe",
    reason: "Unsicherheit wird nicht automatisch versendet.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    signal: "Beschwerde, Konflikt oder Sonderfall",
    action: "Zur Freigabe",
    reason: "Menschliche Entscheidung ist hier verpflichtend.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    signal: "Newsletter, Rundmail, Systemmail, Spam",
    action: "Ignorieren",
    reason: "Kein Lead-Signal, daher kein Versand.",
    tone: "border-gray-200 bg-gray-100 text-gray-800",
  },
];

const autoExamples = [
  "Ist die Immobilie noch verfügbar?",
  "Welche Unterlagen werden für die Besichtigung benötigt?",
  "Wie ist der weitere Ablauf bis zum Termin?",
];

const approvalExamples = [
  "„Ich beziehe mich auf die Wohnung in der Innenstadt“ (Objekt nicht eindeutig).",
  "„Ich bin sehr unzufrieden mit dem letzten Termin“ (Beschwerde/Konflikt).",
  "„Bitte Sonderregelung für meinen Fall“ (ungewöhnliches Anliegen).",
];

const summary = [
  "Auto-Senden greift nur bei klarer Anfrage, Standardfall und vollständigem Kontext.",
  "Unsicherheit führt nicht zu Auto-Versand, sondern verpflichtend zur Freigabe.",
  "Nicht-Anfragen (z. B. Newsletter, Systemmails, Spam) werden konsequent ignoriert.",
];

const controlPoints = [
  {
    title: "Klarheitsprüfung",
    text: "Advaic prüft zuerst, ob überhaupt eine echte Interessenten-Anfrage vorliegt.",
  },
  {
    title: "Kontextprüfung",
    text: "Objektbezug und notwendige Informationen müssen ausreichend eindeutig sein.",
  },
  {
    title: "Risiko-/Sonderfallprüfung",
    text: "Beschwerden, Konflikte und heikle Themen werden immer in die Freigabe gelegt.",
  },
];

const kpis = [
  "Auto-Anteil bei klaren Standardfällen",
  "Freigabequote bei unklaren/sensiblen Fällen",
  "Quote nachträglicher manueller Korrekturen",
  "Ø Erstreaktionszeit auf klare Anfragen",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = {
  title: "Autopilot-Regeln im Detail | Advaic",
  description:
    "Signal-zu-Aktion Matrix mit Beispielen: wann Advaic automatisch sendet, wann Freigabe greift und wann Nachrichten ignoriert werden.",
};

export default function AutopilotRegelnPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Entscheidungslogik"
        title="Wann Advaic automatisch sendet und wann bewusst stoppt"
        description="Diese Seite zeigt die operative Regelmatrix von Advaic: welche Eingangssignale zu Auto, Freigabe oder Ignorieren führen und warum."
        actions={
          <>
            <Link href="/produkt#regeln" className="btn-secondary">
              Zur Produktsektion
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
              <a href="#regeln-details" className="btn-secondary">
                Regelmatrix
              </a>
              <a href="#regeln-quellen" className="btn-secondary">
                Quellen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="regeln-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Regelmatrix im Alltag</h2>
          <p className="body mt-4 max-w-[72ch] text-[var(--muted)]">
            Die Entscheidung folgt keiner Blackbox. Jede Nachricht wird gegen klar definierte Kriterien geprüft.
          </p>

          <div className="mt-6 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold text-[var(--text)]">Entscheidungsreihenfolge</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {["1) Relevanz prüfen", "2) Kontext prüfen", "3) Risiko prüfen", "4) Aktion ausführen"].map((step) => (
                <div key={step} className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {matrixRows.map((row) => (
              <article key={row.signal} className="card-base card-hover p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Eingangssignal
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">{row.signal}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Aktion
                    </p>
                    <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${row.tone}`}>
                      {row.action}
                    </span>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Warum
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{row.reason}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {controlPoints.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h3 className="h3">Typische Auto-Fälle</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {autoExamples.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h3 className="h3">Typische Freigabe-Fälle</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {approvalExamples.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-8 p-6">
            <h3 className="h3">KPI-Set für die Regelkalibrierung</h3>
            <p className="helper mt-3">
              Mit diesen Kennzahlen erkennen Sie, ob die Regelmatrix stabil arbeitet oder nachgeschärft werden muss.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article id="regeln-quellen" className="card-base mt-8 p-6">
            <h3 className="h3">Quellen & Einordnung</h3>
            <p className="helper mt-3">
              Die Regelarchitektur folgt dem Prinzip kontrollierter Automatisierung mit klaren Fail-Safe-Grenzen.
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

          <p className="body mt-8">
            Grundregel: Im Zweifel geht der Fall in die Freigabe und nicht in den Autopilot.
          </p>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
