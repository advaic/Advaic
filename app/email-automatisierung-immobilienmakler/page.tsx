import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "E-Mail-Automatisierung hilft Maklerbüros vor allem bei wiederkehrenden Interessenten-Anfragen mit klarem Objektbezug und ähnlichen nächsten Schritten.",
  "Der eigentliche Hebel ist nicht schneller Text, sondern eine saubere Entscheidung zwischen automatisch senden, zur Freigabe legen und bewusst manuell bearbeiten.",
  "Ein guter Start ist zurückhaltend: wenige klare Antworttypen, sichtbare Qualitätsprüfungen, hohe Freigabequote und erst danach kontrollierter Ausbau.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#fit", label: "Wann es sich lohnt" },
  { href: "#voraussetzungen", label: "Voraussetzungen" },
  { href: "#antworttypen", label: "Geeignete Antworttypen" },
  { href: "#rollout", label: "Einführung" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Empfehlungen verbinden aktuelle Herstellerquellen zu Anfrageverarbeitung und Sequenzen mit allgemeiner Forschung zur Reaktionsgeschwindigkeit digitaler Leads.",
  "Entscheidend ist nicht maximale Automatisierung, sondern ein Betriebsmodell, das Standardfälle, Freigabefälle und manuelle Ausnahmen sauber trennt.",
  "Die Beispiele auf dieser Seite sind für Maklerbüros mit echtem Anfrageeingang gedacht, nicht für allgemeine Newsletter- oder Marketing-Automatisierung.",
];

const fitSignals = [
  "Es gibt regelmäßiges Anfragevolumen mit ähnlichen Erstantworten zu Verfügbarkeit, Unterlagen, Besichtigung oder nächsten Standardschritten.",
  "Das Team verliert heute Zeit vor allem an wiederkehrender E-Mail-Arbeit und nicht nur an wenigen komplexen Einzelfällen.",
  "Sie wollen Reaktionszeit senken, ohne Preisverhandlungen, Beschwerden oder Ausnahmesituationen blind zu automatisieren.",
];

const nonFitSignals = [
  "Es gibt kaum wiederkehrende Muster im Anfrageeingang.",
  "Objektdaten, Zuständigkeiten und Antwortregeln sind intern noch zu uneinheitlich gepflegt.",
  "Ein großer Teil der Kommunikation ist verhandlungsnah, konfliktbehaftet oder stark vom Einzelfall abhängig.",
];

const prerequisites = [
  {
    title: "Antworttypen festlegen",
    text: "Sie sollten vorab benennen können, welche E-Mails standardisierbar sind und welche immer manuell bleiben.",
  },
  {
    title: "Pflichtangaben definieren",
    text: "Objektbezug, Quelle, Kontakt und notwendige Mindestinformationen müssen vor dem Versand ausreichend klar sein.",
  },
  {
    title: "Freigabegrenzen festlegen",
    text: "Unklare Fälle, sensible Aussagen, Beschwerden oder Konflikte brauchen definierte Übergaben statt improvisierter Ausnahmen.",
  },
  {
    title: "Tägliche Rückschleife sichern",
    text: "Im Pilotbetrieb muss jemand Freigaben, Korrekturen und Fehlgründe konsequent prüfen. Sonst lernt das System nichts Sinnvolles.",
  },
];

const responseScopes = [
  {
    title: "Gut automatisierbar",
    text: "Erstantworten zu Verfügbarkeit, Exposé, Unterlagen, Besichtigung und nächsten Standardschritten bei klarer Datenlage.",
  },
  {
    title: "Nur mit Freigabe",
    text: "Unklarer Objektbezug, fehlende Angaben, mögliche Dubletten, irritierte Rückfragen oder Fälle mit unsicherem Tonfall.",
  },
  {
    title: "Bewusst manuell halten",
    text: "Preisverhandlungen, Beschwerden, Sonderwünsche, Eskalationen und andere reputativ oder rechtlich sensible Kommunikation.",
  },
];

const operatingPrinciples = [
  {
    title: "Automatisierung beginnt am Eingang",
    text: "Wenn relevante Anfragen, Dubletten, Systemmails und internes Rauschen nicht sauber getrennt werden, ist jede Folgeentscheidung von Anfang an unsicher.",
  },
  {
    title: "Objekt- und Kontextbezug sind Pflicht",
    text: "Eine gut formulierte Mail hilft wenig, wenn Objekt, Historie oder Zuständigkeit nicht stimmen. Die Arbeitsbasis ist wichtiger als Formulierung.",
  },
  {
    title: "Freigabe ist kein Rückschritt",
    text: "Ein vorsichtiger Start mit hoher Freigabequote ist oft das bessere Modell als ein zu früher hoher Anteil automatischer Antworten mit unnötigen Fehlversendungen.",
  },
  {
    title: "Ausbau nur über echte Kennzahlen",
    text: "Mehr Automatisierung sollte erst folgen, wenn Antwortzeit, Freigabequote und Qualitätsverlauf stabil belegen, dass der Prozess trägt.",
  },
];

const rolloutPlan = [
  {
    title: "Woche 1: Eingang und Standardfälle sichtbar machen",
    text: "Quellen, Anfragearten, Objektbezug und häufigste Erstantworten erfassen. Ziel ist Transparenz, nicht Vollausbau.",
  },
  {
    title: "Woche 2: Regeln und Freigaben schärfen",
    text: "Antworttypen, Pflichtangaben, Freigabegrenzen und Ausnahmen mit echten Fällen kalibrieren.",
  },
  {
    title: "Woche 3: Erste Automatik zurückhaltend aktivieren",
    text: "Nur für wenige klar prüfbare Standardfälle automatischen Versand erlauben. Alles Unsichere bleibt in der Freigabe.",
  },
  {
    title: "Woche 4: Nach Kennzahlen entscheiden",
    text: "Erstreaktionszeit, Freigabequote, Korrekturgründe und manuellen Aufwand auswerten. Erst dann sollte der Anteil automatischer Antworten steigen.",
  },
];

const kpis = [
  {
    title: "Erstreaktionszeit",
    text: "Zeigt, ob der operative Engpass im Eingang tatsächlich kleiner wird und Interessenten schneller eine erste sinnvolle Antwort erhalten.",
  },
  {
    title: "Freigabequote",
    text: "Macht sichtbar, wie viele Fälle bewusst geprüft werden. Zu hoch kann auf schwache Regeln hinweisen, zu niedrig auf zu viel Risiko.",
  },
  {
    title: "Korrekturgründe vor Versand",
    text: "Zeigt, ob Probleme eher bei Objektbezug, Ton, Vollständigkeit oder falscher Einordnung entstehen.",
  },
  {
    title: "Manuelle Minuten pro Standardfall",
    text: "Misst, ob die Automatisierung wirklich entlastet oder nur neue Prüfschritte auf vorhandene Arbeit legt.",
  },
  {
    title: "Antwort- oder Terminquote nach Erstantwort",
    text: "Nicht jede versendete Mail ist wertvoll. Entscheidend ist, ob aus Standardanfragen schneller ein geklärter nächster Schritt wird.",
  },
];

const advaicFit = [
  "Wenn der Engpass im Maklerbüro nicht primär das CRM selbst, sondern die operative Antwortlogik im Anfrageeingang ist.",
  "Wenn Sie nachvollziehbar steuern wollen, warum eine Nachricht automatisch rausgeht, in die Freigabe wandert oder bewusst manuell bleibt.",
  "Wenn Sie eine spezialisierte Ausführungsschicht für Makleranfragen suchen und keine allgemeine Marketing-Automatisierung.",
];

const advaicNotFit = [
  "Wenn Kontakte, Objekte und Zuständigkeiten noch nicht ausreichend gepflegt sind und zuerst die Arbeitsbasis fehlt.",
  "Wenn fast jede relevante E-Mail stark individuell, konfliktbeladen oder verhandlungsnah ist.",
  "Wenn Sie vor allem Kampagnen, Newsletter oder breite Vertriebsstrecken automatisieren möchten.",
];

const faqItems = [
  {
    question: "Welche E-Mails lassen sich bei Maklern gut automatisieren?",
    answer:
      "Vor allem wiederkehrende Erstantworten mit klarem Objektbezug und ähnlichen nächsten Schritten, etwa zu Verfügbarkeit, Unterlagen, Besichtigung oder allgemeinem Ablauf.",
  },
  {
    question: "Welche E-Mails sollten nicht automatisch versendet werden?",
    answer:
      "Preisverhandlungen, Beschwerden, Ausnahmen, Konfliktfälle und Nachrichten mit unklarem Objektbezug oder fehlenden Angaben sollten in die Freigabe oder in die manuelle Bearbeitung gehen.",
  },
  {
    question: "Wann lohnt sich E-Mail-Automatisierung noch nicht?",
    answer:
      "Wenn kaum wiederkehrende Muster vorhanden sind oder die Datenlage zu Objekten, Zuständigkeiten und Standardantworten noch zu unsauber ist. Dann lohnt sich zuerst Prozessarbeit.",
  },
  {
    question: "Ist E-Mail-Automatisierung das Gleiche wie Maklersoftware?",
    answer:
      "Nein. Maklersoftware oder CRM verwalten Kontakte, Objekte und Prozesse breiter. Diese Seite meint die operative Automatisierung wiederkehrender Anfragekommunikation.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die operative Bedeutung schneller Reaktion auf digitale Interessenten-Anfragen.",
  },
  {
    label: "onOffice Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Praxisnahe Herstellerquelle zu Anfrageprozess, Adressanlage und automatischer Verarbeitung.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Herstellerseite zu Portalanfragen, Dubletten-Check, Exposéversand und Statussichtbarkeit.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Praxisnahe Herstellerquelle zur Definition und Einordnung eingehender Anfragen.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sendefenstern, Werktagen und Ablaufsteuerung automatisierter E-Mail-Folgen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automationsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "E-Mail-Automatisierung für Immobilienmakler 2026",
  ogTitle: "E-Mail-Automatisierung für Immobilienmakler 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: wann sich E-Mail-Automatisierung lohnt, welche Antworttypen sich eignen und wie ein sicherer Start mit Freigabe und Kennzahlen aussieht.",
  path: "/email-automatisierung-immobilienmakler",
  template: "guide",
  eyebrow: "E-Mail-Automatisierung",
  proof: "Gute E-Mail-Automatisierung trennt Standardfälle, Freigaben und manuelle Ausnahmen sauber.",
});

export default function EmailAutomatisierungImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "E-Mail-Automatisierung für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/email-automatisierung-immobilienmakler`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: [
          "E-Mail-Automatisierung",
          "Immobilienmakler",
          "Anfrageprozess",
          "Freigabe",
          "Qualitätschecks",
        ],
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
        { name: "E-Mail-Automatisierung für Immobilienmakler", path: "/email-automatisierung-immobilienmakler" },
      ]}
      schema={schema}
      kicker="E-Mail-Automatisierung"
      title="E-Mail-Automatisierung für Immobilienmakler: wo sie hilft und wo sie stoppen muss"
      description="Diese Seite zeigt, wann E-Mail-Automatisierung im Makleralltag wirklich sinnvoll ist, welche Antworttypen sich eignen und warum Freigabegrenzen wichtiger sind als pauschale Vollautomatik."
      actions={
        <>
          <Link href="/manuell-vs-advaic" className="btn-secondary">
            Vergleich öffnen
          </Link>
          <Link href="/signup?entry=email-automatisierung-immobilienmakler" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Antworttypen oder zum Einführungsplan springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#antworttypen" className="btn-secondary w-full justify-center">
              Antworttypen
            </MarketingJumpLink>
            <MarketingJumpLink href="#rollout" className="btn-secondary w-full justify-center">
              Einführung
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="email-automatisierung-immobilienmakler"
      primaryHref="/signup?entry=email-automatisierung-stage"
      primaryLabel="Kontrolliert testen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle Herstellerinformationen zu Anfrageverarbeitung und E-Mail-Abläufen mit allgemeiner Forschung zu Reaktionsgeschwindigkeit und kontrollierter Automatisierung."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Antwortlogik, Freigaben und kontrollierte
                E-Mail-Automatisierung für Maklerbüros.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite zu lesen ist</h2>
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

      <section id="fit" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wann sich E-Mail-Automatisierung im Makleralltag wirklich lohnt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der beste Fit entsteht dort, wo viele ähnliche Interessenten-Anfragen mit klaren nächsten Schritten
              auftreten. Schwierig wird es überall dort, wo Objektbezug, Tonlage oder inhaltliche Lage vor dem Versand
              jedes Mal neu bewertet werden müssen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h3 className="h3">Guter Fit</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {fitSignals.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6 md:p-8">
              <h3 className="h3">Noch kein guter Fit</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {nonFitSignals.map((item) => (
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

      <section id="voraussetzungen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Vier Voraussetzungen vor dem Start</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Einführungen scheitern nicht am Modell, sondern an fehlenden Regeln. Wer vorher nicht sauber
              festlegt, was überhaupt automatisiert werden darf, erzeugt nur schnellere Unsicherheit.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {prerequisites.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {operatingPrinciples.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="antworttypen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Antworttypen sich eignen und welche nicht</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute E-Mail-Automatisierung trennt nicht nach Wunschliste, sondern nach tatsächlicher Prüfbarkeit im
              Anfrageprozess. Genau diese Trennung entscheidet über Qualität und Risiko.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {responseScopes.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="rollout" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Einführungsplan für 30 Tage</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein zurückhaltender Start ist im Makleralltag fast immer robuster als eine frühe Vollautomatik. Ziel der
              ersten Wochen ist nicht maximale Reichweite, sondern ein belastbarer Prozess mit echten Lernschleifen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rolloutPlan.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Kennzahlen, die über Ausbau oder Stopp entscheiden</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Mehr Automatisierung ist nur dann sinnvoll, wenn sie im Alltag Zeit spart und gleichzeitig die
              Antwortqualität stabil hält. Genau das sollten die Kennzahlen transparent machen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <DecisionSimulator
        title="Direkt prüfen: Wie entscheidet Advaic?"
        description="Mit diesen Beispielen sehen Sie in Sekunden, wann automatischer Versand greift und wann Freigabe verpflichtend ist."
      />

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn der Engpass im Anfrageprozess liegt</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                  Anfrageautomation
                </Link>
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn zuerst Grundlagen fehlen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicNotFit.map((item) => (
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

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
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
