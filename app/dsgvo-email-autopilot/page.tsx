import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Ein E-Mail-Autopilot ist nicht schon deshalb datenschutzgerecht, weil er Guardrails hat. Entscheidend ist, ob Zwecke, Rollen, Freigabegrenzen, Speicherregeln und Nachweise im Betrieb sauber geregelt sind.",
  "Für Makler ist die entscheidende Frage nicht, ob Automatisierung erlaubt ist, sondern unter welchen Bedingungen sie kontrolliert, dokumentiert und auf klar prüfbare Standardfälle begrenzt wird.",
  "Advaic kann diesen Rahmen technisch unterstützen. Die rechtliche Bewertung Ihrer konkreten Verarbeitung, internen Zuständigkeiten und Aufbewahrungslogik bleibt trotzdem beim Betreiber.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#worum-es-geht", label: "Worum es geht" },
  { href: "#betreiberpflichten", label: "Betreiberpflichten" },
  { href: "#unterstuetzung", label: "Technische Unterstützung" },
  { href: "#vor-dem-start", label: "Vor dem Start" },
  { href: "#unterlagen", label: "Unterlagen" },
  { href: "#grenzen", label: "Grenzen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite stützt sich auf offizielle Primärquellen der EU, des Europäischen Datenschutzausschusses, des BfDI und des BSI. Sie dient als technische und organisatorische Einordnung für Makler, nicht als individuelle Rechtsberatung.",
  "Bewertet wird nicht nur das Tool, sondern der gesamte Betrieb: Zweckbindung, Datenminimierung, Rollen, Auftragsverarbeitung, Freigabegrenzen, Sicherheit und Nachvollziehbarkeit im Anfrageprozess.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist kein pauschales Konformitätsversprechen, sondern ein realistisch prüfbarer Rahmen für einen sauberen Pilot- und Produktivbetrieb.",
];

const legalFocus = [
  {
    title: "Zweck und Rechtsgrundlage bleiben konkret",
    text: "Es sollte klar dokumentiert sein, warum Nachrichten verarbeitet werden, welche Schritte automatisch laufen dürfen und an welcher Stelle menschliche Prüfung verpflichtend bleibt.",
    Icon: FileText,
  },
  {
    title: "Datensparsamkeit ist Prozessarbeit",
    text: "Nicht jede eingehende E-Mail gehört automatisch in denselben Antwortpfad. Nicht-Anfragen, Rundmails und irrelevante Systemmails sollten bewusst getrennt bleiben.",
    Icon: ClipboardList,
  },
  {
    title: "Sicherheit braucht Technik und Organisation",
    text: "Zugriffsrechte, Rollen, Freigabewege und Schutzmaßnahmen müssen zusammenpassen. Ein gutes Tool ersetzt keine saubere interne Zuständigkeit.",
    Icon: ShieldCheck,
  },
  {
    title: "Nachweise und Speicherregeln müssen belastbar sein",
    text: "Wer automatisiert arbeitet, braucht auch klare Regeln für Verlauf, Aufbewahrung, Löschung und die Bearbeitung von Betroffenenanfragen.",
    Icon: Archive,
  },
];

const operatorDuties = [
  "Verarbeitungszwecke, Rechtsgrundlage und beteiligte Rollen für den Anfrageprozess schriftlich festhalten",
  "Prüfen, welche Dienstleister eingebunden sind und ob Auftragsverarbeitungsverträge sowie Unterlagen vollständig vorliegen",
  "Zugriffsrechte, Freigabezuständigkeiten und Zielzeiten für sensible oder unklare Fälle festlegen",
  "Speicher- und Löschregeln definieren sowie Auskunfts- und Löschanfragen organisatorisch vorbereiten",
];

const advaicSupport = [
  {
    title: "Klare Freigabegrenzen statt Blindversand",
    text: "Advaic ist auf kontrollierte Versandentscheidungen ausgelegt. Unklare, konfliktbehaftete oder unvollständige Fälle gehören in die Freigabe statt in den automatischen Versand.",
  },
  {
    title: "Sichtbarer Verlauf pro Nachricht",
    text: "Für den operativen Alltag zählt, dass Eingang, Entscheidung, Freigabe und Versand nachvollziehbar bleiben. Genau das erleichtert interne Prüfung und spätere Nachsteuerung.",
  },
  {
    title: "Datensparsame Trennung von Relevanz und Rauschen",
    text: "Nicht jede Nachricht ist eine relevante Interessenten-Anfrage. Eine saubere Trennung von Anfrage, Nicht-Anfrage und Sonderfall reduziert unnötige Verarbeitung im falschen Pfad.",
  },
  {
    title: "Konservativer Startkorridor",
    text: "Ein enger Pilot mit klar prüfbaren Standardfällen ist datenschutz- und risikoseitig meist stärker als ein früher Vollautomatismus mit unscharfen Grenzen.",
  },
];

const preflightChecklist = [
  "Welche Nachrichtentypen dürfen überhaupt automatisiert bearbeitet werden und welche bleiben verpflichtend manuell?",
  "Welche Rollen sehen welche Daten, wer entscheidet Freigaben und wer pflegt Regeln nach?",
  "Welche Unterlagen zu Auftragsverarbeitung, Sicherheit, Speicherfristen und Betroffenenrechten liegen intern vor?",
  "Wie werden Verlauf, Korrekturgründe und Ausnahmen dokumentiert, damit der Betrieb später prüfbar bleibt?",
];

const documentationLinks = [
  {
    title: "Datenschutz",
    text: "Die formale Datenschutzeinordnung, Rollen und Speicherhinweise auf der Website.",
    href: "/datenschutz",
    label: "Datenschutz öffnen",
  },
  {
    title: "Sicherheit",
    text: "Die operative Sicherheitslogik rund um Auto, Freigabe, Nachweise und Prüfpfade.",
    href: "/sicherheit",
    label: "Sicherheitsseite öffnen",
  },
  {
    title: "Freigabe-Inbox",
    text: "Der manuelle Prüfpfad für sensible, unklare oder konfliktanfällige Fälle.",
    href: "/freigabe-inbox",
    label: "Freigabe-Inbox öffnen",
  },
  {
    title: "Autopilot-Regeln",
    text: "Die sichtbare Entscheidungslogik hinter Auto, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
    label: "Regeln öffnen",
  },
];

const boundaries = [
  {
    title: "Was diese Seite leistet",
    points: [
      "Sie ordnet die wichtigsten DSGVO-Themen für einen Makler-Autopilot fachlich ein.",
      "Sie zeigt, welche Pflichten typischerweise beim Betreiber liegen und wo technische Guardrails helfen.",
      "Sie verweist auf die Unterlagen und Prozessseiten, die vor einem Test öffentlich oder intern prüfbar sein sollten.",
    ],
  },
  {
    title: "Was diese Seite nicht leisten kann",
    points: [
      "Keine verbindliche Rechtsberatung für Ihren Einzelfall oder Ihre konkrete Rechtsgrundlage.",
      "Keine pauschale Aussage, dass jeder beliebige Einsatz automatisch DSGVO-konform ist.",
      "Keine Ersetzung interner Rollenklärung, Löschkonzepte oder Prüfung Ihrer Dienstleisterverträge.",
    ],
  },
];

const faqItems = [
  {
    question: "Ist ein E-Mail-Autopilot automatisch DSGVO-konform, wenn Guardrails vorhanden sind?",
    answer:
      "Nein. Guardrails sind wichtig, aber sie ersetzen weder eine saubere Zweckbestimmung noch Rollen, Auftragsverarbeitung, Speicherregeln oder interne Zuständigkeiten. Die rechtliche Bewertung bleibt immer am konkreten Betrieb hängen.",
  },
  {
    question: "Warum ist Freigabe aus Datenschutzsicht so wichtig?",
    answer:
      "Weil sensible, unklare oder konfliktbehaftete Fälle gerade nicht blind automatisiert werden sollten. Freigabe ist die kontrollierte Stelle, an der menschliche Prüfung verpflichtend bleibt.",
  },
  {
    question: "Welche Unterlagen sollten vor einem Pilotstart vorliegen?",
    answer:
      "Typisch sind dokumentierte Zwecke und Rollen, Informationen zur Auftragsverarbeitung, Sicherheitsunterlagen, Speicher- und Löschregeln sowie ein klarer interner Prozess für Betroffenenanfragen und Sonderfälle.",
  },
  {
    question: "Welche Aussage wäre auf so einer Seite unseriös?",
    answer:
      "Eine pauschale Behauptung wie `vollständig DSGVO-konform ohne weiteren Aufwand`. Seriöser ist die Aussage, dass das Tool technische und organisatorische Leitplanken unterstützt, die konkrete Bewertung aber von Ihrem Einsatz und Ihren Unterlagen abhängt.",
  },
];

const sources = [
  {
    label: "EUR-Lex: Verordnung (EU) 2016/679",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "Primärquelle der DSGVO, insbesondere für Grundsätze, Betroffenenrechte, Sicherheit, Auftragsverarbeitung und Rechenschaftspflichten.",
  },
  {
    label: "EDPB: Guidelines 4/2019 on Article 25 Data Protection by Design and by Default",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en",
    note: "Offizielle Leitlinie dazu, wie Datenschutz durch Technikgestaltung und datenschutzfreundliche Voreinstellungen praktisch gedacht wird.",
  },
  {
    label: "EDPB: Guidelines 07/2020 on the concepts of controller and processor in the GDPR",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en",
    note: "Offizielle Leitlinie zur Abgrenzung von Verantwortlichen und Auftragsverarbeitern im praktischen Betrieb.",
  },
  {
    label: "BfDI: Informationen zur Datenschutz-Grundverordnung",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
    note: "Nationale Einordnung und Orientierung zur Anwendung der DSGVO in Deutschland.",
  },
  {
    label: "BSI: IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Rahmen für organisatorische und technische Schutzmaßnahmen im laufenden Betrieb.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "DSGVO und E-Mail-Autopilot 2026: Worauf Makler vor dem Einsatz achten sollten",
  ogTitle: "DSGVO und E-Mail-Autopilot 2026 | Advaic",
  description:
    "Leitfaden für Makler: Welche Betreiberpflichten, Unterlagen, Freigabegrenzen und technischen Leitplanken vor dem Einsatz eines E-Mail-Autopiloten wichtig sind.",
  path: "/dsgvo-email-autopilot",
  template: "trust",
  eyebrow: "DSGVO & E-Mail-Autopilot",
  proof:
    "Seriöse DSGVO-Kommunikation trennt technische Leitplanken von Betreiberpflichten und verspricht keine pauschale Konformität ohne klare Rollen, Unterlagen und Freigabegrenzen.",
});

export default function DSGVOEmailAutopilotPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "DSGVO und E-Mail-Autopilot 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/dsgvo-email-autopilot`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["DSGVO", "E-Mail-Autopilot", "Immobilienmakler", "Freigabe", "Datenschutz"],
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
        { name: "DSGVO & E-Mail-Autopilot", path: "/dsgvo-email-autopilot" },
      ]}
      schema={schema}
      kicker="DSGVO & E-Mail-Autopilot"
      title="Worauf Makler bei DSGVO und E-Mail-Autopilot vor dem Einsatz wirklich achten sollten"
      description="Die starke Frage lautet nicht, ob ein Tool pauschal `DSGVO-konform` genannt werden kann. Die starke Frage lautet, ob Zwecke, Rollen, Freigaben, Speicherregeln und Nachweise im echten Betrieb sauber geregelt sind."
      actions={
        <>
          <Link href="/sicherheit" className="btn-secondary">
            Sicherheitsseite
          </Link>
          <Link href="/signup?entry=dsgvo-email-autopilot" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Betreiberpflichten oder Unterlagen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#betreiberpflichten" className="btn-secondary w-full justify-center">
              Betreiberpflichten
            </MarketingJumpLink>
            <MarketingJumpLink href="#unterlagen" className="btn-secondary w-full justify-center">
              Unterlagen
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="intent-dsgvo-autopilot"
      primaryHref="/signup?entry=dsgvo-email-autopilot-stage"
      primaryLabel="Mit konservativen Grenzen testen"
      secondaryHref="/datenschutz"
      secondaryLabel="Datenschutz lesen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Diese Seite ist eine technische und organisatorische Einordnung auf Basis offizieller Quellen. Sie ersetzt keine individuelle Rechtsberatung und keine Prüfung Ihrer konkreten Verarbeitung."
      afterSources={<TrustByDesign />}
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Freigabepfade, Sicherheitslogik und
                nachvollziehbare Automatisierung im Makleralltag.
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

      <section id="worum-es-geht" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Worum es bei DSGVO und E-Mail-Autopilot in der Praxis wirklich geht</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Datenschutzgerechter Betrieb bedeutet nicht, jede Automatisierung zu vermeiden. Entscheidend ist, dass
              automatisierte Verarbeitung auf klare Zwecke, begrenzte Standardfälle und prüfbare Entscheidungswege
              reduziert wird.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {legalFocus.map((item) => (
              <article key={item.title} className="card-base p-6">
                <item.Icon className="h-5 w-5 text-[var(--gold)]" />
                <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="betreiberpflichten" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Welche Pflichten typischerweise beim Betreiber liegen</h2>
              <p className="helper mt-3">
                Ein Tool kann Guardrails liefern. Die Verantwortung für Zwecke, Verträge, Zugriffe, Löschung und
                interne Zuständigkeiten verschwindet dadurch nicht.
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
                {operatorDuties.map((item) => (
                  <li key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Wichtiger Hinweis</p>
              <h2 className="h3 mt-3">Seriös ist die Trennung von Tool und Betrieb</h2>
              <p className="helper mt-3">
                Gute DSGVO-Kommunikation verspricht nicht pauschal Sicherheit durch Software allein, sondern zeigt
                offen, welche Themen technisch unterstützt und welche organisatorisch getragen werden müssen.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="unterstuetzung" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wo Advaic den datenschutzbewussten Betrieb technisch unterstützt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die eigentliche Stärke liegt in begrenzten Versandpfaden, sichtbaren Entscheidungen und konservativen
              Startbedingungen, nicht in vollmundigen Pauschalversprechen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {advaicSupport.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="vor-dem-start" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Welche Fragen vor einem Test beantwortet sein sollten</h2>
              <p className="helper mt-3">
                Wer diese vier Punkte vor dem Pilot sauber klärt, reduziert spätere Unsicherheit deutlich mehr als mit
                einer bloßen Tool-Zusage.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {preflightChecklist.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Pragmatischer Start</p>
              <h2 className="h3 mt-3">Erst enge Standardfälle, dann bewusste Erweiterung</h2>
              <p className="helper mt-3">
                Aus Datenschutz- und Risikosicht ist ein enger Start mit hoher Freigabequote häufig die stärkere
                Variante als ein früher Vollbetrieb mit zu breiten Regeln.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="unterlagen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Seiten und Unterlagen vor einem Test greifbar sein sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Trust-Kommunikation endet nicht auf einer einzigen DSGVO-Seite. Sie verweist auf die Stellen, an
              denen Rollen, Sicherheitslogik und operative Grenzen konkret sichtbar werden.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {documentationLinks.map((item) => (
              <article key={item.href} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-5">
                  {item.label}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="grenzen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {boundaries.map((block) => (
              <article key={block.title} className="card-base p-6 md:p-8">
                <h2 className="h3">{block.title}</h2>
                <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  {block.points.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
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
