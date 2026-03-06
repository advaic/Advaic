import { ArrowRight } from "lucide-react";
import Container from "./Container";
import TrackedLink from "./TrackedLink";

const micro = ["14 Tage Testphase", "Danach Starter", "Kündbar", "Autopilot pausierbar", "Unklare Fälle → Freigabe"];
const trustNotes = [
  "Auto nur bei klaren Standardfällen",
  "Unsicherheit geht zur Freigabe",
  "Qualitätschecks vor jedem Versand",
  "Verlauf mit Status und Zeitstempel",
];

export default function FinalCTA() {
  return (
    <section id="cta" className="marketing-soft-warm py-20 md:py-28">
      <Container>
        <div className="card-base relative overflow-hidden p-8 md:p-12">
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(11,15,23,0),rgba(201,162,39,0.6),rgba(11,15,23,0))]" />
          <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-[var(--gold-soft)] blur-3xl" aria-hidden />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <h2 className="h2 text-balance">Weniger Postfachzeit. Mehr Zeit für Besichtigung und Abschluss.</h2>
              <p className="body mt-4 max-w-[62ch] text-[var(--muted)]">
                Testen Sie Advaic 14 Tage kostenlos. Sie starten konservativ mit Guardrails und erhöhen den Auto-Anteil
                nur bei stabiler Qualität.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/signup"
                  className="btn-primary"
                  event="marketing_final_cta_primary_click"
                  source="website"
                  pageGroup="marketing"
                  section="final-cta"
                  meta={{ section: "final-cta" }}
                >
                  14 Tage kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </TrackedLink>
                <TrackedLink
                  href="/faq"
                  className="btn-secondary"
                  event="marketing_final_cta_secondary_click"
                  source="website"
                  pageGroup="marketing"
                  section="final-cta"
                  meta={{ section: "final-cta" }}
                >
                  Fragen stellen
                </TrackedLink>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {micro.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="helper mt-3">
                Jede Entscheidung bleibt nachvollziehbar: Eingang, Entscheidung, Qualitätsprüfung und Versand.
              </p>
            </div>

            <article className="rounded-[var(--radius)] bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Sicherheitsnetz im Starter
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {trustNotes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
