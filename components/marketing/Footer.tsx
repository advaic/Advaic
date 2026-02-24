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
