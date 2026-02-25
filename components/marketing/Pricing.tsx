import Link from "next/link";
import { Check } from "lucide-react";
import Container from "./Container";

const starterBullets = [
  "14 Tage Testphase ohne langfristige Bindung",
  "Danach Starter mit monatlicher Abrechnung",
  "Autopilot-Regeln mit Guardrails",
  "Freigabe-Inbox für unklare Fälle",
  "Qualitätschecks vor jedem Auto-Versand",
  "Kontrollierte Follow-up-Stufen mit Stop-Logik",
];

const todayIncluded = [
  "Für Solo-Makler und kleine Teams",
  "Für Miet- und mittelpreisige Objekte",
  "Konservativer Start mit mehr Freigaben möglich",
];

const futureModel = [
  "Aktuell gibt es bewusst nur Starter.",
  "Weitere Pakete folgen später feature-basiert.",
  "Keine künstlichen Limit-Stufen als Verkaufsdruck.",
];

const micro = [
  "14 Tage Testphase",
  "Danach Starter",
  "Kündbar",
  "Autopilot pausierbar",
  "Unklare Fälle → Freigabe",
];

type PricingProps = {
  showDetailButton?: boolean;
};

export default function Pricing({ showDetailButton = true }: PricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">Ein klarer Einstieg statt Plan-Wirrwarr</h2>
          {showDetailButton ? (
            <Link href="/preise" className="btn-secondary">
              Preisdetails
            </Link>
          ) : null}
        </div>
        <p className="body mt-4 text-[var(--muted)]">
          Sie starten mit 14 Tagen Testphase. Danach läuft ein Starter-Abo monatlich weiter, jederzeit kündbar.
        </p>
        <p className="helper mt-2">
          Aktuell ist Starter der einzige öffentliche Plan. Das macht die Entscheidung einfach und transparent.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="card-base card-hover overflow-hidden p-6 lg:col-span-2">
            <div className="-mx-6 -mt-6 mb-5 h-1 bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]" />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="h3">Starter</h3>
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                Testphase → Starter
              </span>
            </div>
            <p className="helper mt-3">Für Makler, die schnell produktiv werden wollen, ohne Risiko im Versand.</p>
            <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {starterBullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary">
                14 Tage kostenlos starten
              </Link>
              <Link href="/faq" className="btn-secondary">
                Fragen klären
              </Link>
            </div>
          </article>

          <div className="space-y-4">
            <article className="card-base card-hover p-6">
              <h3 className="text-base font-semibold text-[var(--text)]">Heute enthalten</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {todayIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base card-hover p-6">
              <h3 className="text-base font-semibold text-[var(--text)]">Paket-Logik</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {futureModel.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
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
      </Container>
    </section>
  );
}
