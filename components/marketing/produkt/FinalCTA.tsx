import Link from "next/link";
import Container from "@/components/marketing/Container";

export default function FinalCTA() {
  return (
    <section id="cta" className="py-20 md:py-28">
      <Container>
        <div className="rounded-[var(--radius)] bg-white p-8 text-center ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-12">
          <h2 className="h2">Testen Sie Advaic 14 Tage kostenlos</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Weniger Postfach. Mehr Feierabend. Mit Autopilot-Sicherheitsnetz und klarer Freigabelogik.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
            </Link>
            <a href="#faq" className="btn-secondary">
              Fragen stellen
            </a>
          </div>

          <p className="helper mt-5">
            Kündbar · pausierbar · Unklar → Freigabe · Qualitätschecks vor Auto-Versand
          </p>
        </div>
      </Container>
    </section>
  );
}
