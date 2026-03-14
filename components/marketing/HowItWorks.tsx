import Link from "next/link";
import Container from "./Container";
import { MARKETING_FLOW_CTA_LABEL } from "./cta-copy";

const steps = [
  {
    id: "01",
    title: "Gmail oder Outlook verbinden",
    text: "Sie verbinden Ihr Postfach per OAuth. Zugangsdaten werden nicht manuell im Produkt hinterlegt.",
    stage: "Grundlage",
    outcome: "Zugriff steht, ohne Passwort-Workaround.",
  },
  {
    id: "02",
    title: "Ton, Stil und Freigaberegeln festlegen",
    text: "Sie definieren, wie Advaic formuliert und in welchen Fällen Ihr Team vor dem Versand prüfen soll.",
    stage: "Grundlage",
    outcome: "Grenzen und Sprachstil sind vor dem ersten Versand klar.",
  },
  {
    id: "03",
    title: "Autopilot für sauber prüfbare Anfragen aktivieren",
    text: "Zuerst laufen nur Anfragen automatisch, bei denen Objektbezug, Empfänger und erforderliche Angaben vollständig vorliegen. Alles andere bleibt in Ihrer Freigabe.",
    stage: "Rollout",
    outcome: "Auto startet nur in einem engen, sicheren Korridor.",
  },
  {
    id: "04",
    title: "Follow-ups mit Stop-Regeln ergänzen",
    text: "Sie steuern Nachfass-Stufen und Abstände. Sobald eine Antwort eingeht oder ein Risiko auftaucht, stoppt der Ablauf.",
    stage: "Rollout",
    outcome: "Nachfassen bleibt kontrolliert und stoppt bei echten Signalen.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="marketing-section-cool py-20 md:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <p className="section-kicker">So starten Sie</p>
            <h2 className="h2 mt-2">Erst Regeln festlegen. Dann Auto-Versand freigeben.</h2>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Sie verbinden das Postfach, legen Stil und Grenzen fest und testen zuerst mit enger Freigabegrenze.
              Erst wenn Antworten und Regeln im Alltag tragen, bekommt der Autopilot mehr Verantwortung.
            </p>
          </div>

          <article className="card-base p-5">
            <p className="label">Start</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">Vier Schritte bis zum belastbaren Betrieb</p>
            <p className="helper mt-2">
              Jeder Schritt baut auf dem vorherigen auf. So prüfen Sie Wirkung und Risiko im echten Tagesgeschäft.
            </p>
            <Link href="/so-funktionierts" className="btn-secondary mt-4 w-full justify-center">
              {MARKETING_FLOW_CTA_LABEL}
            </Link>
          </article>
        </div>

        <div className="mt-10 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7">
          <div className="hidden xl:block">
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={`rail-${step.title}`} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                    {step.id}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  {index === steps.length - 1 ? null : <div className="h-px w-4 bg-[var(--border)]" />}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 grid gap-4 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                    {index + 1}
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                    {step.stage}
                  </span>
                </div>
                <p className="label mt-5">Schritt {step.id}</p>
                <h3 className="h3 mt-2">{step.title}</h3>
                <p className="helper mt-3">{step.text}</p>
                <div className="mt-4 rounded-xl bg-white px-4 py-3 ring-1 ring-[var(--border)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Ergebnis
                  </p>
                  <p className="mt-2 text-sm text-[var(--text)]">{step.outcome}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-[rgba(11,15,23,0.03)] px-4 py-3 ring-1 ring-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Grundregel</p>
              <p className="mt-2 text-sm text-[var(--text)]">Erst Regeln und Freigaben prüfen, dann den Auto-Anteil erhöhen.</p>
            </div>
            <div className="rounded-xl bg-[rgba(11,15,23,0.03)] px-4 py-3 ring-1 ring-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Freigabe</p>
              <p className="mt-2 text-sm text-[var(--text)]">Fehlen Angaben oder steigt das Risiko, bleibt der Fall sichtbar beim Team.</p>
            </div>
            <div className="rounded-xl bg-[rgba(11,15,23,0.03)] px-4 py-3 ring-1 ring-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Qualität</p>
              <p className="mt-2 text-sm text-[var(--text)]">Vor dem Versand laufen Relevanz-, Kontext-, Ton- und Risikoprüfungen.</p>
            </div>
            <div className="rounded-xl bg-[rgba(11,15,23,0.03)] px-4 py-3 ring-1 ring-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Follow-ups</p>
              <p className="mt-2 text-sm text-[var(--text)]">Nachfass-Stufen stoppen automatisch, sobald eine Antwort eingeht oder ein Warnsignal auftaucht.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
