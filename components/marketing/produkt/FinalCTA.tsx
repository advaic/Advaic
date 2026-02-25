import Container from "@/components/marketing/Container";
import TrackedLink from "@/components/marketing/TrackedLink";

export default function FinalCTA() {
  return (
    <section id="cta" className="py-20 md:py-28">
      <Container>
        <div className="rounded-[var(--radius)] bg-white p-8 text-center ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-12">
          <h2 className="h2">Testen Sie Advaic 14 Tage kostenlos</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Weniger Postfach. Mehr Feierabend. Danach läuft Starter monatlich weiter.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink
              href="/signup"
              className="btn-primary"
              event="marketing_produkt_final_primary_click"
              source="website"
              pageGroup="produkt"
              section="produkt-final-cta"
              meta={{ section: "produkt-final-cta" }}
            >
              14 Tage kostenlos starten
            </TrackedLink>
            <TrackedLink
              href="/produkt#faq"
              className="btn-secondary"
              event="marketing_produkt_final_secondary_click"
              source="website"
              pageGroup="produkt"
              section="produkt-final-cta"
              meta={{ section: "produkt-final-cta" }}
            >
              Fragen stellen
            </TrackedLink>
          </div>

          <p className="helper mt-5">
            14 Tage Testphase · danach Starter · kündbar · pausierbar · Unklar → Freigabe
          </p>
        </div>
      </Container>
    </section>
  );
}
