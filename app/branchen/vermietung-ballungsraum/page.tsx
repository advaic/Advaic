import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const typicalCases = [
  "Viele gleichartige Erstfragen zu Verfügbarkeit, Unterlagen und Terminen",
  "Anfragespitzen nach Portalausspielung oder Preisanpassung",
  "Reaktionsdruck in den ersten Stunden nach Eingang",
];

const quickTake = [
  "In stark nachgefragten Mietmärkten ist Reaktionsgeschwindigkeit ein echter Hebel, aber nur bei sauberer Qualitätskontrolle.",
  "Automatisierung lohnt sich vor allem für wiederkehrende Erstfragen mit klarem Objektbezug und vorhandenen Pflichtangaben.",
  "Beschwerden, Ausnahmen und informationsarme Nachrichten sollten in Ballungsmärkten bewusst in die Freigabe gehen.",
];

const failurePatterns = [
  {
    title: "Antwortstau in Peak-Zeiten",
    text: "Wenn mehrere Inserate gleichzeitig Anfragen erzeugen, bleibt die Erstreaktion liegen. Dadurch sinkt die Chance auf schnelle Terminvereinbarung.",
  },
  {
    title: "Uneinheitliche Erstkommunikation",
    text: "Unter Zeitdruck unterscheiden sich Ton und Informationsqualität stark zwischen Fällen. Das wirkt unprofessionell und erhöht Rückfragen.",
  },
  {
    title: "Freigabe ohne Priorisierung",
    text: "Wenn alle Sonderfälle gleich behandelt werden, blockieren harmlose Rückfragen und echte Risikofälle dieselbe Queue.",
  },
];

const startPlan = [
  "Auto nur für wiederkehrende Erstfragen aktivieren, etwa Verfügbarkeit, Unterlagenliste oder Termininteresse.",
  "Beschwerden, fehlender Objektbezug und Sonderwünsche konsequent in die Freigabe legen.",
  "Follow-ups zunächst vorsichtig (48 h / 96 h) starten und danach nachschärfen.",
];

const kpis = [
  "Ø Erstreaktionszeit auf neue Interessenten-Anfragen",
  "Freigabequote bei eingehenden Nachrichten",
  "QA-Fehlerquote vor Versand",
  "Anteil manuell bearbeiteter wiederkehrender Erstfragen",
];

const manualBoundaries = [
  "Preis- oder Verhandlungssituationen",
  "Beschwerden und Konfliktthemen",
  "Nachrichten ohne eindeutigen Objektbezug",
  "Fälle, in denen Angaben für eine richtige Antwort fehlen",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie Vermietungsteams Anfragewellen sauber steuern",
  ogTitle: "Vermietung in Ballungsräumen | Branchenprofil Advaic",
  description:
    "Leitfaden für Vermietung in Ballungsräumen: Wie Teams hohe Anfragewellen schneller bearbeiten, welche Nachrichten automatisch laufen können und was manuell bleiben sollte.",
  path: "/branchen/vermietung-ballungsraum",
  template: "usecase",
  eyebrow: "Branchenprofil",
  proof: "Wiederkehrende Erstfragen automatisieren, Ausnahmen in Freigabe halten und KPI-basiert ausrollen.",
});

export default function BranchenVermietungBallungsraumPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Branchenprofil Vermietung in Ballungsräumen",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/branchen/vermietung-ballungsraum`,
    about: ["Vermietung", "Ballungsräume", "Makleranfragen", "Safe-Start"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Branchenprofil"
        title="Wie Vermietungsteams Anfragewellen sauber steuern"
        description="In Ballungsräumen entsteht der größte Hebel nicht bei Einzelfällen, sondern bei hoher Zahl ähnlicher Erstfragen. Entscheidend ist, welche Antworten sicher automatisiert werden können und welche Nachrichten bewusst manuell bleiben."
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

      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <StageCTA
        stage="bewertung"
        primaryHref="/produkt#setup"
        primaryLabel="Safe-Start berechnen"
        secondaryHref="/manuell-vs-advaic"
        secondaryLabel="Prozessvergleich"
        context="branche-vermietung-ballungsraum"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">Betriebsrealität in Ballungsräumen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              In stark nachgefragten Mietmärkten wird nicht der einzelne Sonderfall zum Hauptproblem, sondern die Masse
              wiederkehrender Erstanfragen. Genau dort entsteht der operative Hebel: wiederkehrende Erstantworten schnell und sicher
              bearbeiten, während sensible Fälle konsequent in der Freigabe bleiben.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Dieses Profil ist als Verkaufs- und Umsetzungsbrief aufgebaut: erst Engpassdiagnose, dann Guardrail-Logik
              und schließlich ein kontrollierter 30-Tage-Startpfad.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Typische Ausgangslage</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {typicalCases.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6">
              <h2 className="h3">Wo Automatisierung in diesem Markt sinnvoll ist</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Wiederkehrende Erstfragen können direkt und im definierten Ton beantwortet werden.</li>
                <li>Nachrichten mit fehlenden Angaben oder Sonderwünschen gehen in die Freigabe statt in den Autopilot.</li>
                <li>Der Verlauf bleibt mit Status und Zeitstempeln vollständig nachvollziehbar.</li>
                <li>Follow-ups bleiben regelbasiert und stoppen automatisch, sobald eine Antwort eingeht.</li>
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {failurePatterns.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Empfohlener Safe-Start</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {startPlan.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Diese Nachrichten sollten bewusst manuell bleiben</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {manualBoundaries.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">30-Tage-KPI-Plan für den Rollout</h2>
            <p className="helper mt-3">
              Messen Sie ab Tag 1 dieselben Kennzahlen. Nur so sehen Sie, ob die Automatisierung tatsächlich entlastet
              oder nur Last verlagert.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((kpi) => (
                <li key={kpi} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{kpi}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Branchenempfehlung nutzt öffentliche Referenzen zu Antwortgeschwindigkeit, Arbeitslast und
              Marktumfeld. Zahlen dienen als Orientierung für Ihren kontrollierten Praxistest.
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
