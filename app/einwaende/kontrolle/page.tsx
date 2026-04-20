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
  "Der Einwand Kontrollverlust ist berechtigt. Ein Makler-Autopilot ist nur dann vertretbar, wenn Auto, Freigabe und Stopp als klare Prozessgrenzen beschrieben sind und nicht nur als Marketingbegriffe.",
  "Kontrolle bedeutet im Alltag nicht, dass alles manuell bleibt. Kontrolle bedeutet, dass Regeln, Freigabegründe, manuelle Eingriffe und Korrekturen sichtbar bleiben und später nachgeschärft werden können.",
  "Advaic passt genau dort, wo Standardfälle schneller laufen sollen, ohne dass unklare, sensible oder konfliktbehaftete Nachrichten unkontrolliert in den Versand geraten.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#einwand", label: "Einwand einordnen" },
  { href: "#antwort", label: "Sachliche Antwort" },
  { href: "#mechanik", label: "Kontrollmechanik" },
  { href: "#betrieb", label: "Betrieb" },
  { href: "#pilot", label: "Pilot-Check" },
  { href: "#weiter", label: "Weiter prüfen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite stützt sich auf offizielle Quellen zu Makler-Anfragenmanagement, Portalanfragen und kontrollierter Automatisierung sowie auf Advaics öffentlich dokumentierte Regel-, Prüf- und Freigabelogik.",
  "Beantwortet wird nicht die emotionale Frage, ob Autopilot beängstigend klingt, sondern was in einem belastbaren Betrieb sichtbar und steuerbar sein muss.",
  "Die Empfehlungen sind bewusst konservativ: enge Startkorridore, klare Freigabe, saubere Nachvollziehbarkeit und Regelpflege statt aggressiver Automationsquote.",
];

const concernPoints = [
  {
    title: "Der Einwand trifft einen echten Schwachpunkt vieler Tools",
    text: "Viele Systeme zeigen schöne Antworten, aber zu wenig darüber, warum eine Nachricht automatisch gesendet, gestoppt oder zur Freigabe gelegt wurde.",
  },
  {
    title: "Kontrollverlust beginnt nicht erst beim Fehler",
    text: "Er beginnt schon dann, wenn ein Team Regeln nicht erklären, Korrekturen nicht auswerten oder Freigabefälle nicht klar priorisieren kann.",
  },
  {
    title: "Mehr manuelle Arbeit ist nicht automatisch mehr Kontrolle",
    text: "Wenn alles im Postfach hängen bleibt, entsteht oft eher Intransparenz als Sicherheit. Echte Kontrolle braucht sichtbare Grenzen und geordnete Eingriffe.",
  },
];

const directAnswer = [
  "Advaic ist nicht als System gedacht, das möglichst viel ohne Nachweis versendet. Es basiert auf einer klaren Trennung zwischen automatischem Versand, Freigabe und Ignorieren.",
  "Unklare, unvollständige, konfliktbehaftete oder sensible Fälle sollen nicht automatisch rausgehen, sondern bewusst beim Team landen.",
  "Kontrolle entsteht dadurch, dass Regeln, Freigabegründe, Entscheidungen und manuelle Eingriffe im Verlauf sichtbar bleiben und nicht nur implizit im System verborgen sind.",
  "Trotzdem bleibt Kontrolle nur dann belastbar, wenn das Team Regeln prüft, Ausnahmen beobachtet und bei Bedarf Auto-Anteile wieder reduziert.",
];

const controlMechanisms = [
  {
    title: "Auto nur bei klaren Eingangssignalen",
    text: "Automatischer Versand sollte nur für echte Standardfälle erlaubt sein, bei denen Relevanz, Kontext, Vollständigkeit und Risiko sauber geprüft wurden.",
  },
  {
    title: "Freigabe als Pflichtpfad",
    text: "Fehlende Angaben, Beschwerden, Konflikte, Sonderfälle oder heikle Aussagen gehören nicht in einen blinden Auto-Pfad, sondern in die Freigabe-Inbox.",
  },
  {
    title: "Stopps und Gründe bleiben sichtbar",
    text: "Ein Team muss später nachvollziehen können, warum ein Fall gestoppt wurde oder wo eine Korrektur nötig war. Genau dort entsteht echte Steuerbarkeit.",
  },
  {
    title: "Auto-Anteil bleibt steuerbar",
    text: "Wenn Qualität kippt oder zu viele Grenzfälle durchlaufen, muss das Setup enger gestellt werden können, statt blind weiterzulaufen.",
  },
];

const operatingRequirements = [
  "Regeln so formulieren, dass das Team erklären kann, warum ein Fall automatisch läuft, in die Freigabe geht oder bewusst ignoriert wird",
  "Freigabefälle nach Risiko und Prozesswirkung priorisieren statt nur chronologisch abzuarbeiten",
  "Korrekturen, Stopps und wiederkehrende Grenzfälle regelmäßig auswerten und in die Regelpflege zurückspielen",
  "Auto-Anteil nur dann erweitern, wenn Standardfälle stabil laufen und Sonderfälle sauber abgefangen werden",
];

const pilotChecks = [
  "Wie hoch ist die Freigabequote in den ersten Wochen und sind die Gründe dafür nachvollziehbar?",
  "Wie viele Auto-Fälle mussten nachträglich korrigiert oder manuell eingefangen werden?",
  "Sind Regelgründe, Entscheidungen und Eingriffe pro Nachricht für das Team klar sichtbar?",
  "Kann der Auto-Anteil bei Qualitätsproblemen schnell reduziert werden, ohne dass der Betrieb auseinanderfällt?",
];

const nextSteps = [
  {
    title: "Autopilot-Regeln",
    text: "Die konkrete Entscheidungslogik hinter Auto, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
    label: "Regelwerk öffnen",
  },
  {
    title: "Freigabe-Inbox",
    text: "Der manuelle Pfad für Fälle, die bewusst nicht automatisch versendet werden.",
    href: "/freigabe-inbox",
    label: "Freigabe-Inbox öffnen",
  },
  {
    title: "Qualitätschecks",
    text: "Die Prüfungen, die vor einem Versand überhaupt bestanden sein müssen.",
    href: "/qualitaetschecks",
    label: "Checks prüfen",
  },
  {
    title: "Sicherheit",
    text: "Die übergeordnete Sicherheitslogik mit Nachweisen und Auto-Grenzen.",
    href: "/sicherheit",
    label: "Sicherheitsseite lesen",
  },
];

const faqItems = [
  {
    question: "Was ist der häufigste Grund für echten Kontrollverlust?",
    answer:
      "Nicht die Existenz von Automatisierung, sondern unscharfe Regeln. Wenn unklar bleibt, warum etwas automatisch lief oder hätte gestoppt werden müssen, verliert das Team die Steuerbarkeit.",
  },
  {
    question: "Ist ein hoher Freigabeanteil am Anfang ein schlechtes Zeichen?",
    answer:
      "Nicht unbedingt. In einem konservativen Start ist ein höherer Freigabeanteil oft sinnvoll, weil er Grenzfälle sichtbar macht und verhindert, dass zu früh zu viel automatisch rausgeht.",
  },
  {
    question: "Wann wäre ein Anbieter in dieser Frage unseriös?",
    answer:
      "Wenn er Kontrolle nur behauptet, aber keine klaren Regeln, Freigabepfade, Stoppgründe oder sichtbaren Verläufe zeigt. Dann bleibt das System operativ schwer prüfbar.",
  },
  {
    question: "Wann ist manuelle Bearbeitung trotzdem sinnvoll?",
    answer:
      "Bei Beschwerden, Preisverhandlungen, Sonderfällen, sensiblen Aussagen oder unklaren Zuständigkeiten. Genau dort ist manuelle Prüfung Teil der Kontrolle und nicht ihr Gegenteil.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Bearbeitung im Anfrageeingang.",
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
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Geschwindigkeit wirtschaftlich wichtig ist, solange der Kontrollrahmen sauber bleibt.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automatisierungsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Einwand Kontrolle 2026: Wie Makler den Autopilot steuerbar halten",
  ogTitle: "Einwand Kontrolle 2026 | Advaic",
  description:
    "Antwort auf den Einwand Kontrollverlust: Welche Regeln, Freigabepfade und Nachweise Makler sehen sollten, damit ein Autopilot operativ steuerbar bleibt.",
  path: "/einwaende/kontrolle",
  template: "trust",
  eyebrow: "Einwand Kontrolle",
  proof:
    "Echte Kontrolle entsteht durch klare Regeln, sichtbare Freigabegründe und steuerbare Auto-Grenzen, nicht durch blinden Versand oder bloße Handarbeit.",
});

export default function ObjectionKontrollePage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Einwand Kontrolle 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/einwaende/kontrolle`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Einwand Kontrolle", "Autopilot", "Immobilienmakler", "Freigabe", "Regelwerk"],
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
        { name: "Einwand Kontrolle", path: "/einwaende/kontrolle" },
      ]}
      schema={schema}
      kicker="Einwand Kontrolle"
      title="„Ich will keinen Kontrollverlust durch Autopilot.“ Wie Makler diesen Einwand sauber prüfen sollten"
      description="Der Einwand ist berechtigt. Die starke Antwort ist nicht `vertrauen Sie uns`, sondern ein prüfbarer Blick auf Regeln, Freigabe, Stopps, sichtbare Verläufe und steuerbare Auto-Grenzen."
      actions={
        <>
          <Link href="/autopilot-regeln" className="btn-secondary">
            Regelwerk
          </Link>
          <Link href="/signup?entry=objection-kontrolle" className="btn-primary">
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
      stageContext="einwand-kontrolle"
      primaryHref="/signup?entry=objection-kontrolle-stage"
      primaryLabel="Mit Freigabe-First starten"
      secondaryHref="/freigabe-inbox"
      secondaryLabel="Freigabe-Inbox ansehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Diese Seite ordnet den Einwand auf Basis offizieller Quellen und der öffentlich dokumentierten Produktlogik ein. Sie ersetzt keine individuelle Rechts-, Steuer- oder Unternehmensberatung."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Freigabe, Qualitätsprüfung und steuerbare
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
            <h2 className="h2">Warum der Kontroll-Einwand absolut berechtigt ist</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer Autopilot einführt, sollte nicht nur auf Effizienz schauen. Die entscheidende Frage lautet, ob das
              Team weiterhin erklären, stoppen, freigeben und nachschärfen kann.
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
                Eine belastbare Antwort verspricht nicht grenzenlose Automatik, sondern erklärt, wo Auto endet, wo
                Freigabe greift und wie Kontrolle im Alltag sichtbar bleibt.
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
              <h2 className="h3 mt-3">Kontrolle heißt nicht „alles manuell“</h2>
              <p className="helper mt-3">
                Kontrolle heißt, dass klare Standardfälle schnell laufen und Sonderfälle bewusst beim Menschen landen,
                ohne dass diese Grenze später unsichtbar wird.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="mechanik" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Kontrollmechanik ein brauchbarer Autopilot haben sollte</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Operative Kontrolle entsteht über klare Entscheidungslogik, nicht über ein gutes Gefühl beim Testen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {controlMechanisms.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="betrieb" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was im laufenden Betrieb Kontrolle wirklich sichert</h2>
              <p className="helper mt-3">
                Der eigentliche Unterschied zeigt sich nicht am Demo-Tag, sondern daran, wie Regeln, Freigabefälle und
                Korrekturen später gepflegt werden.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {operatingRequirements.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Wenn Korrekturen nur „nebenbei“ passieren, fehlt die Steuerbarkeit</h2>
              <p className="helper mt-3">
                Dann wird das Team zwar beschäftigt, aber nicht wirklich sicherer. Kontrolle braucht sichtbare Gründe
                und Rückkopplung in die Regeln.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="pilot" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Woran ein kontrollierter Pilot gemessen werden sollte</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer Kontrolle ernst meint, schaut nicht nur auf Tempo und Klickrate, sondern auf Freigabegründe,
              Korrekturen und Regelklarheit im Alltag.
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
              Eine starke Einwand-Seite zeigt nicht nur eine Antwort, sondern auch die Stellen, an denen Kontrolle
              konkret nachvollziehbar wird.
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
