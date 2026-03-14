import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import FAQDecisionTree from "@/components/marketing/FAQDecisionTree";
import MarketingFAQ from "@/components/marketing/FAQ";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const deepDiveLinks = [
  {
    title: "Autopilot-Regeln",
    text: "Wenn Sie genau sehen wollen, wann Auto, Freigabe oder Ignorieren greift.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks",
    text: "Wenn Sie die sechs Prüfungen vor dem automatischen Versand einzeln bewerten möchten.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox",
    text: "Wenn Sie den manuellen Prüfpfad für fehlende Angaben, Konflikte und Ausnahmen sehen wollen.",
    href: "/freigabe-inbox",
  },
  {
    title: "Sicherheit & Datenschutz",
    text: "Wenn Sie rechtliche, technische und organisatorische Nachweise gemeinsam prüfen möchten.",
    href: "/sicherheit",
  },
];

const externalSources = [
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Rechtliche Grundstruktur für datenschutzkonformen Betrieb.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für Risikokontrolle in KI-gestützten Prozessen.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Reaktionszeit im Interessenten-Prozess entscheidend ist.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "FAQ",
  ogTitle: "FAQ | Advaic",
  description:
    "Antworten zu Auto-Versand, Freigabe bei fehlenden Angaben oder Konflikten, Qualitätschecks, Follow-ups, Sicherheit und Testphase von Advaic.",
  path: "/faq",
  template: "guide",
  eyebrow: "FAQ",
  proof: "Die wichtigsten Fragen zu Autopilot, Freigabe, Qualität und Sicherheit auf einen Blick.",
});

export default function FAQPage() {
  const siteUrl = getSiteUrl();
  const faqSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "FAQ zu Advaic",
        inLanguage: "de-DE",
        about: ["Autopilot", "Freigabe", "Qualitätschecks", "Sicherheit", "Follow-up"],
        mainEntityOfPage: `${siteUrl}/faq`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Sendet Advaic automatisch?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, aber nur bei Nachrichten mit sauberem Objektbezug, passendem Empfänger, vollständigen Kerndaten und bestandenen Qualitätschecks. Fälle mit fehlenden Angaben, Konfliktpotenzial oder Risikoindikatoren gehen zur Freigabe.",
            },
          },
          {
            "@type": "Question",
            name: "Was stoppt falsche Antworten vor dem Versand?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Vor jedem Auto-Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitschecks.",
            },
          },
          {
            "@type": "Question",
            name: "Welche Nachrichten gehören bewusst in die Freigabe?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Beschwerden, fehlende Kerndaten, unklarer Objektbezug, Konfliktpotenzial, sensible Inhalte oder unsaubere Rückkanäle gehören nicht in den Auto-Versand und bleiben sichtbar bei Ihnen.",
            },
          },
          {
            "@type": "Question",
            name: "Kann ich den Autopilot jederzeit pausieren?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, der Autopilot kann jederzeit pausiert werden.",
            },
          },
          {
            "@type": "Question",
            name: "Wie transparent ist jede Entscheidung pro Nachricht?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sie sehen den Verlauf pro Nachricht mit Eingang, Entscheidung, blockierenden Gründen, Freigabe und Versandstatus inklusive Zeitstempeln.",
            },
          },
          {
            "@type": "Question",
            name: "Wie starte ich ohne Kontrollverlust?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Mit Safe-Start: erst hoher Freigabeanteil, dann Regeln und Ton im Alltag prüfen, erst danach den Auto-Korridor schrittweise erweitern.",
            },
          },
          {
            "@type": "Question",
            name: "Antwortet Advaic auf Newsletter oder Systemmails?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Nicht automatisch. Newsletter, Systemmails und Spam werden gefiltert. Technische no-reply Absender ohne nutzbaren Rückkanal werden je nach Fall ignoriert oder zur Prüfung markiert.",
            },
          },
          {
            "@type": "Question",
            name: "Was passiert nach den 14 Testtagen?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Nach der Testphase läuft Starter für 199 € pro 4 Wochen weiter. Sie können jederzeit kündigen und den Autopilot zusätzlich pausieren.",
            },
          },
          {
            "@type": "Question",
            name: "Wie prüfe ich Datenschutz und Dokumentation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sie können Sicherheitsseite, Datenschutz, Unterauftragsverarbeiter und Freigabe-Workflow öffentlich prüfen. Weitere Unterlagen erhalten Sie im Onboarding.",
            },
          },
        ],
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]}
      schema={faqSchema}
      kicker="FAQ"
      title="Häufige Fragen zu Advaic"
      description="Hier finden Sie die wichtigsten Antworten zu Auto-Versand, Freigabe, Qualitätschecks, Follow-ups, Steuerung und Testphase."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produktdetails
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4" data-tour="faq-mobile-quickbar">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Öffnen Sie direkt die Kernantworten oder gehen Sie in den Produktablauf.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#faq-answers" className="btn-secondary w-full justify-center">
              Top-8-Antworten
            </MarketingJumpLink>
            <Link href="/produkt" className="btn-secondary w-full justify-center">
              Produktablauf
            </Link>
          </div>
        </article>
      }
      stage="orientierung"
      stageContext="faq"
      primaryHref="/produkt"
      primaryLabel="Produktablauf ansehen"
      secondaryHref="/einwaende"
      secondaryLabel="Einwände prüfen"
      withStageCta={false}
      sources={externalSources}
      sourcesDescription="Die Quellen unterstützen die Einordnung von Datenschutz, Risiko-Governance und Reaktionsgeschwindigkeit."
    >
      <div id="faq-answers">
      <MarketingFAQ
        showDetailButton={false}
        introEyebrow="Antworten zuerst"
        introTitle="Die 8 Fragen, die vor einem Test wirklich geklärt sein müssen"
        introBody="Wenn Sie nur eine Seite lesen, dann diese Antworten. Erst danach lohnt sich der Blick in Regeln, Freigabe oder Datenschutz."
        showCoverageCard={false}
      />
      </div>

      <div className="hidden md:block">
        <FAQDecisionTree />
      </div>

      <section className="py-4 md:hidden">
        <Container>
          <article className="card-base p-4" data-tour="faq-mobile-followup">
            <p className="label">Wenn noch etwas offen ist</p>
            <div className="mt-3 grid gap-2">
              <Link href="/einwaende" className="btn-secondary w-full justify-center">
                Einwände prüfen
              </Link>
              <Link href="/sicherheit" className="btn-secondary w-full justify-center">
                Sicherheit prüfen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-14 md:py-16">
        <Container>
          <article className="card-base p-5 md:p-6" data-tour="marketing-faq-deepdives">
            <h2 className="h3">Die vier wichtigsten Detailseiten</h2>
            <p className="helper mt-3">
              Falls Sie nach dem Entscheidungsbaum noch tiefer prüfen wollen, reichen diese vier Seiten für die meisten Rückfragen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {deepDiveLinks.map((item) => (
                <Link key={item.title} href={item.href} className="btn-secondary">
                  {item.title}
                </Link>
              ))}
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
