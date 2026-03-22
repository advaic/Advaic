import { outboundQualityStatusLabel } from "@/lib/crm/outboundQuality";

export type DraftEvidenceReview = {
  status: "pass" | "needs_review" | "blocked";
  score: number;
  summary: string;
  blockers?: string[];
  warnings?: string[];
  goldset?: {
    summary?: string;
    approved_example_count?: number;
    rejected_example_count?: number;
  } | null;
  evidence_alignment?: {
    score: number;
    cited_claim_count: number;
    weak_claim_count: number;
    unsupported_claim_count: number;
    cited_claims: Array<{
      claim: string;
      evidence: string;
      field_name: string | null;
      source_type: string | null;
      source_url: string | null;
    }>;
    weak_claims: string[];
    unsupported_claims: string[];
    summary: string;
  } | null;
};

function cleanText(value: unknown, fallback = "–") {
  const text = String(value || "").trim();
  return text || fallback;
}

function reviewBadgeClass(status: DraftEvidenceReview["status"]) {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function evidenceBadgeClass(count: number) {
  if (count <= 0) return "border-gray-200 bg-gray-50 text-gray-600";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function weakBadgeClass(count: number) {
  if (count <= 0) return "border-gray-200 bg-gray-50 text-gray-600";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function unsupportedBadgeClass(count: number) {
  if (count <= 0) return "border-gray-200 bg-gray-50 text-gray-600";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function OutboundEvidenceInspector({
  review,
  compact = false,
  defaultOpen = false,
  className = "",
}: {
  review: DraftEvidenceReview | null | undefined;
  compact?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  if (!review) return null;

  const alignment = review.evidence_alignment || null;
  if (!alignment) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 ${className}`.trim()}>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${reviewBadgeClass(review.status)}`}>
          {outboundQualityStatusLabel(review.status)} · {review.score}/100
        </span>
        <div className="mt-1">{review.summary}</div>
      </div>
    );
  }

  const hasDetails =
    alignment.cited_claims.length > 0 ||
    alignment.weak_claims.length > 0 ||
    alignment.unsupported_claims.length > 0;

  return (
    <details
      className={`rounded-xl border border-gray-200 bg-gray-50 ${className}`.trim()}
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${reviewBadgeClass(review.status)}`}>
            {outboundQualityStatusLabel(review.status)} · {review.score}/100
          </span>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${evidenceBadgeClass(alignment.cited_claim_count)}`}>
            Direkt {alignment.cited_claim_count}
          </span>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${weakBadgeClass(alignment.weak_claim_count)}`}>
            Schwach {alignment.weak_claim_count}
          </span>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${unsupportedBadgeClass(alignment.unsupported_claim_count)}`}>
            Ungestuetzt {alignment.unsupported_claim_count}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-700">{alignment.summary}</div>
        {!compact ? <div className="mt-1 text-[11px] text-gray-500">{review.summary}</div> : null}
      </summary>

      {hasDetails ? (
        <div className="border-t border-gray-200 px-3 py-3">
          {alignment.cited_claims.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Direkt belegte Claims
              </div>
              <div className="mt-2 space-y-2">
                {alignment.cited_claims.map((item, index) => (
                  <div key={`${item.claim}-${index}`} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
                    <div className="text-xs font-medium text-gray-900">{cleanText(item.claim)}</div>
                    <div className="mt-1 text-[11px] text-gray-600">{cleanText(item.evidence)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      {item.field_name ? (
                        <span className="rounded-full bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">
                          Feld: {item.field_name}
                        </span>
                      ) : null}
                      {item.source_type ? (
                        <span className="rounded-full bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">
                          Quelle: {item.source_type}
                        </span>
                      ) : null}
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          Quelle öffnen
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {alignment.weak_claims.length > 0 ? (
            <div className={alignment.cited_claims.length > 0 ? "mt-3" : ""}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                Nur indirekt gestuetzt
              </div>
              <div className="mt-2 space-y-2">
                {alignment.weak_claims.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-700">
                    {cleanText(item)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {alignment.unsupported_claims.length > 0 ? (
            <div className={alignment.cited_claims.length > 0 || alignment.weak_claims.length > 0 ? "mt-3" : ""}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                Ohne harte Evidenz
              </div>
              <div className="mt-2 space-y-2">
                {alignment.unsupported_claims.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-gray-700">
                    {cleanText(item)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!compact && review.goldset?.summary ? (
            <div className="mt-3 text-[11px] text-gray-500">Gold-Set: {review.goldset.summary}</div>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
