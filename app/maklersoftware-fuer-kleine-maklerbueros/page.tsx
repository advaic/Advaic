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
  "Kleine Maklerbüros brauchen nicht die größte Maklersoftware, sondern die Lösung mit dem geringsten Reibungsverlust im Alltag.",
  "Die wichtigste Frage ist nicht, welches System die längste Featureliste hat. Entscheidend sind Einarbeitung, mobile Nutzbarkeit, Portal- und Anfrageprozess sowie der Aufwand für saubere Datenpflege.",
  "Der häufigste Fehlkauf kleiner Büros ist ein zu schweres Setup für ein Team, das eigentlich zuerst Übersicht, klare Zuständigkeiten und einen stabilen Anfragepfad braucht.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#anforderungen", label: "Was kleine Büros wirklich brauchen" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#buero-typ", label: "Welches System zu welchem Büro passt" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#anfrageprozess", label: "Anfrageprozess" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite stützt sich auf aktuelle offizielle Herstellerseiten von onOffice, FLOWFACT, Propstack und HubSpot sowie auf öffentliche Preis- und Produktlogik, soweit diese heute sichtbar ist.",
  "Bewertet wird nicht nur Funktionsumfang, sondern speziell die Passung für kleine Maklerbüros: Einstiegshürde, mobile Arbeit, Portalbezug, Anfrageprozess und laufender Pflegeaufwand.",
  "Es gibt bewusst keinen pauschalen Sieger. Für kleine Teams zählt stärker als bei großen Büros, ob die Software zum tatsächlichen Tagesgeschäft und zur Disziplin im Betrieb passt.",
];

const smallOfficeNeeds = [
  {
    title: "Schneller Einstieg ohne Projektcharakter",
    text: "Kleine Maklerbüros haben selten Zeit für monatelange Einführung. Systeme mit zu viel Konfiguration wirken auf dem Papier stark, können im Alltag aber lähmen.",
  },
  {
    title: "Saubere mobile Nutzung",
    text: "Wenn Besichtigung, Rückruf, Objektabgleich und E-Mail nur im Büro sinnvoll funktionieren, ist das für kleine Teams ein echter Nachteil.",
  },
  {
    title: "Portal- und Anfrageprozess müssen mitgedacht sein",
    text: "Kleine Büros spüren Antwortzeiten und Eingangschaos schneller als große Teams. Darum reicht ein hübsches CRM allein oft nicht.",
  },
  {
    title: "Wenig Pflegeaufwand pro Objekt und Kontakt",
    text: "Jedes zusätzliche Pflichtfeld und jede versteckte Nebenmaske erhöhen das Risiko, dass Daten inkonsistent werden und die Software ihre Stärke verliert.",
  },
];

const softwareRows = [
  {
    system: "FLOWFACT Mini",
    price: "Laut Produktseite kostenfreier Einstieg",
    fit: "Einzelmakler, Gründer und CRM-Einsteiger mit Fokus auf schnellem Start",
    strengths: "Einfacher Einstieg, mobile Nutzung, Basisfunktionen für Datenpflege, Exposéversand und Portalübertragung",
    watch: "Weniger passend, wenn früh ein stärkerer Team- oder Freigabeprozess gebraucht wird.",
  },
  {
    system: "FLOWFACT Residential",
    price: "Laut Produktseite 79 EUR pro Lizenz/Monat zzgl. Einrichtung",
    fit: "Kleine Teams mit wachsendem Anfragevolumen und dem Wunsch nach mehr Struktur im Vermarktungsprozess",
    strengths: "Branchenspezifische CRM- und Anfragefunktionen, Portalübertragung, Deal-Logik und automatisierte Anfragenverarbeitung",
    watch: "Nur sinnvoll, wenn das Büro die zusätzlichen Prozesse auch wirklich pflegt.",
  },
  {
    system: "Propstack",
    price: "Preis auf Anfrage / kostenfrei testen",
    fit: "Digitale kleine Teams mit viel mobiler Arbeit und Wunsch nach schlanker, moderner Oberfläche",
    strengths: "Intuitive Nutzung, mobile App, klare CRM-Oberfläche und gute Basis für schnelle Alltagsarbeit",
    watch: "Die Passung hängt stark davon ab, wie tief Portal- und Anfrageautomatik im eigenen Setup wirklich greifen soll.",
  },
  {
    system: "onOffice enterprise",
    price: "Je nach Paket; Teile öffentlich, höherwertige Pakete teils auf Anfrage",
    fit: "Kleine Büros mit anspruchsvollerem Setup und Bereitschaft, eine integrierte Arbeitsbasis sauber zu konfigurieren",
    strengths: "Sehr breite Branchentiefe mit Objekt-, Kontakt-, Portal-, Termin- und Anfrageprozess in einem System",
    watch: "Für sehr kleine Teams kann der Umfang schnell zu schwer wirken, wenn klare Zuständigkeiten und Regeln noch fehlen.",
  },
  {
    system: "HubSpot CRM",
    price: "Öffentliche Staffelpreise und Free-Tier-Struktur",
    fit: "Kleine Teams mit stark allgemeinem Vertriebs- oder Servicefokus und wenig branchenspezifischer Objektlogik",
    strengths: "Bekannte CRM-Oberfläche, gute E-Mail- und Sales-Automation, schneller Einstieg in generische Pipeline-Arbeit",
    watch: "Keine klassische Maklersoftware; Objekt-, Portal- und Exposélogik müssen meist anderweitig gelöst werden.",
  },
];

const officeFits = [
  {
    title: "Einzelmakler oder Gründerteam",
    text: "Hier zählt vor allem geringer Einstiegsaufwand. FLOWFACT Mini oder ein schlankes CRM-Setup kann sinnvoll sein, solange Objekt- und Anfragevolumen noch überschaubar sind.",
  },
  {
    title: "Kleines Büro mit regelmäßigem Portaleingang",
    text: "Sobald Portalanfragen den Tagesrhythmus bestimmen, werden onOffice, FLOWFACT Residential oder Propstack interessanter, weil Datenbasis und Anfragefluss enger zusammenspielen.",
  },
  {
    title: "Kleines Team mit viel Arbeit unterwegs",
    text: "Dann sollten mobile App, schnelle Dateneingabe und Terminzugriff klar vor Featurefülle priorisiert werden. Propstack oder eine bewusst schlanke FLOWFACT-Nutzung können hier stärker passen.",
  },
  {
    title: "Büro mit vorhandener Maklersoftware, aber Engpass im Postfach",
    text: "Dann liegt das Problem oft nicht mehr in der Maklersoftware selbst, sondern in Priorisierung, Antwortpfad, Freigabe und Nachfassen. In diesem Fall hilft eher eine zusätzliche operative Anfrage-Schicht.",
  },
];

const demoQuestions = [
  "Wie schnell kann ein kleines Team mit zwei bis fünf Personen produktiv arbeiten, ohne ein langes Einführungsprojekt zu starten?",
  "Wie laufen Portalanfragen konkret ein: mit Quelle, Objektbezug, Dublettenprüfung und sichtbarem Status oder nur als normale E-Mail?",
  "Was funktioniert unterwegs sauber über App oder Mobile-Web und was nur am Desktop?",
  "Wie viel Pflege braucht ein neuer Kontakt oder ein neues Objekt wirklich im Alltag?",
  "Wie werden Exposéversand, Besichtigungslogik und Zuständigkeit im kleinen Team unterstützt?",
  "Wo endet die Maklersoftware und wo braucht es zusätzlich eine operative Anfrage- und Antwortschicht?",
];

const requestProcessTruth = [
  {
    title: "Maklersoftware löst nicht automatisch Priorisierung",
    text: "Auch gute Maklersoftware braucht klare Regeln dafür, welche Anfrage sofort beantwortet, qualifiziert, freigegeben oder bewusst zurückgestellt wird.",
  },
  {
    title: "Kleine Teams merken Postfach-Reibung besonders schnell",
    text: "Schon bei moderatem Volumen können Standardanfragen, Rückfragen und Terminwünsche den Arbeitstag dominieren, wenn der Eingang nicht sauber geführt wird.",
  },
  {
    title: "Hier setzt Advaic als zusätzliche Schicht an",
    text: "Wenn die Arbeitsbasis steht, aber Anfrageeingang, Antwortqualität und Freigabe zu viel Zeit kosten, kann eine spezialisierte operative Schicht sinnvoller sein als noch ein weiterer Systemwechsel.",
  },
];

const advaicFit = [
  "Sie haben bereits eine Maklersoftware oder ein CRM, verlieren aber im Anfrageeingang Tempo und Übersicht.",
  "Ihr kleines Team braucht klare Regeln für Priorisierung, Auto-Antwort, Freigabe und Nachfassen, ohne die Maklersoftware gleich zu ersetzen.",
  "Sie wollen Standardfälle beschleunigen, Sonderfälle aber bewusst sichtbar manuell halten.",
];

const advaicNotFit = [
  "Es fehlt noch eine belastbare Grundstruktur für Objekte, Kontakte und Zuständigkeiten.",
  "Das Büro hat aktuell sehr wenig Anfragevolumen und kaum wiederkehrende Standardfälle.",
  "Sie suchen zuerst eine vollständige Maklersoftware und noch keine operative Ergänzung für den Anfrageprozess.",
];

const faqItems = [
  {
    question: "Welche Maklersoftware passt für kleine Maklerbüros am besten?",
    answer:
      "Das hängt vor allem von Teamgröße, Anfragevolumen und mobiler Arbeitsweise ab. Kleine Büros sollten nicht nach maximalem Umfang kaufen, sondern nach Einstiegsaufwand, Alltagstauglichkeit und sauberem Anfrageprozess.",
  },
  {
    question: "Ist kostenlose oder sehr günstige Maklersoftware für kleine Büros automatisch die beste Wahl?",
    answer:
      "Nicht automatisch. Ein günstiger Einstieg hilft, aber nur wenn das System im Alltag nicht zu viele manuelle Umwege erzeugt. Entscheidend ist die tatsächliche Reibung pro Anfrage, Objekt und Termin.",
  },
  {
    question: "Wann reicht ein allgemeines CRM wie HubSpot aus?",
    answer:
      "Wenn ein kleines Team vor allem generische Vertriebsarbeit braucht und die branchenspezifische Objekt- und Portal-Logik noch keine große Rolle spielt. Für klassischen Makleralltag reicht das oft nicht dauerhaft.",
  },
  {
    question: "Wann wird neben Maklersoftware noch eine Anfrage-Schicht sinnvoll?",
    answer:
      "Sobald die Grunddaten im System sauber liegen, der Engpass aber weiter bei Priorisierung, Antwortqualität, Freigabe und Nachfassen im Postfach entsteht.",
  },
];

const sources = [
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Aktuelle Herstellerseite zu Funktionsumfang, Paketlogik, Portalübertragung, App und Anfrage-/Prozessmodulen.",
  },
  {
    label: "onOffice: Prozessmanager",
    href: "https://onoffice.com/immobiliensoftware/prozessmanager/",
    note: "Offizielle Einordnung, dass der Prozessmanager auch für große und kleine Immobilienunternehmen gedacht ist.",
  },
  {
    label: "FLOWFACT Mini",
    href: "https://flowfact.de/flowfact_mini_crm/",
    note: "Aktuelle Herstellerseite für Einzelunternehmen, CRM-Einsteiger und mobilen Einstieg in den Makleralltag.",
  },
  {
    label: "FLOWFACT Produkt",
    href: "https://flowfact.de/",
    note: "Aktuelle Herstellerseite mit öffentlicher Preislogik und Positionierung für digitale Maklerteams.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/immobilien-crm/",
    note: "Aktuelle Herstellerseite zu intuitiver Nutzung, Prozessdigitalisierung und branchenspezifischem CRM.",
  },
  {
    label: "Propstack Startseite",
    href: "https://www.propstack.de/",
    note: "Aktuelle Herstellerseite mit Fokus auf mobile App, Übersicht und moderne SaaS-Nutzung.",
  },
  {
    label: "HubSpot: CRM für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Referenz für ein generisches CRM-Setup im Immobilienkontext außerhalb klassischer Maklersoftware.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Maklersoftware für kleine Maklerbüros 2026: Welche Lösung passt wirklich?",
  ogTitle: "Maklersoftware für kleine Maklerbüros 2026 | Advaic",
  description:
    "Vergleich für kleine Maklerbüros: Welche Maklersoftware zu Teamgröße, mobilem Alltag, Portalanfragen und sauberem Anfrageprozess wirklich passt.",
  path: "/maklersoftware-fuer-kleine-maklerbueros",
  template: "compare",
  eyebrow: "Kleine Maklerbüros",
  proof:
    "Für kleine Maklerbüros zählen Einstieg, Alltagstauglichkeit und sauberer Anfrageprozess stärker als maximale Funktionsfülle.",
});

export default function MaklersoftwareFuerKleineMaklerbuerosPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Maklersoftware für kleine Maklerbüros 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-10",
        mainEntityOfPage: `${siteUrl}/maklersoftware-fuer-kleine-maklerbueros`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Maklersoftware", "kleine Maklerbüros", "CRM", "Anfrageprozess"],
      },
      {
        "@type": "ItemList",
        name: "Maklersoftware für kleine Maklerbüros im Vergleich",
        itemListElement: softwareRows.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.system,
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
        { name: "Maklersoftware für kleine Maklerbüros", path: "/maklersoftware-fuer-kleine-maklerbueros" },
      ]}
      schema={schema}
      kicker="Kleine Maklerbüros"
      title="Maklersoftware für kleine Maklerbüros: Welche Lösung im Alltag wirklich trägt"
      description="Kleine Maklerbüros sollten nicht die größte Software kaufen, sondern diejenige, die bei Datenpflege, Portalanfragen, mobiler Arbeit und Teamrhythmus den geringsten Reibungsverlust erzeugt."
      actions={
        <>
          <Link href="/maklersoftware-vergleich" className="btn-secondary">
            Großer Vergleich
          </Link>
          <Link href="/signup?entry=maklersoftware-kleine-maklerbueros" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Vergleich oder zur Bürotyp-Passung springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich
            </MarketingJumpLink>
            <MarketingJumpLink href="#buero-typ" className="btn-secondary w-full justify-center">
              Bürotyp
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="maklersoftware-fuer-kleine-maklerbueros"
      primaryHref="/signup?entry=maklersoftware-kleine-maklerbueros-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/branchen/kleine-maklerbueros"
      secondaryLabel="Branchenprofil kleine Teams"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten sind offizielle Herstellerseiten und beschreiben öffentliche Produkt- und Preislogik. Für die finale Auswahl sollten Sie immer Ihren echten Anfragealltag in einer Demo abbilden."
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
                Produkt- und Prozessteam mit Fokus auf Makleralltag, Anfrageprozesse und kontrollierte Einführung in
                kleinen Teams.
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
              <h2 className="h3 mt-3">Wie diese Seite vergleicht</h2>
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

      <section id="anforderungen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was kleine Maklerbüros an Maklersoftware wirklich brauchen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Kleine Teams gewinnen nicht durch maximale Systemtiefe, sondern durch weniger Reibung im Tagesgeschäft.
              Genau deshalb sollten Alltagstauglichkeit und Anfrageprozess in der Auswahl höher gewichtet werden als
              Marketing-Featurelisten.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {smallOfficeNeeds.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="vergleich" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Maklersoftware für kleine Maklerbüros im Vergleich</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Tabelle trennt bewusst zwischen günstiger Einstiegslösung, branchenspezifischer Arbeitsbasis und
              allgemeinem CRM. Für kleine Büros ist die Frage nach der Passung wichtiger als die Frage nach dem
              größten Namen.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={softwareRows}
            rowKey={(item) => item.system}
            columns={[
              { key: "system", label: "System", emphasize: true },
              { key: "price", label: "Öffentliche Preislogik" },
              { key: "fit", label: "Typischer Fit" },
              { key: "strengths", label: "Stärken" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="buero-typ" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Lösung zu welchem kleinen Büro passt</h2>
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

      <section id="demo-fragen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Sechs Fragen, die kleine Maklerbüros in jeder Demo stellen sollten</h2>
            <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
              {demoQuestions.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section id="anfrageprozess" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was kleine Büros oft zu spät merken: Die Maklersoftware ist nur die Basis</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele kleine Teams kaufen Maklersoftware in der Hoffnung, damit automatisch auch Priorisierung,
              Antwortqualität und Freigabe geklärt zu haben. In der Praxis bleibt der operative Engpass oft im
              Anfrageeingang bestehen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {requestProcessTruth.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h3 className="h3">Wann Advaic sinnvoll ergänzt</h3>
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
              <h3 className="h3">Wann zuerst die Arbeitsbasis dran ist</h3>
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

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Sinnvolle Vertiefungen für kleine Büros</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/branchen/kleine-maklerbueros" className="btn-secondary">
                Branchenprofil kleine Maklerbüros
              </Link>
              <Link href="/maklersoftware-preise-vergleichen" className="btn-secondary">
                Preise vergleichen
              </Link>
              <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                Anfragenmanagement
              </Link>
              <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                Immobilienanfragen priorisieren
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen zu Maklersoftware für kleine Maklerbüros</h2>
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
