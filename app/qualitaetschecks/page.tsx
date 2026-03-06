import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FinalCTA from "@/components/marketing/FinalCTA";

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
    blocks: "Beschwerden, Konflikte, heikle Themen",
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
  "Unsicherheit führt zur Freigabe, nicht zum Risiko-Versand.",
];

const qualityMetrics = [
  "QA-Fehlerquote vor Auto-Versand",
  "Anteil blockierter Auto-Entwürfe pro Check-Typ",
  "Freigabequote wegen Kontext- oder Risiko-Unsicherheit",
  "Korrekturquote nach manueller Freigabe",
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

export const metadata: Metadata = {
  title: "Qualitätschecks | Advaic",
  description:
    "Alle Qualitätskontrollen vor dem Auto-Versand: Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit inklusive Fail-Safe Verhalten.",
  alternates: {
    canonical: "/qualitaetschecks",
  },
  openGraph: {
    title: "Qualitätschecks | Advaic",
    description:
      "Alle Qualitätskontrollen vor dem Auto-Versand: Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit inklusive Fail-Safe Verhalten.",
    url: "/qualitaetschecks",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Qualitätschecks | Advaic",
    description:
      "Alle Qualitätskontrollen vor dem Auto-Versand: Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit inklusive Fail-Safe Verhalten.",
    images: ["/brand/advaic-icon.png"],
  },
};

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
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Qualität vor Versand"
        title="Wie Advaic Fehler vor dem Senden erkennt"
        description="Jede automatische Antwort durchläuft mehrere Prüfungen. Ziel ist ein verlässlicher Autopilot, der bei Unsicherheit stoppt."
        actions={
          <>
            <Link href="/produkt#qualitaet" className="btn-secondary">
              Zur Produktsektion
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
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
              Wenn eine Prüfung nicht bestanden wird, geht die Nachricht zur Freigabe. Dadurch bleibt die
              Entscheidungsqualität hoch, auch wenn Autopilot aktiv ist.
            </p>
          </article>

          <article className="card-base mt-4 p-6">
            <h3 className="h3">KPI-Set für die Qualitätssteuerung</h3>
            <p className="helper mt-3">
              Mit diesen Kennzahlen sehen Sie früh, ob die Check-Logik korrekt kalibriert ist oder nachgeschärft werden
              muss.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {qualityMetrics.map((metric) => (
                <li key={metric} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </article>

          <article id="qualitaetschecks-quellen" className="card-base mt-4 p-6">
            <h3 className="h3">Quellen & Einordnung</h3>
            <p className="helper mt-3">
              Die Prüfarchitektur orientiert sich an kontrollierter Risiko-Governance und nachvollziehbarer
              Prozessführung. Die Quellen dienen als Referenzrahmen für den Betriebsstandard.
            </p>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <article key={source.href} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--text)] underline underline-offset-4"
                  >
                    {source.label}
                  </a>
                  <p className="helper mt-2">{source.note}</p>
                </article>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
