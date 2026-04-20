import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCheck, PenLine, XCircle } from "lucide-react";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Die Freigabe-Inbox ist kein Sammelordner für alles Unsichere, sondern ein enger Prüfpfad für Nachrichten, die bewusst nicht automatisch versendet werden sollten.",
  "Sie ist dann gut, wenn Gründe, Priorität, Entscheidung und Dokumentation sofort sichtbar sind und das Team nicht erst mehrere Postfächer oder Notizen zusammensuchen muss.",
  "Eine starke Freigabe-Inbox schützt Qualität, ohne Routinefälle auszubremsen. Genau deshalb muss sie schmal, priorisiert und gut gepflegt bleiben.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum die Inbox zählt" },
  { href: "#landet-hier", label: "Was hier landet" },
  { href: "#entscheidungen", label: "Entscheidungen" },
  { href: "#priorisierung", label: "Priorisierung" },
  { href: "#betriebsregeln", label: "Betriebsregeln" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet offizielle Quellen zu Makler-Anfragenmanagement, Portalanfragen und kontrollierter Automatisierung mit Advaics Sicht auf den operativen Freigabepfad.",
  "Verglichen wird nicht nur eine Oberfläche, sondern der praktische Ablauf: Fall landet in der Inbox, wird priorisiert, geprüft, entschieden und im Verlauf dokumentiert.",
  "Die Empfehlungen sind bewusst konservativ. Eine gute Freigabe-Inbox soll nur wirklich prüfbedürftige Fälle halten und nicht zum zweiten Postfach für alles werden.",
];

const whyInboxMatters = [
  {
    title: "Kritische Fälle bleiben sichtbar",
    text: "Wenn Beschwerden, Konflikte oder unklare Anfragen im normalen Posteingang untergehen, steigt das Risiko verspäteter oder falscher Reaktionen.",
  },
  {
    title: "Routine bleibt schnell",
    text: "Die Freigabe-Inbox funktioniert nur dann gut, wenn harmlose Standardfälle gar nicht erst hineingezogen werden und der normale Antwortfluss frei bleibt.",
  },
  {
    title: "Entscheidungen werden nachvollziehbar",
    text: "Originalnachricht, Entwurf, Freigabegrund und Entscheidung gehören in eine gemeinsame Sicht. Erst dann wird aus Prüfung ein belastbarer Prozess.",
  },
  {
    title: "Regeln lassen sich verbessern",
    text: "Wiederkehrende Gründe in der Inbox zeigen sehr schnell, wo Texte, Regeln oder Pflichtangaben nachgeschärft werden sollten.",
  },
];

const inboxCases = [
  {
    title: "Objektbezug unklar",
    text: "Wenn nicht sauber erkennbar ist, auf welche Immobilie sich die Nachricht bezieht, sollte keine automatische Zusage oder Auskunft verschickt werden.",
    Icon: AlertTriangle,
  },
  {
    title: "Pflichtangaben fehlen",
    text: "Unvollständige Anfragen oder fehlende Kerndaten brauchen oft erst Rückfrage oder bewusste manuelle Prüfung.",
    Icon: AlertTriangle,
  },
  {
    title: "Beschwerden oder Konflikte",
    text: "Sobald Ton, Thema oder Kontext eskalationsgefährdet wirken, gehört der Fall in die Freigabe und nicht in den automatischen Versand.",
    Icon: AlertTriangle,
  },
  {
    title: "Risiko- oder Qualitätswarnung",
    text: "Wenn Prüfung auf Kontext, Ton, Risiko oder Vollständigkeit nicht sauber besteht, sollte der Versand bewusst beim Team landen.",
    Icon: AlertTriangle,
  },
];

const decisionOptions = [
  {
    title: "Freigeben und senden",
    text: "Wenn Entwurf, Kontext und nächster Schritt stimmig sind, kann der Fall direkt aus der Freigabe-Inbox versendet werden.",
    Icon: CheckCheck,
  },
  {
    title: "Bearbeiten",
    text: "Wenn Inhalt, Ton oder nächster Schritt angepasst werden müssen, wird der Entwurf bewusst überarbeitet und danach versendet.",
    Icon: PenLine,
  },
  {
    title: "Stoppen",
    text: "Wenn keine automatische Antwort hinausgehen soll, bleibt der Fall beendet oder wird in einen anderen manuellen Prozess überführt.",
    Icon: XCircle,
  },
];

const priorityBands = [
  {
    title: "Sofort prüfen",
    text: "Beschwerden, Konflikte, mögliche Fehladressierung, heikle Aussagen oder Fälle mit hohem Reputationsrisiko.",
  },
  {
    title: "Heute prüfen",
    text: "Relevante Interessenten-Anfragen mit fehlenden Angaben, Rückfragen oder unklarem Kontext, die den Ablauf sonst blockieren.",
  },
  {
    title: "Gebündelt prüfen",
    text: "Leichte Lücken ohne direktes Risiko, bei denen keine voreilige Antwort droht, aber noch Klärung nötig ist.",
  },
];

const operatingRules = [
  "Jeder Fall braucht einen klaren Freigabegrund statt freier Notizen oder stiller Annahmen.",
  "Die Inbox wird nach Risiko und Prozesswirkung priorisiert, nicht nur nach Eingangszeit.",
  "Für jede Prioritätsstufe sollte eine Zielzeit bis zur Entscheidung festgelegt sein.",
  "Wiederkehrende Freigabegründe werden wöchentlich ausgewertet, damit die Inbox mit der Zeit enger und sauberer wird.",
];

const metrics = [
  "Median-Zeit bis zur Entscheidung",
  "Anteil Freigabefälle pro 100 relevante Anfragen",
  "Häufigste Freigabegründe pro Woche",
  "Quote nachträglicher Korrekturen nach Freigabe",
  "Anteil Fälle, die nach Freigabe erneut eskalieren",
  "Anteil harmloser Standardfälle, die unnötig in der Inbox landen",
];

const advaicFit = [
  "Sie möchten eine Freigabe-Inbox, in der Gründe, Priorität und Entscheidung in einer gemeinsamen Sicht zusammenlaufen.",
  "Ihr Team verliert heute Zeit, weil Sonderfälle ungeordnet im Postfach liegen oder zu spät erkannt werden.",
  "Sie wollen automatische Antworten nur dort zulassen, wo der Standardfall wirklich sauber prüfbar ist.",
];

const advaicNotFit = [
  "Ihr Anfragevolumen ist so niedrig, dass eine eigene Freigabe-Inbox kaum operative Wirkung entfaltet.",
  "Es gibt noch keine klare Zuständigkeit dafür, wer Freigabefälle zeitnah prüft und entscheidet.",
  "Sie brauchen zuerst grundlegende Struktur bei Kontakten, Objekten oder Zuständigkeiten und nicht primär einen Prüfpfad für Sonderfälle.",
];

const faqItems = [
  {
    question: "Wann sollte eine Nachricht in der Freigabe-Inbox landen?",
    answer:
      "Dann, wenn Objektbezug, Vollständigkeit, Risiko oder Ton nicht eindeutig genug sind. Typische Beispiele sind Beschwerden, Konflikte, fehlende Pflichtangaben oder widersprüchliche Informationen.",
  },
  {
    question: "Was ist der Unterschied zwischen Freigabe-Workflow und Freigabe-Inbox?",
    answer:
      "Der Freigabe-Workflow beschreibt die gesamte Logik von Erkennung bis Dokumentation. Die Freigabe-Inbox ist die konkrete Arbeitsansicht, in der prüfbedürftige Fälle priorisiert und entschieden werden.",
  },
  {
    question: "Woran erkennt man eine zu breite Freigabe-Inbox?",
    answer:
      "Wenn viele harmlose Standardfälle dort landen, die eigentlich automatisch sauber hätten laufen können. Dann wird die Inbox laut, langsam und verliert ihren eigentlichen Schutzwert.",
  },
  {
    question: "Welche Kennzahl ist für den Alltag am wichtigsten?",
    answer:
      "Die Median-Zeit bis zur Entscheidung ist meist der beste Frühindikator. Sie zeigt schnell, ob die Inbox klare Fälle geordnet abarbeitet oder ob Rückstau entsteht.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Bearbeitung im Makler-Anfragenmanager.",
  },
  {
    label: "onOffice Enterprise Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Quelle zur Einrichtung und Struktur eines geregelten Anfrage-Workflows.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur strukturierten Bearbeitung eingehender Portalanfragen im Makleralltag.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zur Einordnung verschiedener Anfragearten und ihrer operativen Bedeutung.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Entscheidungen mit menschlicher Prüfung im Prozess.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Freigabe-Inbox für Immobilienmakler 2026: prüfen, priorisieren, entscheiden",
  ogTitle: "Freigabe-Inbox für Immobilienmakler 2026 | Advaic",
  description:
    "Leitfaden für Makler: Welche Fälle in die Freigabe-Inbox gehören, wie sie priorisiert werden und welche Kennzahlen zeigen, ob der Prüfpfad wirklich funktioniert.",
  path: "/freigabe-inbox",
  template: "guide",
  eyebrow: "Freigabe-Inbox",
  proof: "Eine gute Freigabe-Inbox hält nur wirklich prüfbedürftige Fälle und macht Entscheidungen sofort nachvollziehbar.",
});

export default function FreigabeInboxPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Freigabe-Inbox für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/freigabe-inbox`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Freigabe-Inbox", "Immobilienmakler", "Anfragenmanagement", "Risikoprüfung"],
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
        { name: "Freigabe-Inbox", path: "/freigabe-inbox" },
      ]}
      schema={schema}
      kicker="Freigabe-Inbox"
      title="Freigabe-Inbox für Immobilienmakler: prüfen, priorisieren, entscheiden"
      description="Die Freigabe-Inbox ist die operative Arbeitsansicht für Nachrichten, die bewusst nicht automatisch versendet werden sollten. Entscheidend ist, dass Gründe, Priorität und Entscheidung dort sofort sichtbar zusammenkommen."
      actions={
        <>
          <Link href="/makler-freigabe-workflow" className="btn-secondary">
            Freigabe-Workflow
          </Link>
          <Link href="/signup?entry=freigabe-inbox" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Freigabefällen, Entscheidungen oder Kennzahlen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#landet-hier" className="btn-secondary w-full justify-center">
              Freigabefälle
            </MarketingJumpLink>
            <MarketingJumpLink href="#kennzahlen" className="btn-secondary w-full justify-center">
              Kennzahlen
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="freigabe-inbox"
      primaryHref="/signup?entry=freigabe-inbox-stage"
      primaryLabel="Freigabe mit echten Fällen testen"
      secondaryHref="/qualitaetschecks"
      secondaryLabel="Qualitätschecks verstehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Makler-Anfragenmanagement, Freigabepfaden und kontrollierter Risiko-Logik. Für die konkrete Umsetzung sollten Sie immer Ihre echten Freigabegründe und Antwortmuster mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Qualitätsprüfung, Freigaberegeln und operative
                Entscheidungswege im Makleralltag.
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

      <section id="warum" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum die Freigabe-Inbox im Alltag wichtiger ist als eine bloße Warnmeldung</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Eine Warnung allein löst noch keinen Prozess. Erst die Inbox macht aus prüfbedürftigen Fällen einen
              geordneten Arbeitsfluss, in dem Entscheidungen sichtbar und schnell getroffen werden können.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyInboxMatters.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="landet-hier" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Fälle bewusst in der Freigabe-Inbox landen sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der häufigste Fehler ist eine zu breite Inbox. Sie sollte nur Fälle auffangen, bei denen der normale
              Antwortpfad bewusst unterbrochen werden muss.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {inboxCases.map((item) => (
              <article key={item.title} className="card-base p-6">
                <item.Icon className="h-5 w-5 text-[var(--gold)]" />
                <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="entscheidungen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Entscheidungen in der Inbox klar getrennt bleiben sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Eine gute Freigabe-Inbox mischt nicht alles in einem Editor. Sie trennt sichtbar zwischen freigeben,
              bearbeiten und stoppen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {decisionOptions.map((item) => (
              <article key={item.title} className="card-base card-hover relative overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                <item.Icon className="h-5 w-5 text-[var(--gold)]" />
                <h3 className="h3 mt-3">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="priorisierung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Priorisierung in der Freigabe-Inbox</h2>
              <p className="helper mt-3">
                Die Inbox sollte nicht bloß chronologisch sortieren. Sie muss sichtbar machen, welche Fälle sofort,
                heute oder gesammelt geprüft werden sollten.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {priorityBands.map((band) => (
                  <article key={band.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{band.title}</p>
                    <p className="helper mt-2">{band.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Praktischer Prüfpunkt</p>
              <h2 className="h3 mt-3">Wenn alles dringend aussieht, ist die Inbox zu grob</h2>
              <p className="helper mt-3">
                Eine gesunde Freigabe-Inbox zeigt spürbar verschiedene Prioritäten. Wenn fast jeder Fall sofort geprüft
                werden soll, ist der Prüfpfad meist zu breit aufgesetzt.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="betriebsregeln" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Betriebsregeln, die eine Freigabe-Inbox wirklich brauchbar machen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Oberfläche allein reicht nicht. Erst klare Regeln und Zuständigkeiten machen aus der Inbox einen
              belastbaren Prüfpfad.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {operatingRules.map((item) => (
              <article key={item} className="card-base p-6">
                <p className="text-base font-semibold text-[var(--text)]">{item}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen, die zeigen, ob die Inbox wirklich funktioniert</h2>
              <p className="helper mt-3">
                Gute Kennzahlen messen nicht nur Geschwindigkeit, sondern auch unnötige Freigaben, Rückstau und
                spätere Korrekturen.
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                {metrics.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Zu viele Fälle in der Inbox sind selten ein gutes Zeichen</h2>
              <p className="helper mt-3">
                Wenn die Freigabequote dauerhaft sehr hoch ist, landen oft zu viele harmlose Fälle im Prüfpfad. Dann
                wird die Inbox laut und verliert an operativem Wert.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn prüfbedürftige Fälle nicht im Postfach hängen bleiben sollen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/makler-freigabe-workflow" className="btn-secondary">
                  Freigabe-Workflow
                </Link>
                <Link href="/qualitaetschecks" className="btn-secondary">
                  Qualitätschecks
                </Link>
                <Link href="/manuell-vs-advaic" className="btn-secondary">
                  Manuell vs. Advaic
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Prüfpfad operativ noch nicht getragen werden kann</h2>
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
