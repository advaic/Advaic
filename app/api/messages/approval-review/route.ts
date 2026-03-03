import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { upsertHumanApprovalReview } from "@/lib/security/approval-review";

export const runtime = "nodejs";

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

type Body = {
  message_id?: string;
  edited?: boolean;
  original_text?: string;
  final_text?: string;
  editing_seconds?: number;
  quality_score_before_send?: number;
  approval_age_minutes?: number;
};

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
  const messageId = String(body?.message_id || "").trim();
  if (!messageId) return jsonError(400, "missing_message_id");

  const { data: msg, error: msgErr } = await (admin.from("messages") as any)
    .select("id, lead_id, agent_id, text, approval_required")
    .eq("id", messageId)
    .eq("agent_id", String(user.id))
    .maybeSingle();

  if (msgErr) return jsonError(500, "message_lookup_failed", { details: msgErr.message });
  if (!msg) return jsonError(404, "message_not_found");

  const tracked = await upsertHumanApprovalReview(admin, {
    agentId: String(user.id),
    leadId: String(msg.lead_id),
    messageId,
    edited: Boolean(body?.edited),
    originalText: String(body?.original_text ?? msg.text ?? ""),
    finalText: String(body?.final_text ?? msg.text ?? ""),
    source: "approval_inbox",
    editingSeconds:
      typeof body?.editing_seconds === "number" ? body.editing_seconds : null,
    qualityScoreBeforeSend:
      typeof body?.quality_score_before_send === "number"
        ? body.quality_score_before_send
        : null,
    approvalAgeMinutes:
      typeof body?.approval_age_minutes === "number"
        ? body.approval_age_minutes
        : null,
  });

  if (!tracked.ok) {
    return jsonError(500, "approval_review_track_failed", {
      details: tracked.error,
    });
  }

  return NextResponse.json({
    ok: true,
    tracked,
  });
}
