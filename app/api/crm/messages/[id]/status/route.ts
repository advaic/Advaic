import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
} from "@/lib/crm/acqIntelligence";
import {
  collectTriggerEvidence,
  evaluateFirstTouchGuardrails,
} from "@/lib/crm/cadenceRules";
import {
  assessResearchReadiness,
} from "@/lib/crm/outboundQuality";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
  persistQualityReview,
} from "@/lib/crm/qualityReviewEngine";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["draft", "ready", "sent", "failed", "archived"]);

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const messageId = String(id || "").trim();
  if (!messageId) {
    return NextResponse.json({ ok: false, error: "missing_message_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = String(body?.status || "").trim().toLowerCase();
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: message, error: messageErr } = await (supabase.from("crm_outreach_messages") as any)
    .select("id, prospect_id, agent_id, channel, message_kind, body, metadata, personalization_score")
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (messageErr) {
    return NextResponse.json(
      { ok: false, error: "crm_message_lookup_failed", details: messageErr.message },
      { status: 500 },
    );
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: "message_not_found" }, { status: 404 });
  }
  if (status === "sent" && String(message.message_kind || "").toLowerCase() === "first_touch") {
    const { data: prospect } = await (supabase.from("crm_prospects") as any)
      .select(
        "company_name, contact_email, city, region, object_focus, share_miete_percent, share_kauf_percent, active_listings_count, new_listings_30d, automation_readiness, target_group, process_hint, personalization_hook, personalization_evidence, source_checked_at",
      )
      .eq("id", String(message.prospect_id))
      .eq("agent_id", auth.user.id)
      .maybeSingle();
    const inferred = inferSegmentAndPlaybook(prospect || null);
    const triggerEvidence = collectTriggerEvidence({
      companyName: String((prospect as any)?.company_name || "").trim(),
      city: String((prospect as any)?.city || "").trim() || null,
      region: String((prospect as any)?.region || "").trim() || null,
      objectFocus: String((prospect as any)?.object_focus || "").trim() || null,
      activeListingsCount: Number.isFinite(Number((prospect as any)?.active_listings_count))
        ? Number((prospect as any)?.active_listings_count)
        : null,
      newListings30d: Number.isFinite(Number((prospect as any)?.new_listings_30d))
        ? Number((prospect as any)?.new_listings_30d)
        : null,
      shareMietePercent: Number.isFinite(Number((prospect as any)?.share_miete_percent))
        ? Number((prospect as any)?.share_miete_percent)
        : null,
      shareKaufPercent: Number.isFinite(Number((prospect as any)?.share_kauf_percent))
        ? Number((prospect as any)?.share_kauf_percent)
        : null,
      targetGroup: String((prospect as any)?.target_group || "").trim() || null,
      processHint: String((prospect as any)?.process_hint || "").trim() || null,
      personalizationHook: String((prospect as any)?.personalization_hook || "").trim() || null,
      personalizationEvidence:
        String((prospect as any)?.personalization_evidence || "").trim() || null,
      sourceCheckedAt: String((prospect as any)?.source_checked_at || "").trim() || null,
    });
    const meta =
      message.metadata && typeof message.metadata === "object"
        ? (message.metadata as Record<string, any>)
        : {};
    const researchReadiness = assessResearchReadiness({
      preferredChannel: String((message as any)?.channel || "email"),
      contactEmail: String((prospect as any)?.contact_email || "").trim() || null,
      personalizationHook: String((prospect as any)?.personalization_hook || "").trim() || null,
      personalizationEvidence:
        String((prospect as any)?.personalization_evidence || "").trim() || null,
      sourceCheckedAt: String((prospect as any)?.source_checked_at || "").trim() || null,
      targetGroup: String((prospect as any)?.target_group || "").trim() || null,
      processHint: String((prospect as any)?.process_hint || "").trim() || null,
      activeListingsCount: Number.isFinite(Number((prospect as any)?.active_listings_count))
        ? Number((prospect as any)?.active_listings_count)
        : null,
      automationReadiness: String((prospect as any)?.automation_readiness || "").trim() || null,
    });
    const groundedContext = await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId: String(message.prospect_id),
      messageId,
      channel: String((message as any)?.channel || "email"),
      messageKind: String(message.message_kind || ""),
      segmentKey: String(meta.segment_key || "").trim() || inferred.segment_key,
      playbookKey: String(meta.playbook_key || "").trim() || inferred.playbook_key,
    });
    const outboundReview = evaluateGroundedOutboundMessageQuality({
      body: String(message.body || ""),
      subject: null,
      channel: String((message as any)?.channel || "email"),
      messageKind: String(message.message_kind || ""),
      companyName: String((prospect as any)?.company_name || "").trim() || null,
      city: String((prospect as any)?.city || "").trim() || null,
      personalizationHook: String((prospect as any)?.personalization_hook || "").trim() || null,
      triggerEvidenceCount: Math.max(
        Number((meta as any)?.trigger_evidence_count || 0),
        triggerEvidence.length,
      ),
      researchReadiness,
      prospect: {
        company_name: String((prospect as any)?.company_name || "").trim() || null,
        city: String((prospect as any)?.city || "").trim() || null,
        preferred_channel: String((message as any)?.channel || "email"),
        contact_email: String((prospect as any)?.contact_email || "").trim() || null,
        personalization_hook: String((prospect as any)?.personalization_hook || "").trim() || null,
        personalization_evidence:
          String((prospect as any)?.personalization_evidence || "").trim() || null,
        source_checked_at: String((prospect as any)?.source_checked_at || "").trim() || null,
        target_group: String((prospect as any)?.target_group || "").trim() || null,
        process_hint: String((prospect as any)?.process_hint || "").trim() || null,
        active_listings_count: Number.isFinite(Number((prospect as any)?.active_listings_count))
          ? Number((prospect as any)?.active_listings_count)
          : null,
        automation_readiness: String((prospect as any)?.automation_readiness || "").trim() || null,
      },
      context: groundedContext,
      supportHints: triggerEvidence,
    });
    const guardrail = evaluateFirstTouchGuardrails({
      body: String(message.body || ""),
      triggerEvidenceCount: Math.max(
        Number((meta as any)?.trigger_evidence_count || 0),
        triggerEvidence.length,
      ),
    });
    if (!guardrail.pass) {
      return NextResponse.json(
        {
          ok: false,
          error: "first_touch_send_guardrail_failed",
          details:
            "Manuelles Senden blockiert: Erstkontakt wirkt nicht natürlich genug oder enthält zu viel Roh-/Pitch-Sprache.",
          guardrail,
        },
        { status: 422 },
      );
    }
    if (outboundReview.status === "blocked") {
      return NextResponse.json(
        {
          ok: false,
          error: "outbound_quality_blocked",
          details: outboundReview.summary,
          review: outboundReview,
          research: researchReadiness,
        },
        { status: 422 },
      );
    }
    try {
      await persistQualityReview(supabase, {
        agentId: String(auth.user.id),
        prospectId: String(message.prospect_id),
        messageId,
        reviewScope: "send_gate",
        channel: String((message as any)?.channel || "email"),
        messageKind: String(message.message_kind || ""),
        review: outboundReview,
        metadata: {
          mode: "manual_status_sent",
        },
      });
    } catch {
      // Fail-open for manual status updates.
    }
  }

  const updates: Record<string, any> = { status };
  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await (supabase.from("crm_outreach_messages") as any)
    .update(updates)
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, created_at, updated_at",
    )
    .single();

  if (updateErr) {
    return NextResponse.json(
      { ok: false, error: "crm_message_status_update_failed", details: updateErr.message },
      { status: 500 },
    );
  }

  if (status === "sent") {
    const { data: prospect } = await (supabase.from("crm_prospects") as any)
      .select("object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness")
      .eq("id", String(message.prospect_id))
      .eq("agent_id", auth.user.id)
      .maybeSingle();
    const inferred = inferSegmentAndPlaybook(prospect || null);
    const templateVariant =
      String((message as any)?.metadata?.template_variant || (message as any)?.metadata?.recommended_code || message.message_kind || "").trim() ||
      null;

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: String(message.prospect_id),
      p_agent_id: auth.user.id,
      p_event_type: "message_sent",
      p_message_id: messageId,
      p_details: "Nachricht als gesendet markiert",
      p_metadata: { source: "crm_ui" },
    }) as any);

    await (supabase.from("crm_acq_activity_log") as any).insert({
      agent_id: auth.user.id,
      prospect_id: String(message.prospect_id),
      occurred_at: updates.sent_at || new Date().toISOString(),
      channel: String(message.channel || "sonstiges"),
      action_type: "outbound_manual",
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      template_variant: templateVariant,
      outcome: "pending",
      personalization_depth:
        typeof (message as any)?.personalization_score === "number"
          ? Math.max(0, Math.min(100, Math.round((message as any).personalization_score)))
          : null,
      quality_objective_score: computeObjectiveQualityScore({
        action_type: "outbound_manual",
        outcome: "pending",
        response_time_hours: null,
        personalization_depth:
          typeof (message as any)?.personalization_score === "number"
            ? Math.max(0, Math.min(100, Math.round((message as any).personalization_score)))
            : null,
        quality_self_score: null,
        has_postmortem: false,
      }),
      analysis_note: "Manuell als gesendet markiert",
      metadata: {
        source: "crm_status_update",
        segment_key: inferred.segment_key,
        playbook_key: inferred.playbook_key,
        message_id: messageId,
        review_status: normalizeLine((message as any)?.metadata?.outbound_review?.status, 40) || null,
        review_score:
          Number.isFinite(Number((message as any)?.metadata?.outbound_review?.score))
            ? Number((message as any)?.metadata?.outbound_review?.score)
            : null,
        unsupported_claim_count:
          Number((message as any)?.metadata?.outbound_review?.evidence_alignment?.unsupported_claim_count || 0) || 0,
        weak_claim_count:
          Number((message as any)?.metadata?.outbound_review?.evidence_alignment?.weak_claim_count || 0) || 0,
        research_status: normalizeLine((message as any)?.metadata?.research_readiness?.status, 40) || null,
        research_score:
          Number.isFinite(Number((message as any)?.metadata?.research_readiness?.score))
            ? Number((message as any)?.metadata?.research_readiness?.score)
            : null,
        strategy_contact_channel: normalizeLine((message as any)?.metadata?.strategy_contact_channel, 40) || null,
        strategy_contact_value: normalizeLine((message as any)?.metadata?.strategy_contact_value, 220) || null,
        strategy_contact_confidence:
          Number.isFinite(Number((message as any)?.metadata?.strategy_contact_confidence))
            ? Number((message as any)?.metadata?.strategy_contact_confidence)
            : null,
        strategy_risk_level: normalizeLine((message as any)?.metadata?.strategy_risk_level, 40) || null,
      },
    });
  }

  return NextResponse.json({ ok: true, message: updated });
}
