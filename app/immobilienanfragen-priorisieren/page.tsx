import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "10. April 2026";

const summary = [
  "Immobilienanfragen zu priorisieren heißt nicht, einfach die lauteste Nachricht zuerst zu beantworten. Gute Priorisierung ordnet Anfragen nach nächstem sinnvollen Schritt, Risiko und Reifegrad.",
  "Der häufigste Fehler ist, Standardfälle, echte Chancen, Dubletten und Sonderfälle im selben Stapel zu behandeln. Dadurch verlieren Teams gleichzeitig Geschwindigkeit und Qualität.",
  "Schnelle Reaktion bleibt wichtig. Aber entscheidend ist, welche Anfrage zuerst die richtige Bearbeitung bekommt: sofort antworten, gezielt qualifizieren, freigeben, bündeln oder bewusst archivieren.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#signale", label: "Welche Signale zählen" },
  { href: "#matrix", label: "Priorisierungsmatrix" },
  { href: "#arbeitslogik", label: "Arbeitslogik im Team" },
  { href: "#fehler", label: "Typische Fehler" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von onOffice, Propstack, FLOWFACT und Harvard Business Review mit Advaics operativer Sicht auf Anfrageeingang und Antwortpfade.",
  "Priorisierung wird hier nicht als abstraktes Lead-Scoring verstanden, sondern als konkrete Entscheidung über den nächsten sinnvollen Schritt im Makleralltag.",
  "Die Empfehlungen sind bewusst konservativ: lieber klare Regeln mit wenigen Prioritätsstufen als komplizierte Punktesysteme, die im Alltag niemand pflegt.",
];

const signalCards = [
  {
    title: "Objekt- und Quellenklarheit",
    text: "Eine Anfrage mit sauberem Objektbezug und nachvollziehbarer Quelle ist grundsätzlich besser priorisierbar als eine lose Nachricht ohne Kontext.",
  },
  {
    title: "Reifegrad des Interesses",
    text: "Besichtigungswunsch, konkrete Rückfrage oder erkennbare nächste Handlung sind stärkere Signale als allgemeines Erstinteresse ohne Richtung.",
  },
  {
    title: "Zeitkritik und Erwartungsdruck",
    text: "Portalanfragen, Terminbezug oder eine sichtbare laufende Vermarktung erhöhen den Druck auf zügige Reaktion, aber nicht jede Eile rechtfertigt automatische Behandlung.",
  },
  {
    title: "Risiko und Sonderfall",
    text: "Beschwerden, Konflikte, Preisverhandlungen, widersprüchliche Angaben oder heikle Aussagen gehören trotz hoher Wichtigkeit nicht in normale Schnellpfade.",
  },
];

const priorityRows = [
  {
    category: "A1 Sofort persönlich oder gezielt weiterführen",
    case: "Klare Anfrage mit sauberem Objektbezug, vollständigem Rückkanal und erkennbarem nächstem Schritt wie Besichtigung oder konkrete Rückfrage",
    nextStep: "Sofort beantworten oder direkt in Qualifizierung oder Terminpfad überführen",
    reason: "Hohe Abschlussnähe oder hoher Erwartungsdruck bei geringem Klärungsbedarf",
  },
  {
    category: "A2 Schnell standardisiert beantworten",
    case: "Standardfrage zu Exposé, Verfügbarkeit, Unterlagen oder nächstem Schritt bei stabilem Kontext",
    nextStep: "Schnelle Standardantwort, danach geordnet weiterführen",
    reason: "Hoher Geschwindigkeitswert bei geringem inhaltlichem Risiko",
  },
  {
    category: "B Gezielt qualifizieren",
    case: "Relevante Anfrage mit erkennbarem Interesse, aber noch unklaren Angaben, fehlendem Rückkanal oder unscharfem nächsten Schritt",
    nextStep: "Rückfrage stellen, Informationen ergänzen, Exposé- oder Qualifizierungspfad nutzen",
    reason: "Potenzial vorhanden, aber zu früh für Termin oder Vollbearbeitung",
  },
  {
    category: "C Prüfen und zusammenführen",
    case: "Dubletten, zeitversetzte Portal-E-Mails, unklare Zuordnung oder widersprüchliche Eingangssignale",
    nextStep: "Kontext klären, zusammenführen, danach neu priorisieren",
    reason: "Falsche Eile erzeugt hier besonders leicht doppelte oder widersprüchliche Kommunikation",
  },
  {
    category: "S Sonderfall mit hoher Priorität",
    case: "Beschwerde, Preisverhandlung, Konflikt, sensible Aussage oder reputationskritische Nachricht",
    nextStep: "Bewusst manuell prüfen und priorisiert freigeben",
    reason: "Wichtig und oft zeitkritisch, aber nicht standardisierbar",
  },
  {
    category: "D Archivieren oder ignorieren",
    case: "Spam, Rundmail, interner Lärm oder keine echte Interessenten-Anfrage",
    nextStep: "Nicht in den normalen Antwortpfad ziehen",
    reason: "Nur so bleibt die Queue für echte Anfragen sauber",
  },
];

const workRules = [
  {
    title: "A-Stapel: sofort sichtbar und klein halten",
    text: "Nur Anfragen mit echtem Zeit- oder Reifevorteil gehören hier hinein. Ein zu großer A-Stapel ist meist ein Zeichen fehlender Regeln.",
  },
  {
    title: "B-Stapel: gleiche Tageslogik statt Hektik",
    text: "Viele gute Anfragen sind nicht sofort terminreif. Sie brauchen noch heute Aufmerksamkeit, aber nicht dieselbe Reaktion wie ein klarer Besichtigungsfall.",
  },
  {
    title: "C-Stapel: feste Prüfblöcke statt Dauerunterbrechung",
    text: "Dubletten, unklare Quellen und technische Sonderfälle sollten gebündelt geprüft werden, damit sie nicht ständig den Fluss der echten Bearbeitung unterbrechen.",
  },
  {
    title: "S-Fälle: manuell, aber nicht hinten anstellen",
    text: "Beschwerden oder heikle Fälle dürfen nicht automatisiert werden, sollten aber trotzdem mit klarer Dringlichkeit sichtbar sein.",
  },
];

const commonMistakes = [
  "Jede neue Nachricht automatisch als hohe Priorität behandeln und damit die eigentlichen Chancen im Rauschen verstecken.",
  "Nur nach Antwortgeschwindigkeit steuern, ohne zwischen Standardfall, Qualifizierungsfall und Sonderfall zu unterscheiden.",
  "Beschwerden und Verhandlungen wie normale Anfragen in denselben Auto- oder Follow-up-Pfad zu schicken.",
  "Dubletten oder zeitversetzte Portalverarbeitung zu spät erkennen und dadurch doppelte Kommunikation auslösen.",
];

const kpis = [
  "Median-Zeit bis zur ersten sinnvollen Priorisierungsentscheidung",
  "Anteil Anfragen, die beim ersten Bearbeitungsschritt der richtigen Prioritätsstufe zugeordnet werden",
  "Freigabequote bei Sonderfällen und heiklen Anfragen",
  "Quote doppelt bearbeiteter oder widersprüchlich beantworteter Anfragen",
  "Anteil B-Fälle, die noch am selben Tag qualifiziert werden",
  "Anteil A-Fälle, die ohne unnötige Rückfragen in Besichtigung oder nächsten klaren Schritt übergehen",
];

const faqItems = [
  {
    question: "Was ist der Unterschied zwischen Priorisierung und Qualifizierung?",
    answer:
      "Priorisierung entscheidet, was zuerst Aufmerksamkeit braucht. Qualifizierung entscheidet, welcher nächste Schritt fachlich sinnvoll ist. Beides hängt zusammen, ist aber nicht dasselbe.",
  },
  {
    question: "Sollten Beschwerden immer höchste Priorität haben?",
    answer:
      "Ja in der Sichtbarkeit, aber nicht im Standardpfad. Beschwerden sind meist dringlich, gehören aber nicht in automatische oder normale Schnellantwortprozesse.",
  },
  {
    question: "Reicht ein Lead-Score für die Priorisierung aus?",
    answer:
      "Meist nicht. Im Makleralltag ist eine klare Prioritätslogik mit sichtbaren Regeln hilfreicher als ein abstrakter Score, dessen Bedeutung im Team niemand sauber lebt.",
  },
  {
    question: "Wie viele Prioritätsstufen sind sinnvoll?",
    answer:
      "Für die meisten Maklerbüros reichen vier bis fünf Arbeitsstufen plus Sonderfälle. Mehr Stufen klingen präzise, machen die tägliche Arbeit aber oft langsamer.",
  },
];

const sources = [
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Reaktionsgeschwindigkeit wichtig bleibt, aber nur dann wirtschaftlich wirkt, wenn sie auf die richtigen Fälle angewendet wird.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zu Abbruchbedingungen, Portalerkennung, Dublettenprüfung und manueller Weiterbearbeitung.",
  },
  {
    label: "onOffice Hilfe: Interessenten – Von Abgesagt bis Vertrag",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/immobiliendetailansicht/interessenten-ueberblick/interessentenreiter-abgesagt-expose-besichtigung-vertrag/",
    note: "Offizielle Einordnung von Reifegraden und der Bewegung zwischen Exposé, Besichtigung und Vertrag.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Quelle zu Quellenlogik, API- oder XML-Bedingungen und der Trennung von Anfragen gegenüber sonstigen Aktivitäten.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zu Statussichtbarkeit, Dubletten-Check und zentralem Überblick über eingehende Portalanfragen.",
  },
  {
    label: "FLOWFACT Serviceportal: Zuordnung neuer Deals",
    href: "https://service.flowfact.de/hc/de/articles/10027504066589-Zuordnung-neuer-Deals",
    note: "Offizielle Dokumentation zur Trennung von neuen Anfragen und späteren Qualifizierungsstufen im Prozess.",
  },
  {
    label: "FLOWFACT Serviceportal: Dublettenprüfung bei der Anfragenverarbeitung",
    href: "https://service.flowfact.de/hc/de/articles/4417428216081-Dublettenpr%C3%BCfung-bei-der-Anfragenverarbeitung",
    note: "Offizielle Quelle zu Kontaktabgleich, Dublettenlogik und zentraler Bearbeitung eingehender Anfragen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Immobilienanfragen priorisieren 2026: Welche Anfragen zuerst bearbeitet werden sollten",
  ogTitle: "Immobilienanfragen priorisieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Immobilienanfragen nach Reifegrad, Risiko und nächstem sinnvollen Schritt priorisiert werden statt nur nach Gefühl oder Geschwindigkeit.",
  path: "/immobilienanfragen-priorisieren",
  template: "guide",
  eyebrow: "Anfrage-Priorisierung",
  proof:
    "Gute Priorisierung trennt Standardfälle, echte Chancen, Dubletten und Sonderfälle sauber nach dem nächsten sinnvollen Schritt.",
});

export default function ImmobilienanfragenPriorisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Immobilienanfragen priorisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-10",
        mainEntityOfPage: `${siteUrl}/immobilienanfragen-priorisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Immobilienanfragen priorisieren", "Makler", "Lead Routing", "Anfragenmanagement"],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
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
        { name: "Immobilienanfragen priorisieren", path: "/immobilienanfragen-priorisieren" },
      ]}
      schema={schema}
      kicker="Anfrage-Priorisierung"
      title="Wie Makler Immobilienanfragen sinnvoll priorisieren"
      description="Priorisierung ist mehr als schnell antworten. Entscheidend ist, welche Anfragen sofort weitergeführt, welche erst qualifiziert, welche zusammengeführt und welche bewusst manuell behandelt werden."
      actions={
        <>
          <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
            Anfragenqualifizierung
          </Link>
          <Link href="/signup?entry=immobilienanfragen-priorisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Matrix oder zu den Teamregeln springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#matrix" className="btn-secondary w-full justify-center">
              Matrix
            </MarketingJumpLink>
            <MarketingJumpLink href="#arbeitslogik" className="btn-secondary w-full justify-center">
              Teamregeln
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienanfragen-priorisieren"
      primaryHref="/signup?entry=immobilienanfragen-priorisieren-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Portalanfragen, Prozessstufen, Dublettenlogik und Reaktionsgeschwindigkeit. Die konkrete Prioritätsmatrix sollten Sie immer am eigenen Anfragebestand kalibrieren."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Priorisierung, Freigabepfade und
                Antwortqualität im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite gelesen werden sollte</h2>
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

      <section id="signale" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Signale bei der Priorisierung wirklich zählen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Priorisierung ist eine Mischung aus Klarheit, Reifegrad und Risiko. Geschwindigkeit ist nur ein
              Teil davon.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {signalCards.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="matrix" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Eine praxistaugliche Priorisierungsmatrix für Immobilienanfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Matrix ist absichtlich operativ formuliert. Sie ordnet nicht nur Wichtigkeit zu, sondern direkt den
              nächsten sinnvollen Bearbeitungspfad.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={priorityRows}
            rowKey={(item) => item.category}
            columns={[
              { key: "category", label: "Priorität", emphasize: true },
              { key: "case", label: "Typischer Fall" },
              { key: "nextStep", label: "Nächster Schritt" },
              { key: "reason", label: "Warum" },
            ]}
          />
        </Container>
      </section>

      <section id="arbeitslogik" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wie kleine Maklerteams die Priorisierung im Alltag stabil halten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Priorisierung funktioniert nur, wenn sie als Arbeitslogik sichtbar ist. Sonst landen auch gute Regeln am
              Ende wieder im Bauchgefühl einzelner Personen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {workRules.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Sinnvolle Anschlussseiten</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                Anfragenqualifizierung
              </Link>
              <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                Besichtigungsanfragen
              </Link>
              <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                Antwortzeit
              </Link>
              <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                ImmoScout-Anfragen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="fehler" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Typische Fehler bei der Priorisierung</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {commonMistakes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Nicht alles Dringliche ist automatisierbar</h2>
              <p className="helper mt-3">
                Sonderfälle und Beschwerden sind oft wichtig, aber gerade deshalb nichts für Standardpfade.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für eine belastbare Priorisierungslogik</h2>
              <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                {kpis.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Nächster Hebel</p>
              <h2 className="h3 mt-3">Priorisierung wirkt erst mit klaren Folgepfaden</h2>
              <p className="helper mt-3">
                Sobald Prioritäten sauber gesetzt sind, entscheiden Qualifizierung, Besichtigungspfad und Nachfassen über
                die eigentliche Prozessqualität.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/portalanfragen-priorisieren" className="btn-secondary">
                  Portalanfragen priorisieren
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Immobilienanfragen nachfassen
                </Link>
                <Link href="/besichtigung-bestaetigen" className="btn-secondary">
                  Besichtigung bestätigen
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section id="faq" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen</h2>
          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
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
