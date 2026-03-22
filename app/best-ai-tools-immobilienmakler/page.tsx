import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "21. März 2026";

const summary = [
  "Die meisten Makler brauchen nicht einfach mehr KI, sondern eine sauberere Aufgabentrennung zwischen CRM, Anfragebearbeitung, Textunterstützung und Vermarktung.",
  "Bei wichtigen Entscheidungen zählt nicht die längste Featureliste, sondern ob das Tool Ihren Engpass im Tagesgeschäft wirklich verkleinert.",
  "Im Makleralltag scheitern Tools meist an drei Punkten: unklare Passung zum Prozess, schwache Steuerbarkeit oder zu hoher Einführungsaufwand.",
  "Advaic ist in dieser Landschaft kein Allzweck-CRM, sondern eine spezialisierte Ebene für Anfrageeingang, Entscheidungslogik, Qualitätschecks und Freigabe.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#marktkarte", label: "Tool-Kategorien" },
  { href: "#bewertung", label: "Bewertungskriterien" },
  { href: "#fit", label: "Welche Kombination passt wann?" },
  { href: "#advaic-fit", label: "Wann Advaic passt" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Ausgewertet wurden die aktuellen Suchanfragen aus der Search Console, die vorhandenen Advaic-Seiten und aktuelle Herstellerseiten relevanter Tool-Kategorien.",
  "Die Einordnung erfolgt nicht nach pauschalem Testsieger, sondern danach, wo das Tool im Ablauf sitzt: zentrale Datenbasis, Anfragebearbeitung, Textunterstützung, Visualisierungen und Teamkommunikation.",
  "Bewertet werden vier Punkte: operativer Nutzen im Makleralltag, Steuerbarkeit, Einführungsaufwand und Abhängigkeit von sauber gepflegten Daten.",
  "Produktbeispiele unten sind Marktbeispiele, keine vollständige Liste und keine pauschale Kaufempfehlung.",
];

const toolCategories = [
  {
    category: "Maklersoftware / CRM",
    examples: "onOffice, FLOWFACT, Propstack, HubSpot",
    idealFor: "Kontakte, Objekte, Pipeline, Historie, Aufgaben und teamweite Datenpflege.",
    strengths: "Stark als zentrale Datenbasis und für wiederkehrende Vertriebs- und Vermarktungsprozesse.",
    limits: "Schwächer, wenn die eigentliche Lücke in der Entscheidung über einzelne eingehende Anfragen liegt.",
  },
  {
    category: "Anfrageablauf & Antwortsteuerung",
    examples: "Advaic",
    idealFor: "Eingang prüfen, automatische Antwort oder Freigabe steuern, Antwortqualität absichern, Nachfassen und Verlauf sauber halten.",
    strengths: "Stark bei hohem Anfragevolumen, Qualitätsdruck und dem Wunsch nach konservativer Automatisierung.",
    limits: "Kein Ersatz für vollständige CRM-, Objekt- oder Pipelineverwaltung.",
  },
  {
    category: "KI-Schreibassistenten",
    examples: "ChatGPT, Claude",
    idealFor: "Texte schneller formulieren, Varianten testen, E-Mails oder Exposés überarbeiten.",
    strengths: "Sehr schnell, flexibel und breit einsetzbar für Einzeltasks.",
    limits: "Ohne Prozesslogik, Freigabepfad und Verlauf meist nicht belastbar genug für operativen Anfragebetrieb.",
  },
  {
    category: "Support- und Postfachsysteme",
    examples: "Zendesk, Outlook/Gmail mit Teamregeln",
    idealFor: "Teamzuweisung, kanalübergreifende Kommunikation, Status- und Serviceprozesse.",
    strengths: "Stark für Zusammenarbeit, klare Zuständigkeiten und Service-Transparenz.",
    limits: "Im Maklerkontext oft nicht tief genug auf Objektbezug, Qualitätschecks und klare Regeln pro Anfrage spezialisiert.",
  },
  {
    category: "Visual- und Exposé-Tools",
    examples: "ImmoStage, bloxl",
    idealFor: "Exposés, Bilder, Homestaging, Vermarktungsvisuals, Content-Produktion.",
    strengths: "Klarer Nutzen bei Vermarktungsmaterial und Objektpräsentation.",
    limits: "Lösen nicht das operative Anfrage- und Antwortproblem im Postfach.",
  },
];

const evaluationCriteria = [
  {
    title: "1) Passung zum Prozess",
    text: "Welchen Engpass soll das Tool wirklich lösen: Datenpflege, Antwortgeschwindigkeit, Vermarktung, Interessentenpflege oder Teamkoordination?",
  },
  {
    title: "2) Steuerbarkeit",
    text: "Gibt es nachvollziehbare Regeln, warum etwas automatisch läuft, gestoppt oder zur Freigabe gelegt wird?",
  },
  {
    title: "3) Einführbarkeit",
    text: "Kommt das Team in Tagen oder erst nach Wochen in einen stabilen Betrieb? Gerade kleine Maklerbüros verlieren hier schnell Momentum.",
  },
  {
    title: "4) Datenabhängigkeit",
    text: "Wie stark hängt der Nutzen davon ab, dass Kontakte, Objekte, Rechte und Vorlagen bereits sauber gepflegt sind?",
  },
];

const decisionPaths = [
  {
    title: "Wenn Ihr größtes Problem die Datenbasis ist",
    text: "Priorisieren Sie zuerst Maklersoftware oder CRM. Ohne saubere Objekt-, Kontakt- und Pipelinepflege tragen andere Tools die Lücke nur weiter.",
  },
  {
    title: "Wenn Ihr Engpass im Anfragepostfach liegt",
    text: "Prüfen Sie spezialisierte Anfrage- und Antwortlogik. Genau hier helfen Freigabe, Qualitätschecks und nachvollziehbarer Verlauf mehr als ein generischer KI-Assistent.",
  },
  {
    title: "Wenn Sie mehr Vermarktungsmaterial schneller brauchen",
    text: "Visual- und Exposé-Tools bringen oft den schnellsten operativen Effekt. Sie gehören aber in eine andere Kategorie als Anfrageautomation oder CRM.",
  },
];

const advaicFit = [
  "Sie haben wiederkehrende Interessenten-Anfragen und wollen schneller reagieren, ohne Risiko- oder Lückenfälle automatisch laufen zu lassen.",
  "Ihr Team braucht sichtbare Gründe, warum Nachrichten automatisch gesendet, gestoppt oder zur Freigabe gelegt wurden.",
  "Sie möchten die Logik fürs Nachfassen vorsichtig einführen und jede Entscheidung im Verlauf nachvollziehen können.",
];

const advaicNotFit = [
  "Ihr Hauptproblem ist fehlende Objekt-, Kontakt- oder Deal-Struktur im System.",
  "Sie suchen eine vollständige Maklersoftware mit umfassender Objekt- und Pipelineverwaltung in einem einzigen Produkt.",
  "Fast jede Antwort ist hoch individuell, verhandlungsnah oder konfliktbehaftet und eignet sich kaum für einen vorsichtigen Standardstart.",
];

const faqs = [
  {
    question: "Welches KI-Tool sollten Makler zuerst prüfen?",
    answer:
      "Das hängt vom Engpass ab. Fehlt ein sauberes System für Kontakte, Objekte und Pipeline, ist CRM zuerst sinnvoll. Liegt das Problem bei eingehenden Anfragen und Antwortqualität, ist spezialisierte Anfrageautomation relevanter.",
  },
  {
    question: "Reicht ein KI-Schreibtool für den Makleralltag aus?",
    answer:
      "Für einzelne Textaufgaben oft ja. Für einen belastbaren Anfragebetrieb reichen reine Schreibtools meist nicht aus, weil Freigabe, Qualitätschecks, Verlauf und Stop-Regeln fehlen.",
  },
  {
    question: "Wo ordnet sich Advaic in der Tool-Landschaft ein?",
    answer:
      "Advaic gehört nicht in die Kategorie vollständiges CRM, sondern in die Kategorie Anfrageablauf und Antwortsteuerung. Der Schwerpunkt liegt auf Eingang, Entscheidungslogik, Qualitätschecks, Freigabe und Nachfassen.",
  },
];

const sources = [
  {
    label: "Google: Creating helpful, reliable, people-first content",
    href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    note: "Grundlage dafür, wie hilfreiche, originäre Vergleichsseiten aufgebaut sein sollten.",
  },
  {
    label: "Google: How to write reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Wichtige Leitlinie für Vergleichsseiten mit Methodik, Differenzierung und Belegen.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Herstellerseite für Maklersoftware, CRM-Funktionen, E-Mail-Verwaltung und Portalprozesse.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Herstellerseite für CRM-/Immobiliensoftware, API, Einführungsmodell und Zusatzprodukte.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/",
    note: "Herstellerseite für modernes Immobilien-CRM mit Fokus auf mobile Nutzung und integrierte Prozesse.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Beispiel für ein allgemeineres CRM mit Marketing-, Vertriebs- und Servicefokus.",
  },
  {
    label: "Zendesk: CRM für Immobilienmakler",
    href: "https://www.zendesk.de/sell/crm/crm-fur-immobilienmakler/",
    note: "Beispiel für eine service- und kommunikationsnahe CRM-/Inbox-Perspektive.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "KI-Tools für Immobilienmakler im Vergleich 2026",
  ogTitle: "KI-Tools für Immobilienmakler im Vergleich | Advaic",
  description:
    "Vergleich für Makler: Welche KI-Tools helfen bei CRM, Anfragebearbeitung, Texten, Inbox und Vermarktung und wo Advaic als spezialisierte Anfrage-Logik passt.",
  path: "/best-ai-tools-immobilienmakler",
  template: "compare",
  eyebrow: "Vergleich 2026",
  proof: "Nicht alle KI-Tools lösen denselben Engpass. Entscheidend sind Passung zum Prozess, Steuerbarkeit und Einführbarkeit.",
});

export default function BestAiToolsImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "KI-Tools für Immobilienmakler im Vergleich 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/best-ai-tools-immobilienmakler`,
        dateModified: "2026-03-21",
        about: ["KI-Tools für Immobilienmakler", "CRM", "Anfrageautomation", "Maklersoftware"],
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
      },
      {
        "@type": "ItemList",
        name: "Tool-Kategorien für Immobilienmakler",
        itemListElement: toolCategories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.category,
        })),
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
        { name: "KI-Tools für Immobilienmakler", path: "/best-ai-tools-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Vergleich 2026"
      title="KI-Tools für Immobilienmakler: Welche Kategorie welchen Engpass löst"
      description="Diese Seite sucht keinen pauschalen Testsieger. Sie zeigt, welche Tool-Kategorien Makler wirklich nutzen, wo deren Grenzen liegen und wann spezialisierte Anfrage-Logik wie Advaic sinnvoll wird."
      actions={
        <>
          <Link href="/maklersoftware-vergleich" className="btn-secondary">
            Maklersoftware vergleichen
          </Link>
          <Link href="/signup?entry=best-ai-tools-2026" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Springen Sie direkt zur Marktkarte oder zu der Frage, wann Advaic passt.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#marktkarte" className="btn-secondary w-full justify-center">
              Tool-Kategorien
            </MarketingJumpLink>
            <MarketingJumpLink href="#advaic-fit" className="btn-secondary w-full justify-center">
              Wann Advaic passt
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="best-ai-tools-immobilienmakler"
      primaryHref="/signup?entry=best-ai-tools-2026-stage"
      primaryLabel="Mit echten Anfragen testen"
      secondaryHref="/crm-fuer-immobilienmakler"
      secondaryLabel="CRM-Leitfaden"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen kombinieren Google-Leitlinien für hilfreiche Vergleichsinhalte mit aktuellen Herstellerseiten aus dem Markt. Die Seite ersetzt keine eigene Demo- und Beschaffungsprüfung."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kurzantwort in 90 Sekunden</h2>
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

      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <p className="label">Autor & Stand</p>
              <h2 className="h3 mt-3">Advaic Redaktion</h2>
              <p className="helper mt-3">
                Produkt- und Prozessteam mit Fokus auf Maklerkommunikation, Freigabelogik und kontrollierte
                Anfragebearbeitung.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Aktualisiert</p>
                  <p className="mt-2">{LAST_UPDATED}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Seitentyp</p>
                  <p className="mt-2">Vergleichs- und Auswahlhilfe</p>
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

      <section id="marktkarte" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die Marktkarte: Nicht jedes KI-Tool löst denselben Makler-Engpass</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Genau hier entstehen die meisten Fehlkäufe. Viele Makler vergleichen Tools innerhalb derselben Liste,
              obwohl sie unterschiedliche Jobs erledigen. Die sinnvollere Frage lautet: Welcher Tool-Typ löst Ihren
              Engpass am saubersten?
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={toolCategories}
            rowKey={(item) => item.category}
            columns={[
              { key: "category", label: "Kategorie", emphasize: true },
              { key: "examples", label: "Beispiele" },
              {
                key: "idealFor",
                label: "Wofür stark",
                render: (item) => (
                  <>
                    <p>{item.idealFor}</p>
                    <p className="mt-2 text-[var(--text)]">{item.strengths}</p>
                  </>
                ),
                mobileRender: (item) => (
                  <div className="space-y-2">
                    <p>{item.idealFor}</p>
                    <p className="font-medium text-[var(--text)]">{item.strengths}</p>
                  </div>
                ),
              },
              { key: "limits", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="bewertung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Vier Kriterien, mit denen Sie KI-Tools sauber einordnen</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {evaluationCriteria.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="fit" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Kombination typischerweise wann passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {decisionPaths.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Sinnvolle nächste Vergleiche</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="advaic-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic in diesem Stack gut passt</h2>
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
              <h2 className="h3">Wann Sie zuerst etwas anderes lösen sollten</h2>
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
          <h2 className="h2">Häufige Fragen zur Tool-Auswahl</h2>
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
