import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import TransparencyBox from "@/components/marketing/TransparencyBox";
import Security from "@/components/marketing/Security";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import Guarantee from "@/components/marketing/Guarantee";

const highlights = [
  {
    title: "Klare Filtergrenzen",
    text: "Nicht relevante E-Mails werden nicht automatisch beantwortet.",
  },
  {
    title: "Freigabe bei Unsicherheit",
    text: "Unsichere Fälle werden an Sie übergeben, bevor etwas gesendet wird.",
  },
  {
    title: "Volle Nachvollziehbarkeit",
    text: "Der Verlauf dokumentiert alle Schritte von Eingang bis Versand.",
  },
];

const summary = [
  "Auto-Versand läuft nur bei klarer Anfrage, sauberem Kontext und bestandenen Qualitätschecks.",
  "Unklare oder sensible Fälle gehen verpflichtend in die Freigabe statt in den Autopilot.",
  "Jede Entscheidung bleibt mit Status und Zeitstempel im Verlauf nachvollziehbar.",
];

const detailFlow = [
  {
    title: "1) Eingang bewerten",
    text: "Advaic trennt echte Interessenten-Anfragen von Newsletter-, System- und Spam-Mails.",
  },
  {
    title: "2) Risiko und Kontext prüfen",
    text: "Vor einem Auto-Versand wird geprüft, ob Objektbezug, Vollständigkeit und Sicherheitsniveau ausreichen.",
  },
  {
    title: "3) Kontrollierte Aktion ausführen",
    text: "Nur klare Fälle werden automatisch gesendet. Unsicherheit führt immer zur Freigabe.",
  },
];

const safetyDetails = [
  {
    title: "Entscheidungsregeln",
    text: "Wann Auto, wann Freigabe und wann Ignorieren greift.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätskontrollen",
    text: "Welche Prüfungen vor einem automatischen Versand laufen.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabeprozess",
    text: "Wie unklare Fälle manuell und nachvollziehbar entschieden werden.",
    href: "/freigabe-inbox",
  },
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
    note: "Nationale Orientierung für die DSGVO-Anwendung in Deutschland.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Rahmen für organisatorische und technische Schutzmaßnahmen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Einordnung für kontrollierte KI-Entscheidungen mit Fail-Safe-Prinzipien.",
  },
];

export const metadata: Metadata = {
  title: "Sicherheit",
  description:
    "Sicherheits- und Datenschutzlogik von Advaic: klare Entscheidungsregeln, Freigabe bei Unsicherheit, dokumentierter Verlauf und DSGVO-orientierte Prozesse.",
  alternates: {
    canonical: "/sicherheit",
  },
  openGraph: {
    title: "Sicherheit | Advaic",
    description:
      "Sicherheits- und Datenschutzlogik von Advaic: klare Entscheidungsregeln, Freigabe bei Unsicherheit, dokumentierter Verlauf und DSGVO-orientierte Prozesse.",
    url: "/sicherheit",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Sicherheit | Advaic",
    description:
      "Sicherheits- und Datenschutzlogik von Advaic: klare Entscheidungsregeln, Freigabe bei Unsicherheit, dokumentierter Verlauf und DSGVO-orientierte Prozesse.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function SicherheitPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Sicherheitslogik von Advaic",
    inLanguage: "de-DE",
    about: ["Sicherheit", "DSGVO", "Freigabe", "Qualitätschecks", "Verlauf"],
    mainEntityOfPage: `${siteUrl}/sicherheit`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Sicherheit", path: "/sicherheit" },
      ]}
      schema={schema}
      kicker="Sicherheit und Datenschutz"
      title="Transparenz, Kontrolle und klare Grenzen"
      description="Advaic ist so aufgebaut, dass Sie jederzeit nachvollziehen können, was automatisiert wird und was bewusst in Ihrer Entscheidung bleibt."
      actions={
        <>
          <Link href="/autopilot" className="btn-secondary">
            Autopilot-Regeln
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="sicherheit"
      primaryHref="/signup"
      primaryLabel="Sicher testen"
      secondaryHref="/autopilot-regeln"
      secondaryLabel="Regeln prüfen"
      sources={sources}
      sourcesDescription="Diese Seite beschreibt den technischen und organisatorischen Sicherheitsrahmen. Für rechtliche Bewertung im Einzelfall ist eigene Prüfung erforderlich."
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
              <a href="#sicherheit-details" className="btn-secondary">
                Technische Details
              </a>
              <a href="#stage-cta" className="btn-secondary">
                Nächster Schritt
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="sicherheit-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {detailFlow.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Technische Schutzlogik</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Postfach-Anbindung per OAuth statt Passwortweitergabe</li>
                <li>Auto-Senden nur mit klarer Entscheidung und bestandenen Checks</li>
                <li>Fail-Safe: Bei Unsicherheit geht der Fall in die Freigabe</li>
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Datenschutz und Nachvollziehbarkeit</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Verlauf je Nachricht mit Status und Zeitstempel</li>
                <li>Freigabe-Inbox für sensible oder unklare Fälle</li>
                <li>Dokumentation und Exporte im Onboarding (keine Rechtsberatung)</li>
              </ul>
            </article>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {safetyDetails.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Details ansehen
                </Link>
              </article>
            ))}
          </div>

        </Container>
      </section>

      <TransparencyBox />
      <Security />
      <TrustByDesign />
      <Guarantee />
    </AiDiscoveryPageTemplate>
  );
}
