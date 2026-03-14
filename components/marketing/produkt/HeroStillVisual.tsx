import PremiumVideoFrame from "./PremiumVideoFrame";

const proofCards = [
  {
    title: "Eingang sortiert",
    text: "Freigaben und aktive Fälle sind im Hero sofort erkennbar.",
  },
  {
    title: "Freigabe mit Ursache",
    text: "Der Grund für die Freigabe bleibt direkt im Shot sichtbar.",
  },
  {
    title: "Checks vor Versand",
    text: "Relevanz, Vollständigkeit und Ton werden vor dem Versand geprüft.",
  },
];

export default function HeroStillVisual() {
  return (
    <div className="space-y-2.5 md:space-y-4" data-tour="produkt-hero-visual">
      <div data-tour="produkt-hero-main-shot">
        <PremiumVideoFrame
          label="Produktsignal"
          webm="/loops/product-hero.webm"
          mp4="/loops/product-hero.mp4"
          poster="/loops/product-hero.jpg"
          priority
          ariaLabel="Produktvideo mit Inbox, Freigabe und Qualitätschecks"
          caption="Dieser Shot beantwortet eine Frage: sendet Advaic oder stoppt es bewusst?"
          captionClassName="hidden md:block"
          mediaClassName="aspect-[4/3] object-[69%_14%] scale-[1.08] sm:aspect-video sm:scale-[1.1]"
          className="shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
        />
      </div>

      <div data-tour="produkt-hero-proofcards">
        <div className="grid grid-cols-3 gap-2 md:hidden">
          {proofCards.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-white px-2.5 py-2 shadow-[var(--shadow-sm)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {item.title}
              </div>
            </article>
          ))}
        </div>

        <div className="hidden gap-3 md:grid md:grid-cols-3">
          {proofCards.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[rgba(11,15,23,.08)] bg-white/94 px-3.5 py-3 shadow-[var(--shadow-sm)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Was dieser Shot zeigt
              </div>
              <h3 className="mt-1.5 text-sm font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-5 text-[var(--muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
