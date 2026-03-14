import Container from "@/components/marketing/Container";
import Link from "next/link";
import ProductStillFrame from "./ProductStillFrame";

const inboxItems = [
  {
    subject: "Objektbezug unklar",
    note: "Der Eingang braucht Rückfrage oder Freigabe, bevor etwas versendet wird.",
  },
  {
    subject: "Beschwerde zur letzten Besichtigung",
    note: "Konfliktfälle stoppen Automatik und bleiben bewusst beim Team.",
  },
  {
    subject: "Sonderwunsch zur Unterlagenprüfung",
    note: "Sonderfälle mit zusätzlichem Klärungsbedarf bleiben nicht im Autopilot hängen.",
  },
];

export default function ApprovalInbox() {
  return (
    <section id="freigabe" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <p className="section-kicker">Schritt 3 von 5</p>
          <h2 className="h2 mt-2">Wenn Auto stoppt, landet der Fall sauber bei Ihnen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Alles, was nicht eindeutig ist, wird mit Grund in die Freigabe geschoben. Dort entscheiden Sie sichtbar und geordnet.
          </p>
          <div className="mt-4">
            <Link href="/freigabe-inbox" className="btn-secondary">
              Freigabe-Inbox im Detail
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" data-tour="produkt-approval-visual">
          <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
              Typische Gründe für Freigabe
            </span>
            <ul className="mt-4 space-y-3">
              {inboxItems.map((item) => (
                <li
                  key={item.subject}
                  className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{item.subject}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.note}</p>
                </li>
              ))}
            </ul>
            <p className="helper mt-4">
              Freigabe ist damit kein schwarzes Loch, sondern ein sichtbarer Prüfpfad mit klaren Gründen.
            </p>
          </article>

          <div className="space-y-4">
            <article
              className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7"
              data-tour="produkt-approval-main-shot"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                  Prüf-Reihenfolge
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Original bis Entscheidung
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    step: "1",
                    title: "Original lesen",
                    text: "Zuerst prüfen Sie, was wirklich eingegangen ist, bevor der Vorschlag bewertet wird.",
                  },
                  {
                    step: "2",
                    title: "Vorschlag prüfen",
                    text: "Dann bewerten Sie Inhalt, Ton und Vollständigkeit des Antwortvorschlags.",
                  },
                  {
                    step: "3",
                    title: "Änderungen sehen",
                    text: "Abweichungen und Begründungen bleiben sichtbar statt in einem Editor zu verschwinden.",
                  },
                  {
                    step: "4",
                    title: "Entscheidung treffen",
                    text: "Erst danach wird gesendet, angepasst oder bewusst gestoppt.",
                  },
                ].map((item) => (
                  <article
                    key={item.step}
                    className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                        {item.step}
                      </span>
                      <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>
            <ProductStillFrame
              label="Entscheidung"
              src="/marketing-screenshots/core/raw/approval-decision.png"
              alt="Freigabeansicht mit separater Entscheidungsfläche"
              caption="Senden, Bearbeiten und Ablehnen bleiben als eigene Entscheidung sichtbar getrennt."
              aspectClassName="aspect-[11/13] md:aspect-[4/3]"
              imageClassName="object-contain object-center bg-white p-3 md:p-4"
              frameTour="produkt-approval-secondary-frame"
              stageTour="produkt-approval-secondary-shot"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
