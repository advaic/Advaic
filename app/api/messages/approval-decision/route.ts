import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

const PROMPT_KEY = "approval_decision_v1";
const PROMPT_VERSION = "v1";

type DecisionAction = "approve_direct" | "approve_after_edit" | "reject";

type Body = {
  message_id?: string;
  action?: DecisionAction | string;
  reason_code?: string | null;
  reason_note?: string | null;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function normalizeAction(raw: unknown): DecisionAction | null {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "approve_direct") return "approve_direct";
  if (v === "approve_after_edit") return "approve_after_edit";
  if (v === "reject") return "reject";
  return null;
}

function normalizeReasonCode(raw: unknown): string | null {
  const code = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 64);
  return code || null;
}

function mapVerdict(action: DecisionAction): "pass" | "warn" | "fail" {
  if (action === "approve_direct") return "pass";
  if (action === "approve_after_edit") return "warn";
  return "fail";
}

function mapReason(action: DecisionAction, reasonCode: string | null): string {
  if (reasonCode) return reasonCode;
  if (action === "approve_direct") return "approved_direct";
  if (action === "approve_after_edit") return "approved_after_edit";
  return "rejected_by_agent";
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "missing_body");

  const messageId = String(body.message_id || "").trim();
  if (!messageId) return jsonError(400, "missing_message_id");

  const action = normalizeAction(body.action);
  if (!action) {
    return jsonError(400, "invalid_action", {
      expected: ["approve_direct", "approve_after_edit", "reject"],
    });
  }

  const reasonCode = normalizeReasonCode(body.reason_code);
  if ((action === "approve_after_edit" || action === "reject") && !reasonCode) {
    return jsonError(400, "missing_reason_code");
  }

  const reasonNote = String(body.reason_note || "").trim().slice(0, 1000);

  const { data: msg, error: msgErr } = await (admin.from("messages") as any)
    .select("id, lead_id, agent_id, text")
    .eq("id", messageId)
    .eq("agent_id", String(user.id))
    .maybeSingle();

  if (msgErr) return jsonError(500, "message_lookup_failed", { details: msgErr.message });
  if (!msg) return jsonError(404, "message_not_found");

  const verdict = mapVerdict(action);
  const reason = mapReason(action, reasonCode);
  const meta = {
    action,
    reason_code: reasonCode,
    reason_note: reasonNote || null,
    source: "approval_inbox",
    tracked_at: new Date().toISOString(),
  };

  const { data: existing } = await (admin.from("message_qas") as any)
    .select("id, meta")
    .eq("draft_message_id", messageId)
    .eq("prompt_key", PROMPT_KEY)
    .eq("prompt_version", PROMPT_VERSION)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await (admin.from("message_qas") as any)
      .update({
        verdict,
        reason,
        reason_long: reasonNote || null,
        action,
        risk_flags: reasonCode ? [reasonCode] : [],
        meta: {
          ...(existing?.meta && typeof existing.meta === "object" ? existing.meta : {}),
          ...meta,
        },
      })
      .eq("id", String(existing.id))
      .select("id, verdict, reason, action, meta")
      .maybeSingle();

    if (error) {
      return jsonError(500, "approval_decision_update_failed", { details: error.message });
    }
    return NextResponse.json({ ok: true, tracked: data || null });
  }

  const payload = {
    agent_id: String(user.id),
    lead_id: String(msg.lead_id || ""),
    inbound_message_id: messageId,
    draft_message_id: messageId,
    stage: PROMPT_KEY,
    verdict,
    reason,
    reason_long: reasonNote || null,
    action,
    model: "human_review",
    prompt_key: PROMPT_KEY,
    prompt_version: PROMPT_VERSION,
    risk_flags: reasonCode ? [reasonCode] : [],
    meta,
  } as Record<string, any>;

  const { data, error } = await (admin.from("message_qas") as any)
    .insert(payload)
    .select("id, verdict, reason, action, meta")
    .maybeSingle();

  if (error) {
    return jsonError(500, "approval_decision_insert_failed", { details: error.message });
  }

  return NextResponse.json({ ok: true, tracked: data || null });
}
