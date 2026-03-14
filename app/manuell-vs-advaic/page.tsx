import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import ManualVsAdvaicComparison from "@/components/marketing/ManualVsAdvaicComparison";
import ProcessFlowComparison from "@/components/marketing/ProcessFlowComparison";
import SafeStartConfigurator from "@/components/marketing/SafeStartConfigurator";
import FinalCTA from "@/components/marketing/FinalCTA";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const briefPoints = [
  {
    title: "Zeitverlust entsteht nicht in einem Schritt, sondern im gesamten Fluss",
    text: "Die operative Last entsteht kumulativ: Eingang lesen, Relevanz prüfen, Antwort schreiben, nachfassen, Verlauf dokumentieren. Advaic entlastet genau entlang dieser Kette.",
  },
  {
    title: "Sicherheitsrisiko entsteht bei fehlenden Angaben und Zeitdruck",
    text: "Wenn viele Anfragen parallel kommen, steigt das Risiko unvollständiger oder unpassender Antworten. Advaic verlagert Nachrichten mit fehlenden Angaben oder Qualitätswarnung automatisch in die Freigabe.",
  },
  {
    title: "Transparenz entscheidet über Steuerbarkeit",
    text: "Ohne klaren Verlauf ist nicht sichtbar, warum etwas gesendet oder gestoppt wurde. Advaic dokumentiert Eingang, Entscheidung, QA, Versand und Follow-up-Status.",
  },
];

const rolloutPlan = [
  {
    title: "Woche 1: Beobachten und kalibrieren",
    text: "Starten Sie mit hoher Freigabequote. Prüfen Sie täglich, welche Fälle sauber automatisierbar sind und welche bewusst manuell bleiben sollten.",
  },
  {
    title: "Woche 2: Auto-Fälle sauber eingrenzen",
    text: "Definieren Sie Auto-Fälle wie Verfügbarkeit, Unterlagen, Terminvorschlag und nächste Prozessschritte. Konflikte, Beschwerden und Nachrichten mit fehlenden Kerndaten bleiben in der Freigabe.",
  },
  {
    title: "Woche 3: Follow-ups vorsichtig aktivieren",
    text: "Aktivieren Sie Follow-ups zunächst konservativ mit klaren Stopp-Regeln. Messen Sie, ob Reaktionszeit und Rücklauf stabiler werden.",
  },
  {
    title: "Woche 4: KPI-basiert ausbauen",
    text: "Erhöhen Sie den Auto-Anteil nur bei stabiler Qualität. Relevante KPI: Freigabequote, QA-Fehlerquote, Erstreaktionszeit, manuelle Minuten pro Anfrage.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für den Zusammenhang zwischen Reaktionsgeschwindigkeit und Anfragen-Qualifizierung.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Referenz für den hohen E-Mail-Anteil in wissensintensiver Arbeit als Produktivitätsfaktor.",
  },
  {
    label: "NAR 2024 Profile Highlights",
    href: "https://www.nar.realtor/sites/default/files/2024-11/2024-profile-of-home-buyers-and-sellers-highlights-11-04-2024_2.pdf",
    note: "Internationale Referenz für digital gestartete Immobilienprozesse und Maklerrelevanz.",
  },
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
    note: "Offizielle deutsche Datenbasis zur Wohn- und Marktlage als Umfeldfaktor für Maklerprozesse.",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Rechtliche Einordnung für datenschutzkonformen Betrieb; keine Rechtsberatung.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Manuell vs. Advaic für Makler",
  ogTitle: "Manuell vs. Advaic | Prozessvergleich für Makler",
  description:
    "Vergleich pro Prozessschritt: lesen, einordnen, antworten, nachfassen und dokumentieren. So sehen Sie, wo manuelle Bearbeitung Zeit kostet und wo Advaic entlastet.",
  path: "/manuell-vs-advaic",
  template: "compare",
  eyebrow: "Vergleich",
  proof: "Zeit, Risiko und Transparenz pro Prozessschritt mit echter Entscheidungssubstanz.",
});

export default function ManualVsAdvaicPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Vergleich"
        title="Wo manuelle Anfragebearbeitung Zeit kostet und wo Advaic entlastet"
        description="Verglichen wird nicht eine Featureliste, sondern der echte Ablauf: lesen, einordnen, antworten, nachfassen und dokumentieren. Genau dort entscheidet sich, ob ein Team spürbar entlastet wird."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produkt prüfen
            </Link>
            <Link href="/signup" className="btn-primary">
              {MARKETING_PRIMARY_CTA_LABEL}
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Worauf Sie in diesem Vergleich wirklich achten sollten</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Viele Makler vergleichen Tools über Funktionen. Entscheidend ist aber die Wirkung im Tagesgeschäft:
                Wie viel Zeit bleibt pro Anfrage manuell? Wie stark sinkt das Risiko falscher Antworten? Wie gut
                bleibt der Verlauf für Team und Support nachvollziehbar?
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Genau dafür ist dieser Vergleich gebaut: erst Engpässe sichtbar machen, dann Guardrails prüfen und
                anschließend mit Safe-Start kontrolliert testen. So wird aus einer Demo eine belastbare
                Betriebsentscheidung.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Für wen dieser Vergleich relevant ist</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Makler mit regelmäßigem Anfrageaufkommen und Zeitdruck im Postfach</li>
                <li>Teams, die Automatisierung wollen, aber Sicherheitsgrenzen klar definieren müssen</li>
                <li>Entscheider, die die Einführung über KPI und nicht über Bauchgefühl steuern möchten</li>
              </ul>
            </article>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {briefPoints.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=vergleich-stage"
        primaryLabel="Mit Safe-Start testen"
        secondaryHref="/roi-rechner"
        secondaryLabel="ROI berechnen"
        context="manuell-vs-advaic"
      />

      <ManualVsAdvaicComparison />
      <ProcessFlowComparison />

      <section className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Wo manuelle Prozesse in der Praxis kippen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              In der Realität ist selten ein einzelner Fehler das Problem. Meistens kippt der Prozess, wenn Volumen,
              Geschwindigkeit und fehlende Klarheit gleichzeitig steigen. Dann entstehen Antwortverzug, inkonsistente Texte
              und fehlende Übersicht im Verlauf.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="card-base p-6">
              <h3 className="h3">Zeitrisiko</h3>
              <p className="helper mt-3">
                Jede manuelle wiederkehrende Erstantwort blockiert Zeit für Beratung und Abschlussarbeit. Der Engpass
                entsteht bei häufigen Routineanfragen, nicht bei wenigen Spezialfällen.
              </p>
            </article>
            <article className="card-base p-6">
              <h3 className="h3">Qualitätsrisiko</h3>
              <p className="helper mt-3">
                Unter Zeitdruck steigen Auslassungen und unpräzise Antworten. Im Maklerkontext schadet das unmittelbar
                Vertrauen und Rücklaufquote.
              </p>
            </article>
            <article className="card-base p-6">
              <h3 className="h3">Steuerungsrisiko</h3>
              <p className="helper mt-3">
                Wenn Entscheidungen nicht strukturiert geloggt sind, wird Support reaktiv und kaum noch steuernd. Genau hier
                braucht es klare Status- und Guardrail-Logik.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <SafeStartConfigurator />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-7 md:p-8">
              <h2 className="h3">Einführungsplan für die ersten 30 Tage</h2>
              <p className="helper mt-3">
                Die höchste Erfolgswahrscheinlichkeit entsteht über stufenweisen Betrieb: erst Beobachtung, dann
                Kalibrierung, danach gezielte Ausweitung.
              </p>
              <div className="mt-5 space-y-3">
                {rolloutPlan.map((step) => (
                  <article key={step.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{step.title}</p>
                    <p className="helper mt-2">{step.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="card-base p-6 lg:col-span-5 md:p-8">
              <h2 className="h3">Quellen & Methodik</h2>
              <p className="helper mt-3">
                Die Vergleichslogik kombiniert öffentliche Studien mit konservativer Modellierung. Zahlen dienen als
                Orientierung für eine fundierte Testentscheidung.
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
          </div>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
