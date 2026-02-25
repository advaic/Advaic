import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

type RolloutMode = "observe" | "assist" | "autopilot";

function modeFromSettings(s: any): RolloutMode {
  const autosend = Boolean(s?.autosend_enabled);
  const replyMode = String(s?.reply_mode || "").toLowerCase();
  const followups = Boolean(s?.followups_enabled_default);
  if (autosend && replyMode === "auto") return "autopilot";
  if (!autosend && followups) return "assist";
  return "observe";
}

function presetForMode(mode: RolloutMode) {
  if (mode === "autopilot") {
    return {
      autosend_enabled: true,
      reply_mode: "auto",
      auto_send_min_confidence: 0.75,
      followups_enabled_default: true,
    };
  }
  if (mode === "assist") {
    return {
      autosend_enabled: false,
      reply_mode: "approval",
      auto_send_min_confidence: 0.85,
      followups_enabled_default: true,
    };
  }
  return {
    autosend_enabled: false,
    reply_mode: "approval",
    auto_send_min_confidence: 0.95,
    followups_enabled_default: false,
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: agents }, { data: settings }, { data: recentMsgs }] = await Promise.all([
    (supa.from("agents") as any)
      .select("id, email, name, company, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    (supa.from("agent_settings") as any)
      .select("agent_id, autosend_enabled, reply_mode, auto_send_min_confidence, followups_enabled_default, onboarding_completed, updated_at")
      .limit(2000),
    (supa.from("messages") as any)
      .select("agent_id, send_status, status, timestamp")
      .gte("timestamp", sinceIso)
      .limit(50000),
  ]);

  const settingsMap = new Map<string, any>();
  for (const s of settings || []) settingsMap.set(String(s.agent_id), s);

  const stats = new Map<string, { sent: number; failed: number; needs_human: number }>();
  const ensure = (id: string) => {
    if (!stats.has(id)) stats.set(id, { sent: 0, failed: 0, needs_human: 0 });
    return stats.get(id)!;
  };
  for (const m of recentMsgs || []) {
    const id = String(m?.agent_id || "").trim();
    if (!id) continue;
    const row = ensure(id);
    const sendStatus = String(m?.send_status || "").toLowerCase();
    const status = String(m?.status || "").toLowerCase();
    if (sendStatus === "sent") row.sent += 1;
    if (sendStatus === "failed") row.failed += 1;
    if (status === "needs_human") row.needs_human += 1;
  }

  const rows = (agents || []).map((a: any) => {
    const s = settingsMap.get(String(a.id)) || {};
    const m = ensure(String(a.id));
    const failedRate = m.sent > 0 ? m.failed / (m.sent + m.failed) : 0;
    const risk =
      m.failed >= 5 || m.needs_human >= 5
        ? "high"
        : m.failed >= 2 || m.needs_human >= 2
          ? "medium"
          : "low";
    return {
      agent_id: String(a.id),
      name: a.name ?? null,
      email: a.email ?? null,
      company: a.company ?? null,
      mode: modeFromSettings(s),
      onboarding_completed: Boolean(s?.onboarding_completed),
      autosend_enabled: Boolean(s?.autosend_enabled),
      followups_enabled_default: Boolean(s?.followups_enabled_default),
      reply_mode: s?.reply_mode || null,
      auto_send_min_confidence: s?.auto_send_min_confidence ?? null,
      sent_7d: m.sent,
      failed_7d: m.failed,
      needs_human_7d: m.needs_human,
      failed_rate_7d: failedRate,
      risk,
      settings_updated_at: s?.updated_at || null,
    };
  });

  rows.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return (
      (order[a.risk] ?? 3) - (order[b.risk] ?? 3) ||
      b.failed_7d - a.failed_7d
    );
  });

  return NextResponse.json({
    ok: true,
    since: sinceIso,
    count: rows.length,
    rows,
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    agent_id?: string;
    mode?: RolloutMode;
  };

  const action = String(body.action || "").trim().toLowerCase();
  if (action !== "set_mode") {
    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  }

  const agentId = String(body.agent_id || "").trim();
  if (!agentId) return NextResponse.json({ error: "missing_agent_id" }, { status: 400 });

  const modeRaw = String(body.mode || "").trim().toLowerCase();
  const mode: RolloutMode =
    modeRaw === "autopilot" ? "autopilot" : modeRaw === "assist" ? "assist" : "observe";
  const preset = presetForMode(mode);

  const { data, error } = await (supa.from("agent_settings") as any)
    .upsert(
      {
        agent_id: agentId,
        ...preset,
      },
      { onConflict: "agent_id" },
    )
    .select("agent_id, autosend_enabled, followups_enabled_default, reply_mode, auto_send_min_confidence, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "set_mode_failed", details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    action,
    mode,
    settings: data,
  });
}
