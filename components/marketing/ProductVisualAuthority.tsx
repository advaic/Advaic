import Container from "./Container";
import LoopVideo from "./produkt/LoopVideo";

const visualItems = [
  {
    id: "eingang",
    title: "Eingang und Erkennung",
    text: "Neue E-Mails werden erkannt, klassifiziert und sauber von Nicht-Anfragen getrennt.",
    webm: "/loops/tour-inbox.webm",
    mp4: "/loops/tour-inbox.mp4",
    poster: "/loops/tour-inbox.jpg",
    aria: "Visualisierung der Erkennungslogik für eingehende E-Mails",
  },
  {
    id: "regeln",
    title: "Regeln und Entscheidung",
    text: "Die Policy entscheidet zwischen Auto senden, Freigabe und Ignorieren mit klarer Begründung.",
    webm: "/loops/tour-rules.webm",
    mp4: "/loops/tour-rules.mp4",
    poster: "/loops/tour-rules.jpg",
    aria: "Visualisierung der Entscheidungsregeln im Dashboard",
  },
  {
    id: "qualitaet",
    title: "Qualität und Verlauf",
    text: "Vor dem Versand laufen Qualitätschecks. Ergebnis und Status bleiben jederzeit nachvollziehbar.",
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
  title = "Produktlogik sichtbar statt behauptet",
  description = "Jeder Kern-Claim wird im Produktfluss sichtbar: Erkennung, Entscheidung und Qualitätsprüfung.",
}: ProductVisualAuthorityProps) {
  return (
    <section id={id} className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[72ch]">
          <h2 className="h2">{title}</h2>
          <p className="body mt-4 text-[var(--muted)]">{description}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visualItems.map((item) => (
            <article key={item.id} className="card-base overflow-hidden p-0">
              <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
              <div className="p-4">
                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                  <LoopVideo
                    webm={item.webm}
                    mp4={item.mp4}
                    poster={item.poster}
                    className="aspect-video w-full bg-[var(--surface-2)] object-contain"
                    ariaLabel={item.aria}
                    placeholderLabel={item.title}
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
