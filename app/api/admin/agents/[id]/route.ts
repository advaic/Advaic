import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const gate = await requireAdmin(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const agentId = String(ctx.params.id || "").trim();
  if (!agentId)
    return NextResponse.json({ error: "Missing agent id" }, { status: 400 });

  const { data: agent, error: aErr } = await (supa.from("agents") as any)
    .select("id, email, name, company, created_at")
    .eq("id", agentId)
    .maybeSingle();

  if (aErr)
    return NextResponse.json(
      { error: "Failed to load agent", details: aErr.message },
      { status: 500 },
    );
  if (!agent)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const { data: settings } = await (supa.from("agent_settings") as any)
    .select(
      "agent_id, autosend_enabled, followups_enabled_default, onboarding_completed, updated_at",
    )
    .eq("agent_id", agentId)
    .maybeSingle();

  const { data: conns } = await (supa.from("email_connections") as any)
    .select(
      "id, provider, status, email_address, expires_at, last_error, updated_at",
    )
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });

  const { data: recentSends } = await (supa.from("messages") as any)
    .select(
      "id, lead_id, send_status, send_error, email_provider, subject, timestamp, sent_at, was_followup",
    )
    .eq("agent_id", agentId)
    .in("send_status", ["pending", "sending", "sent", "failed"])
    .order("timestamp", { ascending: false })
    .limit(50);

  const { data: recentLeads } = await (supa.from("leads") as any)
    .select(
      "id, name, email, last_message_at, last_agent_message_at, email_provider, followups_enabled",
    )
    .eq("agent_id", agentId)
    .order("last_message_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    ok: true,
    agent,
    settings: settings || null,
    connections: conns || [],
    recent_sends: recentSends || [],
    recent_leads: recentLeads || [],
  });
}
