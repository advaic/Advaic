import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import HowItWorks from "@/components/marketing/HowItWorks";
import StickyTour from "@/components/marketing/StickyTour";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import UseCasesTeaser from "@/components/marketing/UseCasesTeaser";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import FinalCTA from "@/components/marketing/FinalCTA";

const summary = [
  "Advaic arbeitet als kontrollierter Ablauf: Erkennen, Schreiben, Entscheiden, Senden.",
  "Auto-Versand ist an klare Regeln und Qualitätschecks gebunden.",
  "Unsichere Fälle gehen in die Freigabe und bleiben in Ihrer Hand.",
];

const flowDetails = [
  {
    title: "1. Eingang und Klassifizierung",
    body: "Advaic analysiert den Eingangskontext und trennt relevante Interessenten-Anfragen von Newslettern und sonstigen Nicht-Anfragen.",
  },
  {
    title: "2. Regel- und Qualitätslogik",
    body: "Die Nachricht durchläuft Auto/Freigabe/Ignorieren plus Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfung.",
  },
  {
    title: "3. Versand oder Freigabe",
    body: "Nur klare Fälle werden automatisch versendet. Unklare Fälle gehen mit sauberem Kontext zur Freigabe an Sie.",
  },
  {
    title: "4. Optional: Follow-up Ablauf",
    body: "Wenn keine Antwort kommt, kann Advaic je nach Einstellung kontrollierte Follow-ups in Stufen planen und automatisch stoppen, sobald eine Antwort eingeht.",
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
    text: "Operativer Ablauf für Sonderfälle: sichten, bearbeiten, freigeben oder ablehnen.",
    href: "/freigabe-inbox",
  },
  {
    title: "Follow-up-Logik",
    text: "Stufen, Guardrails und automatische Stop-Gründe in der aktuellen Version.",
    href: "/follow-up-logik",
  },
  {
    title: "Anwendungsfälle",
    text: "Konkrete Einsatzszenarien für Vermietung, kleine Teams und mittelpreisige Objekte.",
    href: "/use-cases",
  },
  {
    title: "Manuell vs. Advaic",
    text: "Direkter Vergleich von Zeit, Risiko und Transparenz mit konservativer Modellrechnung.",
    href: "/manuell-vs-advaic",
  },
];

const funnelNotes = [
  {
    title: "Orientierung",
    text: "Sie verstehen zuerst die Mechanik und die Sicherheitsgrenzen.",
  },
  {
    title: "Bewertung",
    text: "Sie prüfen danach anhand Simulator und Detailseiten, ob der Ablauf zu Ihrem Betrieb passt.",
  },
  {
    title: "Entscheidung",
    text: "Sie starten kontrolliert mit Safe-Start und erweitern den Auto-Anteil nur bei stabilen KPI.",
  },
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = {
  title: "So funktioniert's",
  description:
    "Der Ablauf von Advaic im Detail: Eingang klassifizieren, Regel- und Qualitätslogik anwenden, Auto/Freigabe entscheiden und Follow-ups kontrolliert steuern.",
  alternates: {
    canonical: "/so-funktionierts",
  },
  openGraph: {
    title: "So funktioniert's | Advaic",
    description:
      "Der Ablauf von Advaic im Detail: Eingang klassifizieren, Regel- und Qualitätslogik anwenden, Auto/Freigabe entscheiden und Follow-ups kontrolliert steuern.",
    url: "/so-funktionierts",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "So funktioniert's | Advaic",
    description:
      "Der Ablauf von Advaic im Detail: Eingang klassifizieren, Regel- und Qualitätslogik anwenden, Auto/Freigabe entscheiden und Follow-ups kontrolliert steuern.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function SoFunktioniertsPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Startseite", path: "/" },
          { name: "So funktioniert's", path: "/so-funktionierts" },
        ]}
      />
      <PageIntro
        kicker="Prozess im Detail"
        title="So funktioniert Advaic Schritt für Schritt"
        description="Der Ablauf ist bewusst so aufgebaut, dass Sie Zeit sparen und gleichzeitig die Kontrolle über sensible Entscheidungen behalten."
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
      />
      <StageCTA
        stage="orientierung"
        primaryHref="/produkt"
        primaryLabel="Produkt im Detail"
        secondaryHref="/sicherheit"
        secondaryLabel="Sicherheitsprinzipien"
        context="so-funktionierts"
      />

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
              <a href="#prozess-quellen" className="btn-secondary">
                Quellen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <HowItWorks />

      <section id="prozess-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Der Prozess als Entscheidungsfunnel</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Advaic ist nicht als isoliertes Feature gedacht, sondern als Betriebsablauf mit klaren Übergaben zwischen
              Auto, Freigabe und Qualitätskontrolle.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {funnelNotes.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {flowDetails.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="h3">Weiterführende Detailseiten</h2>
            <p className="helper mt-2">
              Wenn Sie operative Details prüfen möchten, finden Sie hier vertiefende Seiten mit konkreter
              Entscheidungslogik und Beispielen.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>

          <article id="prozess-quellen" className="card-base mt-8 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Prozesslogik orientiert sich an kontrollierter Automatisierung mit klaren Fail-Safe-Grenzen und
              messbarer Prozessqualität.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <StickyTour />
      <DecisionSimulator
        title="Interaktiver Regeltest"
        description="Hier sehen Sie an realistischen Beispielen, wie Advaic im Ablauf entscheidet und welche Guardrails jeweils greifen."
      />
      <UseCasesTeaser />
      <CTAExperiment />
      <FinalCTA />
    </PageShell>
  );
}
