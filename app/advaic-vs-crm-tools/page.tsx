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
  "Ein CRM und Advaic lösen im Makleralltag nicht dieselbe Aufgabe. Ein CRM ist in erster Linie Arbeitsbasis für Kontakte, Objekte, Aufgaben und Historie.",
  "Advaic ist keine Alternative zu dieser Datenbasis, sondern eine operative Schicht für Anfrageeingang, Antwortlogik, Freigabe, Qualitätsprüfung und Nachfassen.",
  "Wenn der größte Engpass trotz CRM im Postfach bleibt, ergänzen sich CRM und Advaic oft sinnvoller, als alles in ein einziges System zu pressen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#kernunterschied", label: "Kernunterschied" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#prioritaet", label: "Was zuerst?" },
  { href: "#stack", label: "Gemeinsamer Stack" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Herstellerquellen von onOffice, FLOWFACT, Propstack und HubSpot mit Advaics Sicht auf den operativen Anfrageprozess.",
  "Verglichen wird nicht nach pauschaler Punktewertung, sondern nach echter Aufgabentrennung: Datenbasis, Anfrageeingang, Entscheidungslogik, Freigabe, Nachfassen und Verlauf.",
  "Mit CRM-Tools sind hier vor allem klassische Makler-CRMs oder allgemeinere CRM-Plattformen gemeint, nicht spezialisierte Ausführungssysteme für einzelne eingehende Nachrichten.",
];

const coreDifference = [
  {
    title: "CRM ist Arbeitsbasis",
    text: "Kontakte, Objekte, Aktivitäten, Aufgaben, Zuständigkeiten und Historie gehören typischerweise ins CRM.",
  },
  {
    title: "Advaic ist Ausführung im Anfrageprozess",
    text: "Advaic entscheidet pro Nachricht, ob automatisch geantwortet wird, ob Freigabe nötig ist oder ob ein Fall bewusst nicht automatisch läuft.",
  },
  {
    title: "Beide Systeme können zusammen sinnvoller sein",
    text: "Gerade im Makleralltag ist es oft stärker, wenn CRM und Anfrageprozess sauber getrennt, aber operativ verbunden sind.",
  },
  {
    title: "Das Problem ist selten die Funktionsliste",
    text: "Die eigentliche Frage ist meist: Wo verliert das Team Zeit, Qualität oder Kontrolle? Im Datenmodell oder in der Bearbeitung eingehender Nachrichten?",
  },
];

const comparisonRows = [
  {
    topic: "Primäre Aufgabe",
    crm: "Kontakte, Objekte, Aktivitäten, Pipeline, Aufgaben und teamweite Historie verwalten.",
    advaic: "Eingehende Anfragen prüfen, Antwortpfad wählen, Versand absichern und Nachverfolgung steuern.",
  },
  {
    topic: "Entscheidung pro Nachricht",
    crm: "Oft nur indirekt über Workflows, Vorlagen oder manuelle Regeln abgebildet.",
    advaic: "Direkt pro Nachricht: automatisch senden, zur Freigabe legen oder bewusst blockieren.",
  },
  {
    topic: "Qualitätsprüfung vor Versand",
    crm: "Nicht der typische Schwerpunkt klassischer CRM-Prozesse.",
    advaic: "Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit werden vor automatischem Versand geprüft.",
  },
  {
    topic: "Umgang mit Lücken oder Risiko",
    crm: "Je nach Setup; häufig kein spezieller Freigabepfad für Antwortentwürfe.",
    advaic: "Unklare oder sensible Fälle landen standardmäßig in einer Freigabe- oder Prüfschleife.",
  },
  {
    topic: "Nachfassen",
    crm: "Meist eher auf Aufgaben, Kampagnen oder Sequenzen ausgerichtet.",
    advaic: "Antwortbezogen mit Stoppsignalen bei Rückmeldung, Termin, Sonderfall oder Risiko.",
  },
  {
    topic: "Verlauf und Nachvollziehbarkeit",
    crm: "Kontakt- und Aktivitätshistorie ist stark, die operative Versandentscheidung pro Nachricht oft weniger granular.",
    advaic: "Nachrichtenspezifischer Verlauf von Eingang über Entscheidung und Prüfung bis Versand oder Freigabe.",
  },
  {
    topic: "Wann es typischerweise den größeren Hebel hat",
    crm: "Wenn Datenbasis, Objektstruktur, Zuständigkeiten und teamweite Transparenz die Hauptbaustelle sind.",
    advaic: "Wenn das Team trotz CRM im Anfrageeingang weiter Zeit, Konsistenz oder Kontrolle verliert.",
  },
];

const priorityScenarios = [
  {
    title: "CRM zuerst stärken",
    text: "Wenn Kontakte, Objekte, Zuständigkeiten und Historie noch nicht sauber gepflegt sind, sollten Sie zuerst die Arbeitsbasis stabilisieren.",
  },
  {
    title: "Advaic zusätzlich einsetzen",
    text: "Wenn ein CRM bereits steht, das Team aber im Anfragepostfach weiter unter Last uneinheitlich oder zu langsam arbeitet.",
  },
  {
    title: "Beides bewusst kombinieren",
    text: "Wenn Sie ein CRM für die Datenbasis brauchen und gleichzeitig den operativen Antwortprozess mit Freigabe und Qualitätsprüfung sauber aufsetzen wollen.",
  },
  {
    title: "Noch nichts davon breit ausrollen",
    text: "Wenn Anfragevolumen, Datenqualität und Standardfälle noch zu schwach sind, um aus einem System oder einer Ergänzung schon echten Nutzen zu ziehen.",
  },
];

const stackRecommendation = [
  {
    title: "CRM bleibt das führende System",
    text: "Objekte, Kontakte, Aufgaben, Historie und teamweite Transparenz bleiben dort, wo sie hingehören: im CRM.",
  },
  {
    title: "Advaic übernimmt den Anfragefluss",
    text: "Der operative Weg von Eingang über Entscheidung und Qualitätsprüfung bis zur Antwort läuft in einer spezialisierten Anfrage-Logik.",
  },
  {
    title: "Gemeinsame Kennzahlen verbinden beide Ebenen",
    text: "Antwortzeit, Freigabequote, Korrekturgründe und geklärte nächste Schritte sollten entlang desselben Prozesses sichtbar sein.",
  },
  {
    title: "Die richtige Trennung reduziert Komplexität",
    text: "Wenn jede Schicht nur ihre eigentliche Aufgabe löst, wird der Alltag oft robuster als bei einer erzwungenen Ein-Tool-Lösung.",
  },
];

const advaicFit = [
  "Ihr CRM ist als Datenbasis grundsätzlich brauchbar, aber der Anfrageeingang bleibt trotzdem langsam, uneinheitlich oder schwer kontrollierbar.",
  "Sie möchten automatische Antworten nur für klar prüfbare Standardfälle freigeben und Risiko- oder Ausnahmefälle sauber in einer Freigabe halten.",
  "Sie wollen keine komplette CRM-Migration auslösen, nur weil der operative Antwortprozess hakt.",
];

const advaicNotFit = [
  "Sie brauchen zuerst ein tragfähiges System für Kontakte, Objekte, Verantwortlichkeiten und Historie.",
  "Ihr Büro hat kaum wiederkehrende Anfragemuster oder sehr wenig relevantes Anfragevolumen.",
  "Sie suchen primär ein vollwertiges Makler-CRM und nicht zuerst eine zusätzliche operative Schicht für Anfragebearbeitung.",
];

const faqItems = [
  {
    question: "Ist Advaic ein CRM?",
    answer:
      "Nein. Advaic ist keine allgemeine Arbeitsbasis für Kontakte, Objekte und Pipeline, sondern eine spezialisierte Ebene für Anfrageeingang, Antwortlogik, Freigabe, Qualitätsprüfung und Nachfassen.",
  },
  {
    question: "Kann ein CRM Advaic komplett ersetzen?",
    answer:
      "Teilweise, aber nicht immer sinnvoll. Viele CRM-Systeme decken Teile von Anfrage- und E-Mail-Prozessen ab. Wenn die eigentliche Lücke jedoch in der operativen Entscheidung pro Nachricht liegt, reicht CRM allein oft nicht aus.",
  },
  {
    question: "Wann sollte ein Maklerbüro zuerst das CRM optimieren?",
    answer:
      "Wenn Kontakte, Objekte, Zuständigkeiten und Historie noch nicht sauber gepflegt oder teamweit nicht verlässlich nutzbar sind. Dann ist die Arbeitsbasis die erste Baustelle.",
  },
  {
    question: "Wann ist Advaic als Ergänzung besonders sinnvoll?",
    answer:
      "Wenn das CRM grundsätzlich steht, aber im Anfragepostfach weiter Zeit, Qualität oder Kontrolle verloren geht. Dann ergänzt Advaic die operative Ausführungsschicht, ohne das CRM ersetzen zu müssen.",
  },
];

const sources = [
  {
    label: "Google: How to write high quality reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Leitlinie für hilfreiche Vergleichsseiten mit Methodik, Differenzierung und echtem Nutzwert.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit Makler-CRM-, Objekt-, Portal- und E-Mail-Logik.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Offizielle Herstellerseite mit CRM-Funktionen, Einführungslogik und Branchenfokus für Maklerbüros.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Produktseite zur Bearbeitung und Automatisierung eingehender Portalanfragen.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/immobilien-crm/",
    note: "Offizielle Herstellerseite mit Fokus auf browserbasiertes Makler-CRM und digitale Standardprozesse.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Offizielle Herstellerseite zur allgemeinen CRM- und Inbox-Perspektive für Immobilienunternehmen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automationsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Advaic vs. CRM-Tools 2026: Wo liegt der Unterschied?",
  ogTitle: "Advaic vs. CRM-Tools 2026 | Advaic",
  description:
    "Vergleich für Makler: CRM verwaltet Kontakte und Objekte, Advaic steuert den operativen Anfrageprozess. Diese Seite zeigt, wann welches System den größeren Hebel hat.",
  path: "/advaic-vs-crm-tools",
  template: "compare",
  eyebrow: "Advaic vs. CRM-Tools",
  proof: "CRM ist nicht dasselbe wie operative Anfragebearbeitung mit Freigabe, Qualitätsprüfung und sauberer Entscheidung pro Nachricht.",
});

export default function AdvaicVsCrmToolsPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Advaic vs. CRM-Tools 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/advaic-vs-crm-tools`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["CRM", "Makler-CRM", "Anfrageprozess", "Antwortlogik", "Freigabe"],
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
        { name: "Advaic vs. CRM-Tools", path: "/advaic-vs-crm-tools" },
      ]}
      schema={schema}
      kicker="Advaic vs. CRM-Tools"
      title="Advaic vs. CRM-Tools: Wann CRM reicht und wann eine zusätzliche Prozessschicht sinnvoll ist"
      description="Diese Seite zeigt, wo CRM-Systeme stark sind, wo der Anfrageprozess eine eigene operative Logik braucht und warum sich CRM und Advaic im Makleralltag oft eher ergänzen als ersetzen."
      actions={
        <>
          <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
            CRM-Vergleich ansehen
          </Link>
          <Link href="/signup?entry=advaic-vs-crm" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Vergleich oder zur Prioritätsfrage springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich
            </MarketingJumpLink>
            <MarketingJumpLink href="#prioritaet" className="btn-secondary w-full justify-center">
              Was zuerst?
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="advaic-vs-crm-tools"
      primaryHref="/signup?entry=advaic-vs-crm-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/crm-fuer-immobilienmakler"
      secondaryLabel="CRM-Vergleich"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Markt- und Aufgabenabgrenzung. Für die konkrete Entscheidung sollten Sie immer mit Ihren realen Anfragefällen und Ihrem vorhandenen CRM-Setup prüfen."
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
                Produkt- und Prozessteam mit Fokus auf CRM-Abgrenzung, Anfrageeingang, Antwortlogik und operative
                Freigabepfade im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie dieser Vergleich zu lesen ist</h2>
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

      <section id="kernunterschied" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Der Kernunterschied ist nicht der Funktionsumfang, sondern die Aufgabe im Alltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Teams vergleichen CRM und Anfrageautomation so, als würden beide Systeme denselben Prozess lösen.
              Genau das führt oft zu schwachen Entscheidungen. Im Alltag braucht das Team meist beides, aber für
              unterschiedliche Ebenen der Arbeit.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {coreDifference.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="vergleich" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wo CRM aufhört und wo Advaic beginnt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der Vergleich unten fasst klassische CRM-Tools wie onOffice, FLOWFACT, Propstack oder HubSpot als
              Arbeitsbasis zusammen und stellt ihnen Advaic als spezialisierte Anfrage-Schicht gegenüber.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={comparisonRows}
            rowKey={(row) => row.topic}
            columns={[
              { key: "topic", label: "Vergleichspunkt", emphasize: true },
              { key: "crm", label: "CRM-Tools" },
              { key: "advaic", label: "Advaic" },
            ]}
          />
        </Container>
      </section>

      <section id="prioritaet" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was Maklerbüros zuerst priorisieren sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die richtige Reihenfolge hängt selten am Anbieter, sondern fast immer am eigentlichen Engpass. Genau den
              sollten Sie vor jeder Tool-Entscheidung sauber benennen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {priorityScenarios.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stack" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">So sieht ein sinnvoller gemeinsamer Stack aus</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wenn Datenbasis und Anfrageprozess sauber getrennt sind, wird die Gesamtarchitektur oft verständlicher
              und robuster als bei dem Versuch, jede Aufgabe in einem einzigen System unterzubringen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stackRecommendation.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn das Problem im Anfrageeingang liegt, nicht in der Datenbasis</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                  CRM-Vergleich
                </Link>
                <Link href="/crm-vs-maklersoftware" className="btn-secondary">
                  CRM vs. Maklersoftware
                </Link>
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/email-automatisierung-immobilienmakler" className="btn-secondary">
                  E-Mail-Automatisierung
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn zuerst die Grundlagen fehlen</h2>
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
