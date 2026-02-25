import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";

export const runtime = "nodejs";

function clampDays(value: string | null, fallback = 30) {
  const n = Number(value || fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(7, Math.min(90, Math.floor(n)));
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const days = clampDays(req.nextUrl.searchParams.get("days"), 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supa = supabaseAdmin();
  const { data, error } = await (supa.from("marketing_events") as any)
    .select("created_at, event, source, cta_variant, path")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(12000);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "marketing_events_load_failed",
        details: String(error.message || error),
      },
      { status: 500 },
    );
  }

  const rows = Array.isArray(data) ? data : [];
  const total = rows.length;
  const eventCounts = new Map<string, number>();
  const variantCounts = new Map<string, number>();
  const topPaths = new Map<string, number>();

  for (const row of rows) {
    const event = String(row?.event || "unknown").trim() || "unknown";
    const variant = String(row?.cta_variant || "none").trim() || "none";
    const path = String(row?.path || "-").trim() || "-";

    eventCounts.set(event, (eventCounts.get(event) || 0) + 1);
    variantCounts.set(variant, (variantCounts.get(variant) || 0) + 1);
    topPaths.set(path, (topPaths.get(path) || 0) + 1);
  }

  const asSorted = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

  return NextResponse.json({
    ok: true,
    window_days: days,
    since,
    total_events: total,
    event_counts: asSorted(eventCounts),
    cta_variant_counts: asSorted(variantCounts),
    top_paths: asSorted(topPaths),
  });
}
