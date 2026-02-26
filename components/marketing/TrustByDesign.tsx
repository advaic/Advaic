import Link from "next/link";
import { FileLock2, ListChecks, LockKeyhole, ShieldCheck } from "lucide-react";
import Container from "./Container";

const pillars = [
  {
    title: "Datenminimierung",
    text: "Advaic verarbeitet nur Inhalte, die für Erkennen, Entscheiden und Antworten im Lead-Prozess erforderlich sind.",
    Icon: ListChecks,
  },
  {
    title: "Zugriffskontrolle",
    text: "Rollen- und agentenbezogene Trennung begrenzt den Zugriff auf relevante Daten und Einstellungen.",
    Icon: LockKeyhole,
  },
  {
    title: "Nachvollziehbarkeit",
    text: "Eingang, Entscheidung, Freigabe und Versand sind mit Status und Zeitstempel dokumentiert.",
    Icon: FileLock2,
  },
  {
    title: "Fail-Safe Logik",
    text: "Bei Unsicherheit wird nicht automatisch versendet, sondern konsequent zur Freigabe übergeben.",
    Icon: ShieldCheck,
  },
];

const limits = [
  "Keine automatische Antwort auf Newsletter, Rundmails oder offensichtlichen Spam.",
  "Keine Auto-Antwort bei unklarem Objektbezug oder fehlenden Pflichtinformationen.",
  "Keine Auto-Antwort bei Konflikt-, Beschwerde- oder sonstigen Risikofällen.",
];

const docs = [
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Nutzungsbedingungen", href: "/nutzungsbedingungen" },
  { label: "Cookie & Storage", href: "/cookie-und-storage" },
  { label: "Sicherheitsseite", href: "/sicherheit" },
];

export default function TrustByDesign() {
  return (
    <section id="trust-design" className="marketing-soft-warm py-20 md:py-28">
      <Container>
        <div className="max-w-[74ch]">
          <h2 className="h2">Trust by Design: Sicherheit ist Produktlogik, kein Zusatz</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Advaic ist so aufgebaut, dass Sie präzise steuern können, was automatisch passieren darf und was bewusst in
            Ihrer Entscheidung bleibt. Das reduziert Risiko, ohne die Geschwindigkeit im Alltag zu verlieren.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((item) => (
            <article key={item.title} className="card-base card-hover p-5">
              <item.Icon className="h-5 w-5 text-[var(--gold)]" />
              <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="helper mt-2">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-12">
          <article className="card-base md:col-span-8 p-6">
            <h3 className="h3">Klare Grenzen im Auto-Versand</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {limits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base md:col-span-4 p-6">
            <h3 className="h3">Dokumentation</h3>
            <p className="helper mt-3">
              Weiterführende Informationen zu Verarbeitung, Speicherlogik und rechtlichen Dokumenten finden Sie hier:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {docs.map((item) => (
                <Link key={item.href} href={item.href} className="btn-secondary">
                  {item.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
