import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const capabilityRows = [
  {
    area: "Nachrichten",
    dashboardPath: "/app/nachrichten",
    does:
      "Zentrale Inbox mit Suche, Filtern und direkter Konversationsbearbeitung für Interessenten-Anfragen.",
    guardrail:
      "Unklare oder riskante Fälle werden nicht still automatisch abgeschlossen, sondern sichtbar weitergeleitet.",
    publicHref: "/produkt#ablauf",
  },
  {
    area: "Eskalationen",
    dashboardPath: "/app/eskalationen",
    does:
      "Sammelt Sonderfälle, Konflikte und operative Risiken, die bewusst menschliche Entscheidung benötigen.",
    guardrail:
      "Eskalationsfälle bleiben im manuellen Pfad, bis ein Mensch entscheidet.",
    publicHref: "/sicherheit#sicherheit-details",
  },
  {
    area: "Zur Freigabe",
    dashboardPath: "/app/zur-freigabe",
    does:
      "Zeigt Entwürfe vor dem Versand. Agent kann freigeben, bearbeiten oder ablehnen.",
    guardrail:
      "Ohne Freigabe kein Versand bei fehlenden Angaben, Konflikten oder Ausnahmen.",
    publicHref: "/freigabe-inbox",
  },
  {
    area: "Follow-ups",
    dashboardPath: "/app/follow-ups",
    does:
      "Überwacht Nachfassfälle und deren Status über definierte Stufen und Zeitfenster.",
    guardrail:
      "Follow-ups stoppen bei Antwort oder Stop-Kriterium; kein endloses Nachfassen.",
    publicHref: "/follow-up-logik",
  },
  {
    area: "Immobilien",
    dashboardPath: "/app/immobilien",
    does:
      "Verwaltet Objektdaten als Grundlage für korrekte Antworten, Matching und qualifizierte Rückfragen.",
    guardrail:
      "Unvollständige Objektdaten erhöhen die Freigabequote; das System soll bei fehlenden Grundlagen bremsen.",
    publicHref: "/produkt#was",
  },
  {
    area: "Antwortvorlagen",
    dashboardPath: "/app/antwortvorlagen",
    does:
      "Erstellt und pflegt Textbausteine, die kontextbasiert genutzt statt blind kopiert werden.",
    guardrail:
      "Vorlagen sind Grundlage, keine 1:1-Automatik ohne Kontextprüfung.",
    publicHref: "/produkt#stil",
  },
  {
    area: "Ton & Stil",
    dashboardPath: "/app/ton-und-stil",
    does:
      "Definiert Anrede, Tonalität, Do’s/Don’ts und Beispieltexte für konsistente Kommunikation.",
    guardrail:
      "Stilsteuerung verbessert Konsistenz, ersetzt aber keine inhaltliche Fachprüfung.",
    publicHref: "/produkt#stil",
  },
  {
    area: "Benachrichtigungen",
    dashboardPath: "/app/benachrichtigungen",
    does:
      "Steuert, wann und wie operative Hinweise für Freigaben, Eskalationen und wichtige Ereignisse gesendet werden.",
    guardrail:
      "Alerts unterstützen Reaktionsgeschwindigkeit, treffen aber keine inhaltlichen Entscheidungen.",
    publicHref: "/produkt#setup",
  },
  {
    area: "Konto & Integrationen",
    dashboardPath: "/app/konto + /app/konto/verknuepfungen",
    does:
      "Verwaltet E-Mail- und Plattformintegrationen (z. B. Gmail, Microsoft 365, optional ImmoScout24) sowie Sicherheit und Abrechnung.",
    guardrail:
      "Ohne aktive Integration kein produktiver Versandpfad.",
    publicHref: "/sicherheit",
  },
  {
    area: "Auto-Senden Steuerung",
    dashboardPath: "/app (Sidebar Toggle)",
    does:
      "Globaler Schalter zum Aktivieren oder Pausieren von Auto-Senden im operativen Alltag.",
    guardrail:
      "Auch bei aktivem Auto-Senden gilt: fehlende Angaben, Konflikte oder Risikosignale führen zur Freigabe, nicht zum Blindversand.",
    publicHref: "/autopilot-regeln",
  },
];

const boundaries = [
  "Das System ersetzt keine Rechts-, Steuer- oder Finanzberatung.",
  "Bei Beschwerden, Konflikten oder unklarem Objektbezug ist der manuelle Pfad vorgesehen.",
  "Produktqualität hängt von sauberem Setup ab: E-Mail-Verknüpfung, Objektdaten, Regeln und Stil.",
  "Public-Chat erklärt Funktionen und Grenzen, greift aber nicht auf Live-Kundendaten zu.",
];

const adoption = [
  "Starten Sie konservativ mit hoher Freigabequote.",
  "Prüfen Sie die häufigsten Freigabegründe nach 7 bis 14 Tagen.",
  "Schärfen Sie Regeln und Objektdaten gezielt nach wiederkehrenden Mustern.",
  "Erhöhen Sie den Auto-Anteil nur bei stabiler Qualitäts- und Sicherheitslage.",
];

const sources = [
  {
    label: "Produktseite: Mechanik und Sicherheitsnetz",
    href: "/produkt",
  },
  {
    label: "Autopilot-Regeln im Detail",
    href: "/autopilot-regeln",
  },
  {
    label: "Freigabe-Inbox Workflow",
    href: "/freigabe-inbox",
  },
  {
    label: "Follow-up-Logik",
    href: "/follow-up-logik",
  },
  {
    label: "Sicherheitslogik und Guardrails",
    href: "/sicherheit",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Capability Matrix für Maklerteams",
  ogTitle: "Capability Matrix | Advaic",
  description:
    "Detaillierte Übersicht der Dashboard-Funktionen: was Advaic operativ kann, welche Guardrails greifen und welche Grenzen bewusst gesetzt sind.",
  path: "/produkt/capabilities",
  template: "product",
  eyebrow: "Capability Matrix",
  proof: "Welche Dashboard-Bereiche wirklich steuern, welche Guardrails greifen und wo Grenzen bewusst gesetzt sind.",
});

export default function ProductCapabilitiesPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Produkt-Transparenz"
        title="Welche Bereiche Sie im Dashboard wirklich steuern"
        description="Diese Matrix ist als Orientierung für Käufer und Betreiber gedacht. Sie zeigt pro Bereich, was im Dashboard gesteuert wird, welche Schutzlogik dort gilt und welche Grenzen bewusst gesetzt sind."
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

      <section id="matrix" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Capability Matrix nach Arbeitsbereich</h2>
          <p className="body mt-4 max-w-[74ch] text-[var(--muted)]">
            Die Matrix ist als operative Landkarte gedacht. Sie zeigt, was Sie in welchem Bereich steuern, welche
            Schutzlogik dort greift und wo Sie fachlich tiefer einsteigen können.
          </p>

          <div className="mt-8 space-y-4">
            {capabilityRows.map((row) => (
              <article key={row.area} className="card-base card-hover p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Bereich
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--text)]">{row.area}</h3>
                    <p className="mt-2 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--muted)] ring-1 ring-[var(--border)]">
                      {row.dashboardPath}
                    </p>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Was Sie steuern
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">{row.does}</p>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Guardrail
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{row.guardrail}</p>
                  </div>
                  <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                    <Link href={row.publicHref} className="btn-secondary">
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article id="grenzen" className="card-base p-6">
              <h3 className="h3">Bewusste Grenzen</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {boundaries.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6">
              <h3 className="h3">Empfohlene Einführungsreihenfolge</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {adoption.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article id="capability-quellen" className="card-base mt-8 p-6">
            <h3 className="h3">Quellen & Verknüpfte Detailseiten</h3>
            <p className="helper mt-3">
              Jede Capability in dieser Matrix ist mit den öffentlichen Detailseiten verknüpft, die dieselbe Logik
              im fachlichen Kontext erläutern.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <Link key={source.href} href={source.href} className="btn-secondary">
                  {source.label}
                </Link>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
