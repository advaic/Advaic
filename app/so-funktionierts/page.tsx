import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import HowItWorks from "@/components/marketing/HowItWorks";
import StickyTour from "@/components/marketing/StickyTour";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import UseCasesTeaser from "@/components/marketing/UseCasesTeaser";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const summary = [
  "Advaic arbeitet als kontrollierter Ablauf: Erkennen, Prüfen, Entscheiden, Senden.",
  "Auto-Versand ist an klare Regeln und Qualitätschecks gebunden.",
  "Fälle mit fehlenden Angaben, Konfliktpotenzial oder Warnsignalen gehen in die Freigabe und bleiben in Ihrer Hand.",
  "Jede Entscheidung bleibt im Verlauf mit Zeitstempel nachvollziehbar.",
];

const flowDetails = [
  {
    step: "01",
    title: "Eingang und Klassifizierung",
    body: "Advaic analysiert den Eingangskontext und trennt relevante Interessenten-Anfragen von Newslettern und sonstigen Nicht-Anfragen.",
    output: "Nur echte Interessenten-Anfragen laufen in den Arbeitsprozess.",
  },
  {
    step: "02",
    title: "Regel- und Qualitätslogik",
    body: "Die Nachricht durchläuft Auto/Freigabe/Ignorieren plus Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfung.",
    output: "Der Versandpfad wird nicht geraten, sondern gegen Regeln und Checks geprüft.",
  },
  {
    step: "03",
    title: "Versand oder Freigabe",
    body: "Nur klar zuordenbare Nachrichten werden automatisch versendet. Fälle mit fehlenden Angaben oder Risikosignalen gehen mit sauberem Kontext zur Freigabe an Sie.",
    output: "Auto bleibt eng begrenzt, Freigabe bleibt konkret begründet.",
  },
  {
    step: "04",
    title: "Optional: Follow-up Ablauf",
    body: "Wenn keine Antwort kommt, kann Advaic je nach Einstellung kontrollierte Follow-ups in Stufen planen und automatisch stoppen, sobald eine Antwort eingeht.",
    output: "Nachfassen bleibt steuerbar und stoppt ohne manuellen Cleanup.",
  },
];

const deepDives = [
  {
    title: "Autopilot-Regeln",
    text: "Detaillierte Entscheidungsmatrix mit klaren Auto-, Freigabe- und Ignorieren-Fällen.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks",
    text: "Alle sechs Prüfungen mit Zweck, Blocklogik und Beispielen aus dem Makleralltag.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox",
    text: "Operativer Ablauf für Nachrichten mit Freigabebedarf: sichten, bearbeiten, freigeben oder ablehnen.",
    href: "/freigabe-inbox",
  },
  {
    title: "Follow-up-Logik",
    text: "Stufen, Guardrails und automatische Stop-Gründe in der aktuellen Version.",
    href: "/follow-up-logik",
  },
];

const funnelNotes = [
  {
    title: "Erkennen",
    text: "Der Eingang wird erst als Anfrage, Nicht-Anfrage oder Folgefall eingeordnet.",
  },
  {
    title: "Prüfen",
    text: "Regeln und Qualitätschecks entscheiden, ob Auto überhaupt möglich ist.",
  },
  {
    title: "Entscheiden",
    text: "Auto, Freigabe oder Ignorieren bleibt als klarer Versandpfad sichtbar.",
  },
  {
    title: "Nachfassen",
    text: "Optional folgen Follow-ups mit Stop-Regeln statt endloser Sequenzen.",
  },
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte KI-Entscheidungen mit dokumentiertem Risikomanagement.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Geschwindigkeit in der Interessentenkommunikation entscheidend ist.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Kontext zum Produktivitätspotenzial strukturierter Kommunikationsprozesse.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Best Practices für klare, verlässliche Informationsarchitektur im Web.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "So funktioniert's",
  ogTitle: "So funktioniert's | Advaic",
  description:
    "Der Ablauf von Advaic im Detail: Eingang klassifizieren, Regel- und Qualitätslogik anwenden, Auto/Freigabe entscheiden und Follow-ups kontrolliert steuern.",
  path: "/so-funktionierts",
  template: "guide",
  eyebrow: "Ablauf",
  proof: "Erkennen, entscheiden, prüfen, senden oder bewusst freigeben.",
});

export default function SoFunktioniertsPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "So funktioniert Advaic Schritt für Schritt",
        inLanguage: "de-DE",
        about: ["E-Mail-Autopilot", "Freigabe", "Qualitätschecks", "Maklerprozess"],
        mainEntityOfPage: `${siteUrl}/so-funktionierts`,
      },
      {
        "@type": "HowTo",
        name: "Kontrollierte Antwortautomatisierung für Makleranfragen",
        inLanguage: "de-DE",
        step: flowDetails.map((item, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: item.title,
          text: item.body,
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "So funktioniert's", path: "/so-funktionierts" },
      ]}
      schema={schema}
      kicker="Prozess im Detail"
      title="So funktioniert Advaic Schritt für Schritt"
      description="Der Ablauf ist bewusst als kontrollierter Prozess gebaut: klare Entscheidungspfade, Qualitätsgrenzen vor Versand und vollständige Nachvollziehbarkeit im Verlauf."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Zur Produktseite
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="so-funktionierts"
      primaryHref="/produkt"
      primaryLabel="Produkt im Detail"
      secondaryHref="/sicherheit"
      secondaryLabel="Sicherheitsprinzipien"
      sources={sources}
      sourcesDescription="Die Quellen begründen, warum der Prozess auf kontrollierter Automatisierung und messbarer Qualität basiert. Sie ersetzen keine individuelle Rechts- oder Unternehmensberatung."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzfassung in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {summary.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#prozess-details" className="btn-secondary">
                Prozessdetails
              </a>
              <a href="#stage-cta" className="btn-secondary">
                Nächster Schritt
              </a>
            </div>
          </article>
        </Container>
      </section>

      <HowItWorks />

      <section id="prozess-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <p className="section-kicker">Ablaufkarte</p>
            <h2 className="h2 mt-2">Der Prozess als sichtbare Entscheidungskette</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Advaic ist nicht als isoliertes Feature gedacht, sondern als Betriebsablauf mit klaren Übergaben zwischen
              Auto, Freigabe und Qualitätskontrolle.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {funnelNotes.map((item) => (
              <article key={item.title} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text)]">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7">
            <div className="hidden xl:block">
              <div className="grid grid-cols-4 gap-4">
                {flowDetails.map((item, index) => (
                  <div key={`timeline-${item.step}`} className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                      {item.step}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    {index === flowDetails.length - 1 ? null : <div className="h-px w-4 bg-[var(--border)]" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-4 xl:grid-cols-4">
              {flowDetails.map((item, index) => (
                <article key={item.title} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                      {index + 1}
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                      Schritt {item.step}
                    </span>
                  </div>
                  <h3 className="h3 mt-4">{item.title}</h3>
                  <p className="helper mt-3">{item.body}</p>
                  <div className="mt-4 rounded-xl bg-white px-4 py-3 ring-1 ring-[var(--border)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Sichtbares Ergebnis
                    </p>
                    <p className="mt-2 text-sm text-[var(--text)]">{item.output}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h3 className="h3">Was Sie auf dieser Seite prüfen sollten</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>Wird zuerst erkannt, ob es überhaupt eine echte Anfrage ist?</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>Sind Auto, Freigabe und Ignorieren an konkrete Regeln gebunden?</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>Bleibt der Versandpfad pro Nachricht sichtbar und nachvollziehbar?</span>
                </li>
              </ul>
            </article>

            <article className="card-base p-6">
              <h3 className="h3">Wann die Detailseiten sinnvoll sind</h3>
              <p className="helper mt-3">
                Wenn Sie einzelne Teile tiefer bewerten wollen, führen die folgenden Seiten jeweils in einen
                speziellen Teil des Ablaufs statt in eine weitere allgemeine Übersicht.
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {deepDives.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Details öffnen
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <StickyTour />
      <DecisionSimulator
        title="Interaktiver Regeltest"
        description="Hier sehen Sie an realistischen Beispielen, wie Advaic im Ablauf entscheidet und welche Guardrails jeweils greifen."
      />
      <UseCasesTeaser />
      <CTAExperiment />
    </AiDiscoveryPageTemplate>
  );
}
