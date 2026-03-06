import Container from "@/components/marketing/Container";
import TrackedLink from "@/components/marketing/TrackedLink";

const micro = [
  "14 Tage Testphase",
  "Danach Starter",
  "Kündbar",
  "Autopilot pausierbar",
  "Unklar → Freigabe",
];

const trustNotes = [
  "Auto-Versand nur bei klarer Standardsituation",
  "Unklare oder heikle Fälle landen in Ihrer Freigabe",
  "Qualitätschecks laufen vor jedem Auto-Versand",
  "Verlauf zeigt Eingang, Entscheidung und Versand",
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
              <h2 className="h2 text-balance">Testen Sie Advaic 14 Tage kostenlos</h2>
              <p className="body mt-4 max-w-[62ch] text-[var(--muted)]">
                Weniger Postfach, klarere Antworten und verlässliche Freigabelogik. Danach läuft Starter monatlich
                weiter.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/signup"
                  className="btn-primary"
                  event="marketing_produkt_final_primary_click"
                  source="website"
                  pageGroup="produkt"
                  section="produkt-final-cta"
                  meta={{ section: "produkt-final-cta" }}
                >
                  14 Tage kostenlos starten
                </TrackedLink>
                <TrackedLink
                  href="/produkt#faq"
                  className="btn-secondary"
                  event="marketing_produkt_final_secondary_click"
                  source="website"
                  pageGroup="produkt"
                  section="produkt-final-cta"
                  meta={{ section: "produkt-final-cta" }}
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
