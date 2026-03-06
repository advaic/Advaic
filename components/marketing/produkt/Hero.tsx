import { PauseCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import Container from "@/components/marketing/Container";
import TrackedLink from "@/components/marketing/TrackedLink";
import PremiumVideoFrame from "./PremiumVideoFrame";

const trustChips = [
  {
    text: "Autopilot jederzeit pausierbar",
    Icon: PauseCircle,
  },
  {
    text: "Unklar → Freigabe",
    Icon: TriangleAlert,
  },
  {
    text: "Qualitätschecks vor Auto-Versand",
    Icon: ShieldCheck,
  },
  {
    text: "DSGVO-konforme Verarbeitung",
    Icon: ShieldCheck,
  },
];

const trialOutcomes = [
  "Sie wissen exakt, wann Advaic automatisch sendet und wann bewusst gestoppt wird.",
  "Sie sehen, wie Qualitätschecks vor jedem Auto-Versand greifen.",
  "Sie behalten die finale Kontrolle über unklare oder heikle Fälle.",
];

const quickAnchors = [
  { href: "#ablauf", label: "Praxisablauf" },
  { href: "#regeln", label: "Regellogik" },
  { href: "#setup", label: "Setup" },
  { href: "#followups", label: "Follow-ups" },
];

export default function Hero() {
  return (
    <section id="top" className="py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12 lg:items-center">
          <div className="col-span-12 lg:col-span-5">
            <p className="label">Produkt</p>
            <h1 className="h1 mt-4 max-w-[17ch]">Autopilot für Interessenten-Anfragen per E-Mail</h1>
            <p className="body-lg mt-6 max-w-[62ch] text-[var(--muted)]">
              Advaic beantwortet Anfragen automatisch in Ihrem Stil, damit Sie weniger Zeit im Postfach verbringen.
              Wenn etwas unklar ist, geht es zur Freigabe. Vor jedem automatischen Versand laufen
              Qualitätskontrollen, bei Freigaben entscheiden Sie final.
            </p>
            <ul className="mt-6 space-y-2">
              {trialOutcomes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/signup"
                className="btn-primary"
                event="marketing_produkt_hero_primary_click"
                source="website"
                pageGroup="produkt"
                section="produkt-hero"
                meta={{ section: "produkt-hero" }}
              >
                14 Tage kostenlos testen
              </TrackedLink>
              <a href="#ablauf" className="btn-secondary">
                Video ansehen
              </a>
            </div>

            <p className="helper mt-3">
              Danach läuft Starter monatlich weiter. Jederzeit kündbar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickAnchors.map((anchor) => (
                <a key={anchor.href} href={anchor.href} className="btn-secondary !min-h-9 !px-3 !py-2 !text-xs">
                  {anchor.label}
                </a>
              ))}
            </div>

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {trustChips.map((chip) => (
                <div
                  key={chip.text}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]"
                >
                  <chip.Icon className="h-4 w-4 text-[var(--gold)]" />
                  <span>{chip.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <PremiumVideoFrame
              label="Produkt"
              webm="/loops/product-hero.webm"
              mp4="/loops/product-hero.mp4"
              poster="/loops/product-hero.jpg"
              priority
              ariaLabel="Produktvideo: Eingang, Entscheidung und Versand"
              caption="Eingang → Entscheidung → Versand. Voll sichtbar im Verlauf."
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
