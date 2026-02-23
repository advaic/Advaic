import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "@/app/api/admin/_guard";

export const runtime = "nodejs";

function toInt(v: string | null, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error || "Forbidden" },
      { status: guard.status || 403 },
    );
  }

  const url = new URL(req.url);
  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
  const limit = toInt(url.searchParams.get("limit"), 100, 1, 500);

  let q = (supabaseAdmin().from("billing_webhook_events") as any)
    .select(
      "event_id, event_type, status, attempt_count, received_at, last_attempt_at, processed_at, error",
    )
    .order("last_attempt_at", { ascending: false })
    .limit(limit);

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { error: "webhook_events_load_failed", details: String(error.message || error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    events: Array.isArray(data) ? data : [],
    count: Array.isArray(data) ? data.length : 0,
  });
}

