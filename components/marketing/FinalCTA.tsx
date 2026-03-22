import { ArrowRight } from "lucide-react";
import Container from "./Container";
import TrackedLink from "./TrackedLink";
import { STARTER_PUBLIC_PRICE_LABEL } from "@/lib/billing/public-pricing";
import { MARKETING_FAQ_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

const micro = [
  "14 Tage Testphase",
  STARTER_PUBLIC_PRICE_LABEL,
  "Kündbar",
  "Autopilot pausierbar",
  "Freigabe bei fehlenden Angaben",
];
const trustNotes = [
  "Auto-Senden nur bei sauberem Objektbezug und vollständigen Angaben",
  "Freigabe bei fehlenden Informationen, Risiko oder no-reply-Absendern",
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
              <h2 className="h2 text-balance">Prüfen Sie 14 Tage im echten Postfach, ob Advaic für Ihr Team passt.</h2>
              <p className="body mt-4 max-w-[62ch] text-[var(--muted)]">
                Testen Sie Advaic 14 Tage im echten Postfach. Danach läuft Starter für {STARTER_PUBLIC_PRICE_LABEL}
                weiter. Sie starten mit enger Freigabegrenze und geben Auto-Senden nur dort frei, wo Angaben,
                Empfänger und Inhalt sauber prüfbar sind.
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
                  {MARKETING_PRIMARY_CTA_LABEL}
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
