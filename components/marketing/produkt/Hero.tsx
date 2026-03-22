import Container from "@/components/marketing/Container";
import TrackedLink from "@/components/marketing/TrackedLink";
import { MARKETING_FLOW_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import HeroStillVisual from "./HeroStillVisual";

const trustChips = [
  {
    mobile: "Versandpfad sichtbar",
    desktop: "Versandpfad pro Nachricht sichtbar",
    tag: "Pfad",
  },
  {
    mobile: "Freigabe begründet",
    desktop: "Freigabegründe bleiben sichtbar",
    tag: "Grund",
  },
  {
    mobile: "Checks vor Versand",
    desktop: "Checks greifen vor dem Versand",
    tag: "Checks",
  },
  {
    mobile: "Safe-Start steuerbar",
    desktop: "Safe-Start bleibt steuerbar",
    tag: "Start",
  },
];

const quickAnchors = [
  { href: "#ablauf", step: "1", label: "Ablauf sehen" },
  { href: "#regeln", step: "2", label: "Regeln prüfen" },
  { href: "#freigabe", step: "3", label: "Freigabe sehen" },
  { href: "#qualitaet", step: "4", label: "Checks prüfen" },
  { href: "#setup", step: "5", label: "Go-live planen" },
];

export default function Hero() {
  return (
    <section id="top" className="py-12 sm:py-14 md:py-28" data-tour="produkt-hero">
      <Container>
        <div className="grid grid-cols-12 gap-6 md:gap-12 lg:items-center">
          <div className="col-span-12 lg:col-span-5">
            <p className="label">Produkt</p>
            <h1 className="h1 mt-3 max-w-[12ch] md:mt-4 md:max-w-[15ch]">
              So entscheidet Advaic im echten Ablauf.
            </h1>
            <p className="body-lg mt-4 max-w-[56ch] text-[var(--muted)] md:mt-6">
              <span className="md:hidden">
                Sie sehen, wann Auto-Senden greift, wann Freigabe übernimmt und welche Checks vor dem Versand laufen.
              </span>
              <span className="hidden md:inline">
                Diese Seite zeigt Eingang, Regelprüfung, Qualitätschecks, Freigabe und Versand im echten Ablauf. Sie
                sehen, wann Auto-Senden greift und an welchen Stellen Ihr Team bewusst übernimmt.
              </span>
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7 lg:row-span-2">
            <HeroStillVisual />
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="mt-1 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <TrackedLink
                href="/signup"
                className="btn-primary"
                event="marketing_produkt_hero_primary_click"
                source="website"
                pageGroup="produkt"
                section="produkt-hero"
                meta={{ section: "produkt-hero" }}
                data-tour="produkt-hero-primary-cta"
              >
                {MARKETING_PRIMARY_CTA_LABEL}
              </TrackedLink>
              <a href="#ablauf" className="btn-secondary">
                {MARKETING_FLOW_CTA_LABEL}
              </a>
            </div>

            <p className="helper mt-3 max-w-[44ch]">
              14 Tage im echten Postfach testen und danach anhand von Qualität, Freigaben und Antwortzeit entscheiden.
            </p>

            <article className="mt-5 rounded-[26px] border border-[rgba(11,15,23,.08)] bg-white/95 p-4 shadow-[var(--shadow-sm)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Diese Tour führt Sie durch 5 Stationen
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  Erst den Ablauf sehen, dann Regeln, Freigabe, Checks und Go-live prüfen.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3" data-tour="produkt-hero-quickanchors">
                {quickAnchors.map((anchor) => (
                  <a
                    key={anchor.href}
                    href={anchor.href}
                    className="btn-secondary !min-h-11 !justify-start !px-3 !py-2 !text-left !text-xs"
                  >
                    <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[10px] font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                      {anchor.step}
                    </span>
                    {anchor.label}
                  </a>
                ))}
              </div>
            </article>

            <div className="mt-4 grid grid-cols-2 gap-2" data-tour="produkt-hero-trustchips">
              {trustChips.map((chip) => (
                <div
                  key={chip.desktop}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[13px] text-[var(--muted)] ring-1 ring-[var(--border)] md:text-sm"
                >
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--surface-2)] px-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--gold)] ring-1 ring-[var(--gold-soft)]">
                    {chip.tag}
                  </span>
                  <span className="md:hidden">{chip.mobile}</span>
                  <span className="hidden md:inline">{chip.desktop}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
