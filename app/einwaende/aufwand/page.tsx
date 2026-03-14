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
    title: "Kein Big-Bang-Onboarding",
    text: "Der Einstieg ist bewusst stufenweise: Postfach verbinden, Ton festlegen, Regeln aktivieren, dann konservativ starten. So bleibt der Aufwand überschaubar.",
  },
  {
    title: "Schneller Nutzen vor Vollausbau",
    text: "Sie müssen nicht sofort alle Sonderfälle modellieren. Erste Entlastung entsteht bereits über wiederkehrende Erstantworten und saubere Freigabewege.",
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
  "Tag 2-3: Top-Antwortpfade und Antwortstil freigeben.",
  "Woche 1: Freigabe-Inbox täglich prüfen, Regeln präzisieren.",
  "Woche 2: nur stabile wiederkehrende Erstantworten in den Auto-Pfad überführen.",
];

const quickTake = [
  "Der Einführungsaufwand ist beherrschbar, wenn Sie mit wenigen Antworttypen und klaren Freigabegrenzen starten.",
  "Der eigentliche Aufwand steckt nicht im Tool, sondern in der einmaligen Klärung von Stil, Regeln und Verantwortlichkeiten.",
  "Ein guter Pilot erzeugt nach wenigen Tagen sichtbaren Nutzen, bevor der Vollausbau überhaupt Thema wird.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie hoch der echte Einführungsaufwand wirklich ist",
  ogTitle: "Einwand Aufwand | Advaic",
  description:
    "Leitfaden zum Einwand Aufwand: Welche Arbeit vor dem Start wirklich anfällt, wie ein schlanker Pilot aussieht und woran Sie die Einführung wirtschaftlich bewerten.",
  path: "/einwaende/aufwand",
  template: "guide",
  eyebrow: "Einwand Aufwand",
  proof: "Kein Big-Bang, sondern kurzer Safe-Start mit klaren Verantwortlichkeiten und messbarem Nutzen.",
});

export default function ObjectionAufwandPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Aufwand"
        title="„Das klingt nach viel Einführungsaufwand.“"
        description="Der Aufwand bleibt beherrschbar, wenn die Einführung nicht als Großprojekt gestartet wird. Entscheidend ist, was wirklich einmalig geklärt werden muss und was bewusst erst später kommt."
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

      <section id="kurzfassung" className="py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

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
        concernSummary="Deshalb ist der Start auf wenige Kernschritte reduziert. Sie aktivieren zuerst nur den Teil, der direkt Zeit spart und gleichzeitig betrieblich sauber abgesichert ist."
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
