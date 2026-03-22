import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "21. März 2026";

const summary = [
  "Antwortzeit ist einer der wichtigsten operativen Hebel im Anfrageprozess, aber sie sollte nicht mit überhasteter Vollantwort verwechselt werden.",
  "Die beste Praxis aus allgemeinen Inbound-Lead-Studien zeigt klar: frühe Reaktion gewinnt. Für Makler heißt das meist zuerst schnell reagieren, dann sauber qualifizieren.",
  "Für kleine Maklerbüros ist ein realistischer Zielzustand nicht immer eine vollständige Antwort in fünf Minuten, aber sehr oft eine sichtbare Erstreaktion innerhalb derselben Arbeitsphase.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum Antwortzeit zählt" },
  { href: "#bandbreiten", label: "Orientierungswerte" },
  { href: "#verzoegerungen", label: "Wo Zeit verloren geht" },
  { href: "#checkliste", label: "Praxis-Checkliste" },
  { href: "#kpis", label: "Kennzahlen" },
];

const methodology = [
  "Direkte, aktuelle Makler-spezifische Vergleichswerte zur Antwortzeit sind öffentlich nur begrenzt verfügbar. Die Orientierungswerte unten sind deshalb aus allgemeiner Forschung zu digitalen Anfragen und aus Maklerpraxis abgeleitet.",
  "Wichtige Quellen dafür sind HBR zur frühen Reaktion auf Online-Leads, HubSpot- und XANT/InsideSales-Studien zur Reaktionsgeschwindigkeit bei neuen Anfragen sowie Advaics eigene Prozesssicht auf Freigabe und Qualitätskontrolle.",
  "Die Zahlen sind keine Branchenregel und keine Garantie. Sie sind eine operative Orientierung, um Ihr Team auf ein realistisches Serviceniveau zu steuern.",
];

const whyItMatters = [
  {
    title: "Interesse ist am Anfang am höchsten",
    text: "Wer gerade eine Anfrage sendet, ist in diesem Moment aktiv im Thema. Jede Verzögerung erhöht die Chance, dass Aufmerksamkeit oder Vergleichsinteresse abwandern.",
  },
  {
    title: "Schnelle Erstreaktion ist nicht dasselbe wie blinde Vollantwort",
    text: "In vielen Fällen reicht eine saubere erste Reaktion mit nächstem Schritt, solange riskante oder unklare Fälle nicht vorschnell beantwortet werden.",
  },
  {
    title: "Antwortzeit ist auch ein Prozesssignal",
    text: "Wenn die Antwortzeit schwankt, ist das oft ein Hinweis auf Probleme in Routing, Zuständigkeit, Kontext oder Freigabelogik.",
  },
];

const targetBands = [
  {
    label: "Sehr stark",
    time: "unter 15 Minuten",
    meaning: "Vor allem für frische Portal- und Website-Anfragen mit klar erkennbarem Interesse ein starker Zielwert für die erste qualifizierte Reaktion oder eine kurze Eingangsbestätigung.",
  },
  {
    label: "Gut kontrollierbar",
    time: "15 bis 60 Minuten",
    meaning: "Für viele kleine und mittlere Maklerteams ein realistischer Standard während der aktiven Arbeitszeit, wenn Eingang, Zuordnung und Vorlagen sauber organisiert sind.",
  },
  {
    label: "Noch tragfähig",
    time: "innerhalb desselben Arbeitstags",
    meaning: "Für weniger dringliche oder volumenstarke Teams oft noch akzeptabel, aber schon mit spürbarem Risiko auf sinkende Kontaktwahrscheinlichkeit.",
  },
  {
    label: "Kritisch",
    time: "nächster Tag oder später",
    meaning: "Hier steigt das Risiko stark, dass Kontext, Aufmerksamkeit oder Konkurrenzdruck bereits gegen Sie arbeiten.",
  },
];

const delaySources = [
  {
    title: "Eingang nicht zentral sichtbar",
    text: "Wenn Portale, Weiterleitungen und Website-Anfragen verteilt einlaufen, beginnt der Verlust schon vor der ersten Entscheidung.",
  },
  {
    title: "Unklare Zuständigkeit",
    text: "Antwortzeit fällt oft nicht an der Formulierung, sondern daran, dass niemand sofort weiß, wem die Anfrage gehört.",
  },
  {
    title: "Fehlender Kontext",
    text: "Unklare Objektzuordnung, fehlende Pflichtangaben oder Dubletten führen zu Verzögerung und Rückfragen.",
  },
  {
    title: "Kein klarer Start für Standardfälle",
    text: "Wenn jede Nachricht wie ein Sonderfall behandelt wird, bleibt das Team im gleichen manuellen Takt wie vorher.",
  },
];

const checklist = [
  "Neue Anfragen an einer Stelle sichtbar machen, nicht über mehrere Postfächer verstreuen.",
  "Klare Zuweisung definieren: Wer reagiert wann auf welche Anfrageart?",
  "Für Standardfälle Vorlagen und klare Regeln vorab klären.",
  "Freigabegrenzen für unklare oder sensible Fälle definieren, statt sie nebenbei zu lösen.",
  "Erstreaktion und Vollantwort getrennt messen, wenn beides im Prozess unterschiedlich läuft.",
  "Antwortzeit nach Quelle auswerten: Portal, Website, E-Mail, manuelle Weiterleitung.",
];

const kpis = [
  "Ø Erstreaktionszeit auf neue Anfragen",
  "Median der Erstreaktionszeit statt nur Durchschnitt",
  "Quote der Anfragen unter 15 Minuten / unter 60 Minuten / am selben Tag",
  "Freigabequote bei schnellen Reaktionen",
  "Antwortquote nach schneller versus langsamer Erstreaktion",
];

const advaicFit = [
  "Advaic hilft dort, wo Antwortzeit heute an Sortierung, Entscheidung und Qualitätssicherung verloren geht, nicht nur an der Textformulierung.",
  "Die Kombination aus Eingangserkennung, klaren Regeln für Automatik oder Freigabe und einem sauberen Verlauf senkt Reibung, ohne riskante Fälle vorschnell zu senden.",
  "Das Ziel ist nicht nur schneller zu wirken, sondern schneller und kontrollierter zu reagieren.",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Grundlegende Referenz dafür, wie stark frühe Reaktion auf Online-Leads wirkt.",
  },
  {
    label: "HubSpot Blog: Best response time for connecting with leads",
    href: "https://blog.hubspot.com/sales/best-times-to-connect-with-leads-infographic",
    note: "Aktuelle Zusammenfassung der klassischen Lead-Response-Forschung und neuerer Vergleichswerte.",
  },
  {
    label: "InsideSales / XANT: Response Time Matters",
    href: "https://www.insidesales.com/response-time-matters/",
    note: "Große neuere Research-Zusammenfassung zu speed-to-lead und Conversion-Unterschieden.",
  },
  {
    label: "HubSpot Blog: Hot leads",
    href: "https://blog.hubspot.com/sales/hot-lead",
    note: "Praxisnahe Einordnung, warum frühe Reaktion bei warmen und intent-starken Anfragen entscheidend ist.",
  },
  {
    label: "ROI-Rechner von Advaic",
    href: "/roi-rechner",
    note: "Interne operative Modellierung für Erstreaktionszeit, Freigabequote und Zeitgewinn im Maklerkontext.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Antwortzeit bei Immobilienanfragen",
  ogTitle: "Antwortzeit bei Immobilienanfragen | Advaic",
  description:
    "Leitfaden für Makler: Welche Antwortzeit im Anfrageprozess realistisch und sinnvoll ist, wo Zeit verloren geht und wie Teams ihre Reaktion messbar verbessern.",
  path: "/antwortzeit-immobilienanfragen",
  template: "guide",
  eyebrow: "Orientierung",
  proof: "Schnelle Antwort ist ein starker Hebel, aber nur zusammen mit sauberer Qualifizierung und Freigabe.",
});

export default function AntwortzeitImmobilienanfragenPage() {
  const siteUrl = getSiteUrl();
  const faqItems = [
    {
      question: "Wie schnell sollten Makler auf Immobilienanfragen reagieren?",
      answer:
        "Je früher, desto besser. Für viele Teams ist eine sichtbare Erstreaktion innerhalb von 15 bis 60 Minuten während der Arbeitszeit ein starker realistischer Standard. Noch wichtiger ist, dass riskante Fälle nicht vorschnell beantwortet werden.",
    },
    {
      question: "Muss jede Anfrage in fünf Minuten vollständig beantwortet sein?",
      answer:
        "Nein. Die Forschung spricht klar für frühe Reaktion, aber im Makleralltag kann eine schnelle qualifizierte Erstreaktion sinnvoller sein als eine unvollständige Vollantwort.",
    },
    {
    question: "Welche Kennzahl ist hier am wichtigsten?",
      answer:
        "Die Erstreaktionszeit ist die sichtbarste Kennzahl. Für die Steuerung sollten Sie zusätzlich Median, Werte unter 15 und 60 Minuten sowie Freigabequote und Antwortquote betrachten.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Antwortzeit bei Immobilienanfragen",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/antwortzeit-immobilienanfragen`,
        dateModified: "2026-03-21",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Antwortzeit", "Immobilienanfragen", "Speed to lead", "Makler", "Erstreaktion"],
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
        { name: "Antwortzeit bei Immobilienanfragen", path: "/antwortzeit-immobilienanfragen" },
      ]}
      schema={schema}
      kicker="Orientierung"
      title="Antwortzeit bei Immobilienanfragen: was für Makler realistisch und sinnvoll ist"
      description="Diese Seite übersetzt allgemeine speed-to-lead-Forschung in einen realistischen Maklerkontext: frühe Erstreaktion, klare Priorisierung und keine vorschnelle Vollantwort in riskanten Fällen."
      actions={
        <>
          <Link href="/roi-rechner" className="btn-secondary">
            ROI-Rechner
          </Link>
          <Link href="/signup?entry=antwortzeit" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Orientierungswerten oder zur Praxis-Checkliste springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#bandbreiten" className="btn-secondary w-full justify-center">
              Orientierungswerte
            </MarketingJumpLink>
            <MarketingJumpLink href="#checkliste" className="btn-secondary w-full justify-center">
              Praxis-Checkliste
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="antwortzeit-immobilienanfragen"
      primaryHref="/signup?entry=antwortzeit-stage"
      primaryLabel="Mit echten Fällen prüfen"
      secondaryHref="/immobilienanfragen-automatisieren"
      secondaryLabel="Automatisierungsleitfaden"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden allgemeine Forschung zu digitalen Anfragen mit operativer Maklerpraxis. Die Werte auf dieser Seite sind daraus abgeleitet und keine starre Branchenregel."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageprozesse, Antwortlogik und operativ belastbare
                Steuerung über Kennzahlen im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Orientierungswerte zu lesen sind</h2>
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
          <h2 className="h2">Warum Antwortzeit im Anfrageprozess so stark wirkt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {whyItMatters.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="bandbreiten" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Orientierungswerte für Maklerteams</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Bänder beschreiben die Zeit bis zur ersten qualifizierten Reaktion. Sie sind keine Garantie und
              keine starre Marktregel, sondern eine operative Orientierung.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Niveau</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Zeit</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Einordnung</th>
                </tr>
              </thead>
              <tbody>
                {targetBands.map((item) => (
                  <tr key={item.label} className="border-b border-[var(--border)] align-top">
                    <td className="px-4 py-4 font-medium text-[var(--text)]">{item.label}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{item.time}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{item.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section id="verzoegerungen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Wo Antwortzeit im Alltag verloren geht</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {delaySources.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="checkliste" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Praxis-Checkliste für bessere Antwortzeit</h2>
            <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section id="kpis" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Kennzahlen für die Steuerung</h2>
            <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Wo Advaic bei Antwortzeit hilft</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {advaicFit.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/roi-rechner" className="btn-secondary">
                ROI-Rechner
              </Link>
              <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                Anfragenmanagement
              </Link>
              <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                Automatisierungsleitfaden
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
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
