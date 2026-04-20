import Link from "next/link";
import Container from "./Container";

const intents = [
  {
    title: "KI-Tools für Immobilienmakler",
    text: "Vergleichsrahmen für Makler: wann CRM, Inbox-Tools oder spezialisierte Antwortautomatisierung sinnvoll ist.",
    href: "/best-ai-tools-immobilienmakler",
  },
  {
    title: "Tools für Immobilienmakler",
    text: "Kategoriehilfe für Makler: welche Tools im Alltag wirklich helfen und in welcher Reihenfolge sie Sinn ergeben.",
    href: "/tools-fuer-immobilienmakler",
  },
  {
    title: "KI für Immobilienmakler",
    text: "Praxisleitfaden für sicheren KI-Einsatz im Makleralltag mit klaren Guardrails.",
    href: "/ki-fuer-immobilienmakler",
  },
  {
    title: "Software für Immobilienanfragen",
    text: "Kaufleitfaden mit Kriterien für Sicherheit, Geschwindigkeit und nachvollziehbare Prozesssteuerung.",
    href: "/best-software-immobilienanfragen",
  },
  {
    title: "Anfragenmanagement für Immobilienmakler",
    text: "Operativer Leitfaden von Eingang, Einordnung und Antwortpfad bis zum kontrollierten Follow-up.",
    href: "/anfragenmanagement-immobilienmakler",
  },
  {
    title: "ImmoScout-Anfragen automatisieren",
    text: "Wie Portalanfragen mit sauberer Quellenlogik, Dublettenschutz und schneller Erstreaktion operativ gesteuert werden.",
    href: "/immobilienscout-anfragen-automatisieren",
  },
  {
    title: "Anfragenqualifizierung für Immobilienmakler",
    text: "Wie Makler Anfragen nach Reifegrad und nächstem Schritt ordnen statt mit unscharfen Scores zu arbeiten.",
    href: "/anfragenqualifizierung-immobilienmakler",
  },
  {
    title: "Besichtigungsanfragen automatisieren",
    text: "Von der qualifizierten Anfrage bis zum bestätigten Termin mit passender Terminlogik und Nachbereitung.",
    href: "/besichtigungsanfragen-automatisieren",
  },
  {
    title: "Maklersoftware für kleine Maklerbüros",
    text: "Vergleich für kleine Teams: welche Maklersoftware bei wenig Personal, mobilem Alltag und Portalanfragen wirklich passt.",
    href: "/maklersoftware-fuer-kleine-maklerbueros",
  },
  {
    title: "Immobilienanfragen priorisieren",
    text: "Wie Makler Anfragen nach Reifegrad, Risiko und nächstem Schritt priorisieren statt nur nach Gefühl zu reagieren.",
    href: "/immobilienanfragen-priorisieren",
  },
  {
    title: "Besichtigungstermine koordinieren",
    text: "Wie Makler Einzeltermine, Zeitfenster, Buchungslinks und Massentermine sauber organisieren.",
    href: "/besichtigungstermine-koordinieren",
  },
  {
    title: "Maklersoftware Preise vergleichen",
    text: "Öffentliche Preislogik von onOffice, FLOWFACT, Propstack und HubSpot sauber eingeordnet.",
    href: "/maklersoftware-preise-vergleichen",
  },
  {
    title: "Besichtigungserinnerungen automatisieren",
    text: "Wie Makler Erinnerungen vor Besichtigungen mit sauberem Timing, Stopplogik und weniger No-Shows organisieren.",
    href: "/besichtigungserinnerungen-automatisieren",
  },
  {
    title: "No-Shows bei Besichtigungen reduzieren",
    text: "Wie Makler Nichterscheinen mit Bestätigung, Erinnerungen und einem klaren Absageweg spürbar senken.",
    href: "/no-show-besichtigungen-reduzieren",
  },
  {
    title: "Besichtigung-Absagen reduzieren",
    text: "Wie Makler späte und stille Absagen durch klarere Rückwege, Statuslogik und Auswertung spürbar senken.",
    href: "/besichtigung-absagen-reduzieren",
  },
  {
    title: "Besichtigung bestätigen",
    text: "Wie Makler Zusagen in belastbare Besichtigungstermine mit klaren Status- und Rückwegen überführen.",
    href: "/besichtigung-bestaetigen",
  },
  {
    title: "Massenbesichtigungen organisieren",
    text: "Wie Makler Massentermine mit Teilnehmerstatus, klaren Rückwegen und belastbarer Vor-Ort-Logik organisieren.",
    href: "/massenbesichtigungen-organisieren",
  },
  {
    title: "CRM vs. Maklersoftware",
    text: "Was Immobilienmakler wirklich vergleichen sollten und wann ein CRM nicht dieselbe Aufgabe wie Maklersoftware erfüllt.",
    href: "/crm-vs-maklersoftware",
  },
  {
    title: "Immobilienanfragen automatisieren",
    text: "Konkreter Ablauf von Eingang bis Versand inkl. Freigabe und Qualitätschecks.",
    href: "/immobilienanfragen-automatisieren",
  },
  {
    title: "Antwortzeit bei Immobilienanfragen",
    text: "Wie schnell Makler realistisch reagieren sollten, wo Zeit verloren geht und welche KPI wirklich zählen.",
    href: "/antwortzeit-immobilienanfragen",
  },
  {
    title: "Follow-up-E-Mails für Immobilienmakler",
    text: "Wie Makler sinnvoll nachfassen, welche Taktung konservativ startet und wann Follow-ups stoppen müssen.",
    href: "/follow-up-emails-immobilienmakler",
  },
  {
    title: "Immobilienanfragen nachfassen",
    text: "Wie Makler offene Anfragen sinnvoll erinnern, im Kontext bleiben und Folgekommunikation sauber stoppen.",
    href: "/immobilienanfragen-nachfassen",
  },
  {
    title: "ImmoScout-Anfragen nachfassen",
    text: "Wie Makler Portalanfragen von ImmoScout sinnvoll nachfassen, ohne Dubletten, API-Logik oder Stoppsignale zu übersehen.",
    href: "/immobilienscout-anfragen-nachfassen",
  },
  {
    title: "Portalanfragen priorisieren",
    text: "Wie Makler Portalqueues nach Objektklarheit, Reifegrad, Dublettenlage und Sonderfallstatus sauber sortieren.",
    href: "/portalanfragen-priorisieren",
  },
  {
    title: "ImmoScout-Anfragen qualifizieren",
    text: "Wie Makler ImmoScout-Fälle nach Objektklarheit, Zusatzdaten und nächstem sinnvollen Schritt sauber einordnen.",
    href: "/immobilienscout-anfragen-qualifizieren",
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
    text: "Klare Abgrenzung: CRM als Datenbasis, Advaic als Ausführungssystem für Anfragen.",
    href: "/advaic-vs-crm-tools",
  },
  {
    title: "Maklersoftware Vergleich 2026",
    text: "Orientierung für Maklerbüros, die Maklersoftware, CRM und Anfrageausführung sauber voneinander trennen wollen.",
    href: "/maklersoftware-vergleich",
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
