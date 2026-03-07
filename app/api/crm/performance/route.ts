import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { inferSegmentAndPlaybook } from "@/lib/crm/acqIntelligence";

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
  if (["email", "linkedin", "telefon", "kontaktformular", "whatsapp"].includes(channel)) return channel;
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

function extractDomain(urlLike: string | null | undefined) {
  const raw = String(urlLike || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return String(u.hostname || "").replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

  const [prospectsRes, messagesRes, eventsRes, rolloutsRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select(
        "id, stage, company_name, object_focus, source_url, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness",
      )
      .eq("agent_id", agentId)
      .limit(5000),
    (supabase.from("crm_outreach_messages") as any)
      .select("id, prospect_id, channel, message_kind, status, sent_at, created_at, metadata")
      .eq("agent_id", agentId)
      .in("status", ["sent", "ready", "draft", "failed"])
      .order("created_at", { ascending: false })
      .limit(10000),
    (supabase.from("crm_outreach_events") as any)
      .select("prospect_id, message_id, event_type, event_at, metadata")
      .eq("agent_id", agentId)
      .in("event_type", [
        "reply_received",
        "pilot_started",
        "pilot_completed",
        "deal_won",
        "message_failed",
        "unsubscribed",
        "no_interest",
      ])
      .order("event_at", { ascending: true })
      .limit(20000),
    (supabase.from("crm_sequence_rollouts") as any)
      .select("message_kind, winner_variant, confidence, sample_size, updated_at")
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .order("message_kind", { ascending: true }),
  ]);

  const firstErr = prospectsRes.error || messagesRes.error || eventsRes.error;
  if (firstErr) {
    return NextResponse.json(
      { ok: false, error: "crm_performance_failed", details: firstErr.message },
      { status: 500 },
    );
  }

  const prospects = (prospectsRes.data || []) as Array<{
    id: string;
    stage: string;
    company_name: string | null;
    object_focus: string | null;
    source_url: string | null;
    share_miete_percent: number | null;
    share_kauf_percent: number | null;
    active_listings_count: number | null;
    automation_readiness: string | null;
  }>;
  const prospectMap = new Map(prospects.map((p) => [String(p.id), p]));
  const segmentByProspect = new Map(
    prospects.map((p) => [
      String(p.id),
      inferSegmentAndPlaybook({
        object_focus: p.object_focus,
        share_miete_percent:
          Number.isFinite(Number(p.share_miete_percent)) ? Number(p.share_miete_percent) : null,
        share_kauf_percent:
          Number.isFinite(Number(p.share_kauf_percent)) ? Number(p.share_kauf_percent) : null,
        active_listings_count:
          Number.isFinite(Number(p.active_listings_count)) ? Number(p.active_listings_count) : null,
        automation_readiness: p.automation_readiness,
      }).segment_key,
    ]),
  );

  const events = (eventsRes.data || []) as Array<{
    prospect_id: string;
    message_id: string | null;
    event_type: string;
    event_at: string;
    metadata: Record<string, any> | null;
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

  const allMessagesById = new Map(
    messagesRaw.map((row) => [String(row.id), { ...row, channel: normalizeChannel(row.channel) }]),
  );

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
  const firstPilotByProspect = new Map<string, number>();
  const firstWonByProspect = new Map<string, number>();
  const optOutEvents: Array<{ prospectId: string; ts: number }> = [];

  for (const event of events) {
    const ts = toTs(event.event_at);
    if (!ts) continue;

    if (event.event_type === "reply_received") {
      const existing = firstReplyByProspect.get(event.prospect_id);
      if (!existing || ts < existing) firstReplyByProspect.set(event.prospect_id, ts);
    }
    if (event.event_type === "pilot_started" || event.event_type === "pilot_completed") {
      const existing = firstPilotByProspect.get(event.prospect_id);
      if (!existing || ts < existing) firstPilotByProspect.set(event.prospect_id, ts);
    }
    if (event.event_type === "deal_won") {
      const existing = firstWonByProspect.get(event.prospect_id);
      if (!existing || ts < existing) firstWonByProspect.set(event.prospect_id, ts);
    }
    if (event.event_type === "unsubscribed" || event.event_type === "no_interest") {
      optOutEvents.push({ prospectId: String(event.prospect_id), ts });
    }
  }

  const wonProspectsFromStage = prospects
    .filter((p) => String(p.stage || "").toLowerCase() === "won")
    .map((p) => String(p.id));
  for (const prospectId of wonProspectsFromStage) {
    if (!firstWonByProspect.has(prospectId)) {
      const list = sentByProspect.get(prospectId) || [];
      const last = list[list.length - 1];
      const ts = toTs(last?.sent_at);
      if (ts) firstWonByProspect.set(prospectId, ts);
    }
  }

  const pilotProspectSet = new Set<string>([
    ...[...firstPilotByProspect.keys()],
    ...prospects
      .filter((p) => ["pilot_active", "pilot_finished", "won"].includes(String(p.stage || "").toLowerCase()))
      .map((p) => String(p.id)),
  ]);

  const channelStats = new Map<
    string,
    {
      sent_messages: number;
      failed_messages: number;
      bounce_events: number;
      opt_out_events: number;
      touched: Set<string>;
      reply: Set<string>;
      pilot: Set<string>;
      won: Set<string>;
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
      won: Set<string>;
    }
  >();
  const variantSegmentStats = new Map<
    string,
    {
      segment_key: string;
      channel: string;
      template_variant: string;
      sent_messages: number;
      touched: Set<string>;
      reply: Set<string>;
      pilot: Set<string>;
      won: Set<string>;
    }
  >();

  const ensureChannel = (channel: string) => {
    const ch = channelStats.get(channel) || {
      sent_messages: 0,
      failed_messages: 0,
      bounce_events: 0,
      opt_out_events: 0,
      touched: new Set<string>(),
      reply: new Set<string>(),
      pilot: new Set<string>(),
      won: new Set<string>(),
      response_hours: [],
    };
    channelStats.set(channel, ch);
    return ch;
  };

  for (const msg of sentMessages) {
    const ch = ensureChannel(msg.channel);
    const variant = getTemplateVariant(msg);

    ch.sent_messages += 1;
    ch.touched.add(msg.prospect_id);

    const templateKey = `${msg.channel}::${variant}`;
    const templateEntry = templateStats.get(templateKey) || {
      channel: msg.channel,
      template_variant: variant,
      sent_messages: 0,
      touched: new Set<string>(),
      reply: new Set<string>(),
      pilot: new Set<string>(),
      won: new Set<string>(),
    };
    templateEntry.sent_messages += 1;
    templateEntry.touched.add(msg.prospect_id);
    templateStats.set(templateKey, templateEntry);

    const segmentKey = String(
      (msg.metadata as any)?.segment_key ||
        (msg.metadata as any)?.cadence_segment_key ||
        segmentByProspect.get(msg.prospect_id) ||
        "unknown",
    );
    const vsKey = `${segmentKey}::${msg.channel}::${variant}`;
    const vsEntry = variantSegmentStats.get(vsKey) || {
      segment_key: segmentKey,
      channel: msg.channel,
      template_variant: variant,
      sent_messages: 0,
      touched: new Set<string>(),
      reply: new Set<string>(),
      pilot: new Set<string>(),
      won: new Set<string>(),
    };
    vsEntry.sent_messages += 1;
    vsEntry.touched.add(msg.prospect_id);
    variantSegmentStats.set(vsKey, vsEntry);
  }

  for (const failed of messagesRaw) {
    if (String(failed.status || "").toLowerCase() !== "failed") continue;
    const channel = normalizeChannel(failed.channel);
    const ch = ensureChannel(channel);
    ch.failed_messages += 1;
  }

  for (const event of events) {
    if (event.event_type !== "message_failed") continue;
    const msgId = String(event.message_id || "").trim();
    const message = msgId ? allMessagesById.get(msgId) : null;
    const channel = message ? normalizeChannel(message.channel) : "email";
    const ch = ensureChannel(channel);
    const bounce = Boolean((event.metadata as any)?.bounce_detected);
    if (bounce) ch.bounce_events += 1;
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

    const ch = ensureChannel(attributed.channel);
    ch.reply.add(prospectId);
    const sentTs = toTs(attributed.sent_at);
    if (sentTs && replyTs >= sentTs) {
      ch.response_hours.push((replyTs - sentTs) / 36e5);
    }

    const templateKey = `${attributed.channel}::${getTemplateVariant(attributed)}`;
    const t = templateStats.get(templateKey);
    if (t) t.reply.add(prospectId);
    const segmentKey = String(
      (attributed.metadata as any)?.segment_key ||
        (attributed.metadata as any)?.cadence_segment_key ||
        segmentByProspect.get(prospectId) ||
        "unknown",
    );
    const vsKey = `${segmentKey}::${attributed.channel}::${getTemplateVariant(attributed)}`;
    const vs = variantSegmentStats.get(vsKey);
    if (vs) vs.reply.add(prospectId);
  }

  for (const prospectId of pilotProspectSet.values()) {
    const list = sentByProspect.get(prospectId) || [];
    if (list.length === 0) continue;
    const attributed = list[list.length - 1];
    const ch = ensureChannel(attributed.channel);
    ch.pilot.add(prospectId);

    const templateKey = `${attributed.channel}::${getTemplateVariant(attributed)}`;
    const t = templateStats.get(templateKey);
    if (t) t.pilot.add(prospectId);
    const segmentKey = String(
      (attributed.metadata as any)?.segment_key ||
        (attributed.metadata as any)?.cadence_segment_key ||
        segmentByProspect.get(prospectId) ||
        "unknown",
    );
    const vsKey = `${segmentKey}::${attributed.channel}::${getTemplateVariant(attributed)}`;
    const vs = variantSegmentStats.get(vsKey);
    if (vs) vs.pilot.add(prospectId);
  }

  for (const prospectId of firstWonByProspect.keys()) {
    const list = sentByProspect.get(prospectId) || [];
    if (list.length === 0) continue;
    const attributed = list[0];
    const ch = ensureChannel(attributed.channel);
    ch.won.add(prospectId);

    const templateKey = `${attributed.channel}::${getTemplateVariant(attributed)}`;
    const t = templateStats.get(templateKey);
    if (t) t.won.add(prospectId);
    const segmentKey = String(
      (attributed.metadata as any)?.segment_key ||
        (attributed.metadata as any)?.cadence_segment_key ||
        segmentByProspect.get(prospectId) ||
        "unknown",
    );
    const vsKey = `${segmentKey}::${attributed.channel}::${getTemplateVariant(attributed)}`;
    const vs = variantSegmentStats.get(vsKey);
    if (vs) vs.won.add(prospectId);
  }

  for (const ev of optOutEvents) {
    const list = sentByProspect.get(ev.prospectId) || [];
    const attributed = list[list.length - 1] || null;
    const channel = attributed ? attributed.channel : "email";
    const ch = ensureChannel(channel);
    ch.opt_out_events += 1;
  }

  const channel_metrics = [...channelStats.entries()]
    .map(([channel, stat]) => {
      const touched = stat.touched.size;
      const reply = stat.reply.size;
      const pilot = stat.pilot.size;
      const won = stat.won.size;
      const avgResponseHours =
        stat.response_hours.length > 0
          ? Math.round(
              (stat.response_hours.reduce((sum, item) => sum + item, 0) / stat.response_hours.length) * 10,
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
        won_prospects: won,
        won_rate_pct: safeRate(won, touched),
        failed_messages: stat.failed_messages,
        failure_rate_pct: safeRate(stat.failed_messages, Math.max(1, stat.sent_messages)),
        bounce_events: stat.bounce_events,
        opt_out_events: stat.opt_out_events,
        avg_response_hours: avgResponseHours,
      };
    })
    .sort((a, b) => b.touched_prospects - a.touched_prospects);

  const deliverability_correlation = channel_metrics.map((row) => {
    const riskScore =
      row.failure_rate_pct * 0.45 + row.bounce_events * 1.3 + row.opt_out_events * 0.8 - row.reply_rate_pct * 0.15;
    return {
      channel: row.channel,
      sent_messages: row.sent_messages,
      failed_messages: row.failed_messages,
      failure_rate_pct: row.failure_rate_pct,
      bounce_events: row.bounce_events,
      opt_out_events: row.opt_out_events,
      reply_rate_pct: row.reply_rate_pct,
      pilot_rate_pct: row.pilot_rate_pct,
      won_rate_pct: row.won_rate_pct,
      risk_level: riskScore >= 12 ? "hoch" : riskScore >= 7 ? "mittel" : "niedrig",
      recommendation:
        riskScore >= 12
          ? "Template und Kanal prüfen, dann Versandlimit reduzieren und Guardrails verschärfen."
          : riskScore >= 7
            ? "Monitoring erhöhen und nur starke Varianten weiter skalieren."
            : "Kanal ist stabil. Gewinner-Variante weiter ausrollen.",
    };
  });

  const template_metrics = [...templateStats.values()]
    .map((stat) => {
      const touched = stat.touched.size;
      const reply = stat.reply.size;
      const pilot = stat.pilot.size;
      const won = stat.won.size;
      return {
        channel: stat.channel,
        template_variant: stat.template_variant,
        sent_messages: stat.sent_messages,
        touched_prospects: touched,
        reply_prospects: reply,
        reply_rate_pct: safeRate(reply, touched),
        pilot_prospects: pilot,
        pilot_rate_pct: safeRate(pilot, touched),
        won_prospects: won,
        won_rate_pct: safeRate(won, touched),
      };
    })
    .sort((a, b) => b.sent_messages - a.sent_messages)
    .slice(0, 24);

  const variant_segment_metrics = [...variantSegmentStats.values()]
    .map((stat) => {
      const touched = stat.touched.size;
      const reply = stat.reply.size;
      const pilot = stat.pilot.size;
      const won = stat.won.size;
      return {
        segment_key: stat.segment_key,
        channel: stat.channel,
        template_variant: stat.template_variant,
        sent_messages: stat.sent_messages,
        touched_prospects: touched,
        reply_prospects: reply,
        reply_rate_pct: safeRate(reply, touched),
        pilot_prospects: pilot,
        pilot_rate_pct: safeRate(pilot, touched),
        won_prospects: won,
        won_rate_pct: safeRate(won, touched),
      };
    })
    .sort((a, b) => {
      if (b.won_rate_pct !== a.won_rate_pct) return b.won_rate_pct - a.won_rate_pct;
      return b.sent_messages - a.sent_messages;
    })
    .slice(0, 36);

  const attributionByChannel = new Map<string, { won: number; pilot: number; replied: number; total: number }>();
  const attributionByTemplate = new Map<string, { won: number; pilot: number; replied: number; total: number }>();
  const attributionBySourceDomain = new Map<string, { won: number; pilot: number; replied: number; total: number }>();

  const closeLoopExamples: Array<{
    prospect_id: string;
    company_name: string;
    source_domain: string | null;
    first_touch_channel: string;
    first_touch_variant: string;
    replied: boolean;
    pilot: boolean;
    won: boolean;
  }> = [];

  for (const [prospectId, list] of sentByProspect.entries()) {
    if (list.length === 0) continue;
    const first = list[0];
    const firstVariant = getTemplateVariant(first);
    const company = String(prospectMap.get(prospectId)?.company_name || "Unbekannt");
    const sourceDomain = extractDomain(prospectMap.get(prospectId)?.source_url || null);
    const replied = firstReplyByProspect.has(prospectId);
    const pilot = pilotProspectSet.has(prospectId);
    const won = firstWonByProspect.has(prospectId);

    const byCh = attributionByChannel.get(first.channel) || { won: 0, pilot: 0, replied: 0, total: 0 };
    byCh.total += 1;
    if (replied) byCh.replied += 1;
    if (pilot) byCh.pilot += 1;
    if (won) byCh.won += 1;
    attributionByChannel.set(first.channel, byCh);

    const byTpl = attributionByTemplate.get(firstVariant) || { won: 0, pilot: 0, replied: 0, total: 0 };
    byTpl.total += 1;
    if (replied) byTpl.replied += 1;
    if (pilot) byTpl.pilot += 1;
    if (won) byTpl.won += 1;
    attributionByTemplate.set(firstVariant, byTpl);

    const sourceKey = sourceDomain || "unknown";
    const bySource = attributionBySourceDomain.get(sourceKey) || { won: 0, pilot: 0, replied: 0, total: 0 };
    bySource.total += 1;
    if (replied) bySource.replied += 1;
    if (pilot) bySource.pilot += 1;
    if (won) bySource.won += 1;
    attributionBySourceDomain.set(sourceKey, bySource);

    closeLoopExamples.push({
      prospect_id: prospectId,
      company_name: company,
      source_domain: sourceDomain,
      first_touch_channel: first.channel,
      first_touch_variant: firstVariant,
      replied,
      pilot,
      won,
    });
  }

  const revenue_attribution = {
    won_total: [...firstWonByProspect.keys()].length,
    by_channel: [...attributionByChannel.entries()]
      .map(([channel, row]) => ({
        channel,
        touched: row.total,
        reply_rate_pct: safeRate(row.replied, row.total),
        pilot_rate_pct: safeRate(row.pilot, row.total),
        won_rate_pct: safeRate(row.won, row.total),
      }))
      .sort((a, b) => b.won_rate_pct - a.won_rate_pct),
    by_template_variant: [...attributionByTemplate.entries()]
      .map(([template_variant, row]) => ({
        template_variant,
        touched: row.total,
        reply_rate_pct: safeRate(row.replied, row.total),
        pilot_rate_pct: safeRate(row.pilot, row.total),
        won_rate_pct: safeRate(row.won, row.total),
      }))
      .sort((a, b) => b.won_rate_pct - a.won_rate_pct)
      .slice(0, 20),
    by_source_domain: [...attributionBySourceDomain.entries()]
      .map(([source_domain, row]) => ({
        source_domain,
        touched: row.total,
        reply_rate_pct: safeRate(row.replied, row.total),
        pilot_rate_pct: safeRate(row.pilot, row.total),
        won_rate_pct: safeRate(row.won, row.total),
      }))
      .sort((a, b) => b.won_rate_pct - a.won_rate_pct)
      .slice(0, 16),
    close_loop_examples: closeLoopExamples
      .filter((x) => x.replied || x.pilot || x.won)
      .sort((a, b) => Number(b.won) - Number(a.won) || Number(b.pilot) - Number(a.pilot))
      .slice(0, 12),
  };

  const sequence_rollouts = rolloutsRes.error
    ? []
    : ((rolloutsRes.data || []) as any[]).map((row) => ({
        message_kind: String(row.message_kind || ""),
        winner_variant: String(row.winner_variant || ""),
        confidence: Number(row.confidence || 0),
        sample_size: Number(row.sample_size || 0),
        updated_at: String(row.updated_at || ""),
      }));

  return NextResponse.json({
    ok: true,
    updated_at: new Date().toISOString(),
    channel_metrics,
    template_metrics,
    variant_segment_metrics,
    deliverability_correlation,
    revenue_attribution,
    sequence_rollouts,
  });
}
