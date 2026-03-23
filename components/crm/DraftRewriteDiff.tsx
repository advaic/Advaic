import { outboundQualityStatusLabel } from "@/lib/crm/outboundQuality";
import type { DraftEvidenceReview } from "@/components/crm/OutboundEvidenceInspector";

type RewriteSnapshot = {
  previousSubject: string;
  previousBody: string;
  nextSubject: string;
  nextBody: string;
  previousReview?: DraftEvidenceReview | null;
  nextReview?: DraftEvidenceReview | null;
  generatedWith?: "ai" | "fallback" | null;
  improvementSummary?: string | null;
  changeSummary?: string | null;
};

function clean(value: unknown, max = 400) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalize(value: unknown) {
  return clean(value, 500)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: unknown) {
  return normalize(value).split(" ").filter(Boolean);
}

function matchScore(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.94;
  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (!aTokens.length || !bTokens.length) return 0;
  const overlap = aTokens.filter((token) => bTokens.includes(token)).length;
  return overlap / Math.max(1, Math.min(aTokens.length, bTokens.length));
}

function sentenceLikeSegments(body: string) {
  return body
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .map((part) => clean(part, 520))
        .filter(Boolean),
    )
    .filter(Boolean);
}

function diffSegments(source: string, target: string) {
  const sourceSegments = sentenceLikeSegments(source);
  const targetSegments = sentenceLikeSegments(target);
  return sourceSegments.filter(
    (segment) => !targetSegments.some((candidate) => matchScore(segment, candidate) >= 0.9),
  );
}

function reviewBadgeClass(status?: DraftEvidenceReview["status"] | null) {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "needs_review") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

export type { RewriteSnapshot as DraftRewriteSnapshot };

export default function DraftRewriteDiff({
  snapshot,
  currentSubject,
  currentBody,
  className = "",
}: {
  snapshot: RewriteSnapshot | null | undefined;
  currentSubject: string;
  currentBody: string;
  className?: string;
}) {
  if (!snapshot) return null;

  const stale =
    clean(currentSubject, 240) !== clean(snapshot.nextSubject, 240) ||
    clean(currentBody, 5000) !== clean(snapshot.nextBody, 5000);
  const removedSegments = diffSegments(snapshot.previousBody, snapshot.nextBody);
  const addedSegments = diffSegments(snapshot.nextBody, snapshot.previousBody);
  const subjectChanged = clean(snapshot.previousSubject, 240) !== clean(snapshot.nextSubject, 240);
  const scoreDelta =
    typeof snapshot.nextReview?.score === "number" && typeof snapshot.previousReview?.score === "number"
      ? snapshot.nextReview.score - snapshot.previousReview.score
      : null;

  return (
    <details className={`rounded-xl border border-slate-200 bg-slate-50 ${className}`.trim()} open>
      <summary className="cursor-pointer list-none px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-900">Rewrite-Diff</div>
          {snapshot.generatedWith ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800">
              {snapshot.generatedWith === "ai" ? "KI-Rewrite" : "Fallback-Rewrite"}
            </span>
          ) : null}
          {snapshot.previousReview ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] ${reviewBadgeClass(snapshot.previousReview.status)}`}
            >
              Vorher {outboundQualityStatusLabel(snapshot.previousReview.status)} · {snapshot.previousReview.score}/100
            </span>
          ) : null}
          {snapshot.nextReview ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] ${reviewBadgeClass(snapshot.nextReview.status)}`}
            >
              Nachher {outboundQualityStatusLabel(snapshot.nextReview.status)} · {snapshot.nextReview.score}/100
            </span>
          ) : null}
          {typeof scoreDelta === "number" ? (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">
              Score {scoreDelta >= 0 ? "+" : ""}
              {scoreDelta}
            </span>
          ) : null}
          {stale ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
              basiert auf letztem Rewrite
            </span>
          ) : null}
        </div>
        <div className="mt-2 text-xs text-slate-700">
          {[snapshot.improvementSummary, snapshot.changeSummary]
            .map((item) => clean(item, 260))
            .filter(Boolean)
            .join(" ")}
        </div>
      </summary>
      <div className="border-t border-slate-200 px-3 py-3">
        {subjectChanged ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Vorher Betreff</div>
              <div className="mt-1 text-sm text-slate-800">{snapshot.previousSubject || "–"}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Nachher Betreff</div>
              <div className="mt-1 text-sm text-slate-800">{snapshot.nextSubject || "–"}</div>
            </div>
          </div>
        ) : null}
        <div className={`grid gap-3 ${subjectChanged ? "mt-3" : ""} md:grid-cols-2`}>
          <div className="rounded-lg border border-rose-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Entfernt oder ersetzt</div>
            <div className="mt-2 space-y-2">
              {removedSegments.length > 0 ? (
                removedSegments.map((segment, index) => (
                  <div key={`${segment}-${index}`} className="rounded-md border border-rose-100 bg-rose-50 px-2 py-2 text-xs text-slate-700">
                    {segment}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-500">
                  Keine klar entfernten Stellen erkannt.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Neu oder geschaerft</div>
            <div className="mt-2 space-y-2">
              {addedSegments.length > 0 ? (
                addedSegments.map((segment, index) => (
                  <div key={`${segment}-${index}`} className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-2 text-xs text-slate-700">
                    {segment}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-500">
                  Keine klar neuen Stellen erkannt.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
