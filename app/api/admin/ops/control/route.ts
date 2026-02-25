import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";
import { readRuntimeControl } from "@/lib/ops/runtime-control";

export const runtime = "nodejs";

type Body = {
  action?: "pause_all" | "resume_all" | "pause_pipeline" | "resume_pipeline";
  pipeline?: "reply_ready_send" | "followups" | "onboarding_recovery" | "outlook_fetch";
  reason?: string;
};

const PIPELINE_COLUMN: Record<
  NonNullable<Body["pipeline"]>,
  "pause_reply_ready_send" | "pause_followups" | "pause_onboarding_recovery" | "pause_outlook_fetch"
> = {
  reply_ready_send: "pause_reply_ready_send",
  followups: "pause_followups",
  onboarding_recovery: "pause_onboarding_recovery",
  outlook_fetch: "pause_outlook_fetch",
};

function sanitizeReason(value: unknown) {
  const reason = String(value ?? "").trim().slice(0, 300);
  return reason || null;
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) return NextResponse.json({ error: "missing_action" }, { status: 400 });

  const supa = supabaseAdmin();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    id: true,
    updated_at: nowIso,
    updated_by: gate.user.id,
  };

  const reason = sanitizeReason(body.reason);
  if (body.action === "pause_all") {
    patch.pause_all = true;
    patch.reason = reason || "Manuelle Notfall-Pause (Admin)";
  } else if (body.action === "resume_all") {
    patch.pause_all = false;
    patch.pause_reply_ready_send = false;
    patch.pause_followups = false;
    patch.pause_onboarding_recovery = false;
    patch.pause_outlook_fetch = false;
    patch.reason = reason;
  } else if (body.action === "pause_pipeline") {
    if (!body.pipeline || !PIPELINE_COLUMN[body.pipeline]) {
      return NextResponse.json({ error: "missing_pipeline" }, { status: 400 });
    }
    patch[PIPELINE_COLUMN[body.pipeline]] = true;
    patch.reason = reason || `Pipeline pausiert: ${body.pipeline}`;
  } else if (body.action === "resume_pipeline") {
    if (!body.pipeline || !PIPELINE_COLUMN[body.pipeline]) {
      return NextResponse.json({ error: "missing_pipeline" }, { status: 400 });
    }
    patch[PIPELINE_COLUMN[body.pipeline]] = false;
    if (reason) patch.reason = reason;
  } else {
    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  }

  const { error } = await (supa.from("ops_runtime_controls") as any).upsert(patch, {
    onConflict: "id",
  });
  if (error) {
    return NextResponse.json(
      { error: "ops_control_update_failed", details: error.message },
      { status: 500 },
    );
  }

  const control = await readRuntimeControl(supa);
  return NextResponse.json({ ok: true, control });
}

