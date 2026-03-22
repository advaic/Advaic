import type { DraftEvidenceReview } from "@/components/crm/OutboundEvidenceInspector";

type SegmentKind = "supported" | "weak" | "unsupported" | "neutral";

function clean(value: unknown, max = 400) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalize(value: unknown) {
  return clean(value, 400)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function sentenceLikeSegments(body: string) {
  return body
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .map((part) => clean(part, 500))
        .filter(Boolean),
    )
    .filter(Boolean);
}

function matchScore(segment: string, claim: string) {
  const a = normalize(segment);
  const b = normalize(claim);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.94;

  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const overlap = aTokens.filter((token) => bTokens.includes(token)).length;
  const ratio = overlap / Math.max(1, Math.min(aTokens.length, bTokens.length));
  return ratio;
}

function segmentClass(kind: SegmentKind) {
  if (kind === "supported") return "border-emerald-200 bg-emerald-50";
  if (kind === "weak") return "border-amber-200 bg-amber-50";
  if (kind === "unsupported") return "border-rose-200 bg-rose-50";
  return "border-gray-200 bg-gray-50";
}

function badgeClass(kind: SegmentKind) {
  if (kind === "supported") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (kind === "weak") return "border-amber-200 bg-amber-100 text-amber-800";
  if (kind === "unsupported") return "border-rose-200 bg-rose-100 text-rose-700";
  return "border-gray-200 bg-white text-gray-600";
}

function badgeLabel(kind: SegmentKind) {
  if (kind === "supported") return "Belegt";
  if (kind === "weak") return "Schwach";
  if (kind === "unsupported") return "Ungestuetzt";
  return "Neutral";
}

export default function DraftClaimHighlight({
  body,
  review,
  stale = false,
  className = "",
}: {
  body: string;
  review: DraftEvidenceReview | null | undefined;
  stale?: boolean;
  className?: string;
}) {
  const alignment = review?.evidence_alignment || null;
  if (!alignment || !body.trim()) return null;

  const supportedClaims = alignment.cited_claims || [];
  const weakClaims = alignment.weak_claims || [];
  const unsupportedClaims = alignment.unsupported_claims || [];
  const segments = sentenceLikeSegments(body).slice(0, 12);
  if (segments.length === 0) return null;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-semibold text-gray-900">Claim-Check im Draft</div>
        {stale ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
            basiert auf letzter Bewertung
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] text-gray-600">
        Jede relevante Aussage wird gegen gespeicherte Evidenz gespiegelt.
      </div>
      <div className="mt-3 space-y-2">
        {segments.map((segment, index) => {
          let kind: SegmentKind = "neutral";
          let helper: string | null = null;
          let sourceUrl: string | null = null;

          const unsupported = unsupportedClaims.find((claim) => matchScore(segment, claim) >= 0.58);
          if (unsupported) {
            kind = "unsupported";
            helper = unsupported;
          } else {
            const weak = weakClaims.find((claim) => matchScore(segment, claim) >= 0.58);
            if (weak) {
              kind = "weak";
              helper = weak;
            } else {
              const supported = supportedClaims.find((claim) => matchScore(segment, claim.claim) >= 0.58);
              if (supported) {
                kind = "supported";
                helper = supported.evidence;
                sourceUrl = supported.source_url || null;
              }
            }
          }

          return (
            <div key={`${segment}-${index}`} className={`rounded-lg border px-3 py-2 ${segmentClass(kind)}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm text-gray-900">{segment}</div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${badgeClass(kind)}`}>
                  {badgeLabel(kind)}
                </span>
              </div>
              {helper ? (
                <div className="mt-1 text-[11px] text-gray-600">
                  {kind === "supported" ? `Beleg: ${helper}` : `Match: ${helper}`}
                  {sourceUrl ? (
                    <>
                      {" · "}
                      <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                        Quelle
                      </a>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
