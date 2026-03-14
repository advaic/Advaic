import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

const evidenceStates = [
  {
    id: "inbox",
    label: "Anonymisierter Inbox-Zustand",
    title: "Eingang, Priorität und Objektbezug sind im Produkt sichtbar",
    poster: "/loops/tour-inbox.jpg",
    alt: "Anonymisierte Advaic-Inbox mit erkannten und priorisierten Nachrichten",
    details: [
      "Neue Nachrichten werden nicht pauschal gleich behandelt, sondern als Anfrage, irrelevante Nachricht oder Folgefall erkannt.",
      "Priorität, Objektbezug und Versandpfad liegen direkt im sichtbaren Arbeitszustand der Inbox.",
      "Der operative Startpunkt ist damit direkt im Produkt prüfbar.",
    ],
    proof:
      "Sie sehen, dass Advaic schon vor Auto oder Freigabe sauber trennt, welche Nachricht überhaupt in den Maklerprozess gehört.",
  },
  {
    id: "approval",
    label: "Anonymisierter Freigabe-Zustand",
    title: "Freigabe ist ein sichtbarer Prüfablauf mit klarer Reihenfolge",
    poster: "/loops/approve.jpg",
    alt: "Anonymisierte Advaic-Freigabeansicht mit Original, Vorschlag und Freigabe",
    details: [
      "Original, Vorschlag, Änderungen und Freigabe sind in einer festen Reihenfolge sichtbar.",
      "Die Freigabe entsteht aus konkreten Gründen wie fehlenden Angaben, Konfliktpotenzial oder sensiblen Inhalten.",
      "Damit bleibt nachvollziehbar, warum eine Nachricht nicht automatisch gesendet wurde.",
    ],
    proof:
      "Der kritische Punkt im System ist nicht versteckt: Sie sehen genau, wie Advaic bei unvollständigen oder riskanten Fällen stoppt und Übergabe an den Makler organisiert.",
  },
  {
    id: "checks",
    label: "Anonymisierter Check-Zustand",
    title: "Qualitätschecks laufen vor dem Versand und bleiben nachvollziehbar",
    poster: "/loops/tour-checks.jpg",
    alt: "Anonymisierte Advaic-Ansicht mit Qualitätschecks vor dem Versand",
    details: [
      "Vor dem Versand prüft Advaic Relevanz, Vollständigkeit, Ton, Risiko und Lesbarkeit.",
      "Checks laufen vor dem Senden, nicht erst nach Beschwerden oder Korrekturen im Nachhinein.",
      "Der Prüfstatus ist pro Nachricht sichtbar und konkret benannt.",
    ],
    proof:
      "So erkennen Sie im Produkt selbst, dass Auto-Versand an konkrete Vorbedingungen gebunden ist und nicht auf blindem Vertrauen basiert.",
  },
];

const productTruths = [
  {
    value: "3",
    title: "klare Entscheidungswege",
    description: "Jede Nachricht landet in genau einem Pfad: Auto senden, Freigabe oder ignorieren.",
  },
  {
    value: "6",
    title: "sichtbare Qualitätschecks",
    description: "Vor jedem Auto-Versand laufen mehrere Prüfungen, bevor die Nachricht rausgeht.",
  },
  {
    value: "2",
    title: "steuerbare Follow-up-Stufen",
    description: "Follow-ups bleiben begrenzt, planbar und stoppen automatisch, sobald eine Antwort eingeht.",
  },
  {
    value: "1",
    title: "nachvollziehbarer Verlauf je Nachricht",
    description: "Entscheidung, Freigabe und Versandpfad bleiben pro Nachricht im System sichtbar.",
  },
];

export default function TrustStats() {
  return (
    <section
      id="proof"
      className="marketing-section-clear py-20 md:py-28"
      data-tour="marketing-home-evidence"
    >
      <Container>
        <div className="max-w-[78ch]">
          <p className="section-kicker">Anonymisierte Produktzustände</p>
          <h2 className="h2">So sieht der Ablauf im echten System aus</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Direkt nach dem Mechanik-Block folgt hier der sichtbare Beleg: keine ausgedachten Kundenzahlen, sondern
            echte, anonymisierte Produktzustände aus Advaic. Sie sehen, wie Eingang, Freigabe und Qualitätsprüfung im
            aktuellen System tatsächlich aussehen.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="card-base p-5 md:p-6" data-tour="marketing-home-evidence-explainer">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Was Sie hier sehen
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                Reale Oberflächen aus dem aktuellen Produkt, nicht neu gezeichnete Mock-ups.
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                Inhalte sind anonymisiert, damit nur Systemlogik und Entscheidungswege sichtbar bleiben.
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                Die Beweiszone trennt Produktwahrheit bewusst von späteren Fallstudien oder Leistungsdaten.
              </div>
            </div>
          </article>

          <article className="card-base p-5 md:p-6" data-tour="marketing-home-evidence-summary">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Warum dieser Block wichtig ist
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
              Sie prüfen hier Systemverhalten, nicht Werbeaussagen
            </h3>
            <p className="helper mt-3">
              Wenn Sie Auto-Versand im Makleralltag bewerten, müssen Sie drei Dinge sehen können: wie Eingang erkannt
              wird, warum Freigabe greift und welche Checks vor dem Versand tatsächlich laufen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/produkt" className="btn-secondary">
                Produkt ansehen
              </Link>
              <Link href="/so-funktionierts" className="btn-secondary">
                Ablauf prüfen
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3" data-tour="marketing-home-evidence-grid">
          {evidenceStates.map((state) => (
            <article
              key={state.id}
              className="card-base overflow-hidden p-0"
              data-tour="marketing-home-evidence-screen"
            >
              <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {state.label}
                </p>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]">
                <Image
                  src={state.poster}
                  alt={state.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-top"
                />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-[var(--text)]">{state.title}</h3>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Was Sie hier sehen
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                    {state.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 rounded-2xl bg-[var(--surface)] px-4 py-4 text-sm leading-relaxed text-[var(--text)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Was das belegt
                  </p>
                  <p className="mt-2">{state.proof}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-tour="marketing-home-evidence-truth">
          {productTruths.map((item) => (
            <article key={item.title} className="card-base p-5">
              <p className="text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">{item.value}</p>
              <p className="mt-3 text-sm font-medium text-[var(--text)]">{item.title}</p>
              <p className="helper mt-2">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
