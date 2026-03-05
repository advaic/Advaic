import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const principles = [
  "Keine Blackbox-Automatisierung: Auto-Versand nur bei klaren Standardfällen.",
  "Fail-Safe zuerst: Unsichere Fälle gehen in die Freigabe statt an Interessenten.",
  "Vollständige Nachvollziehbarkeit: Eingang, Entscheidung und Versand mit Status.",
  "Konservative Inbetriebnahme: erst Freigabe-lastig starten, danach kontrolliert ausbauen.",
];

const dataFlow = [
  {
    title: "1) Eingang",
    text: "E-Mails werden aus dem verbundenen Postfach übernommen und als relevante Anfrage oder Nicht-Anfrage eingeordnet.",
  },
  {
    title: "2) Entscheidung",
    text: "Die Policy-Logik bewertet Auto, Freigabe oder Ignorieren nach Relevanz, Kontext, Vollständigkeit und Risiko.",
  },
  {
    title: "3) Qualität",
    text: "Vor Auto-Versand laufen Qualitätschecks für Ton, Lesbarkeit, Kontext und Fail-Safe-Risiko.",
  },
  {
    title: "4) Verlauf",
    text: "Jede Entscheidung bleibt im Dashboard nachvollziehbar: Status, Zeitstempel und Versandpfad.",
  },
];

const docs = [
  "AVV-Prozess im Onboarding (inklusive Rollenklärung Verantwortlicher/Auftragsverarbeiter).",
  "Öffentliche Unterauftragsverarbeiter-Übersicht mit Stand und Update-Logik.",
  "TOM-Übersicht und organisatorische Maßnahmen auf Anfrage.",
  "Exportierbare Verlaufsdaten für interne Prüfungen und Supportfälle.",
  "Dokumentierte Zuständigkeiten für Incident-Meldung und schnelle Einordnung.",
];

const boundaries = [
  "Advaic ersetzt keine Rechtsberatung und keine individuelle juristische Prüfung.",
  "Die fachliche Richtigkeit objektbezogener Daten bleibt abhängig von Ihren Quellsystemen.",
  "Für Sonderfälle und Konfliktthemen bleibt die Freigabe durch Menschen der Standardpfad.",
];

export const metadata: Metadata = {
  title: "Trust Center | Advaic",
  description:
    "Trust Center für Advaic: DSGVO-Rahmen, Guardrails, Datenfluss, AVV/TOM-Prozess, Incident-Logik und operative Grenzen.",
};

export default function TrustPage() {
  return (
    <PageShell proofContext="trust">
      <BreadcrumbJsonLd
        items={[
          { name: "Startseite", path: "/" },
          { name: "Trust Center", path: "/trust" },
        ]}
      />
      <PageIntro
        kicker="Trust Center"
        title="Sicherheit, DSGVO und operative Kontrolle"
        description="Diese Seite bündelt den Trust-Rahmen von Advaic: wie Auto-Versand abgesichert ist, welche Datenflüsse bestehen und welche Grenzen klar definiert sind."
        actions={
          <>
            <Link href="/sicherheit" className="btn-secondary">
              Sicherheitsseite
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        context="trust-center"
        sectionId="trust-stage"
        primaryHref="/signup"
        primaryLabel="Mit Trust-Setup testen"
        secondaryHref="/dsgvo-email-autopilot"
        secondaryLabel="DSGVO-Details"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Trust-Grundsätze</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {principles.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {dataFlow.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">DSGVO, AVV und TOM</h2>
              <p className="helper mt-3">
                Die Verarbeitung ist auf Anfragebearbeitung und Prozessqualität begrenzt. Dokumentation für AVV, TOM
                und Rollenklärung erhalten Sie im Onboarding und auf Anfrage für Ihre interne Prüfung.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {docs.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/unterauftragsverarbeiter" className="btn-secondary">
                  Unterauftragsverarbeiter
                </Link>
                <Link href="/datenschutz" className="btn-secondary">
                  Datenschutzhinweise
                </Link>
              </div>
            </article>

            <article className="card-base p-6">
              <h2 className="h3">Incident- und Supportlogik</h2>
              <p className="helper mt-3">
                Für operative Auffälligkeiten gilt ein klarer Ablauf: Fall identifizieren, Versandpfad prüfen,
                Statushistorie exportieren, Regelanpassung vornehmen und Ergebnis kontrolliert erneut testen.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Support über nachvollziehbare Verlaufseinträge statt über lose E-Mail-Threads.</li>
                <li>Relevante Fälle können priorisiert und reproduzierbar analysiert werden.</li>
                <li>Autopilot ist pausierbar, bis ein Fall sauber geklärt ist.</li>
              </ul>
            </article>
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Klare Grenzen</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {boundaries.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
