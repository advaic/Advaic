import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  applySelectedContactToProspect,
  runContactRepair,
  updateContactCandidateStatus,
} from "@/lib/crm/contactResolutionEngine";
import { syncGoldsetExampleFromFeedback } from "@/lib/crm/messageGoldset";
import { recordOperatorFeedback } from "@/lib/crm/operatorFeedback";
import { ensureProspectStrategyDecision } from "@/lib/crm/strategyEngine";

export const runtime = "nodejs";

const SUBJECT_TYPES = new Set(["candidate", "strategy", "draft", "contact"]);
const FEEDBACK_VALUES = new Set(["accept", "reject", "approve", "needs_work", "wrong_contact", "preferred"]);

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const subjectType = clean(body?.subject_type, 24).toLowerCase();
  const subjectId = clean(body?.subject_id, 120);
  const feedbackValue = clean(body?.feedback_value, 24).toLowerCase();

  if (!SUBJECT_TYPES.has(subjectType) || !subjectId || !FEEDBACK_VALUES.has(feedbackValue)) {
    return NextResponse.json(
      { ok: false, error: "invalid_feedback_payload" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);
  const prospectId = clean(body?.prospect_id, 120) || null;
  try {
    await recordOperatorFeedback(supabase, {
      agentId,
      subjectType: subjectType as any,
      subjectId,
      feedbackValue: feedbackValue as any,
      prospectId,
      candidateId: clean(body?.candidate_id, 120) || null,
      strategyDecisionId: clean(body?.strategy_decision_id, 120) || null,
      messageId: clean(body?.message_id, 120) || null,
      notes: clean(body?.notes, 500) || null,
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });

    if (subjectType === "draft" && (feedbackValue === "approve" || feedbackValue === "needs_work")) {
      await syncGoldsetExampleFromFeedback(supabase, {
        agentId,
        messageId: clean(body?.message_id, 120) || subjectId,
        feedbackValue: feedbackValue as "approve" | "needs_work",
        notes: clean(body?.notes, 500) || null,
        metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
      });
    }

    if (subjectType === "strategy") {
      const strategyStatus = feedbackValue === "needs_work" || feedbackValue === "reject" ? "rejected" : "active";
      const { error: strategyError } = await (supabase.from("crm_strategy_decisions") as any)
        .update({ strategy_status: strategyStatus })
        .eq("id", subjectId)
        .eq("agent_id", agentId);
      if (strategyError && !isSchemaMismatch(strategyError as any)) {
        return NextResponse.json(
          { ok: false, error: "feedback_strategy_update_failed", details: strategyError.message },
          { status: 500 },
        );
      }
    }

    if (subjectType === "contact" && feedbackValue === "preferred") {
      await updateContactCandidateStatus(supabase, {
        agentId,
        prospectId,
        contactCandidateId: subjectId,
        validationStatus: "verified",
        isPrimary: true,
        metadataPatch: {
          preferred_by_operator_at: new Date().toISOString(),
        },
      });

      if (prospectId) {
        const strategyResult = await ensureProspectStrategyDecision(supabase, {
          agentId,
          prospectId,
          force: true,
        });
        if (strategyResult.ok) {
          const selectedContact =
            strategyResult.rankedContacts.find((contact) => clean(contact.id, 120) === subjectId) ||
            strategyResult.rankedContacts[0] ||
            null;
          await applySelectedContactToProspect(supabase, {
            agentId,
            prospectId,
            selectedContact: selectedContact
              ? {
                  id: clean(selectedContact.id, 120) || null,
                  channel_type: clean(selectedContact.channel_type, 24),
                  channel_value: clean(selectedContact.channel_value, 500),
                  contact_name: clean(selectedContact.contact_name, 160) || null,
                  contact_role: clean(selectedContact.contact_role, 120) || null,
                  confidence:
                    typeof selectedContact.confidence === "number"
                      ? selectedContact.confidence
                      : null,
                  score: Number.isFinite(Number(selectedContact.score))
                    ? Number(selectedContact.score)
                    : 0,
                  recommended_order: Number.isFinite(Number(selectedContact.recommended_order))
                    ? Number(selectedContact.recommended_order)
                    : 0,
                }
              : null,
            strategy: strategyResult.strategy,
            note: "Kontakt wurde manuell priorisiert.",
          });
        }
      }
    }

    if (subjectType === "contact" && feedbackValue === "wrong_contact" && prospectId) {
      const repair = await runContactRepair(supabase, {
        agentId,
        prospectId,
        triggerType: "wrong_contact",
        contactCandidateId: subjectId,
        messageId: clean(body?.message_id, 120) || null,
      });
      if (!repair.ok) {
        const errorResult = repair as Extract<typeof repair, { ok: false }>;
        return NextResponse.json(
          { ok: false, error: errorResult.error, details: errorResult.details },
          { status: 500 },
        );
      }
      return NextResponse.json({
        ok: true,
        repaired: true,
        status: repair.status,
        summary: repair.summary,
        strategy: repair.strategy,
        selected_contact: repair.selected_contact,
      });
    }
  } catch (error: any) {
    if (isSchemaMismatch(error as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_feedback_schema_missing",
          details:
            "CRM-Feedback-Schema fehlt. Bitte zuerst die Migration 20260322_crm_phase2_strategy_feedback.sql ausfuehren.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "crm_feedback_failed", details: String(error?.message || "Feedback konnte nicht gespeichert werden.") },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
