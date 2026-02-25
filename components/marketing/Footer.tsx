import Link from "next/link";
import Container from "./Container";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white py-14">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            © {new Date().getFullYear()} Advaic. Alle Rechte vorbehalten.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
            <Link href="/impressum" className="focus-ring link-subtle">
              Impressum
            </Link>
            <Link href="/datenschutz" className="focus-ring link-subtle">
              Datenschutz
            </Link>
            <Link href="/cookie-und-storage" className="focus-ring link-subtle">
              Cookie & Storage
            </Link>
            <Link href="/unterauftragsverarbeiter" className="focus-ring link-subtle">
              Unterauftragsverarbeiter
            </Link>
            <Link href="/autopilot-regeln" className="focus-ring link-subtle">
              Autopilot-Regeln
            </Link>
            <Link href="/qualitaetschecks" className="focus-ring link-subtle">
              Qualitätschecks
            </Link>
            <Link href="/trust" className="focus-ring link-subtle">
              Trust Center
            </Link>
            <Link href="/use-cases" className="focus-ring link-subtle">
              Anwendungsfälle
            </Link>
            <Link href="/branchen" className="focus-ring link-subtle">
              Branchen
            </Link>
            <Link href="/manuell-vs-advaic" className="focus-ring link-subtle">
              Manuell vs. Advaic
            </Link>
            <Link href="/email-automatisierung-immobilienmakler" className="focus-ring link-subtle">
              E-Mail-Automatisierung
            </Link>
            <a href="mailto:support@advaic.com" className="focus-ring link-subtle">
              support@advaic.com
            </a>
            <Link href="/login" className="focus-ring link-subtle">
              Login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--muted)]">
          Rechtliche und datenschutzbezogene Dokumente sind über die verlinkten Seiten abrufbar.
        </p>
      </Container>
    </footer>
  );
}
