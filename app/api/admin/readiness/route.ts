import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

function filled(v: unknown) {
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  if (typeof v === "boolean") return true;
  if (v === null || v === undefined) return false;
  return String(v).trim().length > 0;
}

function propertyScore(p: any) {
  const checks = [
    filled(p?.city),
    filled(p?.street_address),
    filled(p?.type),
    filled(p?.price),
    filled(p?.rooms),
    filled(p?.size_sqm),
    filled(p?.available_from),
    filled(p?.listing_summary),
    filled(p?.description),
  ];
  const done = checks.filter(Boolean).length;
  return (done / checks.length) * 100;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();

  const [{ data: agents }, { data: properties }] = await Promise.all([
    (supa.from("agents") as any)
      .select("id, email, name, company, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    (supa.from("properties") as any)
      .select("id, agent_id, city, street_address, type, price, rooms, size_sqm, available_from, listing_summary, description, status, updated_at")
      .limit(50000),
  ]);

  const byAgent = new Map<
    string,
    {
      property_count: number;
      published_count: number;
      avg_score_sum: number;
      low_quality_count: number;
      stale_count: number;
    }
  >();
  const ensure = (id: string) => {
    if (!byAgent.has(id)) {
      byAgent.set(id, {
        property_count: 0,
        published_count: 0,
        avg_score_sum: 0,
        low_quality_count: 0,
        stale_count: 0,
      });
    }
    return byAgent.get(id)!;
  };

  for (const p of properties || []) {
    const agentId = String(p?.agent_id || "").trim();
    if (!agentId) continue;
    const row = ensure(agentId);
    row.property_count += 1;

    const score = propertyScore(p);
    row.avg_score_sum += score;
    if (score < 70) row.low_quality_count += 1;
    if (String(p?.status || "").toLowerCase() === "published") row.published_count += 1;

    const updated = p?.updated_at ? new Date(String(p.updated_at)).getTime() : NaN;
    if (!Number.isFinite(updated) || Date.now() - updated > 30 * 24 * 60 * 60 * 1000) {
      row.stale_count += 1;
    }
  }

  const rows = (agents || []).map((a: any) => {
    const r = ensure(String(a.id));
    const avgScore = r.property_count > 0 ? r.avg_score_sum / r.property_count : null;
    const autopilotReady =
      r.property_count >= 5 &&
      avgScore !== null &&
      avgScore >= 80 &&
      r.low_quality_count <= 1;

    return {
      agent_id: String(a.id),
      name: a.name ?? null,
      email: a.email ?? null,
      company: a.company ?? null,
      property_count: r.property_count,
      published_count: r.published_count,
      avg_readiness_score: avgScore === null ? null : Math.round(avgScore * 10) / 10,
      low_quality_count: r.low_quality_count,
      stale_count: r.stale_count,
      autopilot_ready: autopilotReady,
    };
  });

  const filtered = rows
    .filter((r) => {
      if (!q) return true;
      return `${r.name || ""} ${r.email || ""} ${r.company || ""}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aScore = a.avg_readiness_score ?? -1;
      const bScore = b.avg_readiness_score ?? -1;
      return aScore - bScore || b.low_quality_count - a.low_quality_count;
    });

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    rows: filtered,
  });
}
