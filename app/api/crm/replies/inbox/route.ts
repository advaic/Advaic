import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

const HANDLED_STAGES = new Set([
  "pilot_invited",
  "pilot_active",
  "pilot_finished",
  "won",
  "lost",
  "nurture",
]);

const ALL_INTENTS = [
  "interesse",
  "objection",
  "nicht_jetzt",
  "opt_out",
  "falscher_kontakt",
  "neutral",
] as const;

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 2000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function toTs(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const params = new URL(req.url).searchParams;
  const intentFilter = normalizeLine(params.get("intent") || "", 80).toLowerCase();
  const pendingOnly =
    normalizeLine(params.get("pending_only") || "", 10) === "1" ||
    normalizeLine(params.get("pending_only") || "", 10).toLowerCase() === "true";
  const limit = Math.max(10, Math.min(200, Number(params.get("limit") || 80)));

  const supabase = createSupabaseAdminClient();
  const { data: events, error: eventsErr } = await (supabase.from("crm_outreach_events") as any)
    .select("id, prospect_id, message_id, details, event_at, metadata")
    .eq("agent_id", auth.user.id)
    .eq("event_type", "reply_received")
    .order("event_at", { ascending: false })
    .limit(500);

  if (eventsErr) {
    return NextResponse.json(
      { ok: false, error: "crm_reply_inbox_events_failed", details: eventsErr.message },
      { status: 500 },
    );
  }

  const rows = Array.isArray(events) ? events : [];
  const prospectIds = [...new Set(rows.map((r: any) => String(r?.prospect_id || "")).filter(Boolean))];
  const messageIds = [...new Set(rows.map((r: any) => String(r?.message_id || "")).filter(Boolean))];

  const [prospectsRes, messagesRes] = await Promise.all([
    prospectIds.length
      ? (supabase.from("crm_prospects") as any)
          .select(
            "id, company_name, contact_name, contact_email, city, stage, next_action, next_action_at, object_focus, fit_score, priority",
          )
          .eq("agent_id", auth.user.id)
          .in("id", prospectIds)
      : Promise.resolve({ data: [], error: null }),
    messageIds.length
      ? (supabase.from("crm_outreach_messages") as any)
          .select("id, channel, message_kind, subject, body, sent_at, metadata")
          .eq("agent_id", auth.user.id)
          .in("id", messageIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (prospectsRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_reply_inbox_prospects_failed", details: prospectsRes.error.message },
      { status: 500 },
    );
  }
  if (messagesRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_reply_inbox_messages_failed", details: messagesRes.error.message },
      { status: 500 },
    );
  }

  const prospectById = new Map(
    ((prospectsRes.data || []) as any[]).map((p) => [String(p.id), p]),
  );
  const messageById = new Map(
    ((messagesRes.data || []) as any[]).map((m) => [String(m.id), m]),
  );

  const countsAll: Record<string, number> = Object.fromEntries(
    ALL_INTENTS.map((intent) => [intent, 0]),
  );
  let pendingAll = 0;
  const items: any[] = [];

  for (const event of rows) {
    const meta =
      event?.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, any>)
        : {};
    const prospect = prospectById.get(String(event?.prospect_id || ""));
    const message = messageById.get(String(event?.message_id || ""));
    const messageMeta =
      message?.metadata && typeof message.metadata === "object"
        ? (message.metadata as Record<string, any>)
        : {};
    const stage = normalizeLine(prospect?.stage || "new", 60).toLowerCase();
    const handled = HANDLED_STAGES.has(stage);
    if (!handled) pendingAll += 1;

    const intentRaw = normalizeLine(meta.reply_intent || "neutral", 80).toLowerCase();
    const intent = ALL_INTENTS.includes(intentRaw as any) ? intentRaw : "neutral";
    countsAll[intent] = (countsAll[intent] || 0) + 1;

    if (pendingOnly && handled) continue;
    if (intentFilter && intentFilter !== "all" && intentFilter !== intent) continue;

    items.push({
      event_id: String(event?.id || ""),
      event_at: String(event?.event_at || ""),
      prospect_id: String(event?.prospect_id || ""),
      company_name: normalizeLine(prospect?.company_name || "Unbekannt", 160),
      contact_name: normalizeLine(prospect?.contact_name || "", 120) || null,
      contact_email: normalizeLine(prospect?.contact_email || "", 240) || null,
      city: normalizeLine(prospect?.city || "", 120) || null,
      stage,
      handled,
      next_action: normalizeText(prospect?.next_action || "", 220) || null,
      next_action_at: String(prospect?.next_action_at || "") || null,
      object_focus: normalizeLine(prospect?.object_focus || "gemischt", 40),
      fit_score:
        Number.isFinite(Number(prospect?.fit_score)) ? Math.round(Number(prospect?.fit_score)) : null,
      priority: normalizeLine(prospect?.priority || "B", 2) || "B",
      channel: normalizeLine(message?.channel || "email", 40),
      message_kind: normalizeLine(message?.message_kind || "", 40) || null,
      subject: normalizeLine(message?.subject || "", 220) || null,
      sent_at: String(message?.sent_at || "") || null,
      template_variant:
        normalizeLine(meta.template_variant || messageMeta.template_variant || "", 120) ||
        normalizeLine(message?.message_kind || "unknown", 60),
      reply_intent: intent,
      reply_intent_confidence: Number.isFinite(Number(meta.reply_intent_confidence))
        ? Math.max(0, Math.min(1, Number(meta.reply_intent_confidence)))
        : null,
      reply_intent_reason: normalizeText(meta.reply_intent_reason || "", 240) || null,
      recommendation:
        normalizeText(meta.reply_intent_recommendation || meta.recommendation || event?.details || "", 280) ||
        null,
      response_time_hours: Number.isFinite(Number(meta.response_time_hours))
        ? Number(meta.response_time_hours)
        : null,
    });
  }

  return NextResponse.json({
    ok: true,
    updated_at: new Date().toISOString(),
    summary: {
      total: rows.length,
      pending: pendingAll,
      by_intent: countsAll,
    },
    items: items.slice(0, limit),
  });
}
