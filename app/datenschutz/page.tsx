import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import LegalDocumentLayout, {
  type LegalJumpLink,
  type LegalSummaryItem,
} from "@/components/marketing/LegalDocumentLayout";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

type PrivacySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  points?: string[];
};

const PRIVACY_QUICK_TAKE: LegalSummaryItem[] = [
  {
    title: "Rollenmodell",
    body: "Kontodaten für Betrieb, Abrechnung und Sicherheit verarbeitet Advaic grundsätzlich als eigener Verantwortlicher. Nachrichteninhalte im Kundenbetrieb laufen im Kern als Auftragsverarbeitung.",
  },
  {
    title: "Kundenverantwortung",
    body: "Rechtsgrundlagen, Betroffeneninformationen und die Zulässigkeit der konkreten Kommunikation bleiben beim Kunden.",
  },
  {
    title: "Produktgrenze",
    body: "Automatisierte Verarbeitung ist bewusst begrenzt. Bei fehlenden Angaben oder Risikosignalen soll der Fall in die Freigabe gehen.",
  },
];

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "rollenmodell",
    title: "1) Rollenmodell der Verarbeitung",
    points: [
      "Für Kontoanlage, Authentifizierung, Abrechnung, Sicherheit, Missbrauchsprävention und Support handelt Advaic regelmäßig als eigener Verantwortlicher.",
      "Soweit Nachrichteninhalte für den Kundenbetrieb verarbeitet werden, erfolgt die Verarbeitung im Rahmen einer Auftragsverarbeitung gemäß Art. 28 DSGVO.",
      "Der Kunde bleibt verantwortlich für Rechtsgrundlagen, Betroffeneninformationen und die Zulässigkeit der jeweiligen Kommunikation.",
    ],
  },
  {
    id: "datenkategorien",
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
    id: "zwecke-rechtsgrundlagen",
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
    id: "automatisierte-verarbeitung",
    title: "4) Automatisierte Verarbeitung im Produkt",
    points: [
      "Advaic nutzt regel- und modellgestützte Verfahren zur Kategorisierung eingehender E-Mails sowie zur Entwurfserstellung.",
      "Je nach Kundeneinstellung können wiederkehrende, fachlich sauber prüfbare Erstantworten automatisiert versendet werden; Nachrichten mit fehlenden Angaben oder Risikosignalen gehen zur Freigabe.",
      "Trotz Guardrails und Qualitätschecks kann eine Fehlklassifikation technisch nicht vollständig ausgeschlossen werden.",
      "Die fachliche und rechtliche Verantwortung für aktive Konfiguration und Versandentscheidungen verbleibt beim Kunden.",
    ],
  },
  {
    id: "empfaenger-dienstleister",
    title: "5) Empfänger und Dienstleister",
    points: [
      "Technische Infrastruktur- und Betriebsdienstleister (z. B. Hosting, Datenbank, Monitoring, Authentifizierung); für steuerbare Infrastruktur werden bewusst europäische Serverregionen gewählt.",
      "E-Mail- und Integrationsanbieter, die der Kunde aktiv verbindet (z. B. Gmail/Outlook/Portale); bei diesen Anbindungen bleibt die tatsächliche Region zusätzlich vom jeweiligen Tenant, Workspace oder Portal-Setup abhängig.",
      "KI-Dienstleister zur Klassifizierung, Entwurfserstellung und Qualitätsprüfung innerhalb der Produktlogik; auch hier werden für Advaic bewusst europäische Betriebsregionen bevorzugt, soweit dies steuerbar ist.",
      "Zahlungsdienstleister für Abo-, Rechnungs- und Zahlungsabwicklung; diese Dienste können trotz europäischer Grundkonfiguration globale Transferpfade enthalten.",
      "Eine Offenlegung gegenüber Behörden erfolgt ausschließlich bei gesetzlicher Verpflichtung.",
    ],
  },
  {
    id: "drittland",
    title: "6) Drittlandübermittlungen",
    points: [
      "Advaic wählt für steuerbare Dienste bewusst europäische Regionen und Setups, um unnötige Drittlandpfade nach Möglichkeit zu vermeiden.",
      "Drittlandübermittlungen lassen sich dennoch nicht in jedem Fall vollständig ausschließen, insbesondere bei kundenseitig angebundenen Tenants/Workspaces oder globalen Zahlungsdiensten.",
      "Soweit Daten außerhalb der EU/des EWR verarbeitet werden, erfolgen Übermittlungen nur bei geeigneten Garantien.",
      "Als Garantien kommen insbesondere Angemessenheitsbeschlüsse und/oder Standardvertragsklauseln in Betracht.",
      "Ergänzende technische und organisatorische Schutzmaßnahmen werden risikobasiert berücksichtigt.",
    ],
  },
  {
    id: "speicherung-loeschung",
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
    id: "sicherheit",
    title: "8) Sicherheit der Verarbeitung",
    points: [
      "Rollen- und Rechtekonzepte mit Zugriff nach Need-to-know-Prinzip.",
      "Absicherung von Integrations- und Verbindungsdaten sowie Transportverschlüsselung.",
      "Technische und organisatorische Maßnahmen nach Art. 32 DSGVO.",
      "Protokollierung sicherheitsrelevanter Vorgänge sowie Wiederherstellungs- und Backup-Prozesse.",
    ],
  },
  {
    id: "newsletter",
    title: "9) Newsletter und Marketing-Kommunikation",
    points: [
      "Newsletter und vergleichbare Produkt-/Marketing-E-Mails erfolgen nur bei entsprechender Einwilligung.",
      "Die Einwilligung ist freiwillig und jederzeit mit Wirkung für die Zukunft widerrufbar.",
      "Ein Widerruf berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung.",
    ],
  },
  {
    id: "cookies",
    title: "10) Cookies und ähnliche Technologien",
    points: [
      "Notwendige Cookies und Speicher werden für Login, Sicherheit und technisch erforderliche Funktionen eingesetzt.",
      "Optionale Kategorien (Analyse/Marketing) werden nur nach aktiver Einwilligung verarbeitet.",
      "Einwilligungen können jederzeit über die Cookie-Einstellungen angepasst oder widerrufen werden.",
      "Detaillierte Informationen stehen auf der Seite Cookie & Storage.",
    ],
  },
  {
    id: "rechte",
    title: "11) Rechte betroffener Personen",
    points: [
      "Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO) und Einschränkung (Art. 18 DSGVO).",
      "Recht auf Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).",
      "Recht auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).",
      "Beschwerderecht bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO).",
    ],
  },
  {
    id: "pflichtdaten",
    title: "12) Pflicht zur Bereitstellung von Daten",
    points: [
      "Bestimmte Daten sind für Vertragsabschluss und Betrieb von Advaic erforderlich.",
      "Ohne erforderliche Angaben kann die Leistung ganz oder teilweise nicht erbracht werden.",
    ],
  },
  {
    id: "aenderungen",
    title: "13) Änderungen dieser Datenschutzhinweise",
    points: [
      "Diese Hinweise können angepasst werden, wenn sich Rechtslage, technische Prozesse oder Produktfunktionen ändern.",
      "Maßgeblich ist die jeweils auf dieser Seite veröffentlichte aktuelle Fassung mit Stand-Datum.",
    ],
  },
];

const PRIVACY_JUMP_LINKS: LegalJumpLink[] = [
  { id: "verantwortlicher", label: "Verantwortlicher & Kontakt" },
  ...PRIVACY_SECTIONS.map((section) => ({
    id: section.id,
    label: section.title.replace(/^\d+\)\s*/, ""),
  })),
  { id: "weitere-dokumente", label: "Weitere Dokumente" },
];

export const metadata = buildMarketingMetadata({
  title: "Datenschutzhinweise",
  ogTitle: "Datenschutzhinweise | Advaic",
  description:
    "Datenschutzhinweise für Advaic: Rollenmodell, Datenkategorien, Zwecke, Empfänger, Speicherdauer und die Grenzen automatisierter Verarbeitung im Produkt.",
  path: "/datenschutz",
  template: "trust",
  eyebrow: "Datenschutz",
  proof: "Rollen, Verarbeitungszwecke, Guardrails und Verantwortlichkeiten transparent dokumentiert.",
});

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
        description="Das formale Datenschutzdokument für Rollen, Zwecke, Speicherfristen und Rechte bei der Nutzung von Advaic. Stand: 26. Februar 2026."
        actions={
          <>
            <Link href="/trust" className="btn-secondary">
              Trust-Hub
            </Link>
            <a href={`mailto:${privacyEmail}`} className="btn-primary">
              Datenschutz kontaktieren
            </a>
          </>
        }
      />

      <LegalDocumentLayout
        currentPath="/datenschutz"
        summaryTitle="Kurzüberblick"
        summaryItems={PRIVACY_QUICK_TAKE}
        jumpLinks={PRIVACY_JUMP_LINKS}
        asideExtras={
          <>
            <article className="card-base p-5">
              <p className="section-kicker">Rolle dieser Seite</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Dieses Dokument erklärt Rollen, Zwecke und Speicherfristen. Für Auto-Grenzen und Freigabe-Regeln ist die Sicherheitsseite zuständig, für den Überblick der Trust-Hub.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/trust" className="btn-secondary w-full justify-center">
                  Trust-Hub
                </Link>
                <Link href="/sicherheit" className="btn-secondary w-full justify-center">
                  Sicherheitsseite
                </Link>
              </div>
            </article>
            <article className="card-base p-5">
              <p className="section-kicker">Stand & Kontakt</p>
              <p className="mt-3 text-sm text-[var(--muted)]">Stand: 26. Februar 2026.</p>
              <a className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
            </article>
          </>
        }
      >
        <article id="verantwortlicher" className="card-base p-6 md:p-8 scroll-mt-28">
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

        {PRIVACY_SECTIONS.map((section) => (
          <article key={section.title} id={section.id} className="card-base p-6 md:p-8 scroll-mt-28">
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

        <article id="weitere-dokumente" className="card-base p-6 md:p-8 scroll-mt-28">
            <h2 className="h3">Weitere Transparenzdokumente</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/trust" className="underline underline-offset-4">
                  Trust-Hub
                </Link>
              </li>
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

        <article className="card-base p-6">
          <h2 className="h3">Hinweis</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Diese Hinweise dienen der transparenten Information über unsere Datenverarbeitung und ersetzen keine
            individuelle Rechtsberatung.
          </p>
        </article>
      </LegalDocumentLayout>
    </PageShell>
  );
}
