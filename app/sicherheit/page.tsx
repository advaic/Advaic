import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import TransparencyBox from "@/components/marketing/TransparencyBox";
import Security from "@/components/marketing/Security";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import Guarantee from "@/components/marketing/Guarantee";
import FinalCTA from "@/components/marketing/FinalCTA";

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
  },
  {
    label: "BfDI – Informationen zur DSGVO",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
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
  return (
    <PageShell>
      <PageIntro
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
      />
      <StageCTA
        stage="bewertung"
        primaryHref="/signup"
        primaryLabel="Sicher testen"
        secondaryHref="/autopilot-regeln"
        secondaryLabel="Regeln prüfen"
        context="sicherheit"
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
              <a href="#sicherheit-details" className="btn-secondary">
                Technische Details
              </a>
              <a href="#sicherheit-quellen" className="btn-secondary">
                Quellen
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

          <article id="sicherheit-quellen" className="card-base mt-8 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Diese Seite beschreibt die technische und organisatorische Sicherheitslogik von Advaic. Für die konkrete
              rechtliche Bewertung Ihres Betriebs ist eine eigene Prüfung erforderlich.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/unterauftragsverarbeiter" className="btn-secondary">
                Unterauftragsverarbeiter
              </Link>
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

      <TransparencyBox />
      <Security />
      <TrustByDesign />
      <Guarantee />
      <FinalCTA />
    </PageShell>
  );
}
