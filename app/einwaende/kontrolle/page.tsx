import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";

const mechanics = [
  {
    title: "Auto nur bei Klarheit",
    text: "Advaic sendet nicht pauschal automatisch. Auto-Versand gilt nur für klare Standardfälle mit ausreichendem Kontext und bestandenen Qualitätschecks.",
  },
  {
    title: "Unsicher = Zur Freigabe",
    text: "Bei Objekt-Unklarheit, Konflikten, Beschwerden oder niedriger Sicherheit geht die Nachricht verpflichtend in die Freigabe-Inbox.",
  },
  {
    title: "Autopilot jederzeit pausierbar",
    text: "Du kannst den Auto-Modus jederzeit stoppen und erst nach stabiler Qualität wieder schrittweise aktivieren.",
  },
  {
    title: "Verlauf als Kontrollbeweis",
    text: "Eingang, Entscheidung, QA und Versand werden protokolliert. Das macht operative Entscheidungen auch im Nachhinein nachvollziehbar.",
  },
];

const implementation = [
  "Start mit konservativer Konfiguration: mehr Freigabe, weniger Auto.",
  "Wöchentliche Auswertung: Warum landeten Fälle in Freigabe?",
  "Auto-Regeln nur für klar validierte Standardfälle erweitern.",
  "Bei Unsicherheit sofort Auto-Anteil zurücknehmen und Regeln schärfen.",
];

const kpis = [
  "Freigabequote in den ersten 14 Tagen",
  "Anteil Auto-Fälle mit nachträglicher Korrektur",
  "Zeit bis zur manuellen Freigabe in Sonderfällen",
  "Anteil Nachrichten mit vollständigem Verlaufseintrag",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Referenz für kontrollierte Einführung risikobehafteter Automatisierung.",
  },
  {
    label: "ISO/IEC 23894:2023 (AI Risk Management)",
    href: "https://www.iso.org/standard/77304.html",
    note: "Rahmen zur Governance von KI-Risiken im Betrieb.",
  },
  {
    label: "Bafin – Leitlinien zu Governance (allgemeine Orientierung)",
    href: "https://www.bafin.de/DE/DieBaFin/Internationales/Bankenaufsicht/EBA/eba_node.html",
    note: "Allgemeine Orientierung, dass wirksame Kontrolle immer Prozess und Verantwortung braucht.",
  },
];

export const metadata: Metadata = {
  title: "Einwand Kontrolle | Advaic",
  description:
    "Wie Advaic Kontrolle sicherstellt: Auto nur bei Klarheit, verpflichtende Freigabe bei Risiko und vollständig dokumentierter Verlauf.",
  alternates: {
    canonical: "/einwaende/kontrolle",
  },
};

export default function ObjectionKontrollePage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Kontrolle"
        title="„Ich will keinen Kontrollverlust durch Autopilot.“"
        description="Dieser Einwand ist berechtigt. Deshalb ist Advaic als kontrolliertes System gebaut: klare Regeln, Fail-Safe zur Freigabe und jederzeit pausierbarer Automatikmodus."
        actions={
          <>
            <Link href="/autopilot-regeln" className="btn-secondary">
              Regelwerk ansehen
            </Link>
            <Link href="/signup?entry=objection-kontrolle" className="btn-primary">
              Sicher starten
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=objection-kontrolle-stage"
        primaryLabel="Mit Freigabe-First starten"
        secondaryHref="/freigabe-inbox"
        secondaryLabel="Freigabe-Inbox ansehen"
        context="einwand-kontrolle"
      />

      <ObjectionArticle
        context="kontrolle"
        concern="„Was passiert, wenn das System im falschen Moment selbst sendet?“"
        concernSummary="Das zentrale Sicherheitsprinzip lautet: Im Zweifel stoppen. Unklare Fälle werden nicht automatisch versendet, sondern landen bei Ihnen zur Freigabe."
        mechanicsTitle="Kontrollmechanik statt Blind-Automation"
        mechanics={mechanics}
        implementation={implementation}
        kpis={kpis}
        relatedLinks={[
          { label: "Autopilot-Regeln", href: "/autopilot-regeln" },
          { label: "Produktablauf", href: "/produkt#ablauf" },
          { label: "Trust-Center", href: "/trust" },
        ]}
        sources={sources}
      />

      <FinalCTA />
    </PageShell>
  );
}
