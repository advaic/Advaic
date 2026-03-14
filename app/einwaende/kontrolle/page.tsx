import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const mechanics = [
  {
    title: "Auto nur bei prüfbaren Kriterien",
    text: "Advaic sendet nicht pauschal automatisch. Auto-Versand gilt nur bei klarem Objektbezug, ausreichenden Angaben und bestandenen Qualitätschecks.",
  },
  {
    title: "Fehlende Angaben oder Konflikte = Zur Freigabe",
    text: "Bei unklarem Objektbezug, Konflikten, Beschwerden oder fehlenden Angaben geht die Nachricht verpflichtend in die Freigabe-Inbox.",
  },
  {
    title: "Autopilot jederzeit pausierbar",
    text: "Sie können den Auto-Modus jederzeit stoppen und erst nach stabiler Qualität wieder schrittweise aktivieren.",
  },
  {
    title: "Verlauf als Kontrollbeweis",
    text: "Eingang, Entscheidung, QA und Versand werden protokolliert. Das macht operative Entscheidungen auch im Nachhinein nachvollziehbar.",
  },
];

const implementation = [
  "Start mit konservativer Konfiguration: hoher Freigabeanteil, niedriger Auto-Anteil.",
  "Wöchentliche Auswertung: Warum landeten Fälle in Freigabe?",
  "Auto-Regeln nur für klar validierte wiederkehrende Erstantworten erweitern.",
  "Bei gehäuften Konflikten, fehlenden Angaben oder Korrekturen sofort Auto-Anteil zurücknehmen und Regeln schärfen.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie Makler Kontrolle über Autopilot behalten",
  ogTitle: "Einwand Kontrolle | Advaic",
  description:
    "Leitfaden zum Einwand Kontrolle: Welche Regeln, Freigabegrenzen und Nachweise ein Makler-Autopilot braucht, damit kein unkontrollierter Versand entsteht.",
  path: "/einwaende/kontrolle",
  template: "trust",
  eyebrow: "Einwand Kontrolle",
  proof: "Prüfbare Auto-Kriterien, Pflicht-Freigabe und ein dokumentierter Verlauf pro Nachricht.",
});

export default function ObjectionKontrollePage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Kontrolle"
        title="„Ich will keinen Kontrollverlust durch Autopilot.“"
        description="Dieser Einwand ist berechtigt. Entscheidend ist, ob ein System klare Auto-Kriterien, verpflichtende Freigabegrenzen und einen nachvollziehbaren Verlauf pro Nachricht liefert."
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
        concernSummary="Das zentrale Sicherheitsprinzip lautet: Im Zweifel stoppen. Nachrichten mit fehlenden Angaben, Konflikten oder Ausnahmen werden nicht automatisch versendet, sondern landen bei Ihnen zur Freigabe."
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
