import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "./Container";

const micro = ["Kündbar", "Autopilot pausierbar", "Unklare Fälle → Freigabe"];

export default function FinalCTA() {
  return (
    <section id="cta" className="marketing-soft-warm py-20 md:py-28">
      <Container>
        <div className="card-base p-8 text-center md:p-12">
          <h2 className="h2">Machen Sie Feierabend, ohne dass Ihr Postfach weiterläuft.</h2>
          <p className="body mt-4 text-[var(--muted)]">Testen Sie Advaic 14 Tage kostenlos.</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/faq" className="btn-secondary">
              Fragen stellen
            </Link>
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
