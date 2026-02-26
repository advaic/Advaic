import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

type TermsSection = {
  title: string;
  paragraphs?: string[];
  points?: string[];
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "1) Geltungsbereich",
    points: [
      "Diese Nutzungsbedingungen gelten für alle Verträge über die Nutzung der SaaS-Plattform Advaic zwischen dem Anbieter und dem Kunden.",
      "Das Angebot richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB sowie juristische Personen und öffentlich-rechtliche Sondervermögen.",
      "Abweichende Bedingungen des Kunden gelten nur, wenn der Anbieter ihrer Geltung ausdrücklich in Textform zugestimmt hat.",
    ],
  },
  {
    title: "2) Vertragsgegenstand",
    points: [
      "Advaic unterstützt den E-Mail-Prozess im Immobilienkontext (Erkennen, Kategorisieren, Entwurfserstellung, Qualitätsprüfung, Versandpfade und Verlaufsdokumentation).",
      "Der Anbieter schuldet die Bereitstellung der vereinbarten Funktionen im jeweiligen Tarif, nicht jedoch einen bestimmten wirtschaftlichen Erfolg.",
      "Website-Angaben, Demos und Beispielabläufe beschreiben typische Nutzungsszenarien und sind keine Beschaffenheitsgarantie, soweit nicht ausdrücklich schriftlich zugesichert.",
    ],
  },
  {
    title: "3) Rolle von Advaic und Verantwortungsbereich des Kunden",
    points: [
      "Advaic ist ein Assistenz- und Automatisierungssystem. Die rechtliche, fachliche und inhaltliche Verantwortung für versendete Nachrichten verbleibt beim Kunden.",
      "Der Kunde entscheidet eigenverantwortlich, ob und in welchem Umfang Auto-Versand, Freigabe-Workflow und Follow-up-Logik aktiviert werden.",
      "Der Kunde bleibt Absender der über sein Postfach versendeten Nachrichten und ist verantwortlich für Empfängerbezug, Objektreferenz, Datenqualität und Rechtskonformität der Kommunikation.",
    ],
  },
  {
    title: "4) Auto-Versand, Freigabe und Fail-Safe",
    points: [
      "Auto-Versand erfolgt nur im Rahmen der vom Kunden gesetzten Regeln und nur bei als klar eingestuften Standardfällen.",
      "Unklare, widersprüchliche, heikle oder risikobehaftete Fälle sollen in die Freigabe überführt werden.",
      "Trotz Guardrails, Qualitätschecks und Fail-Safe-Logik kann eine Fehlklassifikation oder Fehlantwort technisch nicht vollständig ausgeschlossen werden.",
      "Der Kunde ist verpflichtet, Advaic initial konservativ zu konfigurieren und die Automatisierung erst nach fachlicher Validierung schrittweise auszuweiten.",
    ],
  },
  {
    title: "5) Verbotene Nutzung",
    points: [
      "Unzulässig ist die Nutzung für rechtswidrige, täuschende, diskriminierende, beleidigende oder sonst unzulässige Kommunikation.",
      "Unzulässig ist die Umgehung technischer Schutzmaßnahmen oder die bewusste Deaktivierung sicherheitsrelevanter Prüfpfade.",
      "Unzulässig ist die Verarbeitung oder Versendung von Inhalten ohne erforderliche Rechtsgrundlage.",
    ],
  },
  {
    title: "6) Integrationen und Drittanbieter",
    points: [
      "Bestimmte Funktionen setzen Integrationen mit Drittanbietern (z. B. E-Mail-Provider, Portale, Zahlungsdienste) voraus.",
      "Für Zugangsdaten, Berechtigungen und rechtmäßige Nutzung dieser Drittanbieter bleibt der Kunde verantwortlich.",
      "Ausfälle, API-Limits oder Änderungen von Drittanbietern liegen außerhalb des Verantwortungsbereichs des Anbieters.",
    ],
  },
  {
    title: "7) Nutzungsrechte",
    points: [
      "Der Anbieter räumt für die Vertragslaufzeit ein einfaches, nicht ausschließliches, nicht übertragbares Nutzungsrecht an Advaic ein.",
      "Eine Weitergabe, Unterlizenzierung oder missbräuchliche Nutzung außerhalb des vereinbarten Vertragszwecks ist unzulässig.",
    ],
  },
  {
    title: "8) Verfügbarkeit, Wartung und Änderungen",
    points: [
      "Der Anbieter bemüht sich um hohe Verfügbarkeit. Erforderliche Wartungsfenster und sicherheitsrelevante Updates bleiben vorbehalten.",
      "Funktionen dürfen weiterentwickelt, angepasst oder ersetzt werden, sofern die vertraglichen Kernfunktionen erhalten bleiben und die Nutzung weiterhin zumutbar ist.",
    ],
  },
  {
    title: "9) Preise, Testphase, Laufzeit und Kündigung",
    points: [
      "Es gilt das jeweils vereinbarte Preismodell einschließlich der ausgewiesenen Testphase.",
      "Nach Ende der Testphase ist für die weitere Nutzung ein aktives kostenpflichtiges Abonnement erforderlich.",
      "Laufzeit, Verlängerung und Kündigungsfristen richten sich nach dem gebuchten Tarif; das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.",
    ],
  },
  {
    title: "10) Haftung",
    points: [
      "Der Anbieter haftet unbeschränkt bei Vorsatz, grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften.",
      "Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
      "Im Übrigen ist die Haftung bei leichter Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig.",
      "Soweit gesetzlich zulässig, ist die Gesamthaftung pro Vertragsjahr auf die vom Kunden in den letzten zwölf Monaten gezahlte Nettovergütung begrenzt.",
    ],
  },
  {
    title: "11) Schutzklauseln für Versandrisiken und Freistellung",
    paragraphs: [
      "Diese Schutzklauseln gelten als wesentliche Vertragsgrundlage für den Betrieb von Advaic.",
    ],
    points: [
      "Der Kunde erkennt an, dass Advaic trotz Schutzmechanismen (Guardrails, Qualitätschecks, Freigabe-Logik) Fehlklassifikationen oder unpassende Antworten technisch nicht vollständig ausschließen kann.",
      "Die finale Verantwortung für Aktivierung, Konfiguration, Empfängerauswahl, Objektreferenz und rechtliche Zulässigkeit der versendeten Inhalte liegt beim Kunden.",
      "Der Anbieter haftet nicht für Schäden, Ansprüche oder Bußgelder, die auf kundenseitig gesetzten Regeln, fehlerhaften Eingangsdaten, falschen Empfängerbezügen oder unzureichender Fachprüfung beruhen.",
      "Der Kunde stellt den Anbieter von Ansprüchen Dritter frei, die aus vom Kunden veranlassten Inhalten, Versandentscheidungen oder Konfigurationen resultieren; dies umfasst auch angemessene Rechtsverteidigungskosten.",
      "Die Freistellung gilt insbesondere bei Ansprüchen wegen unzulässiger Kontaktaufnahme, falscher Sachangaben, rechtswidriger Inhalte oder fehlender Rechtsgrundlagen der Verarbeitung.",
    ],
  },
  {
    title: "12) Datenschutz und Auftragsverarbeitung",
    points: [
      "Soweit der Anbieter personenbezogene Daten im Auftrag verarbeitet, schließen die Parteien einen Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.",
      "Der Kunde bleibt für die Rechtmäßigkeit der Verarbeitung, Betroffeneninformationen und Kommunikationszulässigkeit verantwortlich.",
    ],
  },
  {
    title: "13) Vertraulichkeit",
    points: [
      "Beide Parteien verpflichten sich, vertrauliche und nicht öffentliche Informationen der jeweils anderen Partei vertraulich zu behandeln.",
      "Die Vertraulichkeitspflicht gilt über das Vertragsende hinaus fort.",
    ],
  },
  {
    title: "14) Schlussbestimmungen",
    points: [
      "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.",
      "Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.",
      "Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
    ],
  },
];

export default function NutzungsbedingungenPage() {
  const legalCompany = process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "Advaic";
  const legalEmail =
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ||
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ||
    "support@advaic.com";
  const legalAddressStreet = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_STREET || "Adresse folgt";
  const legalAddressZipCity = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_ZIP_CITY || "PLZ Ort folgt";
  const legalAddressCountry = process.env.NEXT_PUBLIC_LEGAL_ADDRESS_COUNTRY || "Deutschland";

  return (
    <PageShell withProofLayer={false}>
      <PageIntro
        kicker="Rechtliches"
        title="Nutzungsbedingungen (B2B)"
        description="Diese Bedingungen regeln die Nutzung von Advaic im geschäftlichen Kontext. Stand: 26. Februar 2026."
        actions={
          <>
            <Link href="/datenschutz" className="btn-secondary">
              Datenschutzhinweise
            </Link>
            <a href={`mailto:${legalEmail}`} className="btn-primary">
              Rechtliches anfragen
            </a>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <p className="text-sm text-[var(--muted)]">
              Anbieter: <strong className="text-[var(--text)]">{legalCompany}</strong>, {legalAddressStreet},{" "}
              {legalAddressZipCity}, {legalAddressCountry}. Kontakt:{" "}
              <a className="underline underline-offset-4" href={`mailto:${legalEmail}`}>
                {legalEmail}
              </a>
              .
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Ergänzend gelten die{" "}
              <Link href="/datenschutz" className="underline underline-offset-4">
                Datenschutzhinweise
              </Link>{" "}
              sowie die Seite{" "}
              <Link href="/cookie-und-storage" className="underline underline-offset-4">
                Cookie & Storage
              </Link>
              .
            </p>
          </article>

          <div className="mt-6 space-y-4">
            {TERMS_SECTIONS.map((section) => (
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
            <h2 className="h3">Wichtiger Hinweis</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Diese Nutzungsbedingungen enthalten produktspezifische Schutz- und Haftungsregelungen für den Einsatz von
              E-Mail-Automatisierung. Sie stellen keine individuelle Rechtsberatung dar.
            </p>
          </article>
        </Container>
      </section>
    </PageShell>
  );
}
