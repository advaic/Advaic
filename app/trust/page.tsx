import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import PublicTrustArtifacts from "@/components/marketing/PublicTrustArtifacts";

const trustSections = [
  {
    title: "Sicherheitsseite",
    text: "Der tiefe Prüfpfad für Auto-Grenzen, Freigabegründe, Nachweise und Guardrails vor dem Versand.",
    href: "/sicherheit",
    cta: "Prüfpfad öffnen",
  },
  {
    title: "Datenschutz",
    text: "Das eigentliche Dokument für Rollenmodell, Datenkategorien, Zwecke, Speicherfristen und Grenzen automatisierter Verarbeitung.",
    href: "/datenschutz",
    cta: "Dokument öffnen",
  },
  {
    title: "Unterauftragsverarbeiter",
    text: "Die öffentliche Anbieterübersicht mit Zwecken, Datenkategorien und Transferhinweisen.",
    href: "/unterauftragsverarbeiter",
    cta: "Anbieterliste öffnen",
  },
  {
    title: "Freigabe-Workflow",
    text: "Der operative Prüfpfad für sensible Fälle, menschliche Entscheidung und sichtbare Nachvollziehbarkeit.",
    href: "/makler-freigabe-workflow",
    cta: "Workflow öffnen",
  },
];

const architectureRoles = [
  "Startseite: kurze Vertrauensprüfung in wenigen Minuten.",
  "/trust: Hub, der Sie in die richtige Prüftiefe führt.",
  "/sicherheit: fachlicher Prüfpfad für Auto, Freigabe und Nachweise.",
  "/datenschutz: formales Dokument für Rollen, Zwecke und Speicherfristen.",
];

const quickChecks = [
  {
    title: "Autopilot-Regeln",
    text: "Prüfen Sie die Kriterien für Auto, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks",
    text: "Sehen Sie, welche Prüfungen vor dem Versand laufen.",
    href: "/qualitaetschecks",
  },
  {
    title: "DSGVO im Betrieb",
    text: "Einordnung für automatisierte E-Mail-Prozesse im Makleralltag.",
    href: "/dsgvo-email-autopilot",
  },
  {
    title: "Integrationen",
    text: "Gmail und Outlook mit sicherem Setup und nachvollziehbarem Versandpfad.",
    href: "/integrationen",
  },
];

const trustPrinciples = [
  "Auto-Versand nur mit klarem Objektbezug, ausreichenden Angaben und bestandenen Qualitätschecks.",
  "Fehlende Informationen, sensible Aussagen oder unklare Versandlage gehen in die Freigabe statt direkt an Interessenten.",
  "Entscheidungen, Stopps und Versandstatus bleiben im Verlauf nachvollziehbar.",
];

const sources = [
  {
    label: "EUR-Lex – DSGVO Volltext (EU 2016/679)",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "Primärquelle für datenschutzrechtliche Anforderungen.",
  },
  {
    label: "BfDI – Informationen zur DSGVO",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
    note: "Nationale Orientierung für Datenschutz im deutschen Betrieb.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte KI-Entscheidungen mit klaren Schutzgrenzen.",
  },
];

export const metadata = buildMarketingMetadata({
  title: "Trust-Hub | Advaic",
  ogTitle: "Trust-Hub | Advaic",
  description:
    "Der zentrale Trust-Hub für Advaic: Wohin Sie für Sicherheitslogik, Datenschutz, Unterauftragsverarbeiter und Freigabe-Workflow gehen sollten.",
  path: "/trust",
  template: "trust",
  eyebrow: "Trust-Hub",
  proof: "Klare Rollenverteilung zwischen Homepage, Hub, Sicherheitsseite und Datenschutz-Dokument.",
});

export default function TrustPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trust-Hub",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/trust`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Trust-Hub", path: "/trust" },
      ]}
      schema={schema}
      kicker="Trust-Hub"
      title="Wohin Sie für welche Trust-Frage gehen sollten"
      description="Diese Seite ist kein weiteres Sicherheitsdokument, sondern der Hub für die richtige Prüftiefe: Sicherheitslogik, Datenschutz, Anbieterübersicht und Freigabe-Workflow."
      actions={
        <>
          <Link href="/sicherheit" className="btn-secondary">
            Sicherheitsseite
          </Link>
          <Link href="/datenschutz" className="btn-primary">
            Datenschutz öffnen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="trust-hub"
      stageSectionId="trust-stage"
      withStageCta={false}
      withProofLayer={false}
      withMarketingRails={false}
      primaryHref="/datenschutz"
      primaryLabel="Datenschutz prüfen"
      secondaryHref="/sicherheit"
      secondaryLabel="Sicherheitslogik"
      sources={sources}
      sourcesDescription="Die Quellen stützen Datenschutz- und Governance-Einordnung. Für Ihren Einzelfall ersetzen sie keine individuelle Rechtsberatung."
    >
      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <article className="card-base p-6 md:p-8" data-tour="trust-architecture-map">
            <h2 className="h3">Rollen in der Trust-Architektur</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Der Hub soll keine Inhalte doppelt erklären. Er ordnet nur, welche Seite für welche Frage zuständig ist.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {architectureRoles.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-6 md:py-8">
        <Container>
          <PublicTrustArtifacts
            title="Diese sieben öffentlichen Prüfobjekte ersetzen keine Logo-Wand, aber sie machen die Prüfung belastbar"
            description="Wenn noch keine öffentlichen Fallstudien vorliegen, müssen Produktzustand, Regeln, Unterlagen, Integrationen und Preis umso klarer öffentlich prüfbar sein."
            dataTour="trust-public-artifacts"
          />
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2" data-tour="trust-hub-sections">
            {trustSections.map((item) => (
              <article key={item.href} className="card-base card-hover p-6 md:p-8">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-5">
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8" data-tour="trust-hub-quick-checks">
            <h2 className="h3">Typische Anschlussfragen nach dem Hub</h2>
            <p className="helper mt-3 max-w-[70ch]">
              Erst wenn die Hauptrolle der Seiten klar ist, lohnen diese vertiefenden Einzelthemen.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickChecks.map((item) => (
                <article
                  key={item.href}
                  className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.text}</p>
                  <Link href={item.href} className="btn-secondary mt-4">
                    Öffnen
                  </Link>
                </article>
              ))}
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
