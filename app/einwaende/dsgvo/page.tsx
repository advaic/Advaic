import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";

const mechanics = [
  {
    title: "Datenminimierung im Prozess",
    text: "Advaic verarbeitet nur die Informationen, die für die Anfragebearbeitung notwendig sind. Nicht relevante Systemmails und Newsletter werden nicht in den Antwortfluss gezogen.",
  },
  {
    title: "Klare Zugriffspfade",
    text: "Unsichere Fälle landen in der Freigabe-Inbox statt im Auto-Versand. Dadurch bleibt die menschliche Entscheidung dort verpflichtend, wo Risiko oder Unklarheit besteht.",
  },
  {
    title: "Dokumentierter Verlauf",
    text: "Für jede Nachricht bleibt der Ablauf nachvollziehbar: Eingang, Entscheidung, Qualitätsprüfung, Versand oder Freigabe. Das erleichtert interne Kontrolle und Audit-Vorbereitung.",
  },
  {
    title: "Technik plus Organisation",
    text: "Technische Guardrails allein reichen nicht. Rollen, Verantwortlichkeiten und interne Prüfroutinen müssen parallel klar definiert sein.",
  },
];

const implementation = [
  "Verarbeitungszwecke und Rollen im Team schriftlich festhalten.",
  "Freigaberegeln für unklare und sensible Fälle verpflichtend aktiv lassen.",
  "Monatlich den Nachrichtenverlauf stichprobenartig prüfen und dokumentieren.",
  "Rechtlich sensible Einzelfälle mit fachlicher Rechtsberatung klären.",
];

const kpis = [
  "Quote automatisch ignorierter Nicht-Anfragen (Newsletter/Systemmails)",
  "Freigabequote bei unklaren Fällen",
  "Anteil nachvollziehbarer Verlaufseinträge pro Nachricht",
  "Zeit bis zur internen Klärung bei sensiblen Fällen",
];

const sources = [
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Offizielle Einordnung zu Grundprinzipien, Pflichten und Betroffenenrechten.",
  },
  {
    label: "EDPB Guidelines (European Data Protection Board)",
    href: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines_en",
    note: "Leitlinien zur datenschutzkonformen Auslegung in der Praxis.",
  },
  {
    label: "BfDI – Datenschutz in der Praxis",
    href: "https://www.bfdi.bund.de/DE/Home/home_node.html",
    note: "Nationale Orientierungshilfe für Verantwortliche in Deutschland.",
  },
];

export const metadata: Metadata = {
  title: "Einwand DSGVO | Advaic",
  description:
    "Wie Advaic datenschutzorientiert betrieben wird, wo Guardrails helfen und welche organisatorischen Schritte Makler zusätzlich brauchen.",
  alternates: {
    canonical: "/einwaende/dsgvo",
  },
};

export default function ObjectionDSGVOPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: DSGVO"
        title="„Ist das wirklich DSGVO-konform?“"
        description="Die kurze Antwort: DSGVO-konformer Betrieb entsteht aus Technik und Organisation zusammen. Advaic liefert Guardrails und Dokumentation, ersetzt aber keine individuelle Rechtsberatung."
        actions={
          <>
            <Link href="/dsgvo-email-autopilot" className="btn-secondary">
              DSGVO-Seite öffnen
            </Link>
            <Link href="/signup?entry=objection-dsgvo" className="btn-primary">
              Kontrolliert testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=objection-dsgvo-stage"
        primaryLabel="Mit DSGVO-Setup starten"
        secondaryHref="/sicherheit"
        secondaryLabel="Sicherheitslogik prüfen"
        context="einwand-dsgvo"
      />

      <ObjectionArticle
        context="dsgvo"
        concern="„Wir dürfen kein Risiko eingehen, wenn automatisiert E-Mails rausgehen.“"
        concernSummary="Genau deshalb trennt Advaic strikt zwischen klaren Standardfällen und unsicheren Fällen. Unsicherheit führt zur Freigabe, nicht zum Auto-Versand."
        mechanicsTitle="Was Advaic in der DSGVO-Praxis konkret beiträgt"
        mechanics={mechanics}
        implementation={implementation}
        kpis={kpis}
        relatedLinks={[
          { label: "Sicherheit", href: "/sicherheit" },
          { label: "Datenschutz", href: "/datenschutz" },
          { label: "Freigabe-Inbox", href: "/freigabe-inbox" },
        ]}
        sources={sources}
      />

      <FinalCTA />
    </PageShell>
  );
}

