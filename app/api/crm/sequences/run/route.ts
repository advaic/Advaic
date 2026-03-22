import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  applySequenceVariantTone,
  chooseSequenceVariant,
  listSequenceVariants,
  loadActiveRolloutWinners,
  type SequenceMessageKind,
} from "@/lib/crm/sequenceExperiments";
import { inferSegmentAndPlaybook } from "@/lib/crm/acqIntelligence";
import { loadCrmAutomationSettings } from "@/lib/crm/automationSettings";
import {
  collectTriggerEvidence,
  deriveAbFields,
  evaluateFirstTouchGuardrails,
} from "@/lib/crm/cadenceRules";
import { getVariantLearningBias, loadCurrentLearningSnapshot } from "@/lib/crm/learningLoop";
import {
  assessResearchReadiness,
} from "@/lib/crm/outboundQuality";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
  persistQualityReview,
} from "@/lib/crm/qualityReviewEngine";
import { ensureProspectStrategyDecision } from "@/lib/crm/strategyEngine";
import { evaluateSendTiming } from "@/lib/crm/timingPolicy";

export const runtime = "nodejs";

const CODE_TO_KIND: Record<
  string,
  "first_touch" | "follow_up_1" | "follow_up_2" | "follow_up_3" | "custom"
> = {
  send_first_touch: "first_touch",
  send_follow_up_1: "follow_up_1",
  send_follow_up_2: "follow_up_2",
  send_follow_up_3: "follow_up_3",
  send_breakup_touch: "custom",
};

const ALLOWED_CODES = new Set(Object.keys(CODE_TO_KIND));

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
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

function sanitizeTouch1Snippet(value: string | null | undefined, max = 220) {
  let text = normalizeText(value || "", max)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bkontaktquelle\b\s*:?/gi, "")
    .replace(/\bimpressum\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!text) return "";
  if (/\b\d{2,}\b/.test(text) || /%/.test(text)) {
    return "";
  }
  const sentence = text.split(/[.!?]/)[0]?.trim() || "";
  if (!sentence) return "";
  return sentence;
}

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" ||
    code === "42p01" ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

function cadenceStepFromCode(code: string) {
  if (code === "send_first_touch") return 1;
  if (code === "send_follow_up_1") return 2;
  if (code === "send_follow_up_2") return 3;
  if (code === "send_follow_up_3") return 4;
  if (code === "send_breakup_touch") return 5;
  return null;
}

function cadenceSubjectFromCode(code: string) {
  if (code === "send_first_touch") return "Anfragen";
  if (code === "send_follow_up_1") return "Reaktionszeit";
  if (code === "send_follow_up_2") return "Kontrolle";
  if (code === "send_follow_up_3") return "Freigabe";
  if (code === "send_breakup_touch") return "Abgleich";
  return "Nachricht";
}

function buildSequenceDraft(args: {
  code: string;
  companyName: string;
  contactName: string | null;
  hook: string | null;
  painPoint: string | null;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;

  const hookLine = args.hook
    ? sanitizeTouch1Snippet(`${args.hook}`.replace(/^mir ist bei .*? aufgefallen[:,]?\s*/i, "").trim(), 220) ||
      "Sie vermarkten mehrere Objekte parallel und setzen gleichzeitig auf persönliche Betreuung."
    : "Sie vermarkten mehrere Objekte parallel und setzen gleichzeitig auf persönliche Betreuung.";

  const painLine = args.painPoint
    ? sanitizeTouch1Snippet(`${args.painPoint}`, 220) ||
      "Gerade dann wird es oft schwierig, jede Anfrage schnell und persönlich genug zu beantworten."
    : "Gerade dann wird es oft schwierig, jede Anfrage schnell und persönlich genug zu beantworten.";

  if (args.code === "send_first_touch") {
    return {
      subject: cadenceSubjectFromCode(args.code),
      body: `${salutation}

ich bin Kilian, Gründer von Advaic.
Ich habe mir ${args.companyName} kurz angeschaut und hatte den Eindruck, dass ${hookLine}
${painLine}

Ist das bei Ihnen aktuell ein relevantes Thema?`,
    };
  }

  if (args.code === "send_follow_up_1") {
    return {
      subject: cadenceSubjectFromCode(args.code),
      body: `${salutation}

ich wollte kurz nachfassen, weil genau dieser Anfragefluss im Alltag oft unbemerkt Zeit frisst.
Wir starten dabei bewusst konservativ: mehr Freigaben, weniger Auto-Versand.

Haben Sie das intern bereits sauber gelöst oder ist das weiterhin offen?`,
    };
  }

  if (args.code === "send_follow_up_2") {
    return {
      subject: cadenceSubjectFromCode(args.code),
      body: `${salutation}

kurzer Kontext zu meiner Nachricht: Mit Advaic lassen sich Standardanfragen abfangen, ohne die Kontrolle bei Sonderfällen zu verlieren.
Wichtig bleibt immer: klar = Auto, unklar = Freigabe, Checks vor Versand.

Soll ich Ihnen zwei konkrete Startkonfigurationen schicken?`,
    };
  }

  if (args.code === "send_follow_up_3") {
    return {
      subject: cadenceSubjectFromCode(args.code),
      body: `${salutation}

typischer Einwand ist die Sorge vor unpassenden Antworten. Genau deshalb stoppt Advaic bei unsicheren Fällen und legt zur Freigabe vor.
So bleibt der Stil persönlich und der Ablauf nachvollziehbar.

Wäre ein kurzer Abgleich sinnvoll, wie das in Ihrem Setup aussehen könnte?`,
    };
  }

  return {
    subject: cadenceSubjectFromCode(args.code),
    body: `${salutation}

ich melde mich ein letztes Mal kurz zu dem Thema.
Wenn es aktuell nicht relevant ist, hake ich es gerne ab.

Soll ich das Thema schließen oder zu einem späteren Zeitpunkt noch einmal aufgreifen?`,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const onlyProspectId = normalizeLine(body?.only_prospect_id || "", 80);
  const dryRun = Boolean(body?.dry_run);
  const overridePause = Boolean(body?.override_pause);
  const limit = Math.max(1, Math.min(100, Number(body?.limit || 40)));

  const supabase = createSupabaseAdminClient();
  const automation = await loadCrmAutomationSettings(supabase, String(auth.user.id));
  if (!automation.sequence_automation_enabled && !overridePause) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_sequence_automation_paused",
        details:
          automation.reason ||
          "CRM-Sequenz-Automation ist pausiert. Entweder erst fortsetzen oder bewusst einmalig uebersteuern.",
        settings: automation,
      },
      { status: 409 },
    );
  }
  let query = (supabase.from("crm_next_actions") as any)
    .select(
      "prospect_id, company_name, contact_name, contact_email, city, region, object_focus, preferred_channel, personalization_hook, pain_point_hypothesis, target_group, process_hint, share_miete_percent, share_kauf_percent, active_listings_count, recommended_code, recommended_action, recommended_reason, recommended_at, priority, fit_score",
    )
    .eq("agent_id", auth.user.id)
    .in("recommended_code", [...ALLOWED_CODES])
    .not("recommended_at", "is", null)
    .lte("recommended_at", new Date().toISOString())
    .order("priority", { ascending: true })
    .order("fit_score", { ascending: false })
    .order("recommended_at", { ascending: true })
    .limit(limit);

  if (onlyProspectId) {
    query = query.eq("prospect_id", onlyProspectId);
  }

  let dueRes = await query;
  if (dueRes.error && isSchemaMismatch(dueRes.error as any)) {
    let fallbackQuery = (supabase.from("crm_next_actions") as any)
      .select(
        "prospect_id, company_name, contact_name, object_focus, preferred_channel, personalization_hook, pain_point_hypothesis, recommended_code, recommended_action, recommended_reason, recommended_at, priority, fit_score",
      )
      .eq("agent_id", auth.user.id)
      .in("recommended_code", [...ALLOWED_CODES])
      .not("recommended_at", "is", null)
      .lte("recommended_at", new Date().toISOString())
      .order("priority", { ascending: true })
      .order("fit_score", { ascending: false })
      .order("recommended_at", { ascending: true })
      .limit(limit);

    if (onlyProspectId) {
      fallbackQuery = fallbackQuery.eq("prospect_id", onlyProspectId);
    }

    const fallback = await fallbackQuery;
    dueRes = {
      data: ((fallback.data || []) as any[]).map((row) => ({
        ...row,
        contact_email: null,
        city: null,
        region: null,
        target_group: null,
        process_hint: null,
        share_miete_percent: null,
        share_kauf_percent: null,
        active_listings_count: null,
      })),
      error: fallback.error,
    } as any;
  }

  if (dueRes.error) {
    if (isSchemaMismatch(dueRes.error as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_schema_missing",
          details:
            "CRM-Schema ist veraltet. Bitte nacheinander ausführen: 20260304_crm_prospects_contact_email.sql und 20260304_crm_next_actions_sequence_logic.sql.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "crm_sequence_due_fetch_failed", details: dueRes.error.message },
      { status: 500 },
    );
  }

  const rows = Array.isArray(dueRes.data) ? (dueRes.data as any[]) : [];
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      scanned: 0,
      created: 0,
      skipped_existing: 0,
      skipped_invalid: 0,
      actions: [],
    });
  }

  let created = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  const actions: any[] = [];
  const createdByVariant: Record<string, number> = {};
  const activeWinners = await loadActiveRolloutWinners(supabase, String(auth.user.id));
  const learningSnapshot = await loadCurrentLearningSnapshot(supabase, String(auth.user.id)).catch(() => null);
  const dueProspectIds = [
    ...new Set(rows.map((row) => String(row?.prospect_id || "").trim()).filter(Boolean)),
  ];
  const stopEventsByProspect = new Map<
    string,
    {
      hardStop: boolean;
      hardStopReason: string | null;
      lastReplyAt: number | null;
      lastHandledAt: number | null;
      lastBounceAt: number | null;
    }
  >();
  if (dueProspectIds.length > 0) {
    const { data: stopEvents, error: stopEventsErr } = await (supabase.from("crm_outreach_events") as any)
      .select("prospect_id, event_type, event_at, metadata")
      .eq("agent_id", auth.user.id)
      .in("prospect_id", dueProspectIds)
      .in("event_type", [
        "reply_received",
        "call_booked",
        "pilot_invited",
        "pilot_started",
        "pilot_completed",
        "deal_won",
        "deal_lost",
        "unsubscribed",
        "no_interest",
        "message_failed",
      ])
      .order("event_at", { ascending: false })
      .limit(4000);
    if (!stopEventsErr) {
      for (const row of (stopEvents || []) as any[]) {
        const prospectId = String(row?.prospect_id || "").trim();
        if (!prospectId) continue;
        const entry = stopEventsByProspect.get(prospectId) || {
          hardStop: false,
          hardStopReason: null,
          lastReplyAt: null as number | null,
          lastHandledAt: null as number | null,
          lastBounceAt: null as number | null,
        };
        const type = String(row?.event_type || "").toLowerCase();
        const ts = toTs(row?.event_at);
        if (!ts) continue;
        const meta =
          row?.metadata && typeof row.metadata === "object"
            ? (row.metadata as Record<string, any>)
            : {};
        if (type === "unsubscribed") {
          entry.hardStop = true;
          entry.hardStopReason = "opt_out";
        }
        if (type === "no_interest" && !entry.hardStop) {
          entry.hardStop = true;
          entry.hardStopReason = "kein_interesse";
        }
        if (type === "reply_received" && (!entry.lastReplyAt || ts > entry.lastReplyAt)) {
          entry.lastReplyAt = ts;
        }
        if (
          ["call_booked", "pilot_invited", "pilot_started", "pilot_completed", "deal_won", "deal_lost"].includes(type) &&
          (!entry.lastHandledAt || ts > entry.lastHandledAt)
        ) {
          entry.lastHandledAt = ts;
        }
        if (type === "message_failed" && Boolean(meta.bounce_detected)) {
          if (!entry.lastBounceAt || ts > entry.lastBounceAt) entry.lastBounceAt = ts;
        }
        stopEventsByProspect.set(prospectId, entry);
      }
    }
  }
  const prospectContextById = new Map<string, Record<string, any>>();
  if (dueProspectIds.length > 0) {
    const { data: prospectContextRows } = await (supabase.from("crm_prospects") as any)
      .select(
        "id, contact_email, source_checked_at, personalization_evidence, response_promise_public, appointment_flow_public, docs_flow_public, automation_readiness, linkedin_url, linkedin_search_url",
      )
      .eq("agent_id", auth.user.id)
      .in("id", dueProspectIds)
      .limit(dueProspectIds.length);
    for (const row of (prospectContextRows || []) as any[]) {
      const prospectId = normalizeLine(row?.id || "", 80);
      if (prospectId) prospectContextById.set(prospectId, row as Record<string, any>);
    }
  }

  for (const row of rows) {
    const recommendedCode = normalizeLine(row?.recommended_code || "", 60);
    const messageKind = CODE_TO_KIND[recommendedCode];
    if (!messageKind) {
      skippedInvalid += 1;
      continue;
    }
    const stopSignals = stopEventsByProspect.get(String(row.prospect_id)) || null;
    if (stopSignals?.hardStop) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "stop_rule_hard",
        reason: stopSignals.hardStopReason,
      });
      continue;
    }
    if (
      stopSignals?.lastReplyAt &&
      (!stopSignals.lastHandledAt || stopSignals.lastReplyAt > stopSignals.lastHandledAt)
    ) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "stop_rule_open_reply",
        reason: "reply_unbearbeitet",
      });
      continue;
    }
    if (
      stopSignals?.lastBounceAt &&
      Date.now() - stopSignals.lastBounceAt <= 14 * 24 * 60 * 60 * 1000
    ) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "stop_rule_recent_bounce",
        reason: "bounce_letzte_14_tage",
      });
      continue;
    }

    const strategyResult = await ensureProspectStrategyDecision(supabase, {
      agentId: String(auth.user.id),
      prospectId: String(row.prospect_id),
    });
    if (!strategyResult.ok) {
      const strategyError = strategyResult as Extract<
        typeof strategyResult,
        { ok: false }
      >;
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "strategy_required",
        reason: strategyError.details,
      });
      continue;
    }
    if (strategyResult.strategy.strategy_status === "rejected") {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "strategy_review_required",
        reason: "Strategie wurde manuell als zu schwach markiert.",
      });
      continue;
    }

    const strategy = strategyResult.strategy;
    const rankedContacts = strategyResult.rankedContacts || [];
    const selectedContact =
      rankedContacts.find((contact) => {
        if (strategy.chosen_contact_candidate_id && contact.id === strategy.chosen_contact_candidate_id) {
          return true;
        }
        return (
          strategy.chosen_contact_channel === contact.channel_type &&
          strategy.chosen_contact_value === contact.channel_value
        );
      }) || rankedContacts[0] || null;

    const channelRaw = normalizeLine(
      strategy.chosen_channel || selectedContact?.channel_type || row?.preferred_channel || "email",
      40,
    ).toLowerCase();
    const channel =
      channelRaw === "email" ||
      channelRaw === "telefon" ||
      channelRaw === "linkedin" ||
      channelRaw === "kontaktformular" ||
      channelRaw === "whatsapp"
        ? channelRaw
        : "email";
    const prospectContext = prospectContextById.get(String(row.prospect_id)) || {};
    const timingPolicy = evaluateSendTiming({
      channel,
      prospect: {
        ...row,
        ...prospectContext,
        preferred_channel: channel,
      },
      learningSnapshot,
      timezone: "Europe/Berlin",
    });
    const resolvedContactEmail =
      channel === "email"
        ? (
            normalizeLine(
              selectedContact?.channel_type === "email"
                ? selectedContact.channel_value
                : strategy.chosen_contact_channel === "email"
                  ? strategy.chosen_contact_value || ""
                  : prospectContext.contact_email || row.contact_email || "",
              240,
            ).toLowerCase() || null
          )
        : null;
    if (!timingPolicy.allow_now) {
      if (!dryRun) {
        await (supabase.from("crm_prospects") as any)
          .update({
            next_action: `${channel} im besseren Zeitfenster vorbereiten`,
            next_action_at: timingPolicy.suggested_send_at,
          })
          .eq("id", String(row.prospect_id))
          .eq("agent_id", auth.user.id);
      }
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "timing_window_wait",
        suggested_send_at: timingPolicy.suggested_send_at,
        reason: timingPolicy.reason,
      });
      continue;
    }
    const researchReadiness = assessResearchReadiness({
      preferredChannel: channel,
      contactEmail: resolvedContactEmail,
      personalizationHook:
        normalizeText(strategy.chosen_trigger || row.personalization_hook || "", 220) || null,
      personalizationEvidence:
        normalizeText(prospectContext.personalization_evidence || "", 240) || null,
      sourceCheckedAt: normalizeLine(prospectContext.source_checked_at || "", 40) || null,
      targetGroup: normalizeText(row.target_group || "", 220) || null,
      processHint: normalizeText(row.process_hint || "", 220) || null,
      responsePromisePublic:
        normalizeText(prospectContext.response_promise_public || "", 180) || null,
      appointmentFlowPublic:
        normalizeText(prospectContext.appointment_flow_public || "", 180) || null,
      docsFlowPublic: normalizeText(prospectContext.docs_flow_public || "", 180) || null,
      activeListingsCount: Number.isFinite(Number(row.active_listings_count))
        ? Number(row.active_listings_count)
        : null,
      automationReadiness:
        normalizeLine(prospectContext.automation_readiness || row.automation_readiness || "", 24) ||
        null,
      linkedinUrl: normalizeLine(prospectContext.linkedin_url || "", 320) || null,
      linkedinSearchUrl: normalizeLine(prospectContext.linkedin_search_url || "", 320) || null,
    });
    if (researchReadiness.status === "missing_contact") {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "missing_contact_channel",
        reason: researchReadiness.summary,
      });
      continue;
    }
    if (
      researchReadiness.status === "needs_research" ||
      (researchReadiness.status === "refresh_research" && messageKind === "first_touch")
    ) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "research_required",
        reason: researchReadiness.summary,
      });
      continue;
    }

    const existingDraftRes = await (supabase.from("crm_outreach_messages") as any)
      .select("id, status")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", String(row.prospect_id))
      .eq("message_kind", messageKind)
      .in("status", ["draft", "ready"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraftRes.error) {
      skippedInvalid += 1;
      continue;
    }
    if (existingDraftRes.data) {
      skippedExisting += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "already_has_draft",
        draft_id: existingDraftRes.data.id,
      });
      continue;
    }

    const draft = buildSequenceDraft({
      code: recommendedCode,
      companyName: normalizeLine(row.company_name || "", 160),
      contactName:
        normalizeLine(selectedContact?.contact_name || row.contact_name || "", 120) || null,
      hook:
        normalizeText(strategy.chosen_trigger || row.personalization_hook || "", 320) || null,
      painPoint:
        normalizeText(strategy.chosen_angle || row.pain_point_hypothesis || "", 320) || null,
    });
    const cadenceStep = cadenceStepFromCode(recommendedCode);
    const triggerEvidence = collectTriggerEvidence({
      companyName: normalizeLine(row.company_name || "", 160),
      city: normalizeLine(row.city || "", 120) || null,
      region: normalizeLine(row.region || "", 120) || null,
      objectFocus: normalizeLine(row.object_focus || "", 24) || null,
      activeListingsCount: Number.isFinite(Number(row.active_listings_count))
        ? Number(row.active_listings_count)
        : null,
      shareMietePercent: Number.isFinite(Number(row.share_miete_percent))
        ? Number(row.share_miete_percent)
        : null,
      shareKaufPercent: Number.isFinite(Number(row.share_kauf_percent))
        ? Number(row.share_kauf_percent)
        : null,
      targetGroup: normalizeText(row.target_group || "", 200) || null,
      processHint: normalizeText(row.process_hint || "", 220) || null,
      personalizationHook: normalizeText(row.personalization_hook || "", 220) || null,
    });
    const inferred = inferSegmentAndPlaybook({
      object_focus: normalizeLine(row.object_focus || "", 24) || null,
      share_miete_percent: Number.isFinite(Number(row.share_miete_percent))
        ? Number(row.share_miete_percent)
        : null,
      share_kauf_percent: Number.isFinite(Number(row.share_kauf_percent))
        ? Number(row.share_kauf_percent)
        : null,
      active_listings_count: Number.isFinite(Number(row.active_listings_count))
        ? Number(row.active_listings_count)
        : null,
      automation_readiness: normalizeLine(row.automation_readiness || "", 24) || null,
    });

    let selectedVariant:
      | { variant: string; source: "winner" | "hash" | "learning"; reason: string }
      | null = null;
    let templateVariant = `${messageKind}__manual_v1`;
    let variantBody = draft.body;

    if (messageKind === "custom") {
      templateVariant = "custom__breakup_respectful_v1";
    } else {
      selectedVariant = chooseSequenceVariant({
        agentId: String(auth.user.id),
        prospectId: String(row.prospect_id),
        kind: messageKind as SequenceMessageKind,
        segmentKey: inferred.segment_key,
        activeWinners,
      });
      if (selectedVariant.source === "hash" && learningSnapshot) {
        const bestLearned = listSequenceVariants(messageKind as SequenceMessageKind)
          .map((variant) => ({
            variant,
            bias: getVariantLearningBias(learningSnapshot, messageKind, variant),
          }))
          .filter((item) => item.bias && item.bias.sample_size >= 4)
          .sort((a, b) => Number(b.bias?.score_adjustment || 0) - Number(a.bias?.score_adjustment || 0))[0];
        if (bestLearned?.bias && bestLearned.bias.score_adjustment >= 4) {
          selectedVariant = {
            variant: bestLearned.variant,
            source: "learning",
            reason: bestLearned.bias.reason,
          };
        }
      }
      templateVariant = `${messageKind}__${selectedVariant.variant}`;
      variantBody = applySequenceVariantTone({
        kind: messageKind as SequenceMessageKind,
        variant: selectedVariant.variant,
        body: draft.body,
      });
    }
    const ab = deriveAbFields({
      messageKind: messageKind as any,
      templateVariant,
      cadenceStep,
    });
    const firstTouchGuardrail =
      messageKind === "first_touch"
        ? evaluateFirstTouchGuardrails({
            body: variantBody,
            triggerEvidenceCount: triggerEvidence.length,
          })
        : null;
    const groundedContext = await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId: String(row.prospect_id),
      channel,
      messageKind,
      segmentKey: strategy.segment_key || null,
      playbookKey: strategy.playbook_key || null,
    });
    const outboundReview = evaluateGroundedOutboundMessageQuality({
      body: variantBody,
      subject: draft.subject || cadenceSubjectFromCode(recommendedCode),
      channel,
      messageKind,
      companyName: normalizeLine(row.company_name || "", 160),
      city: normalizeLine(row.city || "", 120) || null,
      personalizationHook: normalizeText(row.personalization_hook || "", 220) || null,
      triggerEvidenceCount: triggerEvidence.length,
      researchReadiness,
      prospect: {
        company_name: normalizeLine(row.company_name || "", 160) || null,
        city: normalizeLine(row.city || "", 120) || null,
        preferred_channel: channel,
        contact_email: resolvedContactEmail,
        personalization_hook:
          normalizeText(strategy.chosen_trigger || row.personalization_hook || "", 220) || null,
        personalization_evidence: null,
        source_checked_at: null,
        target_group: normalizeText(row.target_group || "", 220) || null,
        process_hint: normalizeText(row.process_hint || "", 220) || null,
        active_listings_count: Number.isFinite(Number(row.active_listings_count))
          ? Number(row.active_listings_count)
          : null,
        automation_readiness: normalizeLine(row.automation_readiness || "", 24) || null,
      },
      context: groundedContext,
      supportHints: [...triggerEvidence, ...(strategy.trigger_evidence || [])],
    });
    if (messageKind === "first_touch" && firstTouchGuardrail && !firstTouchGuardrail.pass) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "guardrail_blocked",
        guardrail_reasons: firstTouchGuardrail.reasons,
      });
      continue;
    }
    if (outboundReview.status === "blocked" || (messageKind === "first_touch" && outboundReview.status !== "pass")) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "quality_review_required",
        review_status: outboundReview.status,
        review_summary: outboundReview.summary,
      });
      continue;
    }

    if (channel === "email" && !resolvedContactEmail) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "missing_contact_email",
      });
      continue;
    }

    if (dryRun) {
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        message_kind: messageKind,
        result: "would_create_draft",
        channel,
        cadence_step: cadenceStep,
        template_variant: templateVariant,
      });
      continue;
    }

    const insertPayload = {
      prospect_id: String(row.prospect_id),
      agent_id: auth.user.id,
      channel,
      message_kind: messageKind,
      subject: draft.subject || cadenceSubjectFromCode(recommendedCode),
      body: variantBody,
      personalization_score: 82,
      status: "ready",
      metadata: {
        source: "sequence_run",
        recommended_code: recommendedCode,
        recommended_action: normalizeText(row.recommended_action || "", 280) || null,
        recommended_reason: normalizeText(row.recommended_reason || "", 360) || null,
        cadence_key: "cadence_v1_5touch_14d",
        cadence_step: cadenceStep,
        cadence_segment: "sequence_runtime",
        segment_key: inferred.segment_key,
        playbook_key: inferred.playbook_key,
        template_variant: templateVariant,
        research_readiness: researchReadiness,
        outbound_review: outboundReview,
        experiment_kind: messageKind !== "custom" ? messageKind : null,
        experiment_variant: selectedVariant?.variant || null,
        experiment_source: selectedVariant?.source || null,
        experiment_reason: selectedVariant?.reason || null,
        ab_intro_variant: ab.ab_intro_variant,
        ab_trigger_variant: ab.ab_trigger_variant,
        ab_cta_variant: ab.ab_cta_variant,
        ab_subject_variant: ab.ab_subject_variant,
        strategy_decision_id: strategy.id,
        strategy_version: strategy.version,
        strategy_channel: strategy.chosen_channel,
        strategy_cta: strategy.chosen_cta,
        strategy_angle: strategy.chosen_angle,
        strategy_trigger: strategy.chosen_trigger,
        strategy_contact_channel: selectedContact?.channel_type || strategy.chosen_contact_channel,
        strategy_contact_value: selectedContact?.channel_value || strategy.chosen_contact_value,
        strategy_contact_candidate_id: selectedContact?.id || strategy.chosen_contact_candidate_id,
        automation_override: overridePause || null,
        automation_settings_snapshot: {
          sequence_automation_enabled: automation.sequence_automation_enabled,
          enrichment_automation_enabled: automation.enrichment_automation_enabled,
          reason: automation.reason,
          updated_at: automation.updated_at,
        },
        timing_policy: timingPolicy,
        scheduled_for: timingPolicy.suggested_send_at,
        trigger_evidence: triggerEvidence,
        trigger_evidence_count: triggerEvidence.length,
        first_touch_guardrail: firstTouchGuardrail,
        first_touch_guardrail_pass:
          messageKind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
        generated_at: new Date().toISOString(),
      },
      cadence_key: "cadence_v1_5touch_14d",
      cadence_step: cadenceStep,
      ab_intro_variant: ab.ab_intro_variant,
      ab_trigger_variant: ab.ab_trigger_variant,
      ab_cta_variant: ab.ab_cta_variant,
      ab_subject_variant: ab.ab_subject_variant,
      trigger_evidence_count: triggerEvidence.length,
      first_touch_guardrail_pass:
        messageKind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
    };

    let insertRes = await (supabase.from("crm_outreach_messages") as any)
      .insert(insertPayload)
      .select("id, status, message_kind, channel")
      .single();

    if (insertRes.error && isSchemaMismatch(insertRes.error as any)) {
      insertRes = await (supabase.from("crm_outreach_messages") as any)
        .insert({
          prospect_id: String(row.prospect_id),
          agent_id: auth.user.id,
          channel,
          message_kind: messageKind,
          subject: draft.subject || cadenceSubjectFromCode(recommendedCode),
          body: variantBody,
          personalization_score: 82,
          status: "ready",
          metadata: insertPayload.metadata,
        })
        .select("id, status, message_kind, channel")
        .single();
    }

    const { data: createdDraft, error: insertErr } = insertRes as any;

    if (insertErr || !createdDraft) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "insert_failed",
        error: insertErr?.message || "unknown",
      });
      continue;
    }

    try {
      await persistQualityReview(supabase, {
        agentId: String(auth.user.id),
        prospectId: String(row.prospect_id),
        messageId: String(createdDraft.id),
        reviewScope: "sequence_draft",
        channel,
        messageKind,
        review: outboundReview,
        metadata: {
          source: "sequence_run",
          strategy_decision_id: strategy.id,
        },
      });
    } catch {
      // Fail-open during sequence generation.
    }

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: String(row.prospect_id),
      p_agent_id: auth.user.id,
      p_event_type: "follow_up_due",
      p_message_id: String(createdDraft.id),
      p_details: `${messageKind} als Draft vorbereitet`,
      p_metadata: {
        source: "sequence_run",
        recommended_code: recommendedCode,
        template_variant: templateVariant,
        cadence_key: "cadence_v1_5touch_14d",
        cadence_step: cadenceStep,
        experiment_kind: messageKind !== "custom" ? messageKind : null,
        experiment_variant: selectedVariant?.variant || null,
        ab_intro_variant: ab.ab_intro_variant,
        ab_trigger_variant: ab.ab_trigger_variant,
        ab_cta_variant: ab.ab_cta_variant,
        ab_subject_variant: ab.ab_subject_variant,
        automation_override: overridePause || null,
        timing_policy: timingPolicy,
        scheduled_for: timingPolicy.suggested_send_at,
      },
    }) as any);

    created += 1;
    createdByVariant[templateVariant] = (createdByVariant[templateVariant] || 0) + 1;
    actions.push({
      prospect_id: row.prospect_id,
      company_name: row.company_name,
      recommended_code: recommendedCode,
      message_kind: messageKind,
      channel,
      template_variant: templateVariant,
      experiment_source: selectedVariant?.source || "manual",
      cadence_step: cadenceStep,
      scheduled_for: timingPolicy.suggested_send_at,
      automation_override: overridePause,
      draft_id: createdDraft.id,
      result: "draft_created",
    });
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    scanned: rows.length,
    automation_override: overridePause,
    created,
    skipped_existing: skippedExisting,
    skipped_invalid: skippedInvalid,
    created_by_variant: createdByVariant,
    active_winner_rollouts: [...activeWinners.entries()].map(([message_kind, row]) => ({
      message_kind,
      winner_variant: row.variant,
      confidence: row.confidence,
      sample_size: row.sample_size,
    })),
    actions,
  });
}
