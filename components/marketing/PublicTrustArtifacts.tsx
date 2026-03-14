import Link from "next/link";
import {
  PUBLIC_TRUST_ARTIFACTS,
  PUBLIC_TRUST_SUMMARIES,
} from "@/lib/marketing/public-trust-artifacts";

type PublicTrustArtifactsProps = {
  title?: string;
  description?: string;
  compact?: boolean;
  framed?: boolean;
  dataTour?: string;
};

export default function PublicTrustArtifacts({
  title = "Öffentlich prüfbar vor dem ersten Gespräch",
  description = "Diese Seite ersetzt eine Logo-Wand nicht mit Behauptungen, sondern mit konkreten Prüfobjekten: Produktzustand, Regeln, Unterlagen und Go-live-Pfade.",
  compact = false,
  framed = true,
  dataTour = "public-trust-artifacts",
}: PublicTrustArtifactsProps) {
  const wrapperClass = framed ? "card-base p-5 md:p-6" : "";

  const visibleArtifacts = compact ? PUBLIC_TRUST_ARTIFACTS.slice(0, 4) : PUBLIC_TRUST_ARTIFACTS;

  return (
    <article className={wrapperClass} data-tour={dataTour}>
      <p className="label">Öffentlich prüfbar</p>
      <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="helper mt-3">{description}</p>

      <div
        className={`mt-4 grid gap-3 ${compact ? "grid-cols-3" : "md:grid-cols-3"}`}
        data-tour="public-trust-artifact-summary"
      >
        {PUBLIC_TRUST_SUMMARIES.map((item) => (
          <article
            key={item.title}
            className={`rounded-2xl bg-[var(--surface-2)] ring-1 ring-[var(--border)] ${
              compact ? "px-3 py-3" : "px-4 py-4"
            }`}
          >
            <p className={`${compact ? "text-xl" : "text-2xl"} font-semibold tracking-[-0.02em] text-[var(--text)]`}>
              {item.value}
            </p>
            <p className={`font-semibold text-[var(--text)] ${compact ? "mt-1 text-xs leading-5" : "mt-2 text-sm"}`}>
              {item.title}
            </p>
            {compact ? null : <p className="helper mt-2">{item.description}</p>}
          </article>
        ))}
      </div>

      <div
        className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}
        data-tour="public-trust-artifact-grid"
      >
        {visibleArtifacts.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl bg-white ring-1 ring-[var(--border)] ${
              compact ? "px-3 py-3" : "px-4 py-4"
            }`}
            data-tour="public-trust-artifact-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {item.eyebrow}
            </p>
            <h4 className="mt-2 text-sm font-semibold text-[var(--text)]">{item.title}</h4>
            {compact ? (
              <Link
                href={item.href}
                className="mt-2 inline-flex text-sm font-semibold text-[var(--text)] underline decoration-[var(--gold-soft)] underline-offset-4"
              >
                {item.cta}
              </Link>
            ) : (
              <>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4 w-full justify-center">
                  {item.cta}
                </Link>
              </>
            )}
          </article>
        ))}
      </div>
    </article>
  );
}
