import Link from "next/link";
import { Check } from "lucide-react";
import Container from "./Container";

type Tier = {
  name: string;
  description: string;
  bullets: string[];
  highlighted?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Starter",
    description: "Für Solo-Makler mit stabilem Anfragevolumen.",
    highlighted: true,
    bullets: [
      "1 Postfach",
      "Autopilot-Regeln inklusive",
      "Freigabe-Workflow",
      "Qualitätschecks aktiv",
      "14 Tage Testphase",
    ],
  },
  {
    name: "Team",
    description: "Für Teams mit höherem Abstimmungsbedarf.",
    bullets: [
      "Alle Starter-Funktionen",
      "Höhere Kapazitätsgrenzen",
      "Erweiterte Prozesssteuerung",
      "Onboarding für Teamabläufe",
      "Monatlich kündbar",
    ],
  },
  {
    name: "Pro",
    description: "Für Organisationen mit anspruchsvollen Anforderungen.",
    bullets: [
      "Alle Team-Funktionen",
      "Erweiterte Steuer- und Prüflogik",
      "Skalierung für hohes Volumen",
      "Begleiteter Rollout",
      "Monatlich kündbar",
    ],
  },
];

const micro = ["Kündbar", "Autopilot pausierbar", "Unklare Fälle → Freigabe"];

type PricingProps = {
  showDetailButton?: boolean;
};

export default function Pricing({ showDetailButton = true }: PricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">14 Tage kostenlos testen</h2>
          {showDetailButton ? (
            <Link href="/preise" className="btn-secondary">
              Preisdetails
            </Link>
          ) : null}
        </div>
        <p className="body mt-4 text-[var(--muted)]">
          Danach monatlich. Transparent und jederzeit kündbar.
        </p>
        <p className="helper mt-2">
          Konkrete Funktions- und Kapazitätsgrenzen werden je Plan im Checkout und Onboarding klar ausgewiesen.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="card-base card-hover overflow-hidden p-6">
              {tier.highlighted ? (
                <div className="-mx-6 -mt-6 mb-5 h-1 bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]" />
              ) : null}
              <h3 className="h3">{tier.name}</h3>
              <p className="helper mt-3">{tier.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {tier.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary mt-6 w-full">
                Kostenlos testen
              </Link>
            </article>
          ))}
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
