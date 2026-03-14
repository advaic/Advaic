import Container from "@/components/marketing/Container";
import TrackedLink from "@/components/marketing/TrackedLink";
import { STARTER_PUBLIC_PRICE_LABEL } from "@/lib/billing/public-pricing";
import { MARKETING_FAQ_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";

const micro = [
  "14 Tage Testphase",
  STARTER_PUBLIC_PRICE_LABEL,
  "Kündbar",
  "Autopilot pausierbar",
  "Freigabe bei fehlenden Angaben",
];

const trustNotes = [
  "Auto-Versand nur bei sauberem Objektbezug, vollständigen Angaben und prüfbarem Empfänger",
  "Freigabe bei fehlenden Informationen, no-reply-Absendern oder sensiblen Inhalten",
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
              <h2 className="h2 text-balance">Prüfen Sie 14 Tage im echten Postfach, ob Advaic zu Ihrem Prozess passt.</h2>
              <p className="body mt-4 max-w-[62ch] text-[var(--muted)]">
                Testen Sie 14 Tage im echten Postfach. Danach läuft Starter für {STARTER_PUBLIC_PRICE_LABEL} weiter,
                wenn Antworten schneller rausgehen und die Freigabe nur dort greift, wo Angaben fehlen oder der
                Versand bewusst geprüft werden muss.
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
                  {MARKETING_PRIMARY_CTA_LABEL}
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
                  {MARKETING_FAQ_CTA_LABEL}
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
