import Link from "next/link";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import LegalDocumentLayout, {
  type LegalJumpLink,
  type LegalSummaryItem,
} from "@/components/marketing/LegalDocumentLayout";

type ProviderRow = {
  provider: string;
  purpose: string;
  categories: string;
  region: string;
  safeguards: string;
};

const providers: ProviderRow[] = [
  {
    provider: "Supabase",
    purpose: "Hosting, Datenbank, Authentifizierung und Storage",
    categories: "Kontodaten, Konfigurationen, Nachrichtenmetadaten, Dateien",
    region: "Für Advaic wird ein rein europäisches Projekt-Setup gewählt.",
    safeguards: "AVV; europäische Serverregion bewusst gewählt, um den DSGVO-Betrieb ohne unnötigen Drittlandpfad aufzusetzen.",
  },
  {
    provider: "Microsoft (Outlook/Graph)",
    purpose: "Anbindung und Versand über verknüpfte Outlook-Postfächer",
    categories: "E-Mail-Inhalte, Header, Zeitstempel, Thread-Metadaten",
    region: "Advaic nutzt einen europäischen Tenant-/Serverpfad; bei kundenseitig angebundenen Microsoft-Postfächern bleibt die jeweilige Tenant-Region zusätzlich relevant.",
    safeguards: "Vertragsrahmen; europäische Konfiguration wird bevorzugt, bei abweichendem Kundentenant sind zusätzliche Transferprüfungen möglich.",
  },
  {
    provider: "Google (Gmail API)",
    purpose: "Anbindung und Versand über verknüpfte Gmail-Postfächer",
    categories: "E-Mail-Inhalte, Header, Zeitstempel, Thread-Metadaten",
    region: "Advaic setzt auf einen europäischen Betriebsrahmen; bei kundenseitig angebundenen Google-Workspaces hängt die tatsächliche Region zusätzlich vom Workspace-Setup ab.",
    safeguards: "Vertragsrahmen; europäische Konfiguration wird bevorzugt, bei abweichendem Workspace sind zusätzliche Transferprüfungen möglich.",
  },
  {
    provider: "OpenAI über Azure OpenAI",
    purpose: "Klassifizierung, Entwurfslogik, Qualitätsprüfungen",
    categories: "Nachrichtenkontext und Textauszüge gemäß Prompt-Design",
    region: "Für Advaic wird eine europäische Azure-Region gewählt.",
    safeguards: "Vertragsrahmen; europäische Azure-Region bewusst gewählt, damit kein unnötiger außereuropäischer Hostingpfad entsteht.",
  },
  {
    provider: "Stripe",
    purpose: "Abo- und Zahlungsabwicklung",
    categories: "Kundendaten, Aboreferenzen, Zahlungsstatus",
    region: "Für Advaic wird ein europäischer Abrechnungsrahmen bevorzugt; Stripe bleibt als globaler Zahlungsanbieter dennoch ein potenzieller Transferfall.",
    safeguards: "DPA/Vertragsrahmen; europäische Konfiguration wo steuerbar, bei globalem Zahlungsnetz zusätzlich Transferprüfung und Vertragsgarantien.",
  },
  {
    provider: "Slack (optional)",
    purpose: "Benachrichtigungen und Support-Eskalationen",
    categories: "Ereignisdaten, Metadaten, ggf. kurze Inhaltsauszüge",
    region: "Wenn Slack genutzt wird, wird ein europäischer Workspace bevorzugt; der Dienst bleibt technisch ein globaler Anbieter.",
    safeguards: "Vertragsrahmen; europäische Workspace-Wahl wo möglich, ansonsten gesonderte Transferprüfung.",
  },
];

const PROVIDER_SUMMARY: LegalSummaryItem[] = [
  {
    title: "Offenlegung",
    body: "Die operative Anbieterübersicht ist öffentlich dokumentiert und steht direkt auf dieser Seite statt nur in Verkaufsunterlagen oder Einzelanfragen.",
  },
  {
    title: "Transferlogik",
    body: "Advaic wählt für steuerbare Dienste bewusst europäische Serverregionen. Bei kundenseitigen Tenants, Workspaces oder globalen Zahlungsdiensten bleibt die konkrete Transferlage zusätzlich zu prüfen.",
  },
  {
    title: "Prüfziel",
    body: "Entscheidend sind die konkreten Datenkategorien, Regionen und Schutzmaßnahmen je Anbieter.",
  },
];

const PROVIDER_JUMP_LINKS: LegalJumpLink[] = [
  { id: "stand", label: "Aktueller Stand" },
  { id: "anbieter", label: "Anbieterübersicht" },
  { id: "hinweis", label: "Prüfhinweis" },
];

export const metadata = buildMarketingMetadata({
  title: "Unterauftragsverarbeiter | Advaic",
  ogTitle: "Unterauftragsverarbeiter | Advaic",
  description:
    "Öffentliches Verzeichnis der Unterauftragsverarbeiter von Advaic mit Zweck, Datenkategorien und Transferhinweisen.",
  path: "/unterauftragsverarbeiter",
  template: "trust",
  eyebrow: "Datenschutz",
  proof: "Anbieter, Zwecke, Datenkategorien und Transferhinweise öffentlich dokumentiert.",
});

export default function UnterauftragsverarbeiterPage() {
  return (
    <PageShell withProofLayer={false}>
      <PageIntro
        kicker="Datenschutz"
        title="Unterauftragsverarbeiter"
        description="Hier finden Sie die aktuelle Übersicht der eingesetzten Anbieter, deren Zweck und die grundsätzliche Transferlogik."
        actions={
          <>
            <Link href="/datenschutz" className="btn-secondary">
              Zu den Datenschutzhinweisen
            </Link>
            <Link href="/sicherheit" className="btn-primary">
              Sicherheitsseite
            </Link>
          </>
        }
      />

      <LegalDocumentLayout
        currentPath="/unterauftragsverarbeiter"
        summaryTitle="Kurzüberblick"
        summaryItems={PROVIDER_SUMMARY}
        jumpLinks={PROVIDER_JUMP_LINKS}
        asideExtras={
          <article className="card-base p-5">
            <p className="section-kicker">Prüfpfad</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li>1. Anbieter identifizieren</li>
              <li>2. Datenkategorien und Region prüfen</li>
              <li>3. Transferbasis und AVV mit Ihrer Rechtsberatung bewerten</li>
            </ul>
          </article>
        }
      >
        <article id="stand" className="card-base p-6 md:p-8 scroll-mt-28">
            <h2 className="h2">Aktueller Stand</h2>
            <p className="helper mt-3">
              Stand: 25. Februar 2026. Diese Übersicht wird aktualisiert, sobald neue Anbieter produktiv eingesetzt
              werden oder sich die Transferbasis wesentlich ändert.
            </p>
        </article>

        <article id="anbieter" className="card-base overflow-hidden scroll-mt-28">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <h2 className="h3">Anbieterübersicht</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Entscheidend sind Zweck, Datenkategorien und Transferbasis je Anbieter.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface)] text-left text-[var(--text)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Anbieter</th>
                  <th className="px-4 py-3 font-semibold">Zweck</th>
                  <th className="px-4 py-3 font-semibold">Datenkategorien</th>
                  <th className="px-4 py-3 font-semibold">Region/Transfer</th>
                  <th className="px-4 py-3 font-semibold">Schutzmaßnahmen</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((row) => (
                  <tr key={row.provider} className="border-t border-[var(--border)] align-top">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{row.provider}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.purpose}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.categories}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.region}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.safeguards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article id="hinweis" className="card-base p-6 md:p-8 scroll-mt-28">
            <h3 className="h3">Wichtiger Hinweis</h3>
            <p className="helper mt-3">
              Diese Seite beschreibt die operative Anbieterübersicht. Die konkrete rechtliche Bewertung für Ihren
              Einzelfall sollte gemeinsam mit Ihrer Rechtsberatung erfolgen.
            </p>
        </article>
      </LegalDocumentLayout>
    </PageShell>
  );
}
