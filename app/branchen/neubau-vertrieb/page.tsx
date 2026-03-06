import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const recurringTopics = [
  "Projektverfügbarkeit und Bauabschnitte",
  "Unterlagen, Exposés und nächste Schritte",
  "Terminabstimmung für Beratung oder Besichtigung",
];

const nonAutoTopics = [
  "Preis- oder Vertragskonflikte",
  "Unklarer Projektbezug in der Anfrage",
  "Spezielle Sonderwünsche mit hohem Abstimmungsbedarf",
];

const complexityRisks = [
  {
    title: "Projektbezug wird nicht sauber erkannt",
    text: "Bei mehreren Bauabschnitten kann eine zu allgemeine Antwort den falschen Kontext treffen und unnötige Rückläufe erzeugen.",
  },
  {
    title: "Informationsstand ist nicht synchron",
    text: "Wenn Exposé- und Verfügbarkeitsdaten nicht klar referenziert sind, steigt das Risiko unpräziser Aussagen im Erstkontakt.",
  },
  {
    title: "Sonderwünsche landen im Standardprozess",
    text: "Individuelle Ausstattungs- oder Vertragsfragen müssen früh in die Freigabe, damit kein Fehlversprechen entsteht.",
  },
];

const rolloutPlan = [
  "Woche 1: Projektreferenzen und Antwortbausteine je Bauabschnitt definieren.",
  "Woche 2: Auto nur auf klar identifizierte Standardfragen je Projekt aktivieren.",
  "Woche 3: Follow-ups für offene Standardfälle in Stufe 1 starten.",
  "Woche 4: Qualitäts- und Freigabeverlauf auswerten, Regeln pro Projekt nachschärfen.",
];

const sources = [
  {
    label: "Destatis – Bauen & Wohnen",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
  },
  {
    label: "NAR 2024 Profile Highlights",
    href: "https://www.nar.realtor/sites/default/files/2024-11/2024-profile-of-home-buyers-and-sellers-highlights-11-04-2024_2.pdf",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
];

export const metadata: Metadata = {
  title: "Neubau-Vertrieb | Branchenprofil Advaic",
  description:
    "Branchenprofil für Neubau-Vertrieb: strukturierte Erstantworten, klare Freigabepfade bei Sonderfällen und nachvollziehbare Statuslogik für Projektanfragen.",
  alternates: {
    canonical: "/branchen/neubau-vertrieb",
  },
  openGraph: {
    title: "Neubau-Vertrieb | Branchenprofil Advaic",
    description:
      "Branchenprofil für Neubau-Vertrieb: strukturierte Erstantworten, klare Freigabepfade bei Sonderfällen und nachvollziehbare Statuslogik für Projektanfragen.",
    url: "/branchen/neubau-vertrieb",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Neubau-Vertrieb | Branchenprofil Advaic",
    description:
      "Branchenprofil für Neubau-Vertrieb: strukturierte Erstantworten, klare Freigabepfade bei Sonderfällen und nachvollziehbare Statuslogik für Projektanfragen.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function BranchenNeubauVertriebPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Branchenprofil Neubau-Vertrieb",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/branchen/neubau-vertrieb`,
    about: ["Neubau-Vertrieb", "Projektanfragen", "Freigabe", "Qualitätschecks"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Branchenprofil"
        title="Neubau-Vertrieb"
        description="Im Neubau-Vertrieb treffen viele ähnliche Projektanfragen ein. Advaic sorgt für konsistente Erstreaktionen und hält komplexe Fälle in Ihrer Freigabe."
        actions={
          <>
            <Link href="/branchen" className="btn-secondary">
              Alle Branchenprofile
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
        secondaryHref="/qualitaetschecks"
        secondaryLabel="Checks im Detail"
        context="branche-neubau-vertrieb"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">Neubau-Vertrieb braucht präzise Kontextführung</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Im Neubau-Vertrieb ist Geschwindigkeit wichtig, aber Präzision noch wichtiger. Interessenten fragen oft zu
              mehreren Einheiten, Bauabschnitten oder Ausstattungsvarianten. Ohne klare Kontextlogik entstehen schnell
              missverständliche Antworten.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Dieses Profil zeigt, welche Fälle sauber automatisierbar sind, welche grundsätzlich in die Freigabe
              gehören und wie ein stufenweiser Rollout ohne Qualitätsverlust aussieht.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Typisch automatisierbare Anfragen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {recurringTopics.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6">
              <h2 className="h3">Bewusst nicht automatisch</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {nonAutoTopics.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {complexityRisks.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Empfohlene Startlogik für Neubau-Teams</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Projektreferenzen im Prompt klar strukturieren, damit der Objektbezug stabil bleibt.</li>
              <li>Auto zunächst auf wiederkehrende Erstinformationen begrenzen.</li>
              <li>Follow-ups nur bei eindeutigen, offenen Standardfällen aktivieren.</li>
              <li>Sonderwünsche und Konfliktthemen konsequent in die Freigabe leiten.</li>
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">30-Tage-Rolloutplan für Projektteams</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {rolloutPlan.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Einordnung kombiniert öffentliche Markt- und Vertriebsreferenzen mit konservativer Prozesslogik für
              projektbasierte Anfragebearbeitung. Ziel ist eine belastbare Pilotierung im echten Betrieb.
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

      <FinalCTA />
    </PageShell>
  );
}
