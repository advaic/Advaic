import Container from "./Container";
import LoopVideo from "./produkt/LoopVideo";

const visualItems = [
  {
    id: "regeln",
    title: "Greift Auto oder Freigabe?",
    label: "Schlüsselfrage",
    text: "Dieser Shot zeigt die sichtbare Versandentscheidung im echten Ablauf.",
    webm: "/loops/tour-rules.webm",
    mp4: "/loops/tour-rules.mp4",
    poster: "/loops/tour-rules.jpg",
    aria: "Visualisierung der Entscheidungsregeln im Dashboard",
  },
  {
    id: "eingang",
    title: "Wird Eingang sauber sortiert?",
    label: "Frage 2",
    text: "Anfrage, irrelevante Nachricht und Folgefall landen nicht im selben Pfad.",
    webm: "/loops/tour-inbox.webm",
    mp4: "/loops/tour-inbox.mp4",
    poster: "/loops/tour-inbox.jpg",
    aria: "Visualisierung der Erkennungslogik für eingehende E-Mails",
  },
  {
    id: "qualitaet",
    title: "Greifen Checks vor dem Versand?",
    label: "Frage 3",
    text: "Ton, Vollständigkeit und Risiko werden vor dem Senden geprüft.",
    webm: "/loops/tour-checks.webm",
    mp4: "/loops/tour-checks.mp4",
    poster: "/loops/tour-checks.jpg",
    aria: "Visualisierung der Qualitätschecks vor Versand",
  },
];

type ProductVisualAuthorityProps = {
  id?: string;
  title?: string;
  description?: string;
};

export default function ProductVisualAuthority({
  id = "produkt-visuals",
  title = "Drei Bilder, drei prüfbare Produktfragen",
  description = "Erst Versandentscheidung, dann Eingangslogik, dann Checks vor Versand.",
}: ProductVisualAuthorityProps) {
  const [mainVisual, ...supportVisuals] = visualItems;

  return (
    <section
      id={id}
      className="marketing-section-clear pt-8 pb-20 md:pt-10 md:pb-24"
      data-tour="marketing-proof-block"
    >
      <Container>
        <div className="max-w-[60ch]">
          <p className="section-kicker">Produktbeweis</p>
          <h2 className="h3 mt-2">{title}</h2>
          <p className="helper mt-3 text-[var(--muted)]">{description}</p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_300px]">
          <article
            className="card-base overflow-hidden p-0"
            data-tour="marketing-proof-main"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(11,15,23,.08)] px-4 py-3.5 md:px-5 md:py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Hauptbeweis
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">
                  Versandentscheidung sichtbar statt behauptet
                </h3>
              </div>
              <div className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Eine Frage pro Bild
              </div>
            </div>

            <div className="p-4 md:p-5" data-tour="marketing-proof-visuals">
              <div className="overflow-hidden rounded-[26px] border border-[rgba(11,15,23,.08)] bg-white">
                <div className="overflow-hidden border-b border-[rgba(11,15,23,.08)] bg-[var(--surface-2)]">
                  <LoopVideo
                    webm={mainVisual.webm}
                    mp4={mainVisual.mp4}
                    poster={mainVisual.poster}
                    className="aspect-[15/9] w-full bg-[var(--surface-2)] object-cover object-[69%_15%] scale-[1.02] md:scale-[1.05]"
                    ariaLabel={mainVisual.aria}
                    placeholderLabel={mainVisual.title}
                  />
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_250px] md:p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        {mainVisual.label}
                      </span>
                      <span className="rounded-full border border-[var(--gold-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                        Schlüsselsignal
                      </span>
                    </div>
                    <h3 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.02em] text-[var(--text)] md:text-[1.5rem]">
                      {mainVisual.title}
                    </h3>
                    <p className="mt-2 max-w-[54ch] text-sm leading-6 text-[var(--muted)] md:text-[0.98rem]">
                      {mainVisual.text}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgba(11,15,23,.08)] bg-[var(--surface-2)] px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Dieses Bild beantwortet
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                      Ist sofort sichtbar, ob Advaic sendet, stoppt oder bewusst in die Freigabe übergibt?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4" data-tour="marketing-proof-mechanisms">
            {supportVisuals.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[rgba(11,15,23,.08)] bg-white"
                data-tour="marketing-proof-step"
              >
                <div className="overflow-hidden border-b border-[rgba(11,15,23,.08)] bg-[var(--surface-2)]">
                  <LoopVideo
                    webm={item.webm}
                    mp4={item.mp4}
                    poster={item.poster}
                    className={`aspect-[16/9] w-full bg-[var(--surface-2)] object-cover ${
                      item.id === "eingang"
                        ? "object-[45%_9%] scale-[1.02]"
                        : "object-[69%_15%] scale-[1.04]"
                    }`}
                    ariaLabel={item.aria}
                    placeholderLabel={item.title}
                  />
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {item.label}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[var(--text)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </aside>
        </div>
      </Container>
    </section>
  );
}
