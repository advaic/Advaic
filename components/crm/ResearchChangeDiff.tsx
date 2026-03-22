type ChangeItem = {
  field?: string;
  label?: string;
  severity?: "high" | "medium" | string;
  previous?: string | null;
  current?: string | null;
  summary?: string | null;
};

function severityClass(value: string | null | undefined) {
  if (String(value || "").toLowerCase() === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function ResearchChangeDiff({
  summary,
  items,
  compact = false,
  className = "",
}: {
  summary?: string | null;
  items: ChangeItem[];
  compact?: boolean;
  className?: string;
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 ${className}`.trim()}>
      <div className="text-xs font-semibold text-gray-900">Aenderungs-Diff</div>
      {summary ? <div className="mt-1 text-[11px] text-gray-600">{summary}</div> : null}
      <div className="mt-3 space-y-2">
        {items.slice(0, compact ? 3 : 8).map((item, index) => (
          <div key={`${item.field || item.label || "change"}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium text-gray-900">{item.label || item.field || "Signal"}</div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${severityClass(item.severity)}`}>
                {String(item.severity || "medium").toLowerCase() === "high" ? "Hoch" : "Mittel"}
              </span>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">Vorher</div>
                <div className="mt-1 text-xs text-gray-700">{item.previous || "unbekannt"}</div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-blue-700">Jetzt</div>
                <div className="mt-1 text-xs text-blue-900">{item.current || "unbekannt"}</div>
              </div>
            </div>
            {!compact && item.summary ? <div className="mt-2 text-[11px] text-gray-500">{item.summary}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
