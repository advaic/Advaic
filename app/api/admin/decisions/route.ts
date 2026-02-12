import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { requireAdmin } from "@/app/api/admin/_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function asInt(v: string | null, def: number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), 500);
}

export async function GET(req: NextRequest) {
  // ✅ Admin-only
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error || "Unauthorized" },
      { status: guard.status || 401 },
    );
  }

  const supabase = supabaseAdmin();

  const url = new URL(req.url);
  const verdict = (url.searchParams.get("verdict") || "").trim().toLowerCase();
  const risk = (url.searchParams.get("risk") || "").trim().toLowerCase();
  const agentId = (url.searchParams.get("agent_id") || "").trim();
  const leadId = (url.searchParams.get("lead_id") || "").trim();
  const limit = asInt(url.searchParams.get("limit"), 100);

  let q = (supabase.from("message_qas") as any)
    .select(
      "id, created_at, agent_id, lead_id, inbound_message_id, draft_message_id, prompt_key, prompt_version, model, verdict, score, reason, reason_long, action, risk_flags",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentId) q = q.eq("agent_id", agentId);
  if (leadId) q = q.eq("lead_id", leadId);

  if (verdict) {
    // Accept "pass" | "warn" | "fail" (contains match)
    // We do ilike for flexibility
    q = q.ilike("verdict", `%${verdict}%`);
  }

  // risk_flags is text[]
  if (risk) {
    // filter where risk_flags contains requested risk (case-insensitive fallback)
    // Supabase doesn't have great "ilike any array" → we use "contains" with exact.
    // If you keep canonical snake flags, this is enough.
    q = q.contains("risk_flags", [risk]);
  }

  const { data: rows, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load decisions", details: error.message },
      { status: 500 },
    );
  }

  const items = (rows || []) as any[];

  // Batch preload agents/leads/drafts
  const agentIds = Array.from(new Set(items.map((r) => String(r.agent_id))));
  const leadIds = Array.from(new Set(items.map((r) => String(r.lead_id))));
  const draftIds = Array.from(
    new Set(items.map((r) => String(r.draft_message_id))),
  );

  const [agentsRes, leadsRes, draftsRes] = await Promise.all([
    agentIds.length
      ? (supabase.from("agents") as any)
          .select("id, email, name")
          .in("id", agentIds)
      : Promise.resolve({ data: [] as any[] }),
    leadIds.length
      ? (supabase.from("leads") as any)
          .select("id, email, name")
          .in("id", leadIds)
      : Promise.resolve({ data: [] as any[] }),
    draftIds.length
      ? (supabase.from("messages") as any)
          .select(
            "id, send_status, email_provider, send_error, status, approval_required, timestamp",
          )
          .in("id", draftIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const agentMap = new Map<string, any>();
  for (const a of (agentsRes as any).data || []) agentMap.set(String(a.id), a);

  const leadMap = new Map<string, any>();
  for (const l of (leadsRes as any).data || []) leadMap.set(String(l.id), l);

  const draftMap = new Map<string, any>();
  for (const d of (draftsRes as any).data || []) draftMap.set(String(d.id), d);

  const hydrated = items.map((r) => ({
    ...r,
    agent: agentMap.get(String(r.agent_id)) || null,
    lead: leadMap.get(String(r.lead_id)) || null,
    draft: draftMap.get(String(r.draft_message_id)) || null,
  }));

  return NextResponse.json({
    ok: true,
    count: hydrated.length,
    items: hydrated,
  });
}
