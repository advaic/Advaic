import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const highlights = [
  {
    title: "Wann Auto erlaubt ist",
    text: "Automatischer Versand ist nur vertretbar, wenn Objektbezug, Pflichtangaben, Empfänger und Antwortzweck sauber prüfbar sind.",
  },
  {
    title: "Wann Freigabe Pflicht ist",
    text: "Fehlende Angaben, Beschwerden, Ausnahmen, rechtlich sensible Aussagen oder nicht verifizierbare Absender müssen manuell geprüft werden.",
  },
  {
    title: "Was dokumentiert sein muss",
    text: "Ein belastbarer Verlauf zeigt Eingang, Entscheidung, blockierende Checks, Versandstatus und jeden manuellen Eingriff.",
  },
];

const summary = [
  "Sichere Anfrage-Automatisierung beantwortet nur Nachrichten mit klarem Objektbezug, vorhandenen Pflichtangaben und bestandenen Qualitätschecks.",
  "Sobald Informationen fehlen, ein Konflikt vorliegt oder der Absender nicht sauber prüfbar ist, gehört die Nachricht in die Freigabe.",
  "Für den Betrieb wichtig sind klare Verantwortlichkeiten, exportierbare Nachweise und eine nachvollziehbare Entscheidungslogik pro Nachricht.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#pruefpfad", label: "Vier Prüfstationen" },
  { href: "#auto-grenzen", label: "Auto vs. Freigabe" },
  { href: "#nachweise", label: "Nachweisquellen" },
];

const reviewSequence = [
  {
    step: "01",
    title: "Nachricht einordnen",
    verify: "Ist es eine echte Interessenten-Anfrage oder nur Systemrauschen?",
    evidence: "Relevanzlogik, Objektbezug und Empfängerprüfung müssen sichtbar beschrieben sein.",
  },
  {
    step: "02",
    title: "Auto-Grenzen prüfen",
    verify: "Welche Voraussetzungen müssen erfüllt sein, bevor Auto-Versand überhaupt erlaubt ist?",
    evidence: "Pflichtangaben, Qualitätschecks und Versandpfad müssen als klare Bedingungen benannt sein.",
  },
  {
    step: "03",
    title: "Stopp-Gründe prüfen",
    verify: "Wann stoppt das System bewusst und schiebt in die Freigabe?",
    evidence: "Fehlende Informationen, Konfliktpotenzial, sensible Inhalte und unsaubere Rückkanäle müssen als Stop-Regeln sichtbar sein.",
  },
  {
    step: "04",
    title: "Nachweise prüfen",
    verify: "Wo bleiben Verlauf, Dokumentation und Unterlagen pro Nachricht greifbar?",
    evidence: "Zeitstempel, Freigabegründe, Datenschutzunterlagen und Exportpfade müssen öffentlich auffindbar oder im Test konkret nachprüfbar sein.",
  },
];

const autoAllowed = [
  "Echte Interessenten-Anfrage mit eindeutigem Objekt- oder Angebotsbezug",
  "Die nötigen Angaben für eine sachlich richtige Antwort liegen vor",
  "Empfänger, Antwortzweck und Versandkanal sind sauber zuordenbar",
  "Relevanz-, Qualitäts- und Risikoprüfungen werden bestanden",
];

const manualRequired = [
  "Objektbezug oder Absender lassen sich nicht eindeutig prüfen",
  "Wichtige Informationen fehlen und die Antwort müsste spekulieren",
  "Beschwerden, Konflikte, Fristen oder rechtlich sensible Aussagen sind betroffen",
  "Das Team möchte Preis-, Verhandlungs- oder Ausnahmesituationen bewusst selbst führen",
];

const vendorChecklist = [
  "Lassen sich Auto-, Freigabe- und Ignore-Regeln verständlich erklären?",
  "Ist pro Nachricht sichtbar, warum gesendet, gestoppt oder weitergeleitet wurde?",
  "Können Sie mit konservativen Grenzen und hoher Freigabequote starten?",
  "Sind Rollen, Datenschutzfragen und Exportmöglichkeiten sauber dokumentiert?",
];

const evidenceSources = [
  {
    title: "Regelwerk prüfen",
    text: "Hier prüfen Sie, welche Entscheidungsregeln öffentlich beschrieben werden und wo Auto bewusst stoppt.",
    href: "/autopilot-regeln",
    label: "Regeln öffnen",
  },
  {
    title: "Versandchecks prüfen",
    text: "Hier sehen Sie, welche Qualitätschecks vor dem Versand beschrieben und begrenzt werden.",
    href: "/qualitaetschecks",
    label: "Checks öffnen",
  },
  {
    title: "Freigabepfad prüfen",
    text: "Hier prüfen Sie, wie unvollständige, konfliktbehaftete oder sensible Fälle manuell entschieden werden.",
    href: "/freigabe-inbox",
    label: "Freigabe öffnen",
  },
  {
    title: "Rollen & Daten prüfen",
    text: "Hier verifizieren Sie Verantwortlichkeiten, Speicherfristen und Dokumentpflichten.",
    href: "/datenschutz",
    label: "Datenschutz öffnen",
  },
];

const safetyDetails = [
  {
    title: "Entscheidungsregeln",
    text: "Wann Auto, wann Freigabe und wann Ignorieren greift.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätskontrollen",
    text: "Welche Prüfungen vor einem automatischen Versand laufen.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabeprozess",
    text: "Wie Nachrichten mit fehlenden Angaben, Konflikten oder Ausnahmen manuell und nachvollziehbar entschieden werden.",
    href: "/freigabe-inbox",
  },
];

const sources = [
  {
    label: "EUR-Lex – DSGVO Volltext (EU 2016/679)",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "Primärquelle für datenschutzrechtliche Anforderungen.",
  },
  {
    label: "BfDI – Informationen zur DSGVO",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
    note: "Nationale Orientierung für die DSGVO-Anwendung in Deutschland.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Rahmen für organisatorische und technische Schutzmaßnahmen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Einordnung für kontrollierte KI-Entscheidungen mit Fail-Safe-Prinzipien.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Sichere Anfrage-Automatisierung für Makler",
  ogTitle: "Sichere Anfrage-Automatisierung | Advaic",
  description:
    "Woran Makler sichere Anfrage-Automatisierung erkennen: klare Auto-Grenzen, Pflicht-Freigabe bei fehlenden Angaben oder sensiblen Inhalten und lückenlose Dokumentation.",
  path: "/sicherheit",
  template: "trust",
  eyebrow: "Leitfaden Sicherheit",
  proof: "Auto nur mit Objektbezug, Pflichtangaben, Qualitätschecks und sauberer Dokumentation.",
});

export default function SicherheitPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Sicherheitslogik von Advaic",
    inLanguage: "de-DE",
    about: ["Sicherheit", "DSGVO", "Freigabe", "Qualitätschecks", "Verlauf"],
    mainEntityOfPage: `${siteUrl}/sicherheit`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Sicherheit", path: "/sicherheit" },
      ]}
      schema={schema}
      kicker="Leitfaden Sicherheit"
      title="So prüfen Makler sichere Anfrage-Automatisierung"
      description="Bevor Sie ein Tool testen, sollten Sie drei Fragen sauber beantworten: Wann darf automatisch geantwortet werden? Welche Nachrichten müssen zwingend manuell bleiben? Und wie wird jeder Schritt dokumentiert?"
      actions={
        <>
          <Link href="/trust" className="btn-secondary">
            Trust-Hub öffnen
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4" data-tour="security-mobile-quickbar">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Springen Sie direkt in den Prüfpfad oder zu den Nachweisquellen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#pruefpfad" className="btn-secondary w-full justify-center">
              Prüfpfad öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#nachweise" className="btn-secondary w-full justify-center">
              Nachweise
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="sicherheit"
      primaryHref="/signup"
      primaryLabel="Sicher testen"
      secondaryHref="/trust"
      secondaryLabel="Trust-Hub"
      sources={sources}
      sourcesDescription="Diese Seite erklärt den fachlichen und technischen Sicherheitsrahmen. Für rechtliche Bewertung im Einzelfall ist weiterhin eigene Prüfung erforderlich."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6">
              <h2 className="h3">Kurzfassung in 60 Sekunden</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {summary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#sicherheit-details" className="btn-secondary">
                  Technische Details
                </a>
                <a href="#nachweise" className="btn-secondary">
                  Nachweise
                </a>
              </div>
            </article>

            <article className="card-base p-6" data-tour="security-page-role">
              <p className="label">Rolle dieser Seite</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">Hier prüfen Sie Auto-Grenzen und Stopp-Regeln</h3>
              <p className="helper mt-3">
                Diese Seite ist der tiefe fachliche Prüfpfad. Für Routing und Überblick nutzen Sie den Trust-Hub, für formale Rollen und Speicherfristen das Datenschutzdokument.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/trust" className="btn-secondary w-full justify-center">
                  Trust-Hub
                </Link>
                <Link href="/datenschutz" className="btn-secondary w-full justify-center">
                  Datenschutz
                </Link>
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <article className="card-base hidden p-6 md:block" data-tour="security-page-toc">
              <p className="label">Prüf-Navigation</p>
              <nav className="mt-4 grid gap-2">
                {contents.map((item, index) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] ring-1 ring-[var(--border)] transition hover:bg-white"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--gold-strong)] ring-1 ring-[var(--border)]">
                      {index + 1}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </article>

            <article className="card-base p-6" data-tour="security-page-audit-scope">
              <p className="label">Worum es auf dieser Seite geht</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                    <p className="helper mt-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section id="sicherheit-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <p className="section-kicker">Prüfpfad</p>
            <h2 className="h2 mt-2">Sicherheitsprüfung in vier Schritten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Seite sollte Ihnen keine bloßen Sicherheitsbehauptungen liefern. Sie sollte Ihnen zeigen, wie Sie
              einen Anfrage-Autopiloten in vier Schritten fachlich und operativ prüfen.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
              <article className="card-base p-5" data-tour="security-sidebar-toc">
                <p className="label">Auf dieser Seite</p>
                <nav className="mt-4 grid gap-2">
                  {contents.map((item, index) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] ring-1 ring-[var(--border)] transition hover:bg-white"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--gold-strong)] ring-1 ring-[var(--border)]">
                        {index + 1}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </nav>
              </article>

              <article className="card-base p-5" data-tour="security-sidebar-evidence">
                <p className="label">Schnelle Nachweise</p>
                <div className="mt-4 grid gap-2">
                  {evidenceSources.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] ring-1 ring-[var(--border)] transition hover:bg-white"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </article>
            </aside>

            <div className="space-y-8">
              <article
                id="pruefpfad"
                className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7"
                data-tour="security-review-sequence"
              >
                <p className="label">Vier Prüfstationen</p>
                <div className="mt-5 space-y-4">
                  {reviewSequence.map((item, index) => (
                    <article
                      key={item.step}
                      className="grid gap-4 rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)] md:grid-cols-[52px_minmax(0,1fr)]"
                    >
                      <div className="flex items-start justify-start md:justify-center">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--gold-strong)] ring-1 ring-[var(--gold-soft)]">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[var(--text)]">{item.title}</h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--border)]">
                            Schritt {item.step}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-medium leading-6 text-[var(--text)]">{item.verify}</p>
                        <p className="helper mt-3">{item.evidence}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <div id="auto-grenzen" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <article className="card-base p-6 md:p-8" data-tour="security-auto-manual">
                  <h2 className="h3">Auto nur wenn diese Kriterien erfüllt sind</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                    {autoAllowed.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 h-px bg-[var(--border)]" />

                  <h2 className="h3 mt-8">Manuelle Freigabe ist Pflicht, wenn …</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                    {manualRequired.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="card-base p-6" data-tour="security-vendor-checklist">
                  <p className="label">Due-Diligence-Check</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">Woran Sie einen sicheren Anbieter erkennen</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                    {vendorChecklist.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 grid gap-2">
                    <Link href="/autopilot" className="btn-secondary w-full justify-center">
                      Autopilot-Logik ansehen
                    </Link>
                    <Link href="/freigabe-inbox" className="btn-secondary w-full justify-center">
                      Freigabeprozess ansehen
                    </Link>
                  </div>
                </article>
              </div>

              <article
                id="nachweise"
                className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7"
                data-tour="security-evidence-sources"
              >
                <p className="label">Nachweisquellen</p>
                <h2 className="h3 mt-2">Daran prüfen Sie, ob die Versprechen belastbar sind</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {evidenceSources.map((item) => (
                    <article key={item.title} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                      <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                      <p className="helper mt-3">{item.text}</p>
                      <Link href={item.href} className="btn-secondary mt-4">
                        {item.label}
                      </Link>
                    </article>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3" data-tour="security-detail-links">
                  {safetyDetails.map((item) => (
                    <article key={item.title} className="rounded-2xl bg-white p-5 ring-1 ring-[var(--border)]">
                      <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                      <p className="helper mt-2">{item.text}</p>
                      <Link href={item.href} className="btn-secondary mt-4">
                        Details ansehen
                      </Link>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
