import Container from "@/components/marketing/Container";
import Link from "next/link";

type SystemCard = {
  title: string;
  body: string;
  facts: string[];
  spanClassName: string;
  href?: string;
  ctaLabel?: string;
};

const systemCards: SystemCard[] = [
  {
    title: "Immobilien & Datenbasis",
    body: "Objekte werden angelegt, gepflegt und auf Startklarheit geprüft. Preise, Bilder, Links und Kernangaben bestimmen, wie sicher Anfragen zugeordnet und beantwortet werden.",
    facts: ["Objekte anlegen und bearbeiten", "Startklarheit und Objektbezug sichtbar"],
    spanClassName: "xl:col-span-3",
  },
  {
    title: "Nachrichten, Freigabe & Eskalationen",
    body: "Ihr Team arbeitet mit Auto-Senden, Inbox, Konversation, Freigabe und Eskalationen. Gründe, Status und Verlauf bleiben dabei im selben Arbeitsfluss sichtbar.",
    facts: ["Inbox, Freigabe und Sonderfälle", "Entscheidungen bleiben nachvollziehbar"],
    spanClassName: "xl:col-span-3",
    href: "/freigabe-inbox",
    ctaLabel: "Freigabe im Detail",
  },
  {
    title: "Follow-ups pro Objekt und global",
    body: "Nachfasslogik wird nicht pauschal gefahren. Stufen, Abstände und Zeitfenster lassen sich global steuern und bei Bedarf pro Immobilie enger setzen.",
    facts: ["Globale Follow-up-Settings", "Objektbezogene Ausnahmen möglich"],
    spanClassName: "xl:col-span-2",
    href: "/follow-up-logik",
    ctaLabel: "Follow-up-Logik",
  },
  {
    title: "Ton, Vorlagen & Regeln",
    body: "Vorlagen, Ton und Stil sowie Freigabegrenzen werden zentral gepflegt. So entsteht ein konsistenter Antwortkorridor statt neuer Prompt-Arbeit pro Fall.",
    facts: ["Antwortvorlagen und Stilregeln", "Regelkorridore zentral gepflegt"],
    spanClassName: "xl:col-span-2",
  },
  {
    title: "Integrationen, Benachrichtigungen & Konto",
    body: "Gmail oder Microsoft 365, Zeitfenster, Benachrichtigungen und operative Verknüpfungen gehören zum laufenden Betrieb dazu und sitzen nicht außerhalb des Produkts.",
    facts: ["Postfach, Alerts und Zeitfenster", "Sicherheits- und Kontologik im Betrieb"],
    spanClassName: "xl:col-span-2",
    href: "/integrationen",
    ctaLabel: "Integrationen ansehen",
  },
];

const systemPills = [
  "Objekte",
  "Nachrichten",
  "Freigabe",
  "Eskalationen",
  "Follow-ups",
  "Vorlagen",
  "Ton & Stil",
  "Integrationen",
  "Benachrichtigungen",
];

export default function SystemOverview() {
  return (
    <section id="system" className="py-20 md:py-28" data-tour="produkt-system-overview">
      <Container>
        <div className="max-w-[72ch]">
          <p className="section-kicker">Hinter dem Antwortfluss</p>
          <h2 className="h2 mt-2">Was Ihr Team im Produkt zusätzlich steuert</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Advaic antwortet nicht aus dem Nichts. Der sichtbare Anfragefluss arbeitet auf Objekt-, Regel-, Follow-up-
            und Integrationsdaten, die Ihr Team im selben System pflegt.
          </p>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-6">
          {systemCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] ${card.spanClassName}`}
              data-tour="produkt-system-card"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Im Produkt sichtbar
              </p>
              <h3 className="h3 mt-3">{card.title}</h3>
              <p className="body mt-3 text-[var(--muted)]">{card.body}</p>

              <div className="mt-4 space-y-2">
                {card.facts.map((fact) => (
                  <div
                    key={fact}
                    className="rounded-full bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] ring-1 ring-[var(--border)]"
                  >
                    {fact}
                  </div>
                ))}
              </div>

              {card.href && card.ctaLabel ? (
                <Link
                  href={card.href}
                  className="btn-secondary mt-5 inline-flex !min-h-10 !px-3 !py-2 text-sm"
                  data-tour="produkt-system-detail-link"
                >
                  {card.ctaLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Systemumfang im Betrieb
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Für den Verkauf steht auf der Startseite bewusst der Antwortfluss im Vordergrund. Im tatsächlichen
            Produkt arbeiten Objekte, Freigabe, Eskalationen, Follow-ups, Vorlagen, Stil und Integrationen zusammen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" data-tour="produkt-system-pills">
            {systemPills.map((pill) => (
              <span
                key={pill}
                className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] ring-1 ring-[var(--border)]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
