import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const checks = [
  {
    title: "Relevanz-Check",
    purpose: "Verhindert Antworten auf Nicht-Anfragen.",
    blocks: "Newsletter, Spam, Systemmails",
    example: "Wenn „list-unsubscribe“ erkannt wird, erfolgt kein Versand.",
    onFail: "Wird ignoriert oder zur manuellen Prüfung markiert.",
  },
  {
    title: "Kontext-Check",
    purpose: "Nutzt nur belegbare Informationen.",
    blocks: "Antworten ohne klaren Objektbezug",
    example: "Ohne erkennbare Immobilie geht es zur Freigabe oder Rückfrage.",
    onFail: "Keine Auto-Antwort; stattdessen Rückfrage oder Freigabe.",
  },
  {
    title: "Vollständigkeits-Check",
    purpose: "Verhindert spekulative Aussagen.",
    blocks: "Antworten mit fehlenden Pflichtinfos",
    example: "Bei „Ist noch frei?“ ohne Objektreferenz wird nicht automatisch zugesagt.",
    onFail: "Versandstopp bis die fehlenden Informationen geklärt sind.",
  },
  {
    title: "Ton-&-Stil-Check",
    purpose: "Hält Ihre Kommunikationslinie ein.",
    blocks: "Unpassende Tonalität oder unnötige Länge",
    example: "Wenn Sie kurze Antworten bevorzugen, bleibt die Antwort kurz und präzise.",
    onFail: "Entwurf geht zur Anpassung oder Freigabe.",
  },
  {
    title: "Risiko-Check (Fail-Safe)",
    purpose: "Stoppt bei sensiblen oder konfliktgeladenen Fällen.",
    blocks: "Beschwerden, Konflikte, Fristen, rechtlich sensible Aussagen",
    example: "Konfliktmail wird immer zur Freigabe gegeben.",
    onFail: "Kein Auto-Versand, Fall landet direkt in der Freigabe.",
  },
  {
    title: "Lesbarkeits-Check",
    purpose: "Sichert klare, umsetzbare Antworten.",
    blocks: "Unstrukturierte Textblöcke",
    example: "Nächste Schritte werden als klare Handlungsfolge formuliert.",
    onFail: "Entwurf wird überarbeitet oder manuell freigegeben.",
  },
];

const phases = [
  {
    title: "Phase 1: Relevanz und Kontext",
    detail: "Bevor eine Antwort erstellt wird, prüft Advaic, ob die E-Mail überhaupt eine echte Anfrage ist.",
  },
  {
    title: "Phase 2: Inhalt und Stil",
    detail: "Der Entwurf wird auf Vollständigkeit und auf Ihren gewünschten Ton abgeglichen.",
  },
  {
    title: "Phase 3: Risiko und Versandfreigabe",
    detail: "Nur wenn die Sicherheitslage klar ist, darf automatisch gesendet werden.",
  },
];

const summary = [
  "Vor jedem Auto-Versand laufen sechs feste Qualitätschecks.",
  "Wenn ein Check fehlschlägt, wird nicht automatisch gesendet.",
  "Fehlende Angaben, Konflikte oder sensible Inhalte führen zur Freigabe, nicht zum Versand.",
];

const qualityMetrics = [
  "QA-Fehlerquote vor Auto-Versand",
  "Anteil blockierter Auto-Entwürfe pro Check-Typ",
  "Freigabequote wegen fehlender Angaben oder Risikosignalen",
  "Korrekturquote nach manueller Freigabe",
];

const beforeLaunchChecklist = [
  "Welche Pflichtangaben müssen pro Antworttyp vorliegen?",
  "Welche Gründe führen immer zur Freigabe?",
  "Welche Texte, Tonregeln und Verbote gelten für automatische Antworten?",
  "Wer prüft blockierte Entwürfe im Pilotbetrieb und wie wird dokumentiert?",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewusste KI-Steuerung und nachvollziehbare Sicherheitsgrenzen.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Orientierung für robuste technische und organisatorische Schutzmaßnahmen.",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Rechtlicher Rahmen für datenschutzkonforme, dokumentierte Prozesse.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Welche Qualitätschecks vor Auto-Versand Pflicht sind",
  ogTitle: "Qualitätschecks vor dem Versand | Advaic",
  description:
    "Leitfaden für Makler: Welche Prüfungen eine automatische Antwort vor dem Versand bestehen muss und welche Signale zwingend zur Freigabe führen.",
  path: "/qualitaetschecks",
  template: "trust",
  eyebrow: "Leitfaden Qualitätschecks",
  proof: "Relevanz, Objektbezug, Pflichtangaben, Ton, Risiko und Lesbarkeit vor jedem Versand prüfen.",
});

export default function QualitaetschecksPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Qualitätschecks vor dem Versand",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/qualitaetschecks`,
    about: ["Qualitätschecks", "Fail-Safe", "Freigabe", "Risikocheck"],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Qualitätschecks", path: "/qualitaetschecks" },
      ]}
      schema={schema}
      kicker="Leitfaden Qualitätschecks"
      title="Welche Qualitätschecks vor dem Versand Pflicht sind"
      description="Die zentrale Frage lautet nicht, ob ein Modell gut formuliert, sondern ob die Nachricht überhaupt automatisch raus darf. Dafür brauchen Sie feste Prüfungen für Relevanz, Objektbezug, Pflichtangaben, Ton, Risiko und Lesbarkeit."
      actions={
        <>
          <Link href="/autopilot-regeln" className="btn-secondary">
            Regeln lesen
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="qualitaetschecks"
      primaryHref="/signup"
      primaryLabel="Mit Safe-Start testen"
      secondaryHref="/autopilot"
      secondaryLabel="Autopilot verstehen"
      sources={sources}
      sourcesDescription="Die Quellen dienen als Referenzrahmen für kontrollierte Risiko-Governance und nachvollziehbare Betriebsstandards. Sie ersetzen keine Rechtsberatung."
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
              <a href="#qualitaetschecks-details" className="btn-secondary">
                Check-Details
              </a>
              <a href="#qualitaetschecks-quellen" className="btn-secondary">
                Quellen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="qualitaetschecks-details" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Prüfphasen vor jedem Auto-Versand</h2>
          <p className="body mt-4 max-w-[72ch] text-[var(--muted)]">
            Die Prüfungen laufen in einer festen Reihenfolge. Erst wenn alle relevanten Checks bestanden sind, darf
            automatisch gesendet werden.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {phases.map((phase) => (
              <article key={phase.title} className="card-base relative overflow-hidden p-5">
                <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                <h3 className="text-base font-semibold text-[var(--text)]">{phase.title}</h3>
                <p className="helper mt-2">{phase.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {checks.map((check) => (
              <article key={check.title} className="card-base card-hover p-5">
                <h3 className="h3">{check.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Zweck:</strong> {check.purpose}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Blockiert:</strong> {check.blocks}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Beispiel:</strong> {check.example}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Bei Fehler:</strong> {check.onFail}
                </p>
              </article>
            ))}
          </div>

          <article className="card-base mt-8 p-6">
            <h3 className="h3">Fail-Safe-Prinzip</h3>
            <p className="body mt-3 text-[var(--muted)]">
              Wenn eine Prüfung nicht bestanden wird, bleibt der Versand blockiert. Dadurch schützt der Betrieb
              Qualität und Nachvollziehbarkeit auch dann, wenn Autopilot aktiv ist.
            </p>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h3 className="h3">Vor dem Pilotstart festlegen</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {beforeLaunchChecklist.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h3 className="h3">KPI-Set für die Qualitätssteuerung</h3>
              <p className="helper mt-3">
                Mit diesen Kennzahlen sehen Sie früh, ob die Check-Logik korrekt kalibriert ist oder nachgeschärft
                werden muss.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {qualityMetrics.map((metric) => (
                  <li key={metric} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>

    </AiDiscoveryPageTemplate>
  );
}
