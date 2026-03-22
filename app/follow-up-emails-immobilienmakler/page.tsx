import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "21. März 2026";

const summary = [
  "Gute Nachfass-E-Mails erinnern an eine offene Anfrage, ohne Druck aufzubauen oder den Kontext zu verlieren.",
  "Es gibt keine universell perfekte Taktung. Ein konservativer Start mit klaren Stopp-Regeln ist fast immer besser als aggressive Sequenzen.",
  "Für Makler zählt vor allem, ob Nachfassungen bei Antwort, Terminbuchung, Kontextwechsel oder Risikosignalen sofort stoppen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#grundregeln", label: "Grundregeln" },
  { href: "#cadence", label: "Konservative Taktung" },
  { href: "#stop", label: "Stop-Regeln" },
  { href: "#kpis", label: "Kennzahlen" },
  { href: "#advaic", label: "Mit Advaic" },
];

const methodology = [
  "Die Empfehlungen basieren auf offiziellen HubSpot-Dokumenten zu Sequenzen und automatischer Beendigung, auf HBR zur Geschwindigkeit digitaler Leads und auf Advaics operativer Nachfasslogik.",
  "Die Taktungsbeispiele unten sind Startpunkte für den Makleralltag, keine universellen Branchenregeln. Teamgröße, Markt, Objekttyp und bestehende Reaktionszeit verändern, was im Alltag sinnvoll ist.",
  "Der Schwerpunkt liegt bewusst auf hilfreichem, kontrolliertem Nachfassen statt auf maximaler Kontaktfrequenz.",
];

const coreRules = [
  {
    title: "Nur auf echte offene Fragen nachfassen",
    text: "Nachfassen sollte ein offenes Gespräch weiterführen und kein Massenmuster ohne Bezug versenden.",
  },
  {
    title: "Im selben E-Mail-Verlauf bleiben, wenn das dem Empfänger hilft",
    text: "Gerade bei Makleranfragen hilft derselbe E-Mail-Verlauf, damit Interessenten nicht neu sortieren müssen, worum es ging.",
  },
  {
    title: "Sofort stoppen, wenn der Kontext kippt",
    text: "Antwort, Termin, Abwesenheitsnotiz, Konflikt oder neue Information sind klare Gründe zum Stoppen oder Prüfen.",
  },
  {
    title: "Nie Frequenz vor Relevanz stellen",
    text: "Eine gute Nachfasslogik erhöht nicht die Anzahl versendeter Mails, sondern die Zahl sinnvoller Erinnerungen.",
  },
];

const cadenceSteps = [
  {
    title: "Stufe 1: 24 bis 48 Stunden nach der ersten Antwort",
    text: "Geeignet für frische, zeitnahe Anfragen mit hoher Abschlussnähe. Der Ton sollte kurz, hilfreich und konkret bleiben.",
  },
  {
    title: "Stufe 2: weitere 48 bis 72 Stunden später",
    text: "Nur wenn weiterhin keine Antwort vorliegt und das Thema noch aktuell ist. Die zweite Stufe sollte eher Klarheit schaffen als Druck erhöhen.",
  },
  {
    title: "Danach meist stoppen oder manuell prüfen",
    text: "Spätestens nach zwei Stufen sollte geprüft werden, ob weiteres Nachfassen noch hilfreich ist oder bereits Reibung erzeugt.",
  },
];

const stopRules = [
  "Der Interessent antwortet auf die Nachricht oder schreibt separat zurück.",
  "Ein Termin wird gebucht oder der nächste Schritt ist bereits bestätigt.",
  "Eine Abwesenheitsnotiz oder ein anderer Sonderfall erfordert eine manuelle Prüfung.",
  "Der Objekt- oder Anfragekontext hat sich verändert.",
  "Qualitäts- oder Risikoprüfungen schlagen vor Versand fehl.",
];

const messagePrinciples = [
  {
    title: "Hilfreich statt drängend",
    text: "Das Ziel ist Klarheit: Brauchen Sie noch Unterlagen, einen Termin oder weitere Infos? Nicht: künstliche Verknappung ohne echten Anlass.",
  },
  {
    title: "Ein nächster Schritt",
    text: "Jede Nachfass-E-Mail sollte einen einfachen nächsten Schritt enthalten: Unterlagen anfordern, Termin bestätigen, Rückfrage beantworten.",
  },
  {
    title: "Keine neue Unsicherheit erzeugen",
    text: "Wenn Angaben fehlen oder der Fall sensibel wird, geht die Mail nicht raus, sondern in die Freigabe oder in die manuelle Bearbeitung.",
  },
];

const kpis = [
  "Antwortquote nach der ersten Nachfass-Stufe",
  "Antwortquote nach der zweiten Nachfass-Stufe",
  "Quote automatisch gestoppter Nachfassungen durch Antwort oder Meeting",
  "Freigabequote bei Fällen mit Nachfassen",
  "Beschwerden, Abmeldungen oder negative Reaktionen nach dem Nachfassen",
];

const advaicFit = [
  "Advaic behandelt Nachfassen nicht als starres Mailing, sondern als Fortsetzung eines bestehenden Anfrageverlaufs.",
  "Vor jeder Nachfassmail greifen dieselben Qualitäts- und Risiko-Checks wie vor einer normalen Antwort.",
  "Wenn der Kontext kippt, ein Warnsignal auftaucht oder Informationen fehlen, landet der Fall nicht im Auto-Versand, sondern in der Freigabe.",
];

const faqs = [
  {
    question: "Wie viele Nachfass-E-Mails sind für Makler sinnvoll?",
    answer:
      "Für einen konservativen Start reichen meist ein bis zwei Stufen. Danach steigt die Gefahr, dass Nachfassungen eher stören als helfen.",
  },
  {
    question: "Soll eine Nachfass-E-Mail im selben Thread bleiben?",
    answer:
      "Oft ja, weil der Empfänger den Kontext direkt sieht. Genau deshalb verweisen viele Sequenz-Tools auf Antworten im selben Thread als hilfreiche Option.",
  },
  {
    question: "Wann sollte eine Nachfass-E-Mail nicht automatisch gesendet werden?",
    answer:
      "Sobald eine Antwort vorliegt, ein Termin gebucht wurde, der Kontext sich verändert hat oder ein Qualitäts- oder Risikosignal eine manuelle Prüfung sinnvoll macht.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die wirtschaftliche Bedeutung schneller, strukturierter Reaktion auf digitale Anfragen.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sequenzen, Sendefenstern, Geschäftstagen und Zeitsteuerung.",
  },
  {
    label: "HubSpot: Unenroll contacts from a sequence",
    href: "https://knowledge.hubspot.com/sequences/unenroll-from-sequence",
    note: "Offizielle Dokumentation zu automatischen Stoppsignalen wie Antwort, Termin oder Abmeldung vom Versand.",
  },
  {
    label: "HubSpot: Create an email thread in a sequence",
    href: "https://knowledge.hubspot.com/de/sequences/create-an-email-thread-with-your-sequence",
    note: "Offizielle Dokumentation dazu, wann Antworten im selben Thread in Sequenzen sinnvoll sind.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automationslogik.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Follow-up-E-Mails für Immobilienmakler",
  ogTitle: "Follow-up-E-Mails für Immobilienmakler | Advaic",
  description:
    "Leitfaden für Makler: Wie Follow-up-E-Mails sinnvoll getaktet, sauber gestoppt und im passenden E-Mail-Verlauf geführt werden, ohne Interessenten zu nerven.",
  path: "/follow-up-emails-immobilienmakler",
  template: "guide",
  eyebrow: "Leitfaden zum Nachfassen",
  proof: "Hilfreiches Nachfassen braucht Taktung, Kontext im Thread und harte Stop-Regeln.",
});

export default function FollowUpEmailsImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Follow-up-E-Mails für Immobilienmakler",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/follow-up-emails-immobilienmakler`,
        dateModified: "2026-03-21",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Follow-up-E-Mails", "Immobilienmakler", "Antworten im selben Thread", "Stop-Regeln", "Sequenzen"],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Follow-up-E-Mails für Immobilienmakler", path: "/follow-up-emails-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Leitfaden zum Nachfassen"
      title="Follow-up-E-Mails für Immobilienmakler: hilfreich nachfassen, sauber stoppen"
      description="Diese Seite zeigt, wie Makler Follow-up-E-Mails sinnvoll takten, wann Nachfassungen im selben E-Mail-Verlauf bleiben sollten und welche Stop-Regeln vor jeder automatischen Stufe Pflicht sind."
      actions={
        <>
          <Link href="/follow-up-logik" className="btn-secondary">
            Produktlogik ansehen
          </Link>
          <Link href="/signup?entry=follow-up-emails" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Taktung oder zu den Stop-Regeln springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#cadence" className="btn-secondary w-full justify-center">
              Taktung
            </MarketingJumpLink>
            <MarketingJumpLink href="#stop" className="btn-secondary w-full justify-center">
              Stop-Regeln
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="follow-up-emails-immobilienmakler"
      primaryHref="/signup?entry=follow-up-emails-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle offizielle Dokumentation zu Sequenzen und Stop-Logik mit einer allgemeinen Research- und Risikoperspektive. Die optimale Taktung hängt trotzdem immer von Ihrem Markt und Ihrem Antwortverhalten ab."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kurzfassung in 90 Sekunden</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {summary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base hidden p-6 lg:block">
              <p className="label">Inhaltsverzeichnis</p>
              <div className="mt-4 grid gap-2">
                {contents.map((item) => (
                  <MarketingJumpLink
                    key={item.href}
                    href={item.href}
                    className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] ring-1 ring-[var(--border)] transition hover:-translate-y-[1px]"
                  >
                    {item.label}
                  </MarketingJumpLink>
                ))}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section id="methodik" className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <p className="label">Autor & Stand</p>
              <h2 className="h3 mt-3">Advaic Redaktion</h2>
              <p className="helper mt-3">
                Produkt- und Prozessteam mit Fokus auf Antwortqualität, Stop-Logik und kontrolliertes Nachfassen für
                Maklerbüros.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Empfehlungen zu lesen sind</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {methodology.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section id="grundregeln" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Vier Grundregeln für gutes Nachfassen im Makleralltag</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {coreRules.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="cadence" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Konservative Taktung für den Start</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Abstände sind Startpunkte, keine starren Regeln. Entscheidend ist, ob Ihr Team im Alltag
              nachvollziehen kann, warum eine Stufe noch sinnvoll ist oder besser stoppt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {cadenceSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stop" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Stop-Regeln vor jeder weiteren Stufe</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {stopRules.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was eine gute Nachfass-E-Mail ausmacht</h2>
              <div className="space-y-4">
                {messagePrinciples.map((item) => (
                  <article key={item.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="helper mt-2">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section id="kpis" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Kennzahlen für die Steuerung des Nachfassens</h2>
            <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Wie Advaic Nachfassen steuert</h2>
            <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
              {advaicFit.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/follow-up-logik" className="btn-secondary">
                Nachfasslogik im Produkt
              </Link>
              <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                Anfragenmanagement
              </Link>
              <Link href="/qualitaetschecks" className="btn-secondary">
                Qualitätschecks
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <article key={item.question} className="card-base p-6 md:p-8">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.question}</h3>
                <p className="helper mt-3">{item.answer}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
