import LoopVideo from "./produkt/LoopVideo";

const proofItems = [
  {
    id: "decision",
    label: "Auto-Senden oder Freigabe",
    text: "Die sichtbare Frage im Hero: sendet Advaic oder stoppt es bewusst?",
  },
  {
    id: "why",
    label: "Warum gestoppt?",
    text: "Fehlende Angaben oder Risiko landen mit erkennbarer Ursache im Prüfpfad.",
  },
  {
    id: "checks",
    label: "Checks vor Versand",
    text: "Relevanz, Ton und Vollständigkeit werden vorher geprüft.",
  },
];

export default function HeroStillVisual() {
  return (
    <div
      className="motion-transition overflow-hidden rounded-[var(--radius)] bg-[linear-gradient(180deg,#ffffff,#fbfbfd)] p-1 ring-1 ring-[rgba(11,15,23,.08)] shadow-[0_24px_60px_rgba(15,23,42,0.10)] md:p-1.5"
      data-tour="marketing-hero-visual"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(11,15,23,.08)] px-2 pb-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f87171]" />
          <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
        </div>
        <div className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] ring-1 ring-[rgba(11,15,23,.08)]">
          Entscheidet live
        </div>
      </div>

      <div className="mt-1 space-y-2 md:mt-1.5 md:space-y-2">
        <div
          className="overflow-hidden rounded-[16px] border border-[rgba(11,15,23,.08)] bg-[var(--surface-2)] md:rounded-[18px]"
          data-tour="marketing-hero-main-shot"
        >
          <LoopVideo
            webm="/loops/product-hero.webm"
            mp4="/loops/product-hero.mp4"
            poster="/loops/product-hero.jpg"
            priority
            ariaLabel="Produktvideo mit Inbox, Freigabe und Qualitätschecks"
            className="aspect-[4/3] w-full bg-[var(--surface-2)] object-cover object-[67%_13%] scale-[1.02] sm:aspect-[16/10] sm:scale-[1.04]"
            placeholderLabel="Produktvideo"
          />
        </div>

        <div data-tour="marketing-hero-proofstrip">
          <div className="grid grid-cols-3 gap-2 md:hidden">
            {proofItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2"
              >
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {item.label}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-3">
            {proofItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[rgba(11,15,23,.08)] bg-white/92 px-3.5 py-3"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Sichtbar im Shot
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-[var(--text)]">{item.label}</h3>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
