import Link from "next/link";
import Container from "./Container";
import PublicTrustArtifacts from "./PublicTrustArtifacts";

const pillars = [
  {
    tag: "Auto",
    title: "Auto nur bei klaren Voraussetzungen",
    text: "Objektbezug, Empfänger, Kerndaten und Versandpfad müssen zusammenpassen, bevor Advaic überhaupt automatisch sendet.",
  },
  {
    tag: "Stop",
    title: "Stopp bei Lücken oder Risiko",
    text: "Fehlen Angaben, ist der Rückkanal unsauber oder kippt der Inhalt in Richtung Beschwerde, Konflikt oder Sensibilität, greift die Freigabe.",
  },
  {
    tag: "Log",
    title: "Verlauf bleibt sichtbar",
    text: "Eingang, Entscheidung, Freigabe und Versand sind pro Nachricht mit Status und Zeitstempel nachvollziehbar.",
  },
  {
    tag: "Docs",
    title: "Unterlagen und Regeln sind prüfbar",
    text: "Sicherheitsseite, Datenschutz und die operative Produktlogik liegen öffentlich nachvollziehbar vor, statt nur versprochen zu werden.",
  },
];

const limits = [
  "Wenn Objektbezug, Empfänger oder Kerndaten nicht sauber zusammenpassen.",
  "Wenn der Inhalt in Richtung Beschwerde, Konflikt, rechtlich sensible Aussage oder Sonderfall kippt.",
  "Wenn der Rückkanal technisch nicht sauber prüfbar ist, zum Beispiel bei unsicherem no-reply-Setup.",
];

export default function TrustByDesign() {
  return (
    <section
      id="trust-design"
      className="marketing-soft-warm py-20 md:py-28"
      data-tour="marketing-trust-block"
    >
      <Container>
        <div className="max-w-[76ch]">
          <p className="section-kicker">Trust-Kurzprüfung auf der Startseite</p>
          <h2 className="h2 mt-2">Die drei Dinge, die vor jedem Test klar sein sollten</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Bevor Sie tiefer lesen, sollte die Startseite genau drei Punkte leisten: zeigen, wann Auto erlaubt ist,
            wann bewusst gestoppt wird und wo Sie danach tiefer prüfen können.
          </p>
        </div>

        <div className="mt-6">
          <PublicTrustArtifacts
            compact
            title="Vertrauen entsteht hier über prüfbare Artefakte"
            description="Vor dem ersten Gespräch sollten Sie Produktzustand, Regeln, Unterlagen und Preis bereits öffentlich öffnen können."
            dataTour="marketing-trust-artifacts"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((item) => (
            <article key={item.title} className="card-base card-hover p-5">
              <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] ring-1 ring-[var(--gold-soft)]">
                {item.tag}
              </span>
              <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="helper mt-2">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="card-base p-6">
            <h3 className="h3">Hier stoppt Auto bewusst</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {limits.map((item) => (
                <li key={item} className="flex items-start gap-2" data-tour="marketing-trust-limit">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base p-6">
            <h3 className="h3">Seitenrollen im Trust-System</h3>
            <p className="helper mt-3">
              Die Startseite bleibt bewusst kurz. Für die eigentliche Prüfung hat jede weitere Seite eine klare Rolle.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/trust" className="btn-secondary">
                Trust-Hub
              </Link>
              <Link href="/sicherheit" className="btn-secondary">
                Sicherheitsseite
              </Link>
              <Link href="/datenschutz" className="btn-secondary">
                Datenschutz
              </Link>
              <Link href="/freigabe-inbox" className="btn-secondary">
                Freigabeprozess
              </Link>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-[var(--muted)]">
              <p>Trust-Hub = Routing und Einstieg.</p>
              <p>Sicherheitsseite = Auto-Grenzen und Nachweise.</p>
              <p>Datenschutz = Rollen und Speicherfristen.</p>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
