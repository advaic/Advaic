import { ArrowRight } from "lucide-react";
import Container from "./Container";
import TrackedLink from "./TrackedLink";

const micro = ["14 Tage Testphase", "Danach Starter", "Kündbar", "Autopilot pausierbar", "Unklare Fälle → Freigabe"];

export default function FinalCTA() {
  return (
    <section id="cta" className="marketing-soft-warm py-20 md:py-28">
      <Container>
        <div className="card-base p-8 text-center md:p-12">
          <h2 className="h2">Machen Sie Feierabend, ohne dass Ihr Postfach weiterläuft.</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Testen Sie Advaic 14 Tage kostenlos. Danach läuft Starter monatlich weiter.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink
              href="/signup"
              className="btn-primary"
              event="marketing_final_cta_primary_click"
              source="website"
              pageGroup="marketing"
              section="final-cta"
              meta={{ section: "final-cta" }}
            >
              14 Tage kostenlos starten
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <TrackedLink
              href="/faq"
              className="btn-secondary"
              event="marketing_final_cta_secondary_click"
              source="website"
              pageGroup="marketing"
              section="final-cta"
              meta={{ section: "final-cta" }}
            >
              Fragen stellen
            </TrackedLink>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {micro.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
