import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const objections = [
  {
    title: "DSGVO",
    text: "Wie datenschutzkonform ist der Betrieb und was müssen Sie organisatorisch sauber abdecken?",
    href: "/einwaende/dsgvo",
  },
  {
    title: "Kontrolle",
    text: "Wie stellen Sie sicher, dass Autopilot nicht unkontrolliert sendet und Sie Sonderfälle sauber steuern?",
    href: "/einwaende/kontrolle",
  },
  {
    title: "Qualität",
    text: "Was verhindert unpassende Antworten, falschen Ton oder fehlenden Kontext vor dem Versand?",
    href: "/einwaende/qualitaet",
  },
  {
    title: "Aufwand",
    text: "Wie viel Implementierungsaufwand entsteht wirklich und wie sieht ein pragmatischer Startplan aus?",
    href: "/einwaende/aufwand",
  },
  {
    title: "Kosten",
    text: "Wann rechnet sich Advaic und welche Kennzahlen sollten Sie für eine klare Go/No-Go-Entscheidung nutzen?",
    href: "/einwaende/kosten",
  },
];

const decisionPath = [
  {
    title: "1) Einwand präzise eingrenzen",
    text: "Definieren Sie die operative Kernfrage: Geht es um Recht, Kontrollverlust, Qualitätsrisiko, Einführungsaufwand oder Wirtschaftlichkeit?",
  },
  {
    title: "2) Nachweis im Produkt prüfen",
    text: "Prüfen Sie den Mechanismus im Ablauf: Entscheidungspfad, Freigabelogik, Qualitätschecks und Verlauf statt nur Marketingaussagen.",
  },
  {
    title: "3) Pilot-KPI vorab festlegen",
    text: "Legen Sie vor dem Test fest, welche Kennzahl entscheidet: z. B. Antwortzeit, Freigabequote, Korrekturaufwand oder QA-Auffälligkeiten.",
  },
  {
    title: "4) Erst danach Rollout erweitern",
    text: "Automatisierung wird nur erhöht, wenn Qualität und Nachvollziehbarkeit im Pilot stabil nachgewiesen sind.",
  },
];

const quickTake = [
  "Die wichtigsten Einwände gegen Anfrage-Automatisierung sind meist berechtigt und sollten über Mechanik statt über Vertrauen beantwortet werden.",
  "Prüfen Sie jeden Punkt über drei Ebenen: konkretes Risiko, sichtbare Schutzlogik und messbare Pilot-KPI.",
  "Wenn ein Anbieter diese drei Ebenen nicht sauber zeigen kann, ist der Einwand wahrscheinlich noch nicht gelöst.",
];

const objectionMatrix = [
  {
    objection: "DSGVO",
    risk: "Unklare Verantwortlichkeiten und fehlende Prozessdokumentation.",
    proof: "Freigabe bei sensiblen Inhalten, Verlauf mit Entscheidungsnachweis und klare Systemgrenzen.",
    metric: "Dokumentationsvollständigkeit, Freigabequote bei sensiblen Fällen.",
    href: "/einwaende/dsgvo",
  },
  {
    objection: "Kontrolle",
    risk: "Angst vor unkontrolliertem Auto-Versand.",
    proof: "Auto nur bei prüfbarem Objektbezug und vollständigen Angaben, Pause jederzeit, Fail-Safe zur Freigabe.",
    metric: "Auto-zu-Freigabe-Verhältnis, manuelle Korrekturrate nach Versand.",
    href: "/einwaende/kontrolle",
  },
  {
    objection: "Qualität",
    risk: "Unpassender Ton, fehlender Kontext, falsche Aussagen.",
    proof: "Sechs Qualitätschecks vor Versand plus Risiko-Gate.",
    metric: "QA-Pass-Rate, Warn-/Fail-Quote, Nachbearbeitungszeit.",
    href: "/einwaende/qualitaet",
  },
  {
    objection: "Aufwand",
    risk: "Einführung belastet Tagesgeschäft.",
    proof: "Safe-Start statt Big-Bang: stufenweiser Rollout mit klaren Prioritäten.",
    metric: "Zeit bis stabilem Pilot, Freigabeaufwand in Woche 1–2.",
    href: "/einwaende/aufwand",
  },
  {
    objection: "Kosten",
    risk: "Unklar, ob der Nutzen den Preis trägt.",
    proof: "Konservative Vorher-Nachher-Bewertung mit echten Prozess-KPI.",
    metric: "Reaktionszeit, gesparte Stunden, Freigabe-zu-Versand-Rate.",
    href: "/einwaende/kosten",
  },
];

const sources = [
  {
    label: "EUR-Lex – DSGVO (Zusammenfassung und Pflichtenrahmen)",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Rechtliche Grundlage für datenschutzkonforme Verarbeitung und Verantwortlichkeiten.",
  },
  {
    label: "EDPB – Leitlinien",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en",
    note: "Praxisnahe Auslegungshilfen für Datenschutz und Governance in Europa.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewussten KI-Betrieb mit klaren Kontrollmechanismen.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Reaktionsgeschwindigkeit operativ und wirtschaftlich relevant ist.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie Makler Einwände gegen Anfrage-Automatisierung prüfen",
  ogTitle: "Einwände gegen E-Mail-Autopilot | Advaic",
  description:
    "Value-first Leitfaden für Makler: So prüfen Sie DSGVO, Kontrolle, Qualität, Aufwand und Kosten über echte Mechanik, klare Schutzlogik und messbare Pilot-KPI.",
  path: "/einwaende",
  template: "guide",
  eyebrow: "Einwände",
  proof: "Risiko, Schutzlogik und KPI pro Einwand statt reiner Vertriebsantworten.",
});

export default function ObjectionsHubPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Einwände gegen E-Mail-Autopilot klar beantwortet",
        inLanguage: "de-DE",
        about: ["DSGVO", "Kontrolle", "Qualität", "Rollout", "ROI"],
        mainEntityOfPage: `${siteUrl}/einwaende`,
      },
      {
        "@type": "ItemList",
        name: "Einwand-Deep-Dives",
        itemListElement: objections.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: `${siteUrl}${item.href}`,
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Einwände", path: "/einwaende" },
      ]}
      schema={schema}
      kicker="Einwände"
      title="Wie Makler kritische Einwände sauber prüfen"
      description="Diese Seite soll keine Bedenken wegreden, sondern prüfbar machen. Für jeden Einwand sehen Sie das operative Risiko, die nötige Schutzlogik und die passende Pilot-KPI."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produktmechanik ansehen
          </Link>
          <Link href="/signup?entry=objection-hub" className="btn-primary">
            14 Tage kontrolliert testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="einwaende-hub"
      primaryHref="/signup?entry=objection-stage"
      primaryLabel="Mit Safe-Start testen"
      secondaryHref="/manuell-vs-advaic"
      secondaryLabel="Prozessvergleich"
      sources={sources}
      sourcesDescription="Die Quellen dienen als Orientierungsrahmen für Governance, Datenschutz und Prozesswirkung. Sie ersetzen keine individuelle Rechts- oder Unternehmensberatung."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-24">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">Wie Sie Einwände richtig prüfen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Entscheidungen entstehen nicht aus Bauchgefühl, sondern aus belegbarer Mechanik. Deshalb folgt diese
              Seite einer festen Reihenfolge: Risiko benennen, Nachweis im Prozess prüfen, Pilot-KPI definieren
              und erst dann die Automatisierung erweitern.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {decisionPath.map((step) => (
              <article key={step.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="helper mt-3">{step.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-soft-cool py-20 md:py-24">
        <Container>
          <h2 className="h2">Einwand-Matrix für die Pilotentscheidung</h2>
          <p className="body mt-4 max-w-[74ch] text-[var(--muted)]">
            Jede Zeile zeigt, was Sie konkret prüfen sollten. So wird aus einem allgemeinen Einwand eine belastbare
            Go/No-Go-Entscheidung.
          </p>
          <div className="mt-8 space-y-4">
            {objectionMatrix.map((row) => (
              <article key={row.objection} className="card-base p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="h3">{row.objection}</h3>
                  <Link href={row.href} className="btn-secondary">
                    Einwand im Detail
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Kritischer Risikopunkt
                    </p>
                    <p className="helper mt-2">{row.risk}</p>
                  </article>
                  <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Nachweis im Produkt
                    </p>
                    <p className="helper mt-2">{row.proof}</p>
                  </article>
                  <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Pilot-KPI
                    </p>
                    <p className="helper mt-2">{row.metric}</p>
                  </article>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-24">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {objections.map((item) => (
              <article key={item.href} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Einwand im Detail
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
