import TrackedLink from "./TrackedLink";
import {
  PROOF_LAST_CHECKED,
  PROOF_METHOD_NOTE,
  PROOF_METRICS,
  PROOF_SOURCES,
} from "@/lib/marketing/proof-data";

type ProofLayerProps = {
  compact?: boolean;
  context?: string;
  className?: string;
};

export default function ProofLayer({
  compact = true,
  context = "marketing",
  className = "",
}: ProofLayerProps) {
  const trustHref = context === "trust" ? "/sicherheit" : "/trust";
  const trustLabel = context === "trust" ? "Sicherheitsseite" : "Trust-Hub";

  return (
    <article className={`card-base ${compact ? "p-5" : "p-6 md:p-8"} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Öffentliche Quellenbasis</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Zuletzt geprüft: <span className="font-semibold text-[var(--text)]">{PROOF_LAST_CHECKED}</span>
          </p>
        </div>
        <TrackedLink
          href={trustHref}
          className="btn-secondary"
          event="marketing_proof_layer_trust_click"
          source="website"
          pageGroup={context}
          meta={{ section: "proof-layer", context }}
        >
          {trustLabel}
        </TrackedLink>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-1"}`}>
        {PROOF_METRICS.map((item) => (
          <article key={item.label} className="rounded-xl border border-[var(--border)] bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Evidenzpunkt
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{item.label}</p>
            <p className="mt-1 text-sm text-[var(--text)]">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.explanation}</p>
            <p className="mt-2 text-xs font-semibold text-[var(--muted)]">Quelle: {item.sourceId}</p>
          </article>
        ))}
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-1"}`}>
        {PROOF_SOURCES.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--muted)] transition hover:border-[rgba(11,15,23,0.18)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{item.id}</p>
            <p className="mt-1 font-semibold text-[var(--text)]">{item.label}</p>
            <p className="mt-1">{item.detail}</p>
          </a>
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">{PROOF_METHOD_NOTE}</p>
    </article>
  );
}
