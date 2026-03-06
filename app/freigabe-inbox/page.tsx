import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck, PenLine, ShieldCheck, XCircle } from "lucide-react";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FinalCTA from "@/components/marketing/FinalCTA";

const flow = [
  {
    step: "1. Eingang",
    detail: "Ein Fall wird als unklar, heikel oder unvollständig erkannt.",
  },
  {
    step: "2. Sichtung",
    detail: "Sie sehen offene Fälle mit Gründen und können nach Risiko oder Zeitpunkt sortieren.",
  },
  {
    step: "3. Entscheidung",
    detail: "Sie können freigeben & senden, bearbeiten oder ablehnen.",
  },
  {
    step: "4. Dokumentation",
    detail: "Die Entscheidung wird mit Status und Zeitstempel im Verlauf festgehalten.",
  },
];

const actions = [
  {
    title: "Freigeben & senden",
    text: "Wenn Entwurf und Kontext passen, wird direkt über Ihr Postfach versendet.",
    Icon: CheckCheck,
  },
  {
    title: "Bearbeiten",
    text: "Sie passen Ton, Inhalt oder nächste Schritte an und senden dann bewusst selbst.",
    Icon: PenLine,
  },
  {
    title: "Ablehnen",
    text: "Wenn kein Versand erfolgen soll, wird der Fall ohne automatische Antwort beendet.",
    Icon: XCircle,
  },
];

const triageRules = [
  {
    title: "Priorität Hoch",
    text: "Konflikte, Beschwerden, unklarer Empfänger oder rechtlich sensible Aussagen.",
  },
  {
    title: "Priorität Mittel",
    text: "Fehlende Pflichtinfos bei grundsätzlich klarem Objektbezug.",
  },
  {
    title: "Priorität Niedrig",
    text: "Leichte Kontextlücken ohne direktes Risiko.",
  },
];

const governance = [
  "Freigabeentscheidungen mit Grundcode dokumentieren",
  "Tägliche Sichtung nach Priorität statt nach Eingangszeit",
  "Wöchentliche Auswertung der häufigsten Freigabegründe",
  "Regelupdate nur auf Basis wiederkehrender Muster",
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Referenz für kontrollierte Mensch-im-Prozess-Entscheidungen bei risikobehafteten Fällen.",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Einordnung für dokumentierte und nachvollziehbare Entscheidungsprozesse.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Allgemeine Orientierung für robustes Prozess- und Risikomanagement.",
  },
];

export const metadata: Metadata = {
  title: "Freigabe-Inbox | Advaic",
  description:
    "So funktioniert die Freigabe-Inbox: unklare Fälle sichten, Entwürfe bearbeiten, manuell freigeben oder ablehnen und alles nachvollziehbar dokumentieren.",
  alternates: {
    canonical: "/freigabe-inbox",
  },
  openGraph: {
    title: "Freigabe-Inbox | Advaic",
    description:
      "So funktioniert die Freigabe-Inbox: unklare Fälle sichten, Entwürfe bearbeiten, manuell freigeben oder ablehnen und alles nachvollziehbar dokumentieren.",
    url: "/freigabe-inbox",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Freigabe-Inbox | Advaic",
    description:
      "So funktioniert die Freigabe-Inbox: unklare Fälle sichten, Entwürfe bearbeiten, manuell freigeben oder ablehnen und alles nachvollziehbar dokumentieren.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function FreigabeInboxPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Freigabe-Inbox in der Praxis",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/freigabe-inbox`,
    about: ["Freigabe", "Sonderfälle", "manuelle Entscheidung", "Verlauf"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Manuelle Kontrolle"
        title="So funktioniert die Freigabe-Inbox in der Praxis"
        description="Die Freigabe-Inbox ist Ihr Sicherheitsnetz für alle Fälle, die bewusst nicht automatisch versendet werden sollen."
        actions={
          <>
            <Link href="/produkt#freigabe" className="btn-secondary">
              Zur Produktsektion
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Warum die Freigabe-Inbox kein Bremsklotz ist</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Ohne strukturiertes Freigabesystem wird Sonderfallarbeit chaotisch: kritische Fälle bleiben liegen,
                harmlose Fälle blockieren Aufmerksamkeit und Entscheidungen sind später kaum nachvollziehbar.
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Die Freigabe-Inbox ist daher ein bewusstes Kontrollmodul: klare Priorisierung, klare Entscheidungspfade
                und klare Dokumentation.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Ziel im Betrieb</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Risikofälle früh erkennen</li>
                <li>Entscheidungen beschleunigen</li>
                <li>Verlauf auditierbar halten</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="h2">Ablauf in vier Schritten</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Jeder Freigabe-Fall folgt einem klaren Ablauf: erkennen, prüfen, entscheiden, dokumentieren.
              </p>
              <div className="mt-6 space-y-3">
                {flow.map((item, index) => (
                  <article key={item.step} className="card-base card-hover p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{item.step}</p>
                        <p className="helper mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-4 md:grid-cols-3">
                {actions.map((action) => (
                  <article key={action.title} className="card-base card-hover relative overflow-hidden p-6">
                    <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                    <action.Icon className="h-5 w-5 text-[var(--gold)]" />
                    <h3 className="h3 mt-3">{action.title}</h3>
                    <p className="helper mt-3">{action.text}</p>
                  </article>
                ))}
              </div>

              <article className="card-base mt-4 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--gold)]" />
                  <div>
                    <h3 className="h3">Wann landet etwas in der Freigabe?</h3>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                      <li>Unklarer Objektbezug oder fehlende Pflichtinformationen</li>
                      <li>Beschwerden, Konflikte oder sonstige heikle Sonderfälle</li>
                      <li>Niedrige Sicherheit im Qualitäts- oder Risiko-Check</li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <article className="card-base mt-4 p-6">
            <h3 className="h3">Priorisierung in der Freigabe</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {triageRules.map((rule) => (
                <article key={rule.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">{rule.title}</p>
                  <p className="helper mt-2">{rule.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card-base mt-4 p-6">
            <h3 className="h3">Governance-Regeln für ein stabiles Freigabesystem</h3>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {governance.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-8 p-6">
            <h3 className="h3">Warum das wichtig ist</h3>
            <p className="body mt-3 text-[var(--muted)]">
              Die Freigabe-Inbox reduziert Risiko ohne die Geschwindigkeit im Standardfall zu verlieren. Klare Fälle
              laufen automatisch, sensible Fälle bleiben in Ihrer Hand.
            </p>
          </article>

          <article className="card-base mt-4 p-6">
            <h3 className="h3">Quellen & Einordnung</h3>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <article key={source.href} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--text)] underline underline-offset-4"
                  >
                    {source.label}
                  </a>
                  <p className="helper mt-2">{source.note}</p>
                </article>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
