import Link from "next/link";
import Container from "./Container";

const intents = [
  {
    title: "Best AI Tools für Immobilienmakler",
    text: "Vergleichsrahmen für Makler: wann CRM, Inbox-Tools oder spezialisierte Antwortautomatisierung sinnvoll ist.",
    href: "/best-ai-tools-immobilienmakler",
  },
  {
    title: "KI für Immobilienmakler",
    text: "Praxisleitfaden für sicheren KI-Einsatz im Makleralltag mit klaren Guardrails.",
    href: "/ki-fuer-immobilienmakler",
  },
  {
    title: "Best Software für Immobilienanfragen",
    text: "Kaufleitfaden mit Kriterien für Sicherheit, Geschwindigkeit und nachvollziehbare Prozesssteuerung.",
    href: "/best-software-immobilienanfragen",
  },
  {
    title: "Immobilienanfragen automatisieren",
    text: "Konkreter Ablauf von Eingang bis Versand inkl. Freigabe und Qualitätschecks.",
    href: "/immobilienanfragen-automatisieren",
  },
  {
    title: "E-Mail-Automatisierung für Immobilienmakler",
    text: "Überblick für Makler, die Antwortzeiten verkürzen und wiederkehrende Erstantworten mit sauberem Objektbezug sicher automatisieren möchten.",
    href: "/email-automatisierung-immobilienmakler",
  },
  {
    title: "Makler-Freigabe-Workflow",
    text: "Detailliert, wie Freigabe, Risiken und manuelle Entscheidungen in der Praxis organisiert sind.",
    href: "/makler-freigabe-workflow",
  },
  {
    title: "DSGVO & E-Mail-Autopilot",
    text: "Konkrete Übersicht zu Datenminimierung, Zugriffskontrolle und dokumentierbaren Prozessgrenzen.",
    href: "/dsgvo-email-autopilot",
  },
  {
    title: "ROI-Rechner für Makler",
    text: "Konservative Modellrechnung zu Zeitgewinn, Erstreaktion und Antwortquote im Zielzeitfenster.",
    href: "/roi-rechner",
  },
  {
    title: "Einwände gegen E-Mail-Autopilot",
    text: "Detaillierte Antworten zu DSGVO, Kontrolle, Qualität, Aufwand und Kosten mit klaren Handlungspfaden.",
    href: "/einwaende",
  },
  {
    title: "Anwendungsfälle für Maklerteams",
    text: "Segmentierte Use Cases mit Fit-Kriterien, Rollout-Regeln und KPI-Steuerung.",
    href: "/use-cases",
  },
  {
    title: "Branchenprofile",
    text: "Vermietung, kleine Maklerbüros und Neubau-Vertrieb mit konkreter Startlogik.",
    href: "/branchen",
  },
  {
    title: "Advaic vs. CRM-Tools",
    text: "Klare Abgrenzung: CRM als System of Record, Advaic als Ausführungssystem für Anfragen.",
    href: "/advaic-vs-crm-tools",
  },
  {
    title: "Integrationen (Gmail & Outlook)",
    text: "Wie Postfachanbindung technisch und operativ sauber eingerichtet wird.",
    href: "/integrationen",
  },
];

export default function SearchIntentTeaser() {
  return (
    <section id="suchintention" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[72ch]">
            <h2 className="h2">Vertiefende Einstiegsseiten nach Suchintention</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Seiten beantworten zentrale Entscheidungsfragen im Detail und führen Sie gezielt in den passenden
              nächsten Schritt.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {intents.map((item) => (
            <article key={item.title} className="card-base card-hover p-6">
              <h3 className="h3">{item.title}</h3>
              <p className="helper mt-3">{item.text}</p>
              <Link href={item.href} className="btn-secondary mt-4">
                Seite öffnen
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
