import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { getAutosendBaseline, getLeadPropertyGate } from "@/lib/security/autosend-gate";
import { getCommercialAccess } from "@/lib/billing/commercial-access";
import { isPipelinePaused, readRuntimeControl } from "@/lib/ops/runtime-control";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function isInternal(req: Request) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
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
    }
  );
}

async function readSendResponse(res: Response) {
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    return {
      ok: false,
      status: "error",
      error: String(data?.error || "send_failed"),
      data,
    };
  }
  const status = String(data?.status || data?.message?.status || "ok");
  return { ok: true, status, data };
}

function buildSubject(lead: any) {
  const s = lead?.subject || lead?.type || "Anfrage";
  return `Re: ${String(s).slice(0, 140)}`;
}

const UPSTREAM_REPLY_READY_STAGES = [
  "/api/pipeline/reply-ready/intent/run",
  "/api/pipeline/route-resolve/run",
  "/api/pipeline/reply-ready/draft/run",
  "/api/pipeline/reply-ready/qa/run",
  "/api/pipeline/reply-ready/rewrite/run",
  "/api/pipeline/reply-ready/qa-recheck/run",
] as const;

async function runUpstreamReplyReadyStages(args: {
  siteUrl: string;
  secret: string;
  onlyMessageId?: string | null;
}) {
  const stageRuns: Array<{
    stage: string;
    ok: boolean;
    status: number;
    error?: string;
    processed?: number;
  }> = [];

  for (const stage of UPSTREAM_REPLY_READY_STAGES) {
    try {
      const res = await fetch(new URL(stage, args.siteUrl).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-advaic-internal-secret": args.secret,
        },
        body: JSON.stringify(
          args.onlyMessageId ? { message_id: args.onlyMessageId } : {}
        ),
      });

      const payload = await res.json().catch(() => ({} as any));
      stageRuns.push({
        stage,
        ok: res.ok,
        status: res.status,
        error: res.ok ? undefined : String(payload?.error || "stage_failed"),
        processed: Number.isFinite(Number(payload?.processed))
          ? Number(payload.processed)
          : undefined,
      });
    } catch (e: any) {
      stageRuns.push({
        stage,
        ok: false,
        status: 0,
        error: String(e?.message || "stage_fetch_failed"),
      });
    }
  }

  return stageRuns;
}

export async function POST(req: NextRequest) {
  const startedAtMs = Date.now();
  const pipeline = "reply_ready_send";
  const internal = isInternal(req);
  const body = (await req.json().catch(() => null)) as
    | { id?: string; message_id?: string }
    | null;
  const onlyMessageId = String(body?.message_id || body?.id || "").trim();
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const secret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");
  let stageRuns: Awaited<ReturnType<typeof runUpstreamReplyReadyStages>> = [];
  let scopedAgentId: string | null = null;

  if (!internal) {
    const authRes = NextResponse.next();
    const supabaseAuth = supabaseFromReq(req, authRes);
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    scopedAgentId = String(user.id);
  }

  const supabase = supabaseAdmin();
  const control = await readRuntimeControl(supabase);
  if (isPipelinePaused(control, "reply_ready_send")) {
    if (internal) {
      stageRuns = await runUpstreamReplyReadyStages({
        siteUrl,
        secret,
        onlyMessageId: onlyMessageId || null,
      });
    }
    await logPipelineRun(supabase, {
      pipeline,
      status: "paused",
      startedAtMs,
      meta: {
        reason: control.reason,
        control_source: control.source,
        internal,
        stage_runs: stageRuns,
      },
    });
    return NextResponse.json(
      {
        ok: true,
        paused: true,
        reason: control.reason || "pipeline_paused",
        stage_runs: stageRuns,
      },
      { status: 200 },
    );
  }

  // Background runner self-heals the full chain:
  // intent -> route resolve -> draft -> qa -> rewrite -> qa-recheck -> send.
  // This keeps existing cron setups functional even if only `/send/run` is scheduled.
  if (internal) {
    stageRuns = await runUpstreamReplyReadyStages({
      siteUrl,
      secret,
      onlyMessageId: onlyMessageId || null,
    });
  }

  // 1) Pull ready_to_send drafts
  let draftsQ = (supabase.from("messages") as any)
    .select(
      "id, agent_id, lead_id, text, status, approval_required, send_status, timestamp, was_followup"
    )
    .in("sender", ["agent", "assistant"]) // be backward-compatible
    .eq("status", "ready_to_send")
    .eq("approval_required", false)
    .in("send_status", ["pending", "failed"])
    .order("timestamp", { ascending: true })
    .limit(25);

  if (scopedAgentId) {
    draftsQ = draftsQ.eq("agent_id", scopedAgentId);
  }
  if (onlyMessageId) {
    draftsQ = draftsQ.eq("id", onlyMessageId);
  }

  const { data: drafts, error: draftsErr } = await draftsQ;

  if (draftsErr) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "error",
      startedAtMs,
      failed: 1,
      meta: {
        step: "load_drafts",
        details: draftsErr.message,
      },
    });
    return NextResponse.json(
      {
        error: "Failed to load ready_to_send drafts",
        details: draftsErr.message,
      },
      { status: 500 }
    );
  }

  if (!drafts || drafts.length === 0) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "ok",
      startedAtMs,
      processed: 0,
      meta: {
        reason: "no_drafts",
        stage_runs: stageRuns,
      },
    });
    return NextResponse.json({ ok: true, processed: 0, results: [], stage_runs: stageRuns });
  }

  // 2) Preload agent_settings for autosend gate
  // Supabase `.in()` expects `string[]` here; drafts can be `any/unknown`, so we normalize explicitly.
  const agentIds: string[] = Array.from(
    new Set(
      (drafts as any[])
        .map((d) => (d?.agent_id ? String(d.agent_id).trim() : ""))
        .filter((v) => v.length > 0)
    )
  );

  if (agentIds.length === 0) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "warning",
      startedAtMs,
      processed: 0,
      skipped: drafts.length,
      meta: { reason: "missing_agent_ids" },
    });
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  const { data: settingsRows } = await (supabase.from("agent_settings") as any)
    .select("agent_id, autosend_enabled")
    .in("agent_id", agentIds);

  const autosendMap = new Map<string, boolean>();
  for (const s of settingsRows || []) {
    autosendMap.set(String(s.agent_id), !!s.autosend_enabled);
  }

  const autosendBaselineCache = new Map<string, Awaited<ReturnType<typeof getAutosendBaseline>>>();
  const leadPropertyGateCache = new Map<string, Awaited<ReturnType<typeof getLeadPropertyGate>>>();
  const commercialAccessMap = new Map<
    string,
    Awaited<ReturnType<typeof getCommercialAccess>>["access"]
  >();

  await Promise.all(
    agentIds.map(async (agentId) => {
      const accessRes = await getCommercialAccess({ supabase, agentId });
      commercialAccessMap.set(agentId, accessRes.access);
    }),
  );

  const results: any[] = [];

  for (const d of drafts) {
    const messageId = String(d.id);
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);
    const isFollowup = !!(d as any).was_followup;
    const commercialAccess = commercialAccessMap.get(agentId) || null;

    const markFailed = async (
      send_error: string,
      extra?: Record<string, any>
    ) => {
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          send_status: "failed",
          send_error,
          ...(extra || {}),
        })
        .eq("id", messageId);
    };

    if (commercialAccess?.upgrade_required) {
      await markFailed("payment_required_trial_expired");
      results.push({
        messageId,
        leadId,
        status: "blocked_trial_expired",
      });
      continue;
    }

    // Safety: only send if autosend_enabled is still true
    if (!autosendMap.get(agentId)) {
      // downgrade to approval so it doesn't get stuck
      await (supabase.from("messages") as any)
        .update({ status: "needs_approval", approval_required: true })
        .eq("id", messageId);

      results.push({ messageId, leadId, status: "skipped_autosend_disabled" });
      continue;
    }

    if (!autosendBaselineCache.has(agentId)) {
      autosendBaselineCache.set(agentId, await getAutosendBaseline(supabase, agentId));
    }
    const autosendBaseline = autosendBaselineCache.get(agentId)!;
    if (!autosendBaseline.eligible) {
      await (supabase.from("messages") as any)
        .update({ status: "needs_approval", approval_required: true })
        .eq("id", messageId);

      results.push({
        messageId,
        leadId,
        status: "skipped_autosend_gate_not_ready",
        reasons: autosendBaseline.reasons,
      });
      continue;
    }

    const leadKey = `${agentId}:${leadId}`;
    if (!leadPropertyGateCache.has(leadKey)) {
      leadPropertyGateCache.set(leadKey, await getLeadPropertyGate(supabase, agentId, leadId));
    }
    const leadPropertyGate = leadPropertyGateCache.get(leadKey)!;
    if (!leadPropertyGate.ready) {
      await (supabase.from("messages") as any)
        .update({ status: "needs_approval", approval_required: true })
        .eq("id", messageId);

      results.push({
        messageId,
        leadId,
        status: "skipped_missing_property_context",
        reason: leadPropertyGate.reason,
        missing_fields: leadPropertyGate.missing_fields,
        active_property_id: leadPropertyGate.active_property_id,
      });
      continue;
    }

    // 3) Load lead (to, thread_id, subject)
    const { data: lead } = await (supabase.from("leads") as any)
      .select(
        "id, agent_id, email, gmail_thread_id, outlook_conversation_id, email_provider, subject, type, followups_enabled"
      )
      .eq("id", leadId)
      .maybeSingle();

    if (!lead?.email) {
      await markFailed("missing_lead_email");
      results.push({ messageId, leadId, status: "failed_missing_lead_email" });
      continue;
    }

    // Follow-up safety: never auto-send follow-ups if the lead disabled them
    if (isFollowup && !lead?.followups_enabled) {
      await (supabase.from("messages") as any)
        .update({ status: "needs_approval", approval_required: true })
        .eq("id", messageId);

      results.push({
        messageId,
        leadId,
        status: "skipped_followups_disabled",
        provider: String(
          lead?.email_provider || (lead?.outlook_conversation_id ? "outlook" : "gmail")
        )
          .toLowerCase()
          .trim(),
      });
      continue;
    }

    const provider = String(
      lead?.email_provider ||
        (lead?.outlook_conversation_id ? "outlook" : "gmail")
    )
      .toLowerCase()
      .trim();

    if (provider !== "gmail" && provider !== "outlook") {
      await markFailed(`invalid_email_provider:${provider}`);
      results.push({
        messageId,
        leadId,
        status: "failed_invalid_provider",
        provider,
      });
      continue;
    }

    const text = String(d.text || "").trim();

    if (!text) {
      await markFailed("empty_draft_text");
      results.push({ messageId, leadId, status: "failed_empty_text" });
      continue;
    }

    // 4) Call provider send route (idempotent + locked)
    const subject = buildSubject(lead);

    const sendPath =
      provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";

    const payload: Record<string, any> =
      provider === "outlook"
        ? {
            id: messageId,
            lead_id: leadId,
            to: lead.email,
            subject, // may be ignored by Outlook reply, but safe to include
            text,
            outlook_conversation_id: lead.outlook_conversation_id ?? null,
            was_followup: isFollowup,
          }
        : {
            id: messageId,
            lead_id: leadId,
            gmail_thread_id: lead.gmail_thread_id,
            to: lead.email,
            subject,
            text,
            was_followup: isFollowup,
          };

    const res = await fetch(new URL(sendPath, siteUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": secret,
      },
      body: JSON.stringify(payload),
    }).catch((e) => ({ __err: e } as any));

    if (!res || (res as any).__err) {
      await markFailed("network_error");
      results.push({ messageId, leadId, status: "network_error", provider });
      continue;
    }

    const send = await readSendResponse(res);

    // We treat these as ok outcomes because send route is idempotent/locked.
    if (
      send.ok &&
      (send.status === "already_sent" ||
        send.status === "locked_or_in_progress" ||
        send.status === "ok" ||
        send.status === "sent")
    ) {
      results.push({ messageId, leadId, status: send.status, provider });
      continue;
    }

    // else: mark failed (send route likely did already, but we persist fail-closed here too)
    await (supabase.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: send.error || "unknown",
        status: "needs_human",
        approval_required: true,
      })
      .eq("id", messageId);

    results.push({
      messageId,
      leadId,
      status: "failed",
      error: send.error || "unknown",
      provider,
    });
  }

  const success = results.filter((r) => String(r?.status || "") === "sent").length;
  const failed = results.filter((r) => {
    const s = String(r?.status || "").toLowerCase();
    return s.includes("failed") || s.startsWith("error") || s.startsWith("blocked");
  }).length;
  const skipped = Math.max(0, results.length - success - failed);
  const status = failed > 0 ? (success > 0 ? "warning" : "error") : "ok";

  await logPipelineRun(supabase, {
    pipeline,
    status,
    startedAtMs,
    processed: results.length,
    success,
    failed,
    skipped,
    meta: {
      internal,
      scoped_agent: scopedAgentId,
      only_message_id: onlyMessageId || null,
      stage_runs: stageRuns,
    },
  });

  return NextResponse.json({ ok: true, processed: results.length, results, stage_runs: stageRuns });
}
