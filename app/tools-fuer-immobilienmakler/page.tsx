import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Makler brauchen selten einfach mehr Tools. Sie brauchen die richtigen Tool-Kategorien in der richtigen Reihenfolge.",
  "Die wichtigste Trennung ist nicht KI gegen Nicht-KI, sondern Datenbasis, Anfrageausführung, Vermarktung und Teamkommunikation.",
  "Die häufigsten Fehlkäufe entstehen, wenn ein Maklerbüro ein Tool für den falschen Engpass auswählt.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#kategorien", label: "Tool-Kategorien" },
  { href: "#buero-typ", label: "Was zu welchem Bürotyp passt" },
  { href: "#reihenfolge", label: "Sinnvolle Reihenfolge" },
  { href: "#advaic-fit", label: "Wann Advaic passt" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Search-Console-Signale von Advaic mit aktuellen Herstellerseiten aus Maklersoftware, CRM, Anfrageausführung und Vermarktung.",
  "Es gibt hier bewusst keinen künstlichen Gesamtsieger. Stattdessen ordnen wir Tools danach ein, welchen Engpass sie im Makleralltag tatsächlich lösen.",
  "Die Beispiele unten sind Marktbeispiele für Kategorien. Entscheidend ist nicht die längste Liste, sondern ob das Tool zu Datenlage, Teamgröße und Tagesgeschäft passt.",
];

const toolCategories = [
  {
    category: "Maklersoftware / CRM",
    examples: "onOffice, FLOWFACT, Propstack",
    solves: "Objekte, Kontakte, Pipeline, Aktivitäten, Portalprozesse und teamweite Datenpflege.",
    fit: "Die richtige Basis für Büros, die zuerst Übersicht, Struktur und verlässliche Stammdaten brauchen.",
    watch: "Ohne saubere Objekt- und Kontaktpflege trägt auch ein gutes CRM die Lücke nur weiter.",
  },
  {
    category: "Anfrageeingang & Antwortsteuerung",
    examples: "Advaic",
    solves: "Eingang prüfen, Antwortpfad steuern, Freigaben setzen, Qualität absichern und Nachfassen sauber dokumentieren.",
    fit: "Stark für Teams mit regelmäßigem Portal- oder Website-Volumen, bei denen das Postfach der operative Engpass ist.",
    watch: "Kein Ersatz für ein vollständiges CRM oder eine umfassende Objekt- und Dealverwaltung.",
  },
  {
    category: "Exposé-, Visual- und Vermarktungstools",
    examples: "ImmoStage, bloxl",
    solves: "Exposés, Visualisierungen, Homestaging, Vermarktungsmaterial und schnellere Objektpräsentation.",
    fit: "Hilfreich, wenn Vermarktungsgeschwindigkeit und Außenwirkung den größten Engpass bilden.",
    watch: "Hilft nicht dabei, eingehende Anfragen sauber zu priorisieren oder zu beantworten.",
  },
  {
    category: "Inbox-, Service- und Kommunikationstools",
    examples: "Zendesk, HubSpot Inbox",
    solves: "Gemeinsame Postfächer, Zuweisung, Status, teamweites Antworten und kanalübergreifende Kommunikation.",
    fit: "Sinnvoll für Teams mit vielen Zuständigkeiten, mehreren Kanälen oder starkem Service-Anteil.",
    watch: "Im Makleralltag fehlt oft die tiefere Logik für Objektbezug, Freigabegründe und standardisierte Erstantworten.",
  },
];

const officeFits = [
  {
    title: "Einzelmakler oder kleines Büro im Aufbau",
    text: "Fangen Sie mit der Datenbasis an. Eine gute Maklersoftware oder ein CRM schafft erst die Grundlage, auf der weitere Tools stabil wirken.",
  },
  {
    title: "Kleines Team mit viel Portalanfrage-Volumen",
    text: "Hier lohnt sich oft die Kombination aus Maklersoftware für Daten und einer zusätzlichen Anfrage-Schicht für Eingang, Freigabe und Antwortqualität.",
  },
  {
    title: "Büro mit starkem Vermarktungsfokus",
    text: "Wenn Exposé, Objektpräsentation und Vermarktungsmaterial zu langsam entstehen, bringen Visual- und Exposé-Tools oft zuerst mehr Wirkung als ein weiterer Systemwechsel.",
  },
  {
    title: "Team mit mehreren Kanälen und Zuständigkeiten",
    text: "Dann werden Inbox- und Kommunikationstools interessant. Sie helfen bei Zuweisung und Transparenz, lösen aber nicht automatisch die eigentliche Antwortlogik im Maklerprozess.",
  },
];

const rolloutOrder = [
  {
    title: "1) Zuerst die Arbeitsbasis stabilisieren",
    text: "Wenn Objekte, Kontakte und Zuständigkeiten noch nicht sauber geführt werden, hat Maklersoftware oder CRM klar Vorrang.",
  },
  {
    title: "2) Danach den Anfrageprozess schärfen",
    text: "Sobald die Datenbasis trägt, lohnt sich der Blick auf Antwortzeit, Freigabe, Qualitätskontrolle und Nachfassen.",
  },
  {
    title: "3) Dann Vermarktung beschleunigen",
    text: "Visual- und Exposé-Tools entfalten den größten Nutzen, wenn der operative Standardprozess bereits verlässlich läuft.",
  },
  {
    title: "4) Spezialtools nur bei echtem Engpass ergänzen",
    text: "Nicht jede neue App ist ein Fortschritt. Zusätzliche Tools sollten immer einen klar messbaren Engpass lösen.",
  },
];

const advaicFit = [
  "Ihr Team hat bereits eine Datenbasis, verliert aber im Anfragepostfach Zeit, Konsistenz oder Kontrolle.",
  "Sie möchten Auto-Senden nur für klar prüfbare Standardfälle erlauben und alles andere sichtbar in der Freigabe halten.",
  "Sie suchen keine weitere Allzweck-Plattform, sondern eine spezialisierte operative Schicht für Eingang, Entscheidung und Qualität.",
];

const advaicNotFit = [
  "Sie brauchen zuerst ein zentrales System für Kontakte, Objekte und Pipeline.",
  "Ihr Anfragevolumen ist sehr niedrig oder fast jede Nachricht ist stark individuell und verhandlungsnah.",
  "Das größere Problem liegt heute in Vermarktungsmaterial, nicht im Anfrageeingang oder der Antwortqualität.",
];

const faqItems = [
  {
    question: "Welche Tools brauchen Immobilienmakler wirklich zuerst?",
    answer:
      "In den meisten Büros zuerst Maklersoftware oder CRM als saubere Arbeitsbasis. Danach lohnt sich der Blick auf Anfrageprozess, Vermarktung oder Kommunikationstools.",
  },
  {
    question: "Reicht ein KI-Tool als Tool-Strategie aus?",
    answer:
      "Meist nein. Ein KI-Tool kann einzelne Texte beschleunigen, ersetzt aber keine Datenbasis, keine klare Anfrage-Logik und keine belastbare Prozessführung im Team.",
  },
  {
    question: "Wo ordnet sich Advaic in dieser Tool-Landschaft ein?",
    answer:
      "Advaic ist kein Makler-CRM, sondern eine spezialisierte Schicht für Anfrageeingang, Antwortsteuerung, Freigabe, Qualitätschecks und Nachfassen.",
  },
];

const sources = [
  {
    label: "Google: Creating helpful, reliable, people-first content",
    href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    note: "Leitlinie für hilfreiche Vergleichs- und Entscheidungsseiten statt oberflächlicher SEO-Texte.",
  },
  {
    label: "Google: How to write reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Richtschnur für Vergleichsinhalte mit Methodik, Differenzierung und echtem Nutzwert.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://at.onoffice.com/en/real-estate-software/",
    note: "Aktuelle Herstellerseite für Maklersoftware, CRM, Objektverwaltung und Portalprozesse.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Aktuelle Herstellerseite für Maklersoftware, CRM, Akquise- und Vermarktungsfunktionen.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/immobilien-crm/",
    note: "Aktuelle Herstellerseite für branchenspezifisches CRM, mobile Nutzung und digitale Standardprozesse.",
  },
  {
    label: "Zendesk: CRM für Immobilienmakler",
    href: "https://www.zendesk.de/sell/crm/crm-fur-immobilienmakler/",
    note: "Beispiel für eine service- und kommunikationsnahe CRM-/Inbox-Perspektive.",
  },
  {
    label: "bloxl: Tools für Immobilienmakler",
    href: "https://bloxl.de/tools",
    note: "Beispiel für Visual-, Exposé- und Vermarktungstools im Maklerkontext.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Tools für Immobilienmakler 2026",
  ogTitle: "Tools für Immobilienmakler | Advaic",
  description:
    "Welche Tools Immobilienmakler wirklich brauchen: Maklersoftware, CRM, Anfrageausführung, Vermarktungs- und Kommunikationstools sauber nach Engpass eingeordnet.",
  path: "/tools-fuer-immobilienmakler",
  template: "guide",
  eyebrow: "Tools für Makler",
  proof: "Gute Tool-Entscheidungen folgen dem Engpass im Betrieb, nicht der längsten Featureliste.",
});

export default function ToolsFuerImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Tools für Immobilienmakler 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-04",
        mainEntityOfPage: `${siteUrl}/tools-fuer-immobilienmakler`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Tools für Immobilienmakler", "Maklersoftware", "CRM", "Anfrageautomation"],
      },
      {
        "@type": "ItemList",
        name: "Tool-Kategorien für Immobilienmakler",
        itemListElement: toolCategories.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.category,
        })),
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
        { name: "Tools für Immobilienmakler", path: "/tools-fuer-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Tools für Makler"
      title="Tools für Immobilienmakler: Welche Kategorien im Alltag wirklich helfen"
      description="Diese Seite sortiert Maklertools nach dem tatsächlichen Engpass im Betrieb: Datenbasis, Anfrageprozess, Vermarktung und Teamkommunikation. Genau diese Trennung fehlt in den meisten Tool-Listen."
      actions={
        <>
          <Link href="/maklersoftware-vergleich" className="btn-secondary">
            Maklersoftware Vergleich
          </Link>
          <Link href="/signup?entry=tools-fuer-immobilienmakler" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Tool-Kategorien oder zur sinnvollen Reihenfolge springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#kategorien" className="btn-secondary w-full justify-center">
              Tool-Kategorien
            </MarketingJumpLink>
            <MarketingJumpLink href="#reihenfolge" className="btn-secondary w-full justify-center">
              Reihenfolge
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="tools-fuer-immobilienmakler"
      primaryHref="/signup?entry=tools-fuer-immobilienmakler-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/best-ai-tools-immobilienmakler"
      secondaryLabel="KI-Tools Vergleich"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen verbinden Google-Leitlinien für hilfreiche Vergleichsseiten mit aktuellen Herstellerseiten aus den wichtigsten Tool-Kategorien für Makler."
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
                Produkt- und Prozessteam mit Fokus auf Maklersoftware, Anfrageprozesse und die operative Auswahl von
                Tool-Kombinationen im Makleralltag.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Aktualisiert</p>
                  <p className="mt-2">{LAST_UPDATED}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Seitentyp</p>
                  <p className="mt-2">Kategorie- und Auswahlhilfe</p>
                </div>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite aufgebaut ist</h2>
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

      <section id="kategorien" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Tool-Kategorien Makler wirklich brauchen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Nicht jedes Tool löst denselben Engpass. Genau deshalb helfen lange Makler-Tool-Listen oft wenig. Die
              bessere Frage lautet: Welche Kategorie entlastet den Betrieb an der richtigen Stelle?
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={toolCategories}
            rowKey={(item) => item.category}
            columns={[
              { key: "category", label: "Kategorie", emphasize: true },
              { key: "examples", label: "Beispiele" },
              {
                key: "solves",
                label: "Was sie löst",
                render: (item) => (
                  <>
                    <p>{item.solves}</p>
                    <p className="mt-2 text-[var(--text)]">{item.fit}</p>
                  </>
                ),
                mobileRender: (item) => (
                  <div className="space-y-2">
                    <p>{item.solves}</p>
                    <p className="font-medium text-[var(--text)]">{item.fit}</p>
                  </div>
                ),
              },
              { key: "watch", label: "Worauf Sie achten sollten" },
            ]}
          />
        </Container>
      </section>

      <section id="buero-typ" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Was zu welchem Bürotyp passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {officeFits.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="reihenfolge" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">In welcher Reihenfolge Tool-Entscheidungen sinnvoll sind</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rolloutOrder.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Sinnvolle nächste Vertiefungen</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/maklersoftware-fuer-kleine-maklerbueros" className="btn-secondary">
                Kleine Maklerbüros
              </Link>
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                KI-Tools Vergleich
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="advaic-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic in diesem Tool-Stack gut passt</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann andere Tool-Fragen zuerst kommen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
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
          <h2 className="h2">Häufige Fragen zu Maklertools</h2>
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
