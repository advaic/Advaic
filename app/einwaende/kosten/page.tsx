import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import ObjectionArticle from "@/components/marketing/ObjectionArticle";

const mechanics = [
  {
    title: "Kosten gegen Zeitgewinn rechnen",
    text: "Die zentrale Frage ist nicht der Tarif allein, sondern wie viele manuelle Minuten pro Anfrage eingespart werden und wie stabil die Erstreaktion bleibt.",
  },
  {
    title: "Konservatives ROI-Modell statt Idealbild",
    text: "Advaic rechnet mit Sicherheitsabschlägen, weil Freigaben und Sonderfälle bewusst erhalten bleiben. Dadurch wird der erwartete Nutzen realistischer.",
  },
  {
    title: "Fehlerkosten berücksichtigen",
    text: "Neben Zeitkosten zählen auch Kosten durch verspätete Antworten, Nachbearbeitung und inkonsistente Kommunikation im Team.",
  },
  {
    title: "Go/No-Go über Pilot-KPI",
    text: "Nach der Testphase sollte die Entscheidung datenbasiert fallen: Zeitgewinn, Qualitätsstabilität, Freigabequote und Rücklaufentwicklung.",
  },
];

const implementation = [
  "Vor Start Basiswerte erfassen: Minuten pro Anfrage, Erstreaktion, Freigabeaufwand.",
  "Nach 14 Tagen dieselben Werte vergleichen und Abweichungen begründen.",
  "Nur stabile Verbesserungen als Go-Kriterium akzeptieren.",
  "Bei gemischtem Ergebnis zuerst Regeln/Qualität nachschärfen statt blind ausbauen.",
];

const kpis = [
  "Gesparte Stunden pro Monat (konservativ)",
  "Verbesserung der Median-Erstreaktion",
  "Antwortquote im Zielzeitfenster (z. B. 60 Minuten)",
  "Freigabe-zu-Versand-Rate bei Sonderfällen",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Reaktionszeit als wirtschaftlicher Hebel im Interessenten-Prozess.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Produktivitätsbeitrag besserer Kommunikationsprozesse.",
  },
  {
    label: "NAR Research – Market/Consumer Reports",
    href: "https://www.nar.realtor/research-and-statistics",
    note: "Marktbezogene Orientierung zu digital geprägten Immobilienprozessen.",
  },
];

export const metadata: Metadata = {
  title: "Einwand Kosten | Advaic",
  description:
    "Wie sich Advaic wirtschaftlich bewerten lässt: konservative ROI-Rechnung mit Zeitgewinn, Reaktionsgeschwindigkeit und Qualitätsstabilität.",
  alternates: {
    canonical: "/einwaende/kosten",
  },
  openGraph: {
    title: "Einwand Kosten | Advaic",
    description:
      "Wie sich Advaic wirtschaftlich bewerten lässt: konservative ROI-Rechnung mit Zeitgewinn, Reaktionsgeschwindigkeit und Qualitätsstabilität.",
    url: "/einwaende/kosten",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Einwand Kosten | Advaic",
    description:
      "Wie sich Advaic wirtschaftlich bewerten lässt: konservative ROI-Rechnung mit Zeitgewinn, Reaktionsgeschwindigkeit und Qualitätsstabilität.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function ObjectionKostenPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Einwand: Kosten"
        title="„Lohnt sich das wirtschaftlich wirklich?“"
        description="Die richtige Antwort liefert kein Bauchgefühl, sondern ein sauberer Vorher-nachher-Vergleich mit konservativen Annahmen. Genau dafür sind ROI-Rechner und Pilot-KPI da."
        actions={
          <>
            <Link href="/roi-rechner" className="btn-secondary">
              ROI-Rechner öffnen
            </Link>
            <Link href="/signup?entry=objection-kosten" className="btn-primary">
              Mit Pilot-KPI testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="entscheidung"
        primaryHref="/signup?entry=objection-kosten-stage"
        primaryLabel="14 Tage mit KPI testen"
        secondaryHref="/preise"
        secondaryLabel="Preislogik ansehen"
        context="einwand-kosten"
      />

      <ObjectionArticle
        context="kosten"
        concern="„Wenn wir zahlen, muss das messbar besser sein als unser heutiger Ablauf.“"
        concernSummary="Genau dafür ist der Betrieb auf messbare KPI ausgelegt: Zeitgewinn, Reaktionsgeschwindigkeit, Qualität und Transparenz statt reiner Versandmenge."
        mechanicsTitle="So bewerten Sie die Wirtschaftlichkeit sauber"
        mechanics={mechanics}
        implementation={implementation}
        kpis={kpis}
        relatedLinks={[
          { label: "ROI-Rechner", href: "/roi-rechner" },
          { label: "Preise", href: "/preise" },
          { label: "Prozessvergleich", href: "/manuell-vs-advaic" },
        ]}
        sources={sources}
      />

      <FinalCTA />
    </PageShell>
  );
}
