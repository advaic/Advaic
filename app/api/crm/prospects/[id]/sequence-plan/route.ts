import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  buildCadenceV1,
  collectTriggerEvidence,
  deriveAbFields,
  evaluateFirstTouchGuardrails,
  type CadenceChannel,
  type CadenceMessageKind,
} from "@/lib/crm/cadenceRules";

export const runtime = "nodejs";

type SequenceStep = {
  step_number: 1 | 2 | 3 | 4 | 5;
  day_offset: number;
  message_kind: CadenceMessageKind;
  channel: CadenceChannel;
  label: string;
  objective: string;
  intro_variant: string;
  trigger_variant: string;
  cta_variant: string;
  subject_variant: string;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 2600) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
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

function parseDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function parseStepNumber(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded as 1 | 2 | 3 | 4 | 5;
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

function buildBody(args: {
  step: SequenceStep;
  companyName: string;
  contactName: string | null;
  hook: string | null;
  pain: string | null;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;
  const hook =
    args.hook ||
    "Sie vermarkten mehrere Objekte parallel und setzen gleichzeitig auf persönliche Betreuung.";
  const pain =
    args.pain ||
    "Gerade dann wird es oft schwierig, jede Anfrage schnell und persönlich genug zu beantworten.";

  if (args.step.message_kind === "first_touch") {
    return `${salutation}

ich bin Kilian, Gründer von Advaic.
Ich habe mir ${args.companyName} kurz angeschaut und hatte den Eindruck, dass ${hook}
${pain}

Ist das bei Ihnen aktuell ein relevantes Thema?`;
  }

  if (args.step.message_kind === "follow_up_1") {
    return `${salutation}

ich wollte kurz nachfassen, weil genau dieser Anfragefluss im Alltag oft unbemerkt Zeit frisst.
Wir starten in der Regel konservativ: mehr Freigaben, weniger Auto-Versand.

Haben Sie das intern bereits sauber gelöst oder ist das weiterhin offen?`;
  }

  if (args.step.message_kind === "follow_up_2") {
    return `${salutation}

kurzer Kontext zu meiner Nachricht: Mit Advaic lassen sich Standardanfragen abfangen, ohne die Kontrolle bei Sonderfällen zu verlieren.
Wichtig bleibt immer: klar = Auto, unklar = Freigabe, Checks vor Versand.

Soll ich Ihnen zwei konkrete Startkonfigurationen schicken?`;
  }

  if (args.step.message_kind === "follow_up_3") {
    return `${salutation}

typischer Einwand ist die Sorge vor unpassenden Antworten. Genau deshalb stoppt Advaic bei unsicheren Fällen und legt zur Freigabe vor.
So bleibt der Stil persönlich und der Ablauf nachvollziehbar.

Wäre ein kurzer Abgleich sinnvoll, wie das in Ihrem Setup aussehen könnte?`;
  }

  return `${salutation}

ich melde mich ein letztes Mal kurz zu dem Thema.
Wenn es aktuell nicht relevant ist, hake ich es gerne ab.

Soll ich das Thema schließen oder zu einem späteren Zeitpunkt noch einmal aufgreifen?`;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const prospectId = String(id || "").trim();
  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const requestedStart = parseDate(body?.start_at);
  const startAt = requestedStart || new Date();
  const customSteps = Array.isArray(body?.steps) ? (body.steps as any[]) : null;

  const supabase = createSupabaseAdminClient();

  let prospectRes = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, stage, next_action, next_action_at, personalization_hook, pain_point_hypothesis, object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness, preferred_channel, linkedin_url, linkedin_search_url, city, region, target_group, process_hint, personalization_evidence, source_checked_at",
    )
    .eq("id", prospectId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (prospectRes.error && String((prospectRes.error as any).code || "") === "42703") {
    prospectRes = await (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, stage, next_action, next_action_at, personalization_hook, pain_point_hypothesis, object_focus, preferred_channel, city, region, target_group, process_hint",
      )
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id)
      .maybeSingle();
  }

  if (prospectRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: prospectRes.error.message },
      { status: 500 },
    );
  }
  if (!prospectRes.data) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }
  const prospect = prospectRes.data as Record<string, any>;

  const cadence = buildCadenceV1({
    objectFocus: normalizeLine(prospect.object_focus, 20) || null,
    shareMietePercent: Number.isFinite(Number(prospect.share_miete_percent))
      ? Number(prospect.share_miete_percent)
      : null,
    shareKaufPercent: Number.isFinite(Number(prospect.share_kauf_percent))
      ? Number(prospect.share_kauf_percent)
      : null,
    activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
      ? Number(prospect.active_listings_count)
      : null,
    automationReadiness: normalizeLine(prospect.automation_readiness, 24) || null,
    preferredChannel: normalizeLine(prospect.preferred_channel, 24) || null,
    hasLinkedin: Boolean(
      normalizeLine(prospect.linkedin_url, 260) || normalizeLine(prospect.linkedin_search_url, 260),
    ),
  });

  let steps: SequenceStep[] = cadence.steps.map((step) => ({
    ...step,
  }));

  if (customSteps && customSteps.length > 0) {
    const parsed = customSteps
      .map((step, idx) => {
        const day = Number(step?.day_offset);
        const stepNumber = parseStepNumber(step?.step_number) || parseStepNumber(idx + 1);
        const kind = normalizeLine(step?.message_kind, 40) as CadenceMessageKind;
        const channel = normalizeLine(step?.channel, 40) as CadenceChannel;
        const label = normalizeLine(step?.label, 90);
        const objective = normalizeLine(step?.objective, 220);
        if (!Number.isFinite(day) || !stepNumber) return null;
        if (!["first_touch", "follow_up_1", "follow_up_2", "follow_up_3", "custom"].includes(kind)) {
          return null;
        }
        if (!["email", "linkedin", "telefon", "kontaktformular", "whatsapp", "sonstiges"].includes(channel)) {
          return null;
        }
        const ab = deriveAbFields({
          messageKind: kind,
          templateVariant: normalizeLine(step?.template_variant, 120) || `cadence_manual_step_${stepNumber}`,
          cadenceStep: stepNumber,
        });
        return {
          step_number: stepNumber,
          day_offset: Math.max(0, Math.min(21, Math.round(day))),
          message_kind: kind,
          channel,
          label: label || `Tag ${Math.max(0, Math.min(21, Math.round(day)))} · Schritt ${stepNumber}`,
          objective: objective || "Geplanter Sequenzschritt",
          intro_variant: normalizeLine(step?.intro_variant, 80) || ab.ab_intro_variant,
          trigger_variant: normalizeLine(step?.trigger_variant, 80) || ab.ab_trigger_variant,
          cta_variant: normalizeLine(step?.cta_variant, 80) || ab.ab_cta_variant,
          subject_variant: normalizeLine(step?.subject_variant, 80) || ab.ab_subject_variant,
        } as SequenceStep;
      })
      .filter(Boolean) as SequenceStep[];
    if (parsed.length > 0) {
      steps = parsed.sort((a, b) => a.day_offset - b.day_offset);
    }
  }

  const sequencePlanId = randomUUID();
  const created: Array<{ id: string; message_kind: string; channel: string; scheduled_for: string }> = [];
  const skipped: Array<{ message_kind: string; reason: string }> = [];

  const triggerEvidence = collectTriggerEvidence({
    companyName: normalizeLine(prospect.company_name, 160),
    city: normalizeLine(prospect.city, 120) || null,
    region: normalizeLine(prospect.region, 120) || null,
    objectFocus: normalizeLine(prospect.object_focus, 24) || null,
    activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
      ? Number(prospect.active_listings_count)
      : null,
    newListings30d: Number.isFinite(Number(prospect.new_listings_30d))
      ? Number(prospect.new_listings_30d)
      : null,
    shareMietePercent: Number.isFinite(Number(prospect.share_miete_percent))
      ? Number(prospect.share_miete_percent)
      : null,
    shareKaufPercent: Number.isFinite(Number(prospect.share_kauf_percent))
      ? Number(prospect.share_kauf_percent)
      : null,
    targetGroup: normalizeText(prospect.target_group, 200) || null,
    processHint: normalizeText(prospect.process_hint, 220) || null,
    personalizationHook: normalizeText(prospect.personalization_hook, 220) || null,
    personalizationEvidence: normalizeText(prospect.personalization_evidence, 220) || null,
    sourceCheckedAt: normalizeLine(prospect.source_checked_at, 40) || null,
  });

  for (const step of steps) {
    const scheduled = new Date(startAt.getTime() + step.day_offset * 24 * 60 * 60 * 1000);
    const scheduledIso = scheduled.toISOString();

    const existingRes = await (supabase.from("crm_outreach_messages") as any)
      .select("id, status, metadata")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .eq("message_kind", step.message_kind)
      .in("status", ["draft", "ready", "sent"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRes.error) {
      skipped.push({ message_kind: step.message_kind, reason: "lookup_failed" });
      continue;
    }
    if (existingRes.data) {
      skipped.push({ message_kind: step.message_kind, reason: "already_exists" });
      continue;
    }

    const bodyText = buildBody({
      step,
      companyName: normalizeLine(prospect.company_name, 160),
      contactName: normalizeLine(prospect.contact_name, 120) || null,
      hook:
        sanitizeTouch1Snippet(normalizeText(prospect.personalization_hook, 260), 220) || null,
      pain:
        sanitizeTouch1Snippet(normalizeText(prospect.pain_point_hypothesis, 260), 220) || null,
    });

    const firstTouchGuardrail =
      step.message_kind === "first_touch"
        ? evaluateFirstTouchGuardrails({
            body: bodyText,
            triggerEvidenceCount: triggerEvidence.length,
          })
        : null;
    if (step.message_kind === "first_touch" && firstTouchGuardrail && !firstTouchGuardrail.pass) {
      skipped.push({
        message_kind: step.message_kind,
        reason: `guardrail_failed:${firstTouchGuardrail.reasons.join(" | ")}`,
      });
      continue;
    }

    const subject =
      step.message_kind === "first_touch"
        ? "Anfragen"
        : step.message_kind === "follow_up_1"
          ? "Reaktionszeit"
          : step.message_kind === "follow_up_2"
            ? "Kontrolle"
            : step.message_kind === "follow_up_3"
              ? "Freigabe"
              : "Abgleich";

    const templateVariant = `${step.message_kind}__${step.intro_variant}`;
    const metadata = {
      source: "sequence_planner",
      sequence_plan_id: sequencePlanId,
      step_label: step.label,
      scheduled_for: scheduledIso,
      stop_rules: cadence.stop_rules,
      cadence_key: cadence.cadence_key,
      cadence_step: step.step_number,
      cadence_segment: cadence.segment,
      objective: step.objective,
      template_variant: templateVariant,
      intro_variant: step.intro_variant,
      trigger_variant: step.trigger_variant,
      cta_variant: step.cta_variant,
      subject_variant: step.subject_variant,
      ab_intro_variant: step.intro_variant,
      ab_trigger_variant: step.trigger_variant,
      ab_cta_variant: step.cta_variant,
      ab_subject_variant: step.subject_variant,
      trigger_evidence: triggerEvidence,
      trigger_evidence_count: triggerEvidence.length,
      first_touch_guardrail_pass:
        step.message_kind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
      first_touch_guardrail: firstTouchGuardrail,
    };

    const insertWithColumns = {
      prospect_id: prospectId,
      agent_id: auth.user.id,
      channel: step.channel,
      message_kind: step.message_kind,
      subject: step.channel === "email" ? subject : null,
      body: bodyText,
      personalization_score: 86,
      status: "ready",
      metadata,
      cadence_key: cadence.cadence_key,
      cadence_step: step.step_number,
      ab_intro_variant: step.intro_variant,
      ab_trigger_variant: step.trigger_variant,
      ab_cta_variant: step.cta_variant,
      ab_subject_variant: step.subject_variant,
      trigger_evidence_count: triggerEvidence.length,
      first_touch_guardrail_pass:
        step.message_kind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
    };

    let insertRes = await (supabase.from("crm_outreach_messages") as any)
      .insert(insertWithColumns)
      .select("id, message_kind, channel, metadata")
      .single();

    if (insertRes.error && isSchemaMismatch(insertRes.error as any)) {
      insertRes = await (supabase.from("crm_outreach_messages") as any)
        .insert({
          prospect_id: prospectId,
          agent_id: auth.user.id,
          channel: step.channel,
          message_kind: step.message_kind,
          subject: step.channel === "email" ? subject : null,
          body: bodyText,
          personalization_score: 86,
          status: "ready",
          metadata,
        })
        .select("id, message_kind, channel, metadata")
        .single();
    }

    if (insertRes.error || !insertRes.data) {
      skipped.push({
        message_kind: step.message_kind,
        reason: `insert_failed:${insertRes.error?.message || "unknown"}`,
      });
      continue;
    }

    created.push({
      id: String(insertRes.data.id),
      message_kind: String(insertRes.data.message_kind),
      channel: String(insertRes.data.channel),
      scheduled_for: scheduledIso,
    });

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: prospectId,
      p_agent_id: auth.user.id,
      p_event_type: "follow_up_due",
      p_message_id: String(insertRes.data.id),
      p_details: `Sequenz-Schritt geplant: ${step.label}`,
      p_metadata: {
        source: "sequence_planner",
        sequence_plan_id: sequencePlanId,
        cadence_key: cadence.cadence_key,
        cadence_step: step.step_number,
        stop_rules: cadence.stop_rules,
        template_variant: templateVariant,
      },
    }) as any);
  }

  const nextScheduled = created
    .map((entry) => parseDate(entry.scheduled_for))
    .filter(Boolean)
    .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] as Date | undefined;

  if (nextScheduled) {
    await (supabase.from("crm_prospects") as any)
      .update({
        next_action: "Geplante Sequenz überwachen",
        next_action_at: nextScheduled.toISOString(),
      })
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id);
  }

  return NextResponse.json({
    ok: true,
    sequence_plan_id: sequencePlanId,
    cadence_key: cadence.cadence_key,
    cadence_segment: cadence.segment,
    stop_rules: cadence.stop_rules,
    next_action: nextScheduled ? "Geplante Sequenz überwachen" : null,
    next_action_at: nextScheduled ? nextScheduled.toISOString() : null,
    created,
    skipped,
    created_count: created.length,
    skipped_count: skipped.length,
  });
}
