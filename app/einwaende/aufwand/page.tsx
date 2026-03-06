import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";

const mechanics = [
  {
    title: "Kein Big-Bang-Onboarding",
    text: "Der Einstieg ist bewusst stufenweise: Postfach verbinden, Ton festlegen, Regeln aktivieren, dann konservativ starten. So bleibt der Aufwand überschaubar.",
  },
  {
    title: "Schneller Nutzen vor Vollausbau",
    text: "Sie müssen nicht sofort alle Sonderfälle modellieren. Erste Entlastung entsteht bereits über klare Standardfälle und saubere Freigabewege.",
  },
  {
    title: "Iteratives Nachschärfen",
    text: "Regeln, Ton und Follow-up-Strategie werden aus realen Fällen nachjustiert. Das senkt Einführungsrisiko und erhöht Akzeptanz im Team.",
  },
  {
    title: "Supportfähig durch Verlauf",
    text: "Da Entscheidungen dokumentiert sind, können Rückfragen intern schneller geklärt werden. Das reduziert versteckte Betriebskosten.",
  },
];

const implementation = [
  "Tag 1: Postfach verbinden und Safe-Start aktivieren.",
  "Tag 2-3: Top-Standardfälle und Antwortstil freigeben.",
  "Woche 1: Freigabe-Inbox täglich prüfen, Regeln präzisieren.",
  "Woche 2: nur stabile Standardfälle in den Auto-Pfad überführen.",
];

const kpis = [
  "Einführungszeit bis erster stabiler Auto-Fall",
  "Aufwand für tägliche Freigabeprüfung in Woche 1-2",
  "Korrekturquote nach Freigabe",
  "Netto-Zeitersparnis ab Woche 3",
];

const sources = [
  {
    label: "NIST – AI RMF Playbook",
    href: "https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook",
    note: "Empfehlungen für schrittweise und kontrollierte Einführung.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Kontext zur Entlastung wissensintensiver Kommunikationsarbeit.",
  },
  {
    label: "Atlassian – Change Management Basics",
    href: "https://www.atlassian.com/work-management/knowledge-sharing/change-management",
    note: "Allgemeine Orientierung für stufenweise Prozessänderungen.",
  },
];

export const metadata: Metadata = {
  title: "Einwand Aufwand | Advaic",
  description:
    "Wie hoch ist der echte Einführungsaufwand? Mit stufenweisem Setup, Safe-Start und klarer Rollout-Logik bleibt die Einführung beherrschbar.",
  alternates: {
    canonical: "/einwaende/aufwand",
  },
  openGraph: {
    title: "Einwand Aufwand | Advaic",
    description:
      "Wie hoch ist der echte Einführungsaufwand? Mit stufenweisem Setup, Safe-Start und klarer Rollout-Logik bleibt die Einführung beherrschbar.",
    url: "/einwaende/aufwand",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Einwand Aufwand | Advaic",
    description:
      "Wie hoch ist der echte Einführungsaufwand? Mit stufenweisem Setup, Safe-Start und klarer Rollout-Logik bleibt die Einführung beherrschbar.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function ObjectionAufwandPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Aufwand"
        title="„Das klingt nach viel Einführungsaufwand.“"
        description="Der Aufwand bleibt beherrschbar, wenn die Einführung nicht als Großprojekt gestartet wird. Advaic ist auf schnelle, kontrollierte Teilgewinne ausgelegt."
        actions={
          <>
            <Link href="/produkt#setup" className="btn-secondary">
              Setup ansehen
            </Link>
            <Link href="/signup?entry=objection-aufwand" className="btn-primary">
              Mit Safe-Start beginnen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/signup?entry=objection-aufwand-stage"
        primaryLabel="Aufwandarm testen"
        secondaryHref="/roi-rechner"
        secondaryLabel="Aufwand vs. Nutzen rechnen"
        context="einwand-aufwand"
      />

      <ObjectionArticle
        context="aufwand"
        concern="„Wir haben im Tagesgeschäft keine Zeit für ein komplexes Tool-Projekt.“"
        concernSummary="Deshalb ist der Start auf wenige Kernschritte reduziert. Sie aktivieren zuerst nur den Teil, der direkt Zeit spart und betrieblich sicher bleibt."
        mechanicsTitle="So bleibt die Einführung operativ schlank"
        mechanics={mechanics}
        implementation={implementation}
        kpis={kpis}
        relatedLinks={[
          { label: "Produktseite", href: "/produkt" },
          { label: "Follow-up-Logik", href: "/follow-up-logik" },
          { label: "Manuell vs. Advaic", href: "/manuell-vs-advaic" },
        ]}
        sources={sources}
      />

      <FinalCTA />
    </PageShell>
  );
}
