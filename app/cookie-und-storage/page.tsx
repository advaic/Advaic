import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";

type Entry = {
  name: string;
  place: "Cookie" | "Local Storage" | "Session Storage";
  purpose: string;
  legalBase: string;
  retention: string;
};

const entries: Entry[] = [
  {
    name: "Supabase-Session-Cookies (`sb-…-auth-token`)",
    place: "Cookie",
    purpose: "Authentifizierung und sichere Anmeldung im Konto-Bereich.",
    legalBase: "Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Bis Logout oder Session-Ende; technische Erneuerung durch das Auth-System möglich.",
  },
  {
    name: "`advaic_outlook_oauth_state`, `advaic_outlook_pkce_verifier`, `advaic_outlook_return_to`",
    place: "Cookie",
    purpose: "Sicherer OAuth-Flow (CSRF-Schutz, PKCE, Rücksprungpfad) bei Outlook-Verknüpfung.",
    legalBase: "Art. 6 Abs. 1 lit. b DSGVO, § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Kurzlebig (maximal 10 Minuten), wird nach dem OAuth-Flow gelöscht.",
  },
  {
    name: "`advaic_immoscout_return_to`",
    place: "Cookie",
    purpose: "Rücksprungpfad für die ImmoScout-Verknüpfung.",
    legalBase: "Art. 6 Abs. 1 lit. b DSGVO, § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Kurzlebig (maximal 10 Minuten), wird nach dem OAuth-Flow gelöscht.",
  },
  {
    name: "`advaic:tour:dashboard`",
    place: "Local Storage",
    purpose: "Speichert den Fortschritt der Produkt-Tour im Dashboard.",
    legalBase: "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an nutzerfreundlicher Bedienung), § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Bis zur Zurücksetzung der Tour oder manuellen Löschung im Browser.",
  },
  {
    name: "`advaic:tour:progress:v1`",
    place: "Local Storage",
    purpose: "Speichert positionsgenaue Schrittstände der Tour.",
    legalBase: "Art. 6 Abs. 1 lit. f DSGVO, § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Bis zur Zurücksetzung der Tour oder manuellen Löschung im Browser.",
  },
  {
    name: "`advaic_chat_session`",
    place: "Session Storage",
    purpose: "Temporäre Chat-Sitzungs-ID für den Support-Chat innerhalb eines Tabs.",
    legalBase: "Art. 6 Abs. 1 lit. f DSGVO, § 25 Abs. 2 Nr. 2 TDDDG",
    retention: "Nur bis zum Schließen des Browser-Tabs.",
  },
];

export default function CookieUndStoragePage() {
  const privacyEmail =
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL ||
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ||
    "support@advaic.com";

  return (
    <PageShell>
      <PageIntro
        kicker="Cookie- & Speicherhinweise"
        title="Welche Cookies und Browser-Speicher wir nutzen"
        description="Hier findest du transparent, welche technisch notwendigen Einträge auf unserer Website und im Produkt verwendet werden."
        actions={
          <>
            <Link href="/datenschutz" className="btn-secondary">
              Datenschutzhinweise
            </Link>
            <a href={`mailto:${privacyEmail}`} className="btn-primary">
              Datenschutz kontaktieren
            </a>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Aktueller Stand</h2>
            <p className="helper mt-3">
              Stand: 24. Februar 2026. Im aktuellen Code-Stand setzen wir keine zusätzlichen Marketing- oder
              Werbe-Tracking-Skripte ein. Wenn sich das ändert, wird diese Seite vorab aktualisiert.
            </p>
          </article>

          <div className="card-base mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--surface)] text-left text-[var(--text)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Speicherort</th>
                    <th className="px-4 py-3 font-semibold">Zweck</th>
                    <th className="px-4 py-3 font-semibold">Rechtsgrundlage</th>
                    <th className="px-4 py-3 font-semibold">Speicherdauer</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.name} className="border-t border-[var(--border)] align-top">
                      <td className="px-4 py-3 text-[var(--text)]">{entry.name}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{entry.place}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{entry.purpose}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{entry.legalBase}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{entry.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Wie du Einträge löschen kannst</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Cookies sowie Local-/Session-Storage kannst du in den Browser-Einstellungen löschen.</li>
              <li>Wenn du dich ausloggst, werden Auth-Sessions beendet.</li>
              <li>
                Für datenschutzrechtliche Anfragen (z. B. Auskunft oder Löschung) schreib bitte an{" "}
                <a className="underline underline-offset-4" href={`mailto:${privacyEmail}`}>
                  {privacyEmail}
                </a>
                .
              </li>
            </ul>
          </article>
        </Container>
      </section>
    </PageShell>
  );
}
