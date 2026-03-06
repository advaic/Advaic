import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { classifyReplyIntent } from "@/lib/crm/replyIntent";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
} from "@/lib/crm/acqIntelligence";

export const runtime = "nodejs";

function normalizeLine(value: unknown, max = 320) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseIsoOrNull(value: unknown) {
  const s = String(value || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

  const { data: sentMessages, error: sentErr } = await (supabase.from(
    "crm_outreach_messages",
  ) as any)
    .select("id, prospect_id, channel, message_kind, sent_at, metadata")
    .eq("agent_id", agentId)
    .eq("status", "sent")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(200);

  if (sentErr) {
    return NextResponse.json(
      { ok: false, error: "crm_sent_messages_fetch_failed", details: sentErr.message },
      { status: 500 },
    );
  }

  const messages = Array.isArray(sentMessages) ? sentMessages : [];
  if (messages.length === 0) {
    return NextResponse.json({
      ok: true,
      scanned: 0,
      synced_replies: 0,
      skipped: 0,
    });
  }

  const prospectIds = [...new Set(messages.map((m: any) => String(m.prospect_id || "")))].filter(
    Boolean,
  );
  const messageIds = [...new Set(messages.map((m: any) => String(m.id || "")))].filter(Boolean);

  const [prospectsRes, existingRepliesRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select(
        "id, contact_email, stage, object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness",
      )
      .eq("agent_id", agentId)
      .in("id", prospectIds),
    (supabase.from("crm_outreach_events") as any)
      .select("message_id")
      .eq("agent_id", agentId)
      .eq("event_type", "reply_received")
      .in("message_id", messageIds),
  ]);

  if (prospectsRes.error) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_prospect_email_fetch_failed",
        details: prospectsRes.error.message,
      },
      { status: 500 },
    );
  }
  if (existingRepliesRes.error) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_reply_events_fetch_failed",
        details: existingRepliesRes.error.message,
      },
      { status: 500 },
    );
  }

  const emailByProspect = new Map<string, string>();
  const prospectById = new Map<string, any>();
  for (const row of (prospectsRes.data || []) as any[]) {
    const pid = String(row?.id || "").trim();
    const email = normalizeLine(row?.contact_email || "", 320).toLowerCase();
    if (pid && email) emailByProspect.set(pid, email);
    if (pid) prospectById.set(pid, row);
  }

  const existingReplyByMessage = new Set(
    ((existingRepliesRes.data || []) as any[])
      .map((r) => String(r?.message_id || "").trim())
      .filter(Boolean),
  );

  let syncedReplies = 0;
  let skipped = 0;
  const replyIntentCounts: Record<string, number> = {};

  for (const msg of messages as any[]) {
    const crmMessageId = String(msg?.id || "").trim();
    const prospectId = String(msg?.prospect_id || "").trim();
    const sentAtIso = parseIsoOrNull(msg?.sent_at);
    if (!crmMessageId || !prospectId || !sentAtIso) {
      skipped += 1;
      continue;
    }
    if (existingReplyByMessage.has(crmMessageId)) {
      skipped += 1;
      continue;
    }

    const toEmail = emailByProspect.get(prospectId);
    if (!toEmail) {
      skipped += 1;
      continue;
    }

    const meta =
      msg?.metadata && typeof msg.metadata === "object"
        ? (msg.metadata as Record<string, any>)
        : {};
    const provider = normalizeLine(meta.provider || "", 40).toLowerCase();
    const providerThreadId = normalizeLine(meta.provider_thread_id || "", 200);

    const leadRes = await (supabase.from("leads") as any)
      .select("id, email, gmail_thread_id")
      .eq("agent_id", agentId)
      .eq("email", toEmail)
      .order("updated_at", { ascending: false })
      .limit(3);
    if (leadRes.error) {
      skipped += 1;
      continue;
    }

    const candidates = Array.isArray(leadRes.data) ? leadRes.data : [];
    let matchedReply: any = null;
    let matchedLeadId: string | null = null;

    for (const lead of candidates) {
      const leadId = String(lead?.id || "").trim();
      if (!leadId) continue;

      const inboundRes = await (supabase.from("messages") as any)
        .select("id, timestamp, sender, text, snippet, gmail_thread_id")
        .eq("agent_id", agentId)
        .eq("lead_id", leadId)
        .eq("sender", "user")
        .gt("timestamp", sentAtIso)
        .order("timestamp", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (inboundRes.error || !inboundRes.data) continue;

      const inbound = inboundRes.data as any;
      if (
        provider === "gmail" &&
        providerThreadId &&
        normalizeLine(inbound?.gmail_thread_id || "", 200) !== providerThreadId
      ) {
        continue;
      }

      matchedReply = inbound;
      matchedLeadId = leadId;
      break;
    }

    if (!matchedReply || !matchedLeadId) {
      skipped += 1;
      continue;
    }

    const replyIntent = classifyReplyIntent({
      inboundText: String(matchedReply.text || ""),
      inboundSnippet: String(matchedReply.snippet || ""),
    });
    const templateVariant =
      normalizeLine(
        meta.template_variant || meta.variant || meta.recommended_code || msg?.message_kind || "",
        120,
      ) || null;
    const inboundTsIso = parseIsoOrNull(matchedReply.timestamp);
    const sentTs = new Date(sentAtIso).getTime();
    const inboundTs = inboundTsIso ? new Date(inboundTsIso).getTime() : null;
    const responseTimeHours =
      inboundTs && Number.isFinite(sentTs) && inboundTs >= sentTs
        ? Math.round(((inboundTs - sentTs) / 36e5) * 10) / 10
        : null;

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: prospectId,
      p_agent_id: agentId,
      p_event_type: "reply_received",
      p_message_id: crmMessageId,
      p_details: `Antwort erkannt (${replyIntent.label})`,
      p_metadata: {
        source: "crm_tracking_sync",
        provider,
        lead_id: matchedLeadId,
        inbound_message_id: String(matchedReply.id || ""),
        inbound_timestamp: inboundTsIso,
        reply_intent: replyIntent.label,
        reply_intent_confidence: replyIntent.confidence,
        reply_intent_reason: replyIntent.reason,
        reply_intent_recommendation: replyIntent.recommendation,
        response_time_hours: responseTimeHours,
        template_variant: templateVariant,
      },
    }) as any);

    if (replyIntent.label === "opt_out") {
      await ((supabase as any).rpc("crm_register_outreach_event", {
        p_prospect_id: prospectId,
        p_agent_id: agentId,
        p_event_type: "unsubscribed",
        p_message_id: crmMessageId,
        p_details: "Opt-out in Antwort erkannt",
        p_metadata: {
          source: "crm_tracking_sync",
          provider,
          reply_intent: replyIntent.label,
          template_variant: templateVariant,
        },
      }) as any);
    } else if (replyIntent.stageSuggestion === "nurture") {
      await (supabase.from("crm_prospects") as any)
        .update({
          stage: "nurture",
          next_action: replyIntent.recommendation,
          next_action_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", prospectId)
        .eq("agent_id", agentId);
    } else if (replyIntent.stageSuggestion === "pilot_invited") {
      await (supabase.from("crm_prospects") as any)
        .update({
          next_action: "Pilot-Einladung senden oder 15-Minuten-Termin vorschlagen",
          next_action_at: new Date().toISOString(),
        })
        .eq("id", prospectId)
        .eq("agent_id", agentId);
    } else {
      await (supabase.from("crm_prospects") as any)
        .update({
          next_action: replyIntent.recommendation,
          next_action_at: new Date().toISOString(),
        })
        .eq("id", prospectId)
        .eq("agent_id", agentId);
    }

    const prospectSignals = prospectById.get(prospectId) || null;
    const inferred = inferSegmentAndPlaybook(prospectSignals);
    const channelRaw = normalizeLine(msg?.channel || "", 40).toLowerCase();
    const safeChannel =
      channelRaw === "email" ||
      channelRaw === "linkedin" ||
      channelRaw === "telefon" ||
      channelRaw === "kontaktformular" ||
      channelRaw === "meeting" ||
      channelRaw === "whatsapp"
        ? channelRaw
        : "sonstiges";
    const outcome =
      replyIntent.label === "interesse"
        ? "positive"
        : replyIntent.label === "opt_out" || replyIntent.label === "falscher_kontakt"
          ? "negative"
          : "neutral";
    await (supabase.from("crm_acq_activity_log") as any).insert({
      agent_id: agentId,
      prospect_id: prospectId,
      occurred_at: new Date().toISOString(),
      channel: safeChannel,
      action_type: "reply_received",
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      template_variant: templateVariant,
      outcome,
      response_time_hours: responseTimeHours,
      quality_objective_score: computeObjectiveQualityScore({
        action_type: "reply_received",
        outcome,
        response_time_hours: responseTimeHours,
        personalization_depth: null,
        quality_self_score: null,
        has_postmortem: outcome === "negative",
      }),
      winning_signal: outcome === "positive" ? replyIntent.reason : null,
      failure_reason: outcome === "negative" ? replyIntent.reason : null,
      analysis_note: replyIntent.recommendation,
      postmortem_root_cause:
        outcome === "negative" ? "Negatives Reply-Intent im CRM-Tracking erkannt." : null,
      postmortem_fix:
        outcome === "negative"
          ? "Ansprache neu ausrichten und Einwand-resistente Vorlage nutzen."
          : null,
      postmortem_prevention:
        outcome === "negative"
          ? "Reply-Intent-Logik als Stop-Regel in Sequenz beibehalten."
          : null,
      metadata: {
        source: "crm_tracking_sync",
        provider,
        inbound_message_id: String(matchedReply.id || ""),
        reply_intent: replyIntent.label,
        confidence: replyIntent.confidence,
        recommendation: replyIntent.recommendation,
      },
    });

    existingReplyByMessage.add(crmMessageId);
    syncedReplies += 1;
    replyIntentCounts[replyIntent.label] = (replyIntentCounts[replyIntent.label] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: messages.length,
    synced_replies: syncedReplies,
    skipped,
    reply_intents: replyIntentCounts,
  });
}
