import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";

const mechanics = [
  {
    title: "Relevanz- und Kontextprüfung",
    text: "Vor Versand wird geprüft, ob es wirklich eine Interessenten-Anfrage ist und ob der Objektbezug belastbar vorhanden ist.",
  },
  {
    title: "Vollständigkeitsprüfung",
    text: "Wenn zentrale Informationen fehlen, wird nicht geraten. Der Fall geht zur Freigabe oder es wird eine saubere Rückfrage vorbereitet.",
  },
  {
    title: "Ton- und Lesbarkeitsprüfung",
    text: "Antworten orientieren sich an Ihrem Stilprofil und bleiben strukturiert, kurz und verständlich statt generisch oder überladen.",
  },
  {
    title: "Risiko-Fail-Safe",
    text: "Bei niedriger Sicherheit, Konfliktpotenzial oder heiklen Themen wird nicht automatisch gesendet. Die Entscheidung bleibt menschlich.",
  },
];

const implementation = [
  "Stilvorgaben konkret hinterlegen: Ton, Länge, formale Regeln.",
  "Standardantworten für Verfügbarkeit, Unterlagen und Terminlogik definieren.",
  "QA-Warnungen in den ersten Wochen täglich prüfen und Ursachen nachziehen.",
  "Sonderfälle als feste Freigabekategorie markieren und manuell behandeln.",
];

const kpis = [
  "QA-Pass-Rate vor Auto-Versand",
  "Warn-/Fail-Quote pro Nachrichtentyp",
  "Nachträgliche manuelle Korrekturzeit pro Entwurf",
  "Rückfragenquote wegen unklarer Antworten",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für zuverlässige und risikobewusste KI-Ausgaben.",
  },
  {
    label: "ISO/IEC 25010 (Softwarequalität)",
    href: "https://iso25000.com/index.php/en/iso-25000-standards/iso-25010",
    note: "Allgemeine Qualitätsdimensionen für verlässliche Software-Ergebnisse.",
  },
  {
    label: "DIN 5008 (Kommunikationsklarheit, allgemeine Orientierung)",
    href: "https://www.beuth.de/de/norm/din-5008/308235453",
    note: "Praxisorientierte Leitlinie für klare schriftliche Geschäftskommunikation.",
  },
];

export const metadata: Metadata = {
  title: "Einwand Qualität | Advaic",
  description:
    "Wie Advaic Qualitätsrisiken reduziert: Relevanz-, Kontext-, Vollständigkeits-, Stil- und Risiko-Checks vor jedem Versand.",
  alternates: {
    canonical: "/einwaende/qualitaet",
  },
};

export default function ObjectionQualitaetPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Qualität"
        title="„Was verhindert falsche oder unpassende Antworten?“"
        description="Dieser Punkt ist zentral. Advaic kombiniert mehrere Qualitätsprüfungen vor dem Versand und setzt bei Unsicherheit konsequent auf Freigabe statt Risiko."
        actions={
          <>
            <Link href="/qualitaetschecks" className="btn-secondary">
              Qualitätschecks im Detail
            </Link>
            <Link href="/signup?entry=objection-qualitaet" className="btn-primary">
              Qualitätsgesichert testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=objection-qualitaet-stage"
        primaryLabel="Mit QA-First testen"
        secondaryHref="/produkt#qualitaet"
        secondaryLabel="Qualitätslogik im Produkt"
        context="einwand-qualitaet"
      />

      <ObjectionArticle
        context="qualitaet"
        concern="„Wir können uns keinen Qualitätsverlust leisten, nur um schneller zu sein.“"
        concernSummary="Deshalb wird Geschwindigkeit nie ohne Qualitätsgrenze freigeschaltet. Jede Antwort durchläuft Prüfungen, und unsichere Fälle werden gestoppt."
        mechanicsTitle="Qualität wird technisch und operativ abgesichert"
        mechanics={mechanics}
        implementation={implementation}
        kpis={kpis}
        relatedLinks={[
          { label: "Qualitätschecks", href: "/qualitaetschecks" },
          { label: "Freigabe-Inbox", href: "/freigabe-inbox" },
          { label: "FAQ", href: "/faq" },
        ]}
        sources={sources}
      />

      <FinalCTA />
    </PageShell>
  );
}
