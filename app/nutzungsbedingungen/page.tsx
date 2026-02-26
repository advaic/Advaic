import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

const sections = [
  {
    title: "1) Geltungsbereich",
    points: [
      "Diese Bedingungen gelten für die Nutzung von Advaic als SaaS-Anwendung zur E-Mail-Automatisierung für Immobilienmakler.",
      "Mit Registrierung und Nutzung des Kontos akzeptieren Sie diese Bedingungen in der jeweils aktuellen Fassung.",
    ],
  },
  {
    title: "2) Leistungsbeschreibung",
    points: [
      "Advaic unterstützt bei der Erkennung, Erstellung und dem Versand von Antworten auf Interessenten-Anfragen.",
      "Autopilot-Funktionen arbeiten auf Basis Ihrer Regeln, Guardrails und Qualitätschecks.",
      "Unklare oder risikobehaftete Fälle werden zur Freigabe vorgelegt.",
    ],
  },
  {
    title: "3) Pflichten des Nutzers",
    points: [
      "Sie stellen sicher, dass Ihre Angaben vollständig und korrekt sind.",
      "Sie prüfen Freigaben, Regeln und Konfigurationen regelmäßig und halten diese aktuell.",
      "Sie nutzen das Produkt nur im Einklang mit geltendem Recht und ohne missbräuchliche Zwecke.",
    ],
  },
  {
    title: "4) Verfügbarkeit und Änderungen",
    points: [
      "Wir entwickeln Advaic laufend weiter und können Funktionen anpassen, wenn Sicherheit, Stabilität oder Produktqualität dies erfordern.",
      "Geplante, wesentliche Änderungen kommunizieren wir transparent über Website oder In-Produkt-Hinweise.",
    ],
  },
  {
    title: "5) Preise, Testphase und Kündigung",
    points: [
      "Es gilt eine 14-tägige Testphase gemäß aktuellem Preismodell auf der Preis-Seite.",
      "Nach Ende der Testphase ist für die weitere Nutzung ein aktives, kostenpflichtiges Abo erforderlich.",
      "Details zu Laufzeit, Kündigung und Abrechnung richten sich nach dem jeweils gebuchten Tarif.",
    ],
  },
  {
    title: "6) Haftung und Verantwortung",
    points: [
      "Advaic ist ein Assistenzsystem. Die fachliche und rechtliche Verantwortung für versendete Inhalte verbleibt beim Nutzer.",
      "Für Schäden haften wir im Rahmen der gesetzlichen Vorschriften.",
      "Diese Seite ersetzt keine individuelle Rechtsberatung.",
    ],
  },
];

export default function NutzungsbedingungenPage() {
  const legalEmail =
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ||
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ||
    "support@advaic.com";

  return (
    <PageShell withProofLayer={false}>
      <PageIntro
        kicker="Rechtliches"
        title="Nutzungsbedingungen"
        description="Rahmenbedingungen für die Nutzung von Advaic. Stand: 26. Februar 2026."
        actions={
          <>
            <Link href="/preise" className="btn-secondary">
              Preise ansehen
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
            <p className="helper">
              Diese Nutzungsbedingungen regeln die vertraglichen Grundsätze für den Zugang zu Advaic. Ergänzend gelten
              unsere{" "}
              <Link href="/datenschutz" className="underline underline-offset-4">
                Datenschutzhinweise
              </Link>{" "}
              und die Angaben zu{" "}
              <Link href="/cookie-und-storage" className="underline underline-offset-4">
                Cookie & Storage
              </Link>
              .
            </p>
          </article>

          <div className="mt-6 space-y-4">
            {sections.map((section) => (
              <article key={section.title} className="card-base p-6 md:p-8">
                <h2 className="h3">{section.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
