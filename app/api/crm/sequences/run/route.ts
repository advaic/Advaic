import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  applySequenceVariantTone,
  chooseSequenceVariant,
  loadActiveRolloutWinners,
  type SequenceMessageKind,
} from "@/lib/crm/sequenceExperiments";
import {
  collectTriggerEvidence,
  deriveAbFields,
  evaluateFirstTouchGuardrails,
} from "@/lib/crm/cadenceRules";

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
    ? `${args.hook}`
    : `mir ist bei ${args.companyName} der Fokus auf mehrere parallele Vermarktungen aufgefallen.`;

  const painLine = args.painPoint
    ? `${args.painPoint}`
    : "Gerade dann wird es oft schwierig, jede Anfrage schnell und persönlich genug zu beantworten.";

  if (args.code === "send_first_touch") {
    return {
      subject: cadenceSubjectFromCode(args.code),
      body: `${salutation}

ich bin Kilian von Advaic. ${hookLine}
${painLine}

Advaic beantwortet klare Fälle automatisch, schickt unklare Fälle zur Freigabe und führt vor jedem Versand Qualitätschecks auf Relevanz, Kontext und Ton aus.

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
  const limit = Math.max(1, Math.min(100, Number(body?.limit || 40)));

  const supabase = createSupabaseAdminClient();
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
  if (dueRes.error && String((dueRes.error as any)?.code || "") === "42703") {
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

  for (const row of rows) {
    const recommendedCode = normalizeLine(row?.recommended_code || "", 60);
    const messageKind = CODE_TO_KIND[recommendedCode];
    if (!messageKind) {
      skippedInvalid += 1;
      continue;
    }

    const channelRaw = normalizeLine(row?.preferred_channel || "email", 40).toLowerCase();
    const channel =
      channelRaw === "email" ||
      channelRaw === "telefon" ||
      channelRaw === "linkedin" ||
      channelRaw === "kontaktformular" ||
      channelRaw === "whatsapp"
        ? channelRaw
        : "email";

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
      contactName: normalizeLine(row.contact_name || "", 120) || null,
      hook: normalizeText(row.personalization_hook || "", 320) || null,
      painPoint: normalizeText(row.pain_point_hypothesis || "", 320) || null,
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

    let selectedVariant:
      | { variant: string; source: "winner" | "hash"; reason: string }
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
        activeWinners,
      });
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

    const toEmail = normalizeLine(row.contact_email || "", 240).toLowerCase();
    if (channel === "email" && !toEmail) {
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
        template_variant: templateVariant,
        experiment_kind: messageKind !== "custom" ? messageKind : null,
        experiment_variant: selectedVariant?.variant || null,
        experiment_source: selectedVariant?.source || null,
        experiment_reason: selectedVariant?.reason || null,
        ab_intro_variant: ab.ab_intro_variant,
        ab_trigger_variant: ab.ab_trigger_variant,
        ab_cta_variant: ab.ab_cta_variant,
        ab_subject_variant: ab.ab_subject_variant,
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
      draft_id: createdDraft.id,
      result: "draft_created",
    });
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    scanned: rows.length,
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
