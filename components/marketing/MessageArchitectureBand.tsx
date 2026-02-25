import Link from "next/link";
import Container from "./Container";
import { MESSAGE_ARCHITECTURE, POSITIONING_ONE_LINER } from "@/lib/marketing/message-architecture";

type MessageArchitectureBandProps = {
  compact?: boolean;
  className?: string;
};

export default function MessageArchitectureBand({
  compact = false,
  className = "",
}: MessageArchitectureBandProps) {
  return (
    <section className={`py-10 md:py-12 ${className}`}>
      <Container>
        <article className="card-base overflow-hidden p-0">
          <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
          <div className={`${compact ? "p-5" : "p-6 md:p-8"}`}>
            <p className="label">Kernlogik von Advaic</p>
            <p className="body mt-3 max-w-[70ch] text-[var(--muted)]">{POSITIONING_ONE_LINER}</p>

            <div className={`mt-5 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
              {MESSAGE_ARCHITECTURE.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/produkt#was" className="btn-secondary">
                Produktmechanik
              </Link>
              <Link href="/autopilot-regeln" className="btn-secondary">
                Entscheidungsregeln
              </Link>
              <Link href="/qualitaetschecks" className="btn-secondary">
                Qualitätschecks
              </Link>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
