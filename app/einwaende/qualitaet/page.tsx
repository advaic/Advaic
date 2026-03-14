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
    text: "Bei fehlenden Angaben, Konfliktpotenzial oder rechtlich sensiblen Aussagen wird nicht automatisch gesendet. Die Entscheidung bleibt menschlich.",
  },
];

const implementation = [
  "Stilvorgaben konkret hinterlegen: Ton, Länge, formale Regeln.",
  "Antwortpfade für Verfügbarkeit, Unterlagen und Terminlogik definieren.",
  "QA-Warnungen in den ersten Wochen täglich prüfen und Ursachen nachziehen.",
  "Sonderfälle als feste Freigabekategorie markieren und manuell behandeln.",
];

const quickTake = [
  "Antwortqualität entsteht nicht durch schönes Wording allein, sondern durch Relevanz-, Kontext- und Risikoprüfung vor dem Versand.",
  "Fehlende Angaben oder sensible Aussagen sollten nicht geglättet, sondern gestoppt und manuell geprüft werden.",
  "Ein guter Pilot misst Qualität über Pass-Raten, Warnsignale, Korrekturzeit und Rückfragenquote.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Was falsche oder unpassende Antworten wirklich verhindert",
  ogTitle: "Einwand Qualität | Advaic",
  description:
    "Leitfaden zum Einwand Qualität: Welche Prüfungen eine Antwort vor dem Versand bestehen muss und wie Makler Qualität im Pilotbetrieb belastbar messen.",
  path: "/einwaende/qualitaet",
  template: "trust",
  eyebrow: "Einwand Qualität",
  proof: "Relevanz, Kontext, Vollständigkeit, Stil und Risiko vor jedem Versand kontrollieren.",
});

export default function ObjectionQualitaetPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Qualität"
        title="„Was verhindert falsche oder unpassende Antworten?“"
        description="Dieser Punkt ist zentral. Gute Qualität entsteht dann, wenn fachliche Richtigkeit, Vollständigkeit und Risikogrenzen vor dem Versand geprüft werden, nicht erst danach."
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
        primaryHref="/signup?entry=objection-qualitaet-stage"
        primaryLabel="Mit QA-First testen"
        secondaryHref="/produkt#qualitaet"
        secondaryLabel="Qualitätslogik im Produkt"
        context="einwand-qualitaet"
      />

      <ObjectionArticle
        context="qualitaet"
        concern="„Wir können uns keinen Qualitätsverlust leisten, nur um schneller zu sein.“"
        concernSummary="Deshalb wird Geschwindigkeit nie ohne Qualitätsgrenze freigeschaltet. Jede Antwort durchläuft Prüfungen, und Nachrichten mit fehlenden Angaben oder Risikosignalen werden gestoppt."
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
