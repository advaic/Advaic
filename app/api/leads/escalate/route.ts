import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  agent_id: string;
  lead_id: string;
  reason?: string | null;
  event_id?: string | null;
};

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

function siteUrl() {
  return mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
}

async function safeJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

async function enqueueBestEffort(payload: any) {
  try {
    await fetch(`${siteUrl()}/api/notifications/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow
  }
}

export async function POST(req: Request) {
  // Internal secret gate
  const headerSecret = req.headers.get("x-advaic-internal-secret") || "";
  if (headerSecret !== process.env.ADVAIC_INTERNAL_PIPELINE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await safeJson<Body>(req);
  if (!body?.agent_id || !body?.lead_id) {
    return NextResponse.json(
      { error: "missing_required_fields", required: ["agent_id", "lead_id"] },
      { status: 400 },
    );
  }

  const supabase = supabaseAdmin();
  const agentId = String(body.agent_id).trim();
  const leadId = String(body.lead_id).trim();
  const reason = String(body.reason || "").trim() || null;

  // Verify ownership + get lead name for notification
  const { data: lead, error: leadErr } = await (supabase.from("leads") as any)
    .select("id, agent_id, name, escalated, escalation_case_status")
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (leadErr) {
    return NextResponse.json(
      { ok: false, error: leadErr.message },
      { status: 500 },
    );
  }
  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found" },
      { status: 404 },
    );
  }

  // Escalate + stop followups (so nothing auto-triggers while it’s escalated)
  const patch: any = {
    escalated: true,
    escalation_case_status: "open",
    followups_enabled: false,
    followups_pause_reason: reason,
    // optional: also pause explicitly
    followup_paused_until: null,
  };

  const { data: updated, error: updErr } = await (supabase.from("leads") as any)
    .update(patch)
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .select("id, escalated, escalation_case_status, followups_enabled")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: updErr.message },
      { status: 500 },
    );
  }

  // Enqueue escalation notification (email/slack/dashboard)
  await enqueueBestEffort({
    agent_id: agentId,
    type: "escalation_created",
    entity_type: "lead",
    entity_id: leadId,
    payload: {
      lead_id: leadId,
      lead_name: String((lead as any).name || "").trim() || null,
      reason,
      deep_link: "/app/eskalationen",
    },
    dispatch_now: true,
  });

  return NextResponse.json({ ok: true, lead: updated ?? { id: leadId } });
}
