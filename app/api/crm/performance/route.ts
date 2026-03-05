import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

type SentMessage = {
  id: string;
  prospect_id: string;
  channel: string;
  message_kind: string;
  sent_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
};

function toTs(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function normalizeChannel(value: unknown) {
  const channel = String(value || "").trim().toLowerCase();
  if (["email", "linkedin", "telefon", "kontaktformular"].includes(channel)) return channel;
  return "sonstiges";
}

function getTemplateVariant(message: SentMessage) {
  const meta = message.metadata && typeof message.metadata === "object" ? message.metadata : {};
  const raw =
    String(meta.template_variant || "").trim() ||
    String(meta.variant || "").trim() ||
    String(meta.recommended_code || "").trim() ||
    String(message.message_kind || "").trim() ||
    "unknown";
  return raw.slice(0, 80);
}

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

  const [prospectsRes, messagesRes, eventsRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select("id, stage")
      .eq("agent_id", agentId)
      .limit(5000),
    (supabase.from("crm_outreach_messages") as any)
      .select("id, prospect_id, channel, message_kind, status, sent_at, created_at, metadata")
      .eq("agent_id", agentId)
      .in("status", ["sent", "ready", "draft", "failed"])
      .order("created_at", { ascending: false })
      .limit(8000),
    (supabase.from("crm_outreach_events") as any)
      .select("prospect_id, event_type, event_at")
      .eq("agent_id", agentId)
      .in("event_type", [
        "reply_received",
        "pilot_started",
        "pilot_completed",
        "deal_won",
      ])
      .order("event_at", { ascending: true })
      .limit(12000),
  ]);

  const firstErr = prospectsRes.error || messagesRes.error || eventsRes.error;
  if (firstErr) {
    return NextResponse.json(
      { ok: false, error: "crm_performance_failed", details: firstErr.message },
      { status: 500 },
    );
  }

  const prospects = (prospectsRes.data || []) as Array<{ id: string; stage: string }>;
  const events = (eventsRes.data || []) as Array<{
    prospect_id: string;
    event_type: string;
    event_at: string;
  }>;
  const messagesRaw = (messagesRes.data || []) as Array<{
    id: string;
    prospect_id: string;
    channel: string;
    message_kind: string;
    status: string;
    sent_at: string | null;
    created_at: string;
    metadata: Record<string, any> | null;
  }>;

  const sentMessages: SentMessage[] = messagesRaw
    .filter((row) => String(row.status || "").toLowerCase() === "sent" || !!row.sent_at)
    .map((row) => ({
      id: String(row.id),
      prospect_id: String(row.prospect_id),
      channel: normalizeChannel(row.channel),
      message_kind: String(row.message_kind || "custom"),
      sent_at: row.sent_at || row.created_at || null,
      created_at: String(row.created_at || ""),
      metadata: row.metadata || {},
    }))
    .filter((row) => !!row.prospect_id);

  const sentByProspect = new Map<string, SentMessage[]>();
  for (const msg of sentMessages) {
    const arr = sentByProspect.get(msg.prospect_id) || [];
    arr.push(msg);
    sentByProspect.set(msg.prospect_id, arr);
  }
  for (const [, list] of sentByProspect) {
    list.sort((a, b) => (toTs(a.sent_at) || 0) - (toTs(b.sent_at) || 0));
  }

  const firstReplyByProspect = new Map<string, number>();
  for (const event of events) {
    if (event.event_type !== "reply_received") continue;
    const ts = toTs(event.event_at);
    if (!ts) continue;
    const existing = firstReplyByProspect.get(event.prospect_id);
    if (!existing || ts < existing) {
      firstReplyByProspect.set(event.prospect_id, ts);
    }
  }

  const pilotProspectSet = new Set<string>();
  for (const row of prospects) {
    const stage = String(row.stage || "").toLowerCase();
    if (["pilot_active", "pilot_finished", "won"].includes(stage)) {
      pilotProspectSet.add(String(row.id));
    }
  }
  for (const event of events) {
    if (["pilot_started", "pilot_completed", "deal_won"].includes(String(event.event_type))) {
      pilotProspectSet.add(String(event.prospect_id));
    }
  }

  const channelStats = new Map<
    string,
    {
      sent_messages: number;
      touched: Set<string>;
      reply: Set<string>;
      pilot: Set<string>;
      response_hours: number[];
    }
  >();
  const templateStats = new Map<
    string,
    {
      channel: string;
      template_variant: string;
      sent_messages: number;
      touched: Set<string>;
      reply: Set<string>;
      pilot: Set<string>;
    }
  >();

  for (const msg of sentMessages) {
    const ch = msg.channel;
    const variant = getTemplateVariant(msg);
    const channelEntry = channelStats.get(ch) || {
      sent_messages: 0,
      touched: new Set<string>(),
      reply: new Set<string>(),
      pilot: new Set<string>(),
      response_hours: [],
    };
    channelEntry.sent_messages += 1;
    channelEntry.touched.add(msg.prospect_id);
    channelStats.set(ch, channelEntry);

    const templateKey = `${ch}::${variant}`;
    const templateEntry = templateStats.get(templateKey) || {
      channel: ch,
      template_variant: variant,
      sent_messages: 0,
      touched: new Set<string>(),
      reply: new Set<string>(),
      pilot: new Set<string>(),
    };
    templateEntry.sent_messages += 1;
    templateEntry.touched.add(msg.prospect_id);
    templateStats.set(templateKey, templateEntry);
  }

  for (const [prospectId, replyTs] of firstReplyByProspect.entries()) {
    const list = sentByProspect.get(prospectId) || [];
    if (list.length === 0) continue;
    let attributed: SentMessage | null = null;
    for (const msg of list) {
      const ts = toTs(msg.sent_at);
      if (!ts) continue;
      if (ts <= replyTs) attributed = msg;
    }
    if (!attributed) attributed = list[0] || null;
    if (!attributed) continue;

    const channelEntry = channelStats.get(attributed.channel);
    if (channelEntry) {
      channelEntry.reply.add(prospectId);
      const sentTs = toTs(attributed.sent_at);
      if (sentTs && replyTs >= sentTs) {
        channelEntry.response_hours.push((replyTs - sentTs) / 36e5);
      }
    }

    const templateKey = `${attributed.channel}::${getTemplateVariant(attributed)}`;
    const templateEntry = templateStats.get(templateKey);
    if (templateEntry) {
      templateEntry.reply.add(prospectId);
    }
  }

  for (const prospectId of pilotProspectSet.values()) {
    const list = sentByProspect.get(prospectId) || [];
    if (list.length === 0) continue;
    const attributed = list[list.length - 1];
    const channelEntry = channelStats.get(attributed.channel);
    if (channelEntry) channelEntry.pilot.add(prospectId);
    const templateKey = `${attributed.channel}::${getTemplateVariant(attributed)}`;
    const templateEntry = templateStats.get(templateKey);
    if (templateEntry) templateEntry.pilot.add(prospectId);
  }

  const channel_metrics = [...channelStats.entries()]
    .map(([channel, stat]) => {
      const touched = stat.touched.size;
      const reply = stat.reply.size;
      const pilot = stat.pilot.size;
      const avgResponseHours =
        stat.response_hours.length > 0
          ? Math.round(
              (stat.response_hours.reduce((sum, item) => sum + item, 0) /
                stat.response_hours.length) *
                10,
            ) / 10
          : null;
      return {
        channel,
        sent_messages: stat.sent_messages,
        touched_prospects: touched,
        reply_prospects: reply,
        reply_rate_pct: safeRate(reply, touched),
        pilot_prospects: pilot,
        pilot_rate_pct: safeRate(pilot, touched),
        avg_response_hours: avgResponseHours,
      };
    })
    .sort((a, b) => b.touched_prospects - a.touched_prospects);

  const template_metrics = [...templateStats.values()]
    .map((stat) => {
      const touched = stat.touched.size;
      const reply = stat.reply.size;
      const pilot = stat.pilot.size;
      return {
        channel: stat.channel,
        template_variant: stat.template_variant,
        sent_messages: stat.sent_messages,
        touched_prospects: touched,
        reply_prospects: reply,
        reply_rate_pct: safeRate(reply, touched),
        pilot_prospects: pilot,
        pilot_rate_pct: safeRate(pilot, touched),
      };
    })
    .sort((a, b) => b.sent_messages - a.sent_messages)
    .slice(0, 18);

  return NextResponse.json({
    ok: true,
    updated_at: new Date().toISOString(),
    channel_metrics,
    template_metrics,
  });
}

