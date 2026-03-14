import Link from "next/link";
import { Check } from "lucide-react";
import Container from "./Container";
import { MARKETING_FAQ_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";
import {
  STARTER_PUBLIC_BILLING_CYCLE_LABEL,
  STARTER_PUBLIC_PRICE_EUR,
  STARTER_PUBLIC_PRICE_LABEL,
  STARTER_PUBLIC_TRIAL_AND_PRICE_LABEL,
} from "@/lib/billing/public-pricing";

const starterBullets = [
  "14 Tage im echten Postfach testen",
  `Danach ${STARTER_PUBLIC_PRICE_LABEL}`,
  "Regeln für Auto senden, Zur Freigabe und Ignorieren",
  "Freigabe-Inbox bei fehlenden Angaben, no-reply-Absendern oder sensiblen Inhalten",
  "Qualitätschecks vor jedem Auto-Versand",
  "Follow-ups mit Stop-Regeln und Pausenlogik",
];

const starterFit = [
  "Sie erhalten regelmäßig wiederkehrende Interessenten-Anfragen",
  "Sie möchten Erstantworten beschleunigen, ohne Nachrichten mit fehlenden Angaben, Konflikten oder sensiblen Inhalten automatisch laufen zu lassen",
  "Sie sind bereit, Regeln und Freigaben im Alltag aktiv zu prüfen",
];

const starterNotIdeal = [
  "Sie erhalten nur wenige Anfragen pro Woche",
  "Jede Antwort muss vollständig individuell und ohne feste Regeln entstehen",
  "Sie möchten aktuell keinerlei Teilautomatisierung zulassen",
];

const micro = [
  "14 Tage im echten Postfach",
  STARTER_PUBLIC_PRICE_LABEL,
  "Kündbar",
  "Autopilot pausierbar",
  "Freigabe bei fehlenden Angaben",
];

type PricingProps = {
  showDetailButton?: boolean;
};

export default function Pricing({ showDetailButton = true }: PricingProps) {
  return (
    <section id="pricing" className="marketing-section-warm py-20 md:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div>
            <p className="section-kicker">Testphase & Starter</p>
            <h2 className="h2 mt-2">14 Tage testen. Danach {STARTER_PUBLIC_PRICE_LABEL}.</h2>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Ein öffentlicher Plan, keine künstlichen Stufen: Sie prüfen im echten Postfach, ob
              Antwortzeit, Freigabe und Regelwerk für Ihr Team tragen. Erst dann läuft Starter
              weiter.
            </p>
          </div>

          <article className="card-base p-5">
            <p className="label">Öffentlicher Einstieg</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">Preis, Testphase, Kündbarkeit</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              {STARTER_PUBLIC_PRICE_EUR} €
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{STARTER_PUBLIC_BILLING_CYCLE_LABEL} nach 14 Tagen Testphase</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>14 Tage ohne langfristige Bindung testen</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>Danach läuft genau ein Starter-Plan für {STARTER_PUBLIC_PRICE_LABEL}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>Freigabe, Regeln und Pausen bleiben jederzeit steuerbar</span>
              </li>
            </ul>
            {showDetailButton ? (
              <Link href="/preise" className="btn-secondary mt-4 w-full justify-center">
                Preise ansehen
              </Link>
            ) : null}
          </article>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="card-base card-hover overflow-hidden p-6 lg:col-span-2">
            <div className="-mx-6 -mt-6 mb-5 h-1 bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]" />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="h3">Starter</h3>
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                {STARTER_PUBLIC_TRIAL_AND_PRICE_LABEL}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1" data-tour="marketing-pricing-price">
              <p className="text-5xl font-semibold tracking-[-0.05em] text-[var(--text)]">{STARTER_PUBLIC_PRICE_EUR} €</p>
              <div className="pb-1">
                <p className="text-sm font-semibold text-[var(--text)]">{STARTER_PUBLIC_BILLING_CYCLE_LABEL}</p>
                <p className="text-sm text-[var(--muted)]">nach 14 Tagen Testphase im echten Postfach</p>
              </div>
            </div>
            <p className="helper mt-3">
              Für Makler, die regelmäßig wiederkehrende Anfragen im Postfach haben und die erste Antwort
              beschleunigen wollen, ohne kritische Fälle aus der Hand zu geben.
            </p>
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
                {MARKETING_PRIMARY_CTA_LABEL}
              </Link>
              <Link href="/faq" className="btn-secondary">
                {MARKETING_FAQ_CTA_LABEL}
              </Link>
            </div>
          </article>

          <div className="space-y-4">
            <article className="card-base card-hover p-6">
              <h3 className="text-base font-semibold text-[var(--text)]">Starter passt gut, wenn</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {starterFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base card-hover p-6">
              <h3 className="text-base font-semibold text-[var(--text)]">Sie sollten noch warten, wenn</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {starterNotIdeal.map((item) => (
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
              className="rounded-full border border-[var(--gold-soft)] bg-white/90 px-3 py-1 text-xs text-[var(--muted)]"
            >
              {item}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
