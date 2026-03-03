import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

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

const processOrder = [
  "Einwand auswählen und kritisch lesen.",
  "Direkt die operative Antwort mit Guardrails prüfen.",
  "Mit Safe-Start testen und KPI im Dashboard beobachten.",
  "Erst danach Automatisierungsgrad erhöhen.",
];

export const metadata: Metadata = {
  title: "Einwände gegen E-Mail-Autopilot klar beantwortet",
  description:
    "Detaillierte Antworten auf die wichtigsten Einwände von Maklern: DSGVO, Kontrolle, Qualität, Aufwand und Kosten.",
  alternates: {
    canonical: "/einwaende",
  },
  openGraph: {
    title: "Einwände | Advaic",
    description:
      "Detaillierte Antworten auf die wichtigsten Einwände von Maklern: DSGVO, Kontrolle, Qualität, Aufwand und Kosten.",
    url: "/einwaende",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Einwände | Advaic",
    description:
      "Detaillierte Antworten auf die wichtigsten Einwände von Maklern: DSGVO, Kontrolle, Qualität, Aufwand und Kosten.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function ObjectionsHubPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwände"
        title="Kritische Fragen, präzise Antworten"
        description="Diese Seiten sind für Makler gemacht, die nicht auf Versprechen kaufen, sondern auf nachvollziehbare Mechanik. Jeder Einwand wird konkret, operativ und mit klaren Grenzen beantwortet."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produktmechanik ansehen
            </Link>
            <Link href="/signup?entry=objection-hub" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=objection-stage"
        primaryLabel="Kontrolliert starten"
        secondaryHref="/manuell-vs-advaic"
        secondaryLabel="Prozessvergleich"
        context="einwaende-hub"
      />

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

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Wie Sie diese Seiten sinnvoll nutzen</h2>
            <ol className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {processOrder.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
