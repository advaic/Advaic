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
  "Der DSGVO-Einwand ist berechtigt. Ein E-Mail-Autopilot ist nur dann verantwortbar, wenn Zwecke, Rollen, Freigabegrenzen, Speicherregeln und Nachweise im Betrieb klar geregelt sind.",
  "Eine seriöse Antwort auf diesen Einwand verspricht keine pauschale Konformität. Sie trennt sauber zwischen technischer Unterstützung und den Pflichten, die beim Betreiber bleiben.",
  "Advaic passt genau dort, wo Makler kontrollierte Standardfälle beschleunigen wollen, ohne sensible oder unklare Nachrichten blind in den Versand zu geben.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#einwand", label: "Einwand einordnen" },
  { href: "#antwort", label: "Sachliche Antwort" },
  { href: "#advaic", label: "Was Advaic beiträgt" },
  { href: "#intern", label: "Was intern geklärt werden muss" },
  { href: "#pilot", label: "Was im Pilot geprüft wird" },
  { href: "#weiter", label: "Weiter prüfen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite stützt sich auf offizielle Primärquellen der EU, des Europäischen Datenschutzausschusses, des BfDI und des BSI sowie auf Advaics öffentlich dokumentierte Sicherheits- und Freigabelogik.",
  "Beantwortet wird nicht die abstrakte Frage, ob Automatisierung pauschal erlaubt ist, sondern was für einen verantwortbaren Betrieb im Makleralltag konkret vorliegen sollte.",
  "Die Empfehlung ist bewusst vorsichtig: enge Standardfälle, klare Freigabegrenzen, dokumentierte Rollen und keine vollmundigen Aussagen ohne belegbare Unterlagen.",
];

const concernPoints = [
  {
    title: "Der Einwand ist nicht übervorsichtig",
    text: "Sobald automatisiert E-Mails verarbeitet oder versendet werden, geht es nicht nur um Textqualität, sondern um Zweck, Zugriff, Dokumentation und menschliche Eingriffspunkte.",
  },
  {
    title: "Die eigentliche Frage ist betrieblicher Natur",
    text: "Entscheidend ist nicht der Slogan auf der Website, sondern ob der Betrieb mit Rollen, Unterlagen, Freigaben und Speicherregeln tatsächlich tragfähig aufgebaut ist.",
  },
  {
    title: "Pauschale Antworten sind eher ein Warnsignal",
    text: "Wenn ein Anbieter auf diesen Einwand nur mit einem einfachen `ja, natürlich` reagiert, ohne Pflichten und Grenzen offenzulegen, ist das meistens zu dünn.",
  },
];

const directAnswer = [
  "Advaic ist nicht als unkontrollierter Vollautomatismus gedacht, sondern als eng geführter Anfragepfad mit klaren Regeln für Auto, Freigabe und Ignorieren.",
  "Sensible, unklare oder konfliktbehaftete Fälle gehören in die Freigabe und nicht in den automatischen Versand.",
  "Verlauf, Entscheidungen und Eingriffe sollen sichtbar bleiben, damit Teams den Betrieb prüfen und nachsteuern können.",
  "Trotzdem ersetzt das Produkt keine interne Rollenklärung, keine Prüfung der Auftragsverarbeitung und keine individuelle Rechtsberatung.",
];

const advaicContribution = [
  {
    title: "Freigabe statt Blindversand",
    text: "Advaic unterstützt einen konservativen Pfad, in dem unvollständige, riskante oder unklare Fälle bewusst manuell entschieden werden.",
  },
  {
    title: "Nachvollziehbarkeit statt Black Box",
    text: "Für operative Prüfung ist wichtig, dass Entscheidungen und Status pro Nachricht sichtbar bleiben und nicht nur im Hintergrund passieren.",
  },
  {
    title: "Trennung von relevanter Anfrage und Rauschen",
    text: "Nicht jede eingehende Nachricht gehört in denselben Verarbeitungsweg. Die Trennung von Anfrage, Nicht-Anfrage und Sonderfall reduziert unnötige Verarbeitung.",
  },
  {
    title: "Vorsichtiger Start statt großer Versprechen",
    text: "Ein enger Pilot mit hoher Freigabequote ist aus Datenschutz- und Risikosicht oft die stärkere Antwort auf diesen Einwand.",
  },
];

const internalRequirements = [
  "Verarbeitungszwecke, Rechtsgrundlage und Rollen für den Anfrageprozess sauber dokumentieren",
  "Prüfen, welche Dienstleister beteiligt sind und ob Auftragsverarbeitung und Unterlagen vollständig vorliegen",
  "Speicher- und Löschregeln sowie Zuständigkeiten für Auskunfts- und Löschanfragen festlegen",
  "Definieren, welche Fälle verpflichtend manuell bleiben und wer Freigaben in welcher Frist prüft",
];

const pilotChecks = [
  "Nur klar prüfbare Standardfälle in den Startkorridor nehmen",
  "Freigabegründe, Stopps und manuelle Korrekturen in den ersten Wochen aktiv auswerten",
  "Mit echten Fällen prüfen, ob Verlauf, Verantwortlichkeiten und Nachweise im Team wirklich greifen",
  "Sensible Sonderfälle bewusst außerhalb des automatischen Versands halten, bis Unterlagen und Regeln stabil sind",
];

const nextSteps = [
  {
    title: "DSGVO-Hub",
    text: "Die ausführliche Einordnung zu Betreiberpflichten, Unterlagen und Grenzen.",
    href: "/dsgvo-email-autopilot",
    label: "DSGVO-Seite öffnen",
  },
  {
    title: "Sicherheitsseite",
    text: "Die operative Sicherheitslogik mit Auto-Grenzen, Freigabe und Nachweisen.",
    href: "/sicherheit",
    label: "Sicherheit prüfen",
  },
  {
    title: "Freigabe-Inbox",
    text: "Der manuelle Pfad für sensible oder unklare Fälle im Alltag.",
    href: "/freigabe-inbox",
    label: "Freigabe-Inbox ansehen",
  },
  {
    title: "Datenschutz",
    text: "Die formalen Datenschutzinformationen und Website-Unterlagen.",
    href: "/datenschutz",
    label: "Datenschutz lesen",
  },
];

const faqItems = [
  {
    question: "Kann man auf diesen Einwand seriös mit einem klaren Ja antworten?",
    answer:
      "Nur sehr eingeschränkt. Seriös ist nicht das pauschale Ja, sondern die Erklärung, unter welchen Bedingungen der Betrieb sauber aufgesetzt wird und welche Pflichten beim Betreiber bleiben.",
  },
  {
    question: "Warum ist Freigabe bei diesem Einwand so zentral?",
    answer:
      "Weil Freigabe zeigt, dass sensible, unklare oder konfliktbehaftete Fälle eben nicht blind automatisiert werden. Genau dort wird aus einem pauschalen Risiko eine kontrollierte Prozessgrenze.",
  },
  {
    question: "Was wäre bei einem Anbieter ein schlechtes Zeichen?",
    answer:
      "Wenn weder Rollen, Unterlagen, Auftragsverarbeitung, Speicherregeln noch Freigabegrenzen sauber benannt werden und stattdessen nur allgemeine Vertrauensbegriffe stehen bleiben.",
  },
  {
    question: "Wann ist der Einwand für ein Maklerbüro besonders relevant?",
    answer:
      "Vor allem dann, wenn mehrere Postfächer, verschiedene Mitarbeiter, sensible Sonderfälle oder ungeklärte Speicher- und Verantwortungsfragen zusammenkommen. Dann braucht es mehr als nur ein gutes Antwortmodell.",
  },
];

const sources = [
  {
    label: "EUR-Lex: Verordnung (EU) 2016/679",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "Primärquelle der DSGVO für Grundsätze, Rechenschaftspflichten, Sicherheit, Betroffenenrechte und Auftragsverarbeitung.",
  },
  {
    label: "EDPB: Guidelines 4/2019 on Article 25 Data Protection by Design and by Default",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en",
    note: "Offizielle Leitlinie dazu, wie datenschutzfreundliche Technikgestaltung und Voreinstellungen praktisch zu verstehen sind.",
  },
  {
    label: "EDPB: Guidelines 07/2020 on the concepts of controller and processor in the GDPR",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en",
    note: "Offizielle Leitlinie zur Abgrenzung von Verantwortlichen und Auftragsverarbeitern im Betrieb.",
  },
  {
    label: "BfDI: Informationen zur Datenschutz-Grundverordnung",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
    note: "Nationale Orientierung zur Anwendung der DSGVO in Deutschland.",
  },
  {
    label: "BSI: IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Rahmen für organisatorische und technische Schutzmaßnahmen im laufenden Betrieb.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Einwand DSGVO 2026: Wie Makler den Autopilot seriös prüfen sollten",
  ogTitle: "Einwand DSGVO 2026 | Advaic",
  description:
    "Antwort auf den DSGVO-Einwand: Welche Fragen Makler wirklich stellen sollten, was Advaic technisch beiträgt und welche Pflichten intern geklärt bleiben.",
  path: "/einwaende/dsgvo",
  template: "trust",
  eyebrow: "Einwand DSGVO",
  proof:
    "Eine seriöse Antwort auf den DSGVO-Einwand trennt technische Leitplanken von Betreiberpflichten und macht Freigabegrenzen sowie Unterlagen sichtbar.",
});

export default function ObjectionDSGVOPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Einwand DSGVO 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/einwaende/dsgvo`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Einwand DSGVO", "E-Mail-Autopilot", "Immobilienmakler", "Freigabe", "Datenschutz"],
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
        { name: "Einwand DSGVO", path: "/einwaende/dsgvo" },
      ]}
      schema={schema}
      kicker="Einwand DSGVO"
      title="„Ist das wirklich DSGVO-konform?“ Wie Makler diesen Einwand seriös prüfen sollten"
      description="Der Einwand ist berechtigt. Die starke Antwort ist nicht ein pauschales Ja, sondern ein sauberer Blick auf Zwecke, Rollen, Freigabegrenzen, Unterlagen und den realen Betrieb."
      actions={
        <>
          <Link href="/dsgvo-email-autopilot" className="btn-secondary">
            DSGVO-Hub
          </Link>
          <Link href="/signup?entry=objection-dsgvo" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur sachlichen Antwort oder zum Pilot-Check springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#antwort" className="btn-secondary w-full justify-center">
              Sachliche Antwort
            </MarketingJumpLink>
            <MarketingJumpLink href="#pilot" className="btn-secondary w-full justify-center">
              Pilot-Check
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="einwand-dsgvo"
      primaryHref="/signup?entry=objection-dsgvo-stage"
      primaryLabel="Mit konservativen Grenzen starten"
      secondaryHref="/sicherheit"
      secondaryLabel="Sicherheitslogik prüfen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Diese Seite ordnet den Einwand auf Basis offizieller Quellen und der öffentlich dokumentierten Produktlogik ein. Sie ersetzt keine individuelle Rechtsberatung."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Freigabe, Sicherheitslogik und nachvollziehbare
                Automatisierung im Makleralltag.
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

      <section id="einwand" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum dieser Einwand absolut berechtigt ist</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer automatisierte E-Mail-Bearbeitung einführt, sollte nicht zuerst nach Beruhigung suchen, sondern nach
              sauberer Trennung von Produktlogik, Unterlagen und Betreiberverantwortung.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {concernPoints.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="antwort" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Die sachliche Antwort auf den Einwand</h2>
              <p className="helper mt-3">
                Die belastbare Antwort lautet nicht `ja, natürlich`, sondern: nur unter klaren Bedingungen, mit
                sichtbaren Grenzen und ohne Verwechslung von Tool-Funktion und Betreiberpflicht.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {directAnswer.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Freigabe ist die seriöse Antwort auf Unsicherheit</h2>
              <p className="helper mt-3">
                Wenn ein System sensible oder unklare Fälle nicht sauber stoppt, ist das kein Datenschutz-Setup,
                sondern ein Risiko mit hübscher Oberfläche.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was Advaic in dieser Frage tatsächlich beiträgt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Stärke liegt in kontrollierter Prozesslogik, nicht in pauschalen Konformitätsversprechen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {advaicContribution.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="intern" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was intern trotzdem geklärt bleiben muss</h2>
              <p className="helper mt-3">
                Genau an diesem Punkt trennt sich ernsthafte Vorbereitung von bloßer Tool-Hoffnung.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {internalRequirements.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Wenn niemand diese Punkte im Team benennen kann, ist es zu früh</h2>
              <p className="helper mt-3">
                Dann ist nicht der Einwand das Problem, sondern die fehlende Betriebsreife für einen kontrollierten
                Einsatz.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="pilot" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Woran ein DSGVO-sensibler Pilot gemessen werden sollte</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer diesen Einwand ernst nimmt, prüft nicht nur Sprache und Tempo, sondern vor allem Grenzen,
              Freigabegründe und tatsächliche Nachvollziehbarkeit.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {pilotChecks.map((item) => (
              <article key={item} className="card-base p-6">
                <p className="text-base font-semibold text-[var(--text)]">{item}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="weiter" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Diese Seiten sollten Sie als Nächstes prüfen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Eine starke Einwand-Seite zeigt nicht nur eine Antwort, sondern auch den Weg zu den eigentlichen
              Prüfstellen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {nextSteps.map((item) => (
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
