import type { DraftEvidenceReview } from "@/components/crm/OutboundEvidenceInspector";

type SegmentKind = "supported" | "weak" | "unsupported" | "neutral";
type RewriteSuggestion = {
  id: string;
  label: string;
  replacement: string;
  hint: string;
};
type ProspectContext = {
  companyName?: string | null;
  city?: string | null;
  objectFocus?: string | null;
  personalizationHook?: string | null;
  targetGroup?: string | null;
  processHint?: string | null;
  responsePromisePublic?: string | null;
  appointmentFlowPublic?: string | null;
  docsFlowPublic?: string | null;
};
type EvidenceRow = {
  field_name?: string | null;
  field_value?: string | null;
  source_url?: string | null;
  confidence?: number | null;
};

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

function cleanupBody(value: string) {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function replaceSegmentInBody(body: string, segment: string, replacement: string) {
  const index = body.indexOf(segment);
  if (index < 0) return body;
  const before = body.slice(0, index);
  const after = body.slice(index + segment.length);
  const spacerBefore = before && !before.endsWith("\n") && replacement ? " " : "";
  const spacerAfter = after && !replacement.endsWith("\n") && replacement ? " " : "";
  return cleanupBody(`${before}${spacerBefore}${replacement}${spacerAfter}${after}`);
}

function inferTopic(segment: string) {
  const text = normalize(segment);
  if (/miet|vermiet/.test(text)) return "miete";
  if (/verkauf|kauf|eigentum/.test(text)) return "kauf";
  if (/besichtigung|termin/.test(text)) return "termin";
  if (/unterlag|dokument|expose/.test(text)) return "unterlagen";
  if (/antwort|reaktion|anfrage|interessent/.test(text)) return "antworten";
  return "general";
}

function focusSnippet(context?: ProspectContext | null) {
  const city = clean(context?.city, 80);
  const hook = clean(context?.personalizationHook, 120);
  if (hook) return hook.replace(/[.!?]+$/, "");
  const processHint = clean(context?.processHint, 120);
  if (processHint) return processHint.replace(/[.!?]+$/, "");
  const targetGroup = clean(context?.targetGroup, 100);
  if (targetGroup) return targetGroup;
  const objectFocus = clean(context?.objectFocus, 40).toLowerCase();
  if (objectFocus === "miete") return city ? `Vermietung in ${city}` : "Vermietung";
  if (objectFocus === "kauf") return city ? `Verkauf in ${city}` : "Verkauf";
  if (objectFocus === "neubau") return city ? `Neubau in ${city}` : "Neubau";
  if (city) return `Immobiliengeschaeft in ${city}`;
  return "Ihr operatives Tagesgeschaeft";
}

function bestEvidenceSnippet(segment: string, evidenceRows: EvidenceRow[], context?: ProspectContext | null) {
  const candidates = evidenceRows
    .filter((row) => Number(row.confidence || 0) >= 0.45)
    .map((row) => ({
      text: clean(row.field_value, 140),
      score: matchScore(segment, clean(row.field_value, 200)) + Number(row.confidence || 0) * 0.2,
    }))
    .filter((row) => row.text);
  candidates.sort((a, b) => b.score - a.score || a.text.localeCompare(b.text, "de"));
  if (candidates[0]?.score >= 0.5) return candidates[0].text.replace(/[.!?]+$/, "");
  return focusSnippet(context);
}

function buildEvidenceRewrite(segment: string, context?: ProspectContext | null, evidenceRows: EvidenceRow[] = []) {
  const topic = inferTopic(segment);
  const snippet = bestEvidenceSnippet(segment, evidenceRows, context);
  if (!snippet) return null;
  if (topic === "miete") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie organisieren Sie heute schnelle, persoenliche Antworten auf Mietanfragen?`;
  }
  if (topic === "kauf") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie organisieren Sie heute schnelle, persoenliche Antworten auf Verkaufsanfragen?`;
  }
  if (topic === "termin") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein relevanter Teil Ihres Prozesses. Wie organisieren Sie heute schnelle Rueckmeldungen rund um Besichtigungen?`;
  }
  if (topic === "unterlagen") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein relevanter Prozessschritt. Wie halten Sie Rueckfragen dabei schnell und persoenlich?`;
  }
  return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie gehen Sie heute operativ damit um, ohne dass Antworten standardisiert wirken?`;
}

function buildQuestionRewrite(segment: string, context?: ProspectContext | null) {
  const topic = inferTopic(segment);
  const city = clean(context?.city, 80);
  if (topic === "miete") {
    return `Wie stellen Sie heute sicher, dass Mietanfragen${city ? ` in ${city}` : ""} schnell beantwortet werden, ohne unpersoenlich zu wirken?`;
  }
  if (topic === "kauf") {
    return `Wie stellen Sie heute sicher, dass Verkaufsanfragen${city ? ` in ${city}` : ""} schnell beantwortet werden, ohne unpersoenlich zu wirken?`;
  }
  if (topic === "termin") {
    return "Wie organisieren Sie heute schnelle, persoenliche Rueckmeldungen rund um Besichtigungstermine?";
  }
  if (topic === "unterlagen") {
    return "Wie organisieren Sie heute Rueckfragen zu Unterlagen oder Exposes, ohne dass Antworten standardisiert wirken?";
  }
  return "Wie stellen Sie heute schnelle, persoenliche Erstreaktionen sicher, ohne dass Antworten standardisiert wirken?";
}

function buildSoftRewrite(segment: string, context?: ProspectContext | null) {
  const topic = inferTopic(segment);
  const snippet = focusSnippet(context);
  if (topic === "miete" || topic === "kauf") {
    return `Bei ${snippet} entstehen oft wiederkehrende Rueckfragen. Wie gehen Sie heute damit um, ohne dass Antworten unpersoenlich wirken?`;
  }
  return `Bei ${snippet} entstehen haeufig wiederkehrende Rueckfragen. Wie gehen Sie heute damit um, ohne dass Antworten standardisiert wirken?`;
}

function buildSuggestions(args: {
  kind: SegmentKind;
  segment: string;
  context?: ProspectContext | null;
  evidenceRows?: EvidenceRow[];
}) {
  if (args.kind !== "weak" && args.kind !== "unsupported") return [] as RewriteSuggestion[];

  const evidenceRewrite = buildEvidenceRewrite(args.segment, args.context, args.evidenceRows || []);
  const suggestions: RewriteSuggestion[] = [];
  if (evidenceRewrite) {
    suggestions.push({
      id: "evidence",
      label: "Mit Evidenz ersetzen",
      replacement: evidenceRewrite,
      hint: "Safer Einstieg, der sich enger an sichtbare Signale anlehnt.",
    });
  }
  suggestions.push({
    id: "question",
    label: "Als Frage drehen",
    replacement: buildQuestionRewrite(args.segment, args.context),
    hint: "Nimmt Ueberbehauptung raus und oeffnet das Gespraech.",
  });
  suggestions.push({
    id: "soft",
    label: "Sicherer formulieren",
    replacement: buildSoftRewrite(args.segment, args.context),
    hint: "Bleibt relevant, aber macht weniger harte Annahmen.",
  });
  suggestions.push({
    id: "remove",
    label: "Streichen",
    replacement: "",
    hint: "Wenn der Claim aktuell nicht belastbar genug ist, lieber weglassen.",
  });
  return suggestions;
}

export default function DraftClaimHighlight({
  body,
  review,
  stale = false,
  refreshing = false,
  className = "",
  prospectContext,
  evidenceRows = [],
  onApplySuggestion,
  onRequestAiRewrite,
  rewriteBusy = false,
}: {
  body: string;
  review: DraftEvidenceReview | null | undefined;
  stale?: boolean;
  refreshing?: boolean;
  className?: string;
  prospectContext?: ProspectContext | null;
  evidenceRows?: EvidenceRow[];
  onApplySuggestion?: ((nextBody: string, successText: string) => void) | null;
  onRequestAiRewrite?: (() => void) | null;
  rewriteBusy?: boolean;
}) {
  const alignment = review?.evidence_alignment || null;
  if (!alignment || !body.trim()) return null;

  const supportedClaims = alignment.cited_claims || [];
  const weakClaims = alignment.weak_claims || [];
  const unsupportedClaims = alignment.unsupported_claims || [];
  const segments = sentenceLikeSegments(body).slice(0, 12);
  if (segments.length === 0) return null;
  const segmentReviews = segments.map((segment) => {
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

    return {
      segment,
      kind,
      helper,
      sourceUrl,
      suggestions: buildSuggestions({
        kind,
        segment,
        context: prospectContext,
        evidenceRows,
      }),
    };
  });
  const actionableSegments = segmentReviews.filter(
    (item) => (item.kind === "weak" || item.kind === "unsupported") && item.suggestions.length > 0,
  );

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-gray-900">Claim-Check im Draft</div>
          {refreshing ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800">
              Review wird aktualisiert
            </span>
          ) : stale ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
              basiert auf letzter Bewertung
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRequestAiRewrite ? (
            <button
              type="button"
              className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-800 hover:bg-blue-100 disabled:opacity-60"
              disabled={rewriteBusy}
              onClick={() => onRequestAiRewrite()}
            >
              {rewriteBusy ? "KI schaerft..." : "Mit KI nachschaerfen"}
            </button>
          ) : null}
          {onApplySuggestion && actionableSegments.length >= 2 ? (
            <button
              type="button"
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-800 hover:bg-amber-100"
              onClick={() => {
                let nextBody = body;
                let applied = 0;
                for (const item of actionableSegments) {
                  const preferred = item.suggestions.find((suggestion) => suggestion.id !== "remove") || item.suggestions[0];
                  if (!preferred) continue;
                  const updated = replaceSegmentInBody(nextBody, item.segment, preferred.replacement);
                  if (updated !== nextBody) {
                    nextBody = updated;
                    applied += 1;
                  }
                }
                if (applied > 0) {
                  onApplySuggestion(nextBody, `${applied} schwache Aussagen nachgeschaerft.`);
                }
              }}
            >
              Sichere Fixes uebernehmen
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-gray-600">
        Jede relevante Aussage wird gegen gespeicherte Evidenz gespiegelt.
      </div>
      {actionableSegments.length > 0 ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          {actionableSegments.length === 1
            ? "Eine Aussage sollte direkt im Draft nachgeschaerft werden."
            : `${actionableSegments.length} Aussagen sollten direkt im Draft nachgeschaerft werden.`}
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {segmentReviews.map(({ segment, kind, helper, sourceUrl, suggestions }, index) => {
          const canApply = Boolean(onApplySuggestion) && (kind === "weak" || kind === "unsupported");
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
              {canApply && suggestions.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <div className="text-[11px] font-medium text-gray-700">
                    Direkte Hilfe fuer diese Stelle
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${segment}-${suggestion.id}`}
                        type="button"
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          const nextBody = replaceSegmentInBody(body, segment, suggestion.replacement);
                          if (nextBody !== body) {
                            onApplySuggestion?.(
                              nextBody,
                              suggestion.id === "remove"
                                ? "Schwache Aussage entfernt."
                                : "Verbesserung in den Draft uebernommen.",
                            );
                          }
                        }}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <div
                        key={`${segment}-${suggestion.id}-preview`}
                        className="rounded-md border border-gray-200 bg-white px-2 py-2 text-[11px] text-gray-700"
                      >
                        <div className="font-medium text-gray-900">{suggestion.label}</div>
                        <div className="mt-1">{suggestion.replacement || "Aussage wird aus dem Draft entfernt."}</div>
                        <div className="mt-1 text-gray-500">{suggestion.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
