import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

type PrivacySection = {
  title: string;
  paragraphs?: string[];
  points?: string[];
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1) Rollenmodell der Verarbeitung",
    points: [
      "Für Kontoanlage, Authentifizierung, Abrechnung, Sicherheit, Missbrauchsprävention und Support handelt Advaic regelmäßig als eigener Verantwortlicher.",
      "Soweit Nachrichteninhalte für den Kundenbetrieb verarbeitet werden, erfolgt die Verarbeitung im Rahmen einer Auftragsverarbeitung gemäß Art. 28 DSGVO.",
      "Der Kunde bleibt verantwortlich für Rechtsgrundlagen, Betroffeneninformationen und die Zulässigkeit der jeweiligen Kommunikation.",
    ],
  },
  {
    title: "2) Verarbeitete Datenkategorien",
    points: [
      "Kontodaten: Name, E-Mail, Firmenangaben, Rollen, Einstellungen, Vertragsdaten.",
      "Kommunikationsdaten: Betreff, E-Mail-Inhalte, Absender-/Empfängerdaten, Thread-Bezüge, Zeitstempel, Status.",
      "Konfigurationsdaten: Auto/Freigabe-Regeln, Ton- und Stilvorgaben, Follow-up-Einstellungen, Vorlagen.",
      "Integrationsdaten: Verbindungsstatus, technische Token-/API-Metadaten (sicher gespeichert), Fehler- und Laufzeitinformationen.",
      "Sicherheits- und Protokolldaten: Zugriffsvorgänge, Systemereignisse, Fehlermeldungen, Audit-Hinweise.",
    ],
  },
  {
    title: "3) Zwecke und Rechtsgrundlagen",
    points: [
      "Art. 6 Abs. 1 lit. b DSGVO: Vertragserfüllung, Bereitstellung und Betrieb der Plattform, Nutzerverwaltung, Support.",
      "Art. 6 Abs. 1 lit. f DSGVO: Sicherheit, Stabilität, Missbrauchsprävention, Qualitätsverbesserung und Nachvollziehbarkeit.",
      "Art. 6 Abs. 1 lit. c DSGVO: Erfüllung gesetzlicher Pflichten (z. B. handels- und steuerrechtliche Aufbewahrung).",
      "Art. 6 Abs. 1 lit. a DSGVO: Einwilligungsbasierte Verarbeitungen (z. B. Newsletter, optionale Analyse-/Marketing-Cookies).",
      "§ 25 TDDDG: Zugriff auf Endgeräteinformationen erfolgt nur im gesetzlich zulässigen Rahmen (erforderlich oder einwilligungsbasiert).",
    ],
  },
  {
    title: "4) Automatisierte Verarbeitung im Produkt",
    points: [
      "Advaic nutzt regel- und modellgestützte Verfahren zur Kategorisierung eingehender E-Mails sowie zur Entwurfserstellung.",
      "Je nach Kundeneinstellung können klare Standardfälle automatisiert versendet werden; unklare oder risikobehaftete Fälle gehen zur Freigabe.",
      "Trotz Guardrails und Qualitätschecks kann eine Fehlklassifikation technisch nicht vollständig ausgeschlossen werden.",
      "Die fachliche und rechtliche Verantwortung für aktive Konfiguration und Versandentscheidungen verbleibt beim Kunden.",
    ],
  },
  {
    title: "5) Empfänger und Dienstleister",
    points: [
      "Technische Infrastruktur- und Betriebsdienstleister (z. B. Hosting, Datenbank, Monitoring, Authentifizierung).",
      "E-Mail- und Integrationsanbieter, die der Kunde aktiv verbindet (z. B. Gmail/Outlook/Portale).",
      "KI-Dienstleister zur Klassifizierung, Entwurfserstellung und Qualitätsprüfung innerhalb der Produktlogik.",
      "Zahlungsdienstleister für Abo-, Rechnungs- und Zahlungsabwicklung.",
      "Eine Offenlegung gegenüber Behörden erfolgt ausschließlich bei gesetzlicher Verpflichtung.",
    ],
  },
  {
    title: "6) Drittlandübermittlungen",
    points: [
      "Soweit Daten außerhalb der EU/des EWR verarbeitet werden, erfolgen Übermittlungen nur bei geeigneten Garantien.",
      "Als Garantien kommen insbesondere Angemessenheitsbeschlüsse und/oder Standardvertragsklauseln in Betracht.",
      "Ergänzende technische und organisatorische Schutzmaßnahmen werden risikobasiert berücksichtigt.",
    ],
  },
  {
    title: "7) Speicherdauer und Löschung",
    points: [
      "Kontodaten: Speicherung für die Vertragslaufzeit; danach Löschung oder Einschränkung, soweit keine gesetzlichen Pflichten entgegenstehen.",
      "Nachrichten- und Verlaufsdaten: Speicherung für den Produktbetrieb und Nachvollziehbarkeit, danach Löschung/Anonymisierung gemäß Löschkonzept.",
      "Integrations- und Zugriffsdaten: Speicherung bis zur Trennung der Verbindung oder Vertragsende.",
      "Abrechnungsdaten: Aufbewahrung nach gesetzlichen handels- und steuerrechtlichen Fristen.",
      "Sicherheits-/Fehlerprotokolle: nur so lange wie für Stabilität, Sicherheit und Missbrauchsabwehr erforderlich.",
    ],
  },
  {
    title: "8) Sicherheit der Verarbeitung",
    points: [
      "Rollen- und Rechtekonzepte mit Zugriff nach Need-to-know-Prinzip.",
      "Absicherung von Integrations- und Verbindungsdaten sowie Transportverschlüsselung.",
      "Technische und organisatorische Maßnahmen nach Art. 32 DSGVO.",
      "Protokollierung sicherheitsrelevanter Vorgänge sowie Wiederherstellungs- und Backup-Prozesse.",
    ],
  },
  {
    title: "9) Newsletter und Marketing-Kommunikation",
    points: [
      "Newsletter und vergleichbare Produkt-/Marketing-E-Mails erfolgen nur bei entsprechender Einwilligung.",
      "Die Einwilligung ist freiwillig und jederzeit mit Wirkung für die Zukunft widerrufbar.",
      "Ein Widerruf berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung.",
    ],
  },
  {
    title: "10) Cookies und ähnliche Technologien",
    points: [
      "Notwendige Cookies und Speicher werden für Login, Sicherheit und technisch erforderliche Funktionen eingesetzt.",
      "Optionale Kategorien (Analyse/Marketing) werden nur nach aktiver Einwilligung verarbeitet.",
      "Einwilligungen können jederzeit über die Cookie-Einstellungen angepasst oder widerrufen werden.",
      "Detaillierte Informationen stehen auf der Seite Cookie & Storage.",
    ],
  },
  {
    title: "11) Rechte betroffener Personen",
    points: [
      "Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO) und Einschränkung (Art. 18 DSGVO).",
      "Recht auf Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).",
      "Recht auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).",
      "Beschwerderecht bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO).",
    ],
  },
  {
    title: "12) Pflicht zur Bereitstellung von Daten",
    points: [
      "Bestimmte Daten sind für Vertragsabschluss und Betrieb von Advaic erforderlich.",
      "Ohne erforderliche Angaben kann die Leistung ganz oder teilweise nicht erbracht werden.",
    ],
  },
  {
    title: "13) Änderungen dieser Datenschutzhinweise",
    points: [
      "Diese Hinweise können angepasst werden, wenn sich Rechtslage, technische Prozesse oder Produktfunktionen ändern.",
      "Maßgeblich ist die jeweils auf dieser Seite veröffentlichte aktuelle Fassung mit Stand-Datum.",
    ],
  },
];

export default function DatenschutzPage() {
  const legalCompany = process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "Advaic";
  const privacyEmail =
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ||
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ||
    "support@advaic.com";
  const legalAddressStreet = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_STREET || "Adresse folgt";
  const legalAddressZipCity = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_ZIP_CITY || "PLZ Ort folgt";
  const legalAddressCountry = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_COUNTRY || "Deutschland";

  return (
    <PageShell withProofLayer={false}>
      <PageIntro
        kicker="Datenschutz"
        title="Datenschutzhinweise"
        description="Transparente Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung von Advaic. Stand: 26. Februar 2026."
        actions={
          <>
            <Link href="/cookie-und-storage" className="btn-secondary">
              Cookie & Storage
            </Link>
            <a href={`mailto:${privacyEmail}`} className="btn-primary">
              Datenschutz kontaktieren
            </a>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Verantwortlicher</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist{" "}
              <strong className="text-[var(--text)]">{legalCompany}</strong>, {legalAddressStreet}, {legalAddressZipCity},{" "}
              {legalAddressCountry}. Für Datenschutzanfragen nutzen Sie bitte{" "}
              <a className="underline underline-offset-4" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
              .
            </p>
          </article>

          <div className="mt-6 space-y-4">
            {PRIVACY_SECTIONS.map((section) => (
              <article key={section.title} className="card-base p-6 md:p-8">
                <h2 className="h3">{section.title}</h2>

                {section.paragraphs?.length ? (
                  <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.points?.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Weitere Transparenzdokumente</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/unterauftragsverarbeiter" className="underline underline-offset-4">
                  Unterauftragsverarbeiter
                </Link>
              </li>
              <li>
                <Link href="/nutzungsbedingungen" className="underline underline-offset-4">
                  Nutzungsbedingungen
                </Link>
              </li>
              <li>
                <Link href="/sicherheit" className="underline underline-offset-4">
                  Sicherheitslogik und Guardrails
                </Link>
              </li>
            </ul>
          </article>

          <article className="card-base mt-6 p-6">
            <h2 className="h3">Hinweis</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Diese Hinweise dienen der transparenten Information über unsere Datenverarbeitung und ersetzen keine
              individuelle Rechtsberatung.
            </p>
          </article>
        </Container>
      </section>
    </PageShell>
  );
}
