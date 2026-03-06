import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, PauseCircle, ShieldCheck } from "lucide-react";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import FinalCTA from "@/components/marketing/FinalCTA";

const timeline = [
  {
    step: "Ausgangsnachricht",
    detail: "Ein Interessent erhält eine Antwort, reagiert aber nicht.",
  },
  {
    step: "Stufe 1 (z. B. nach 24 h)",
    detail: "Freundliche Erinnerung mit klarem nächstem Schritt.",
  },
  {
    step: "Stufe 2 (z. B. nach 72 h)",
    detail: "Zweites Nachfassen, falls weiterhin keine Antwort kommt.",
  },
  {
    step: "Automatischer Stopp",
    detail: "Sobald eine Antwort eingeht oder ein Stop-Kriterium greift, endet der Ablauf.",
  },
];

const guardrails = [
  "Nur aktiv, wenn Follow-ups in den Einstellungen erlaubt sind.",
  "Nur aktiv, wenn der Interessent zuletzt nicht geantwortet hat.",
  "Bis zu zwei Stufen in der aktuellen Version.",
  "Vor jedem Follow-up laufen dieselben Qualitätschecks wie bei normalen Antworten.",
  "Bei Risiko oder Unsicherheit geht der Fall in die Freigabe statt in den Auto-Versand.",
];

const stopReasons = [
  "Interessent hat geantwortet",
  "Maximale Follow-up-Stufe erreicht",
  "Follow-ups oder Autopilot wurden pausiert",
  "Sicherheits- oder Qualitätskriterien nicht erfüllt",
];

const timelineDetails = [
  {
    title: "Direkt nach der Ausgangsantwort",
    text: "Follow-up wird nur vorgemerkt, nicht sofort gesendet.",
  },
  {
    title: "Erste Wartezeit läuft",
    text: "Nach Ablauf (z. B. 24 h) prüft Advaic, ob ein Follow-up zulässig ist.",
  },
  {
    title: "Zweite Wartezeit (optional)",
    text: "Wenn weiterhin keine Antwort vorliegt, kann Stufe 2 folgen (z. B. 72 h).",
  },
];

const operatingModel = [
  {
    title: "Auslöser",
    text: "Follow-up wird nur erzeugt, wenn auf eine vorherige Interessenten-Nachricht noch keine Antwort eingegangen ist und die Funktion aktiv ist.",
  },
  {
    title: "Qualitätsgate",
    text: "Vor jeder Stufe laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfungen.",
  },
  {
    title: "Fail-Safe",
    text: "Bei niedriger Sicherheit oder unklarem Kontext geht der Fall zur Freigabe statt in den Auto-Versand.",
  },
];

const metrics = [
  "Antwortquote nach Stufe 1",
  "Antwortquote nach Stufe 2",
  "Anteil gestoppter Follow-ups durch eingegangene Interessenten-Antwort",
  "Freigabequote bei Follow-up-Fällen",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die Bedeutung schneller und strukturierter Kontaktreaktionen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Einordnung für kontrollierte, risikobewusste Automationssteuerung.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Kontext zur operativen E-Mail-Last in Wissensarbeit.",
  },
];

export const metadata: Metadata = {
  title: "Follow-up-Logik | Advaic",
  description:
    "Kontrollierte Follow-ups mit Guardrails: Stufen, Stop-Gründe, Sicherheitschecks und manuelle Steuerung für den Makleralltag.",
  alternates: {
    canonical: "/follow-up-logik",
  },
  openGraph: {
    title: "Follow-up-Logik | Advaic",
    description:
      "Kontrollierte Follow-ups mit Guardrails: Stufen, Stop-Gründe, Sicherheitschecks und manuelle Steuerung für den Makleralltag.",
    url: "/follow-up-logik",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Follow-up-Logik | Advaic",
    description:
      "Kontrollierte Follow-ups mit Guardrails: Stufen, Stop-Gründe, Sicherheitschecks und manuelle Steuerung für den Makleralltag.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function FollowUpLogikPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Follow-up-Logik mit Guardrails",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/follow-up-logik`,
    about: ["Follow-up", "Stop-Regeln", "Qualitätschecks", "Freigabe"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Nachfass-Prozess"
        title="Follow-ups: kontrolliert planen, sicher stoppen"
        description="Follow-ups sollen nicht drängen, sondern Klarheit schaffen. Deshalb folgt der Ablauf festen Regeln und stoppt automatisch, sobald eine Antwort eingeht."
        actions={
          <>
            <Link href="/produkt#followups" className="btn-secondary">
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
              <h2 className="h3">Sales Brief: Warum Follow-ups oft falsch umgesetzt werden</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Viele Teams setzen Nachfassen als starre Erinnerungsfunktion um. Das führt zu unpassenden Nachrichten,
                unnötigem Druck und einer schlechten Interessenten-Erfahrung.
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Advaic behandelt Follow-ups als regelbasierten Prozess mit Qualitätsgates und Stop-Logik. Dadurch bleiben
                Nachfassungen hilfreich, nachvollziehbar und kontrollierbar.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Zielbild</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Nur relevante Nachfassungen</li>
                <li>Automatischer Stopp bei Antwort</li>
                <li>Freigabe bei Unsicherheit</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-section-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Ablauf in der aktuellen Version</h2>
          <p className="body mt-4 max-w-[72ch] text-[var(--muted)]">
            Follow-ups sind ein kontrollierter Prozess. Der Versand passiert nur unter klaren Bedingungen und stoppt
            zuverlässig, sobald ein Stopp-Kriterium erfüllt ist.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {timeline.map((item) => (
              <article key={item.step} className="card-base card-hover p-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">{item.step}</h3>
                <p className="helper mt-2">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {timelineDetails.map((item) => (
              <article key={item.title} className="card-base p-5">
                <Clock3 className="h-4 w-4 text-[var(--gold)]" />
                <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h3 className="h3">Guardrails vor jedem Follow-up</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {guardrails.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6">
              <h3 className="h3">Automatische Stop-Gründe</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {stopReasons.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {operatingModel.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Sicherheitsprinzip</p>
                  <p className="helper mt-1">
                    Vor jedem Follow-up greifen dieselben Qualitäts- und Risiko-Checks wie bei normalen Antworten.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <PauseCircle className="mt-0.5 h-5 w-5 text-[var(--gold)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Manuelle Kontrolle</p>
                  <p className="helper mt-1">
                    Sie können Follow-ups jederzeit pausieren, deaktivieren oder auf Freigabe umstellen.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="card-base mt-4 p-6">
            <h3 className="h3">KPI-Set für Follow-up-Steuerung</h3>
            <p className="helper mt-3">
              Messen Sie den Effekt je Stufe, bevor Sie Zeitfenster oder Frequenz erhöhen.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {metrics.map((metric) => (
                <li key={metric} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
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
