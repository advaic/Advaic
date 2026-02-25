import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const profiles = [
  {
    title: "Vermietung in Ballungsräumen",
    text: "Für Teams mit hohem täglichen Anfrageaufkommen, schneller Erstreaktions-Erwartung und klar wiederkehrenden Standardfragen.",
    href: "/branchen/vermietung-ballungsraum",
    fit: "Besonders stark bei hoher Taktung und standardisierbaren Erstanfragen.",
    caution: "Nicht sinnvoll, wenn nahezu jede Anfrage hochindividuell verhandelt werden muss.",
  },
  {
    title: "Kleine Maklerbüros",
    text: "Für Solo-Makler und kleine Teams, die knappe Zeit ohne Kontrollverlust skalieren möchten.",
    href: "/branchen/kleine-maklerbueros",
    fit: "Besonders stark, wenn Postfacharbeit regelmäßig Beratungszeit verdrängt.",
    caution: "Nicht sinnvoll, wenn kaum Anfragevolumen vorhanden ist.",
  },
  {
    title: "Neubau-Vertrieb",
    text: "Für strukturierte Erstantworten bei vielen Projektanfragen über mehrere Objekte und Bauabschnitte.",
    href: "/branchen/neubau-vertrieb",
    fit: "Besonders stark bei wiederkehrenden Projektfragen mit klaren Vorlagen.",
    caution: "Nicht sinnvoll, wenn jeder Fall individuellen Projektabgleich in Echtzeit erfordert.",
  },
];

const funnelSteps = [
  {
    title: "1) Einordnen",
    text: "Wählen Sie das Branchenprofil, das Ihrem Anfrage-Mix am nächsten kommt. Ziel ist keine perfekte Theorie, sondern ein realistischer Startpunkt.",
  },
  {
    title: "2) Engpass verstehen",
    text: "Prüfen Sie die typischen Fehlmuster des Profils: Reaktionsverzug, Freigabe-Überlast, fehlende Follow-up-Disziplin, unklare Zuständigkeiten.",
  },
  {
    title: "3) Safe-Start übernehmen",
    text: "Nutzen Sie die vorgeschlagene Startkonfiguration mit konservativem Auto-Anteil und klarer Freigabelogik.",
  },
  {
    title: "4) KPI-basiert erweitern",
    text: "Erhöhen Sie die Automatisierung erst, wenn QA-Verlauf, Freigabequote und Antwortzeit stabil sind.",
  },
];

const sources = [
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
];

export const metadata: Metadata = {
  title: "Branchenprofile | Advaic",
  description:
    "Detaillierte Branchen-Landingpages für Immobilienmakler: Vermietung in Ballungsräumen, kleine Maklerbüros und Neubau-Vertrieb.",
};

export default function BranchenPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Branchenprofile"
        title="Welche Konfiguration passt zu Ihrem Markt?"
        description="Diese Seiten zeigen branchenspezifisch, welche Anfragearten dominieren, wo Risiken entstehen und mit welcher Safe-Start-Logik Sie sinnvoll beginnen."
        actions={
          <>
            <Link href="/manuell-vs-advaic" className="btn-secondary">
              Vergleich ansehen
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/produkt#safe-start-konfiguration"
        primaryLabel="Safe-Start berechnen"
        secondaryHref="/manuell-vs-advaic"
        secondaryLabel="Prozessvergleich"
        context="branchen-hub"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">So lesen Sie die Branchenprofile als Entscheidungsfunnel</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Seite ist bewusst nicht als oberflächliche Linkliste aufgebaut. Jedes Profil beantwortet drei
              kaufentscheidende Fragen: Wo entsteht heute der größte operative Verlust, welche Guardrails sind zwingend
              und welche Startkonfiguration minimiert Risiko bei maximaler Lernkurve.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {funnelSteps.map((step) => (
              <article key={step.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="helper mt-3">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {profiles.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Ideal, wenn:</p>
                <p className="helper mt-1">{item.fit}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Weniger passend, wenn:</p>
                <p className="helper mt-1">{item.caution}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Profil öffnen
                </Link>
              </article>
            ))}
          </div>

          <article className="card-base mt-8 p-6">
            <h2 className="h3">Quellenbasis für die Branchenlogik</h2>
            <p className="helper mt-3">
              Die Profile kombinieren öffentliche Markteinordnung mit operativer Prozesslogik aus dem Makleralltag.
              Ziel ist eine realistische Betriebsentscheidung, keine generische Marketingaussage.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
