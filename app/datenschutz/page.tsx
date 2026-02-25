import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

const principles = [
  "Zweckbindung: E-Mail-Daten werden nur zur Anfragebearbeitung, Qualitätssicherung und Nachvollziehbarkeit verarbeitet.",
  "Datenminimierung: Nicht relevante Nachrichten wie Newsletter, Systemmails und Spam werden gefiltert und nicht beantwortet.",
  "Kontrolle: Unklare oder riskante Fälle gehen in die Freigabe statt in den Autopilot.",
  "Nachvollziehbarkeit: Status, Zeitstempel und Versandentscheidungen sind im Verlauf dokumentiert.",
];

const recipients = [
  "Supabase für Hosting, Datenbank, Authentifizierung und Storage.",
  "Google und Microsoft für E-Mail-Integrationen, wenn Sie diese aktiv verbinden.",
  "Azure OpenAI für Klassifizierung, Entwürfe und Qualitätsprüfungen im Produktfluss.",
  "Stripe für Abo-, Rechnungs- und Zahlungsprozesse.",
  "Slack oder vergleichbare Benachrichtigungsdienste, wenn Sie sie aktiv freischalten.",
];

const retentionRows = [
  {
    category: "Nachrichten- und Verlaufsdaten",
    retention:
      "Speicherung für den laufenden Produktbetrieb. Bei Kontolöschung werden agentenbezogene Datensätze und Verknüpfungen entfernt, vorbehaltlich gesetzlicher Pflichten.",
  },
  {
    category: "Integrations- und Zugriffsdaten",
    retention:
      "Bis zur Trennung der jeweiligen Integration oder Kontolöschung. Zugangstoken werden verschlüsselt gespeichert.",
  },
  {
    category: "Technische Fehler- und Sicherheitsprotokolle",
    retention:
      "Nur solange erforderlich für Stabilität, Missbrauchsschutz und Fehleranalyse. Kein Einsatz von Marketing-Tracking im aktuellen Code-Stand.",
  },
  {
    category: "Cookies und Browser-Speicher",
    retention:
      "Siehe detaillierte Übersicht auf der Seite „Cookie & Storage“ mit Eintrag, Zweck, Rechtsgrundlage und Dauer.",
  },
];

export default function DatenschutzPage() {
  const companyName = process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "Advaic";
  const privacyEmail =
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ||
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ||
    "support@advaic.com";

  return (
    <PageShell withProofLayer={false}>
      <PageIntro
        kicker="Datenschutz"
        title="Datenschutzhinweise"
        description="Diese Seite beschreibt, wie Advaic personenbezogene Daten in der Produktnutzung verarbeitet. Stand: 25. Februar 2026."
        actions={
          <>
            <Link href="/sicherheit" className="btn-secondary">
              Sicherheitsdetails
            </Link>
            <a href={`mailto:${privacyEmail}`} className="btn-primary">
              Datenschutz anfragen
            </a>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-8 md:p-10">
            <h2 className="h2">Verantwortlicher</h2>
            <p className="helper mt-4">
              Verantwortlich für die Datenverarbeitung im Rahmen dieses Webauftritts und der Produktnutzung ist{" "}
              <strong>{companyName}</strong>. Datenschutzanfragen richten Sie an{" "}
              <a className="underline underline-offset-4" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
              .
            </p>
          </article>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="card-base card-hover p-6">
              <h3 className="h3">1) Welche Daten verarbeitet Advaic?</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>E-Mail-Inhalte, Betreffzeilen und Metadaten (Absender, Zeitpunkte, Threads).</li>
                <li>Konfigurationen wie Tonalität, Regeln, Freigabe- und Versandstatus.</li>
                <li>Technische Protokolle zur Stabilität, Fehlersuche und Missbrauchserkennung.</li>
              </ul>
            </article>

            <article className="card-base card-hover p-6">
              <h3 className="h3">2) Zu welchen Zwecken?</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Erkennung echter Interessenten-Anfragen und Filterung nicht relevanter Nachrichten.</li>
                <li>Erstellung von Antwortentwürfen im definierten Stil und kontrollierter Versand.</li>
                <li>Dokumentation von Entscheidungen für Transparenz und interne Qualitätssicherung.</li>
              </ul>
            </article>

            <article className="card-base card-hover p-6">
              <h3 className="h3">3) Rechtsgrundlagen</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Art. 6 Abs. 1 lit. b DSGVO (Vertrag und vorvertragliche Kommunikation).</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherer, effizienter Kommunikation).</li>
                <li>Art. 6 Abs. 1 lit. c DSGVO, soweit gesetzliche Pflichten bestehen.</li>
              </ul>
            </article>

            <article className="card-base card-hover p-6">
              <h3 className="h3">4) Empfänger und Dienstleister</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {recipients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Drittlandtransfer</h3>
            <p className="helper mt-3">
              Wenn Dienste außerhalb der EU/des EWR eingebunden sind, erfolgt die Verarbeitung nur auf Grundlage der
              jeweils erforderlichen Garantien (z. B. Angemessenheitsbeschluss oder Standardvertragsklauseln).
              Die konkrete Anbieter- und Transferübersicht finden Sie auf der Seite{" "}
              <Link href="/unterauftragsverarbeiter" className="underline underline-offset-4">
                Unterauftragsverarbeiter
              </Link>
              .
            </p>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Speicherdauer und Löschung</h3>
            <div className="mt-4 space-y-4">
              {retentionRows.map((row) => (
                <div key={row.category} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-sm font-semibold text-[var(--text)]">{row.category}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{row.retention}</p>
                </div>
              ))}
            </div>
            <p className="helper mt-4">
              Detaillierte technische Einträge finden Sie auf{" "}
              <Link href="/cookie-und-storage" className="underline underline-offset-4">
                Cookie & Storage
              </Link>
              .
            </p>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Datenschutz-Grundsätze im Produkt</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {principles.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Ihre Rechte nach DSGVO</h3>
            <p className="helper mt-3">
              Sie haben insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
              Datenübertragbarkeit sowie Widerspruch. Anfragen senden Sie an{" "}
              <a className="underline underline-offset-4" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
              .
            </p>
            <p className="helper mt-3">
              Wenn Sie der Ansicht sind, dass eine Verarbeitung nicht DSGVO-konform erfolgt, können Sie sich zusätzlich
              an eine Datenschutzaufsichtsbehörde wenden.
            </p>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Transparenz-Dokumente</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/unterauftragsverarbeiter" className="underline underline-offset-4">
                  Unterauftragsverarbeiter-Verzeichnis
                </Link>
              </li>
              <li>
                <Link href="/cookie-und-storage" className="underline underline-offset-4">
                  Cookie & Storage Übersicht
                </Link>
              </li>
              <li>
                <Link href="/sicherheit" className="underline underline-offset-4">
                  Sicherheits- und Guardrail-Logik
                </Link>
              </li>
            </ul>
          </article>

          <article className="card-base mt-6 p-6">
            <h3 className="h3">Hinweis</h3>
            <p className="helper mt-3">
              Diese Seite ist eine produktbezogene Datenschutzinformation. Sie ersetzt keine individuelle Rechtsberatung.
            </p>
          </article>
        </Container>
      </section>
    </PageShell>
  );
}
