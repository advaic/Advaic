import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "KI für Immobilienmakler ist dann sinnvoll, wenn sie wiederkehrende Arbeit im Anfrageprozess, in der Vorqualifizierung oder bei Vermarktungsroutinen messbar verkleinert.",
  "Der größte Hebel liegt selten in einem allgemeinen Chatbot allein, sondern in klaren Arbeitsabläufen rund um Anfrageeingang, Antwortlogik, Qualitätsprüfung und Nachfassen.",
  "Seriöse KI-Lösungen ersetzen keine Verhandlung, keine Beschwerdebearbeitung und keine heiklen Einzelfälle. Sie entlasten vor allem dort, wo Regeln und Stoppsignale sauber formulierbar sind.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#einsatzfelder", label: "Einsatzfelder" },
  { href: "#grenzen", label: "Grenzen" },
  { href: "#tool-check", label: "Prüfkriterien" },
  { href: "#einfuehrung", label: "Einführung" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Herstellerquellen zu Anfrageverarbeitung und E-Mail-Abläufen mit allgemeiner Forschung zur Reaktionsgeschwindigkeit digitaler Leads und risikobewusstem KI-Einsatz.",
  "Sie ist bewusst nach Aufgaben aufgebaut und nicht nach pauschalen Testsiegern. Für Maklerbüros ist wichtiger, wo KI im Ablauf sitzt, als ob sie möglichst viele Funktionen verspricht.",
  "Die Beispiele unten unterscheiden deshalb zwischen Datenbasis, Anfrageprozess, Textunterstützung, Nachfassen und Vermarktungsarbeit.",
];

const useCases = [
  {
    title: "Anfrageeingang priorisieren",
    text: "KI kann echte Interessenten-Anfragen von Spam, Newslettern, Systemmails und Dubletten trennen und damit die eigentliche Arbeit im Postfach sichtbar machen.",
  },
  {
    title: "Antwortentwürfe vorbereiten",
    text: "Wiederkehrende Erstantworten zu Verfügbarkeit, Unterlagen, Besichtigung oder nächsten Schritten lassen sich deutlich schneller vorbereiten als vollständig manuell schreiben.",
  },
  {
    title: "Qualität vor Versand prüfen",
    text: "Gute Systeme prüfen Kontext, fehlende Angaben, Ton, Risiko und Lesbarkeit, bevor eine Nachricht überhaupt rausgeht.",
  },
  {
    title: "Nachfassen regelbasiert steuern",
    text: "KI ist beim Nachfassen nur dann hilfreich, wenn Antwort, Termin, Abwesenheitsnotiz oder Sonderfall automatische Folgeschritte sofort stoppen.",
  },
  {
    title: "Vermarktungsmaterial beschleunigen",
    text: "Auch Exposé-Texte, Kurzbeschreibungen oder Bild- und Vermarktungsroutinen lassen sich beschleunigen. Das ist aber ein anderer Anwendungsfall als Anfrageautomation.",
  },
];

const boundaries = [
  {
    title: "Beschwerden und Konflikte",
    text: "Sobald ein Fall reputativ heikel oder emotional aufgeladen ist, sollte KI höchstens vorbereiten, aber nicht autonom versenden.",
  },
  {
    title: "Preis- und Verhandlungssituationen",
    text: "Hier zählt Kontext, Timing und menschliche Einschätzung. Reine Standardisierung hilft meist nicht weit genug.",
  },
  {
    title: "Unklare Datenlage",
    text: "Wenn Objektbezug, Historie oder Zuständigkeit nicht sauber erkennbar sind, ist die richtige Entscheidung oft wichtiger als ein schneller Entwurf.",
  },
  {
    title: "Rechtlich oder dokumentarisch sensible Aussagen",
    text: "Bei heiklen Formulierungen, Zusagen oder Sonderfällen ist ein manueller Prüfpfad fast immer der sauberere Weg.",
  },
];

const evaluationChecklist = [
  {
    title: "Löst das Tool einen echten Engpass?",
    text: "Prüfen Sie zuerst, ob das Problem in Datenpflege, Anfrageeingang, Textarbeit, Vermarktung oder Nachfassen liegt. Nicht jede KI löst dieselbe Baustelle.",
  },
  {
    title: "Sind Regeln und Stopps nachvollziehbar?",
    text: "Sie sollten sehen können, warum etwas automatisch läuft, warum es gestoppt wurde und wann Freigabe greift.",
  },
  {
    title: "Ist ein vorsichtiger Start möglich?",
    text: "Seriöse Tools erlauben einen konservativen Betrieb mit hoher Freigabequote, statt sofort auf maximale Automatik zu drängen.",
  },
  {
    title: "Wie stark hängt alles an sauberer Datenpflege?",
    text: "Viele Probleme werden nur schneller, wenn Kontakte, Objekte, Vorlagen und Zuständigkeiten nicht tragfähig gepflegt sind.",
  },
];

const commonMistakes = [
  "KI nur als Schreibhilfe einkaufen, obwohl der eigentliche Engpass im Anfrageeingang oder in der Freigabelogik liegt.",
  "Zu früh zu viel automatisieren, bevor Antworttypen, Stoppsignale und Qualitätsgrenzen stehen.",
  "Erfolg nur an der Zahl versendeter Nachrichten messen statt an Antwortzeit, Korrekturaufwand und geklärten nächsten Schritten.",
  "KI als Ersatz für Teamentscheidung verkaufen, obwohl Makleralltag an vielen Stellen weiterhin manuelle Verantwortung braucht.",
];

const rolloutSteps = [
  {
    title: "Woche 1: Engpass sauber benennen",
    text: "Prüfen Sie, ob Ihr größtes Problem im Eingang, in der Erstantwort, im Nachfassen oder in Vermarktungsroutinen liegt.",
  },
  {
    title: "Woche 2: Standardfälle und Ausnahmen definieren",
    text: "Legen Sie fest, welche Fälle gut standardisierbar sind und welche immer in der Freigabe oder manuell bleiben.",
  },
  {
    title: "Woche 3: Kontrolliert starten",
    text: "Beginnen Sie mit wenigen klar prüfbaren Fällen und hoher Freigabequote statt mit einer breiten Vollautomatik.",
  },
  {
    title: "Woche 4: Nach Kennzahlen nachziehen",
    text: "Bewerten Sie Antwortzeit, Freigabequote, Korrekturgründe und Reaktionen auf echte versendete Nachrichten.",
  },
];

const advaicFit = [
  "Wenn das Maklerbüro bereits eine Arbeitsbasis hat, der eigentliche Engpass aber im Anfrageeingang, in Antwortlogik, Freigabe oder Nachfassen liegt.",
  "Wenn Sie nachvollziehbar steuern möchten, welche eingehenden Nachrichten automatisch laufen, welche blockiert werden und welche bewusst manuell bleiben.",
  "Wenn Sie KI nicht als Allzweck-Assistent, sondern als operative Schicht für den Anfrageprozess einsetzen wollen.",
];

const advaicNotFit = [
  "Wenn zuerst Kontakte, Objekte, Zuständigkeiten und Historie systemisch aufgeräumt werden müssen.",
  "Wenn fast jede wichtige Nachricht hoch individuell, konfliktbeladen oder verhandlungsnah ist.",
  "Wenn Sie primär ein allgemeines CRM, einen Marketing-Chatbot oder ein Tool für Vermarktungsinhalte suchen.",
];

const faqItems = [
  {
    question: "Wofür ist KI für Immobilienmakler heute am sinnvollsten?",
    answer:
      "Vor allem für wiederkehrende Arbeit im Anfrageprozess: Anfrageeingang sortieren, Antwortentwürfe vorbereiten, vor Versand prüfen und Nachfassen kontrolliert steuern. Auch Vermarktungsroutinen lassen sich beschleunigen, gehören aber in eine andere Tool-Kategorie.",
  },
  {
    question: "Sollten Makler sofort alles automatisieren?",
    answer:
      "Nein. Ein sinnvoller Start ist konservativ: wenige klar prüfbare Standardfälle automatisieren, Ausnahmen und sensible Kommunikation bewusst in der Freigabe halten.",
  },
  {
    question: "Braucht man für KI im Makleralltag immer ein spezielles Tool?",
    answer:
      "Nicht immer. Für einzelne Textaufgaben reicht oft ein allgemeiner Assistent. Für den operativen Anfrageprozess braucht es meist mehr als Textgenerierung, nämlich Regeln, Freigabe, Qualitätsprüfung und sauberen Verlauf.",
  },
  {
    question: "Wo ordnet sich Advaic in diesem Markt ein?",
    answer:
      "Advaic ist keine allgemeine KI für jeden Anwendungsfall, sondern eine spezialisierte Ebene für Anfrageeingang, Antwortlogik, Qualitätschecks, Freigabe und Nachfassen im Makleralltag.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die operative Bedeutung schneller Reaktion auf digitale Interessenten-Anfragen.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Praxisnahe Herstellerquelle zu Anfragebearbeitung, Ausnahmen, Wartezeiten und manueller Weiterbearbeitung.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Herstellerseite zu Portalanfragen, Dubletten-Check, Exposéversand und Statusübersicht im Anfrageprozess.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Praxisnahe Herstellerquelle zur Definition, Einordnung und Herkunft eingehender Anfragen.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sendefenstern und Ablaufsteuerung bei automatisierter Folgekommunikation.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierten, nachvollziehbaren und risikobewussten KI-Einsatz.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "KI für Immobilienmakler 2026: Wo KI wirklich hilft",
  ogTitle: "KI für Immobilienmakler 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: wofür KI im Makleralltag wirklich sinnvoll ist, welche Aufgaben manuell bleiben sollten und wie seriöse KI-Lösungen bewertet werden.",
  path: "/ki-fuer-immobilienmakler",
  template: "guide",
  eyebrow: "KI für Immobilienmakler",
  proof: "Echter Nutzen entsteht bei wiederkehrender Arbeit im Anfrageprozess, nicht bei pauschalen KI-Versprechen.",
});

export default function KiFuerImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "KI für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/ki-fuer-immobilienmakler`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: [
          "KI für Immobilienmakler",
          "Anfrageprozess",
          "Antwortlogik",
          "Freigabe",
          "Nachfassen",
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
        { name: "KI für Immobilienmakler", path: "/ki-fuer-immobilienmakler" },
      ]}
      schema={schema}
      kicker="KI für Immobilienmakler"
      title="KI für Immobilienmakler: Wo sie echten Nutzen bringt und wo sie Grenzen hat"
      description="Diese Seite zeigt, in welchen Bereichen KI im Makleralltag wirklich hilft, wo manuelle Verantwortung bleibt und wie Makler seriöse KI-Lösungen von bloßen Versprechen unterscheiden können."
      actions={
        <>
          <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
            KI-Tools vergleichen
          </Link>
          <Link href="/signup?entry=ki-fuer-immobilienmakler" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Einsatzfeldern oder zu den Prüfkriterien springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#einsatzfelder" className="btn-secondary w-full justify-center">
              Einsatzfelder
            </MarketingJumpLink>
            <MarketingJumpLink href="#tool-check" className="btn-secondary w-full justify-center">
              Prüfkriterien
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="orientierung"
      stageContext="ki-fuer-immobilienmakler"
      primaryHref="/produkt"
      primaryLabel="Ablauf ansehen"
      secondaryHref="/best-ai-tools-immobilienmakler"
      secondaryLabel="KI-Tools vergleichen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle Herstellerinformationen zu Anfrageverarbeitung und Folgekommunikation mit allgemeiner Forschung zu Lead-Reaktion und risikobewusstem KI-Einsatz."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Antwortlogik, Freigabe und kontrollierten
                KI-Einsatz im Makleralltag.
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

      <section id="einsatzfelder" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Fünf Einsatzfelder, in denen KI Makler wirklich entlasten kann</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der Mehrwert entsteht meist dort, wo Arbeit wiederkehrt, sich nachvollziehbar prüfen lässt und klare
              nächste Schritte kennt. Genau deshalb sehen wir die stärksten Effekte meist im Anfrageprozess und in
              standardisierten Vermarktungsroutinen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {useCases.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="grenzen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wo KI im Makleralltag bewusst Grenzen haben sollte</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute KI ist nicht diejenige, die überall antwortet, sondern diejenige, die sauber erkennt, wann
              menschliche Verantwortung Vorrang hat.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {boundaries.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="tool-check" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Woran Sie seriöse KI-Angebote erkennen</h2>
              <div className="mt-4 space-y-4">
                {evaluationChecklist.map((item) => (
                  <article key={item.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="helper mt-2">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Häufige Fehlentscheidungen beim KI-Einsatz</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {commonMistakes.map((item) => (
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

      <section id="einfuehrung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wie Makler KI sinnvoll einführen, ohne sich zu überheben</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die beste Einführung beginnt nicht mit einem großen Versprechen, sondern mit einer klaren Engpassanalyse
              und wenigen gut kontrollierten Fällen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rolloutSteps.map((item) => (
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
              <h2 className="h3 mt-3">Wenn KI im Anfrageprozess konkret arbeiten soll</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                  KI-Tools vergleichen
                </Link>
                <Link href="/email-automatisierung-immobilienmakler" className="btn-secondary">
                  E-Mail-Automatisierung
                </Link>
                <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                  Anfrageautomation
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn Sie eigentlich ein anderes Problem lösen müssen</h2>
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
