const APPROVAL_REVIEW_KEY = "approval_review_v1";
const APPROVAL_REVIEW_VERSION = "v1";

function normalizeForCompare(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function roughDiffCount(a: string, b: string) {
  const left = String(a || "");
  const right = String(b || "");
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 0;
  let mismatches = 0;
  const minLen = Math.min(left.length, right.length);
  for (let i = 0; i < minLen; i++) {
    if (left[i] !== right[i]) mismatches++;
  }
  mismatches += Math.abs(left.length - right.length);
  return mismatches;
}

export type ApprovalReviewInput = {
  agentId: string;
  leadId: string;
  messageId: string;
  originalText?: string | null;
  finalText?: string | null;
  edited?: boolean;
  source?: "approval_inbox" | "api_approve" | "slack" | "other";
};

export async function upsertHumanApprovalReview(
  supabase: any,
  input: ApprovalReviewInput,
) {
  const originalText = String(input.originalText || "");
  const finalText = String(input.finalText || "");
  const normalizedEdited =
    normalizeForCompare(originalText) !== normalizeForCompare(finalText);
  const edited = typeof input.edited === "boolean" ? input.edited || normalizedEdited : normalizedEdited;

  try {
    const { data: existing } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", input.messageId)
      .eq("prompt_key", APPROVAL_REVIEW_KEY)
      .eq("prompt_version", APPROVAL_REVIEW_VERSION)
      .maybeSingle();

    if (existing?.id) {
      return {
        ok: true,
        inserted: false,
        id: String(existing.id),
        edited,
      };
    }
  } catch {
    // continue and try insert
  }

  const diffChars = roughDiffCount(originalText, finalText);
  const base = {
    agent_id: input.agentId,
    lead_id: input.leadId,
    inbound_message_id: input.messageId,
    draft_message_id: input.messageId,
    stage: APPROVAL_REVIEW_KEY,
    verdict: edited ? "warn" : "pass",
    reason: edited ? "edited_before_send" : "approved_without_edit",
    model: "human_review",
    prompt_key: APPROVAL_REVIEW_KEY,
    prompt_version: APPROVAL_REVIEW_VERSION,
  } as Record<string, any>;

  const extended = {
    ...base,
    reason_long: edited
      ? "Freigabe mit Textänderung vor dem Versand."
      : "Freigabe ohne Textänderung vor dem Versand.",
    action: edited ? "manual_edit_and_send" : "approve_and_send",
    risk_flags: edited ? ["manual_edit"] : ["no_edit"],
    meta: {
      source: input.source || "other",
      edited,
      normalized_edited: normalizedEdited,
      original_length: originalText.length,
      final_length: finalText.length,
      diff_chars: diffChars,
    },
  } as Record<string, any>;

  try {
    const { data } = await (supabase.from("message_qas") as any)
      .insert(extended)
      .select("id")
      .maybeSingle();
    return {
      ok: true,
      inserted: true,
      id: data?.id ? String(data.id) : null,
      edited,
    };
  } catch {
    try {
      const { data } = await (supabase.from("message_qas") as any)
        .insert(base)
        .select("id")
        .maybeSingle();
      return {
        ok: true,
        inserted: true,
        id: data?.id ? String(data.id) : null,
        edited,
      };
    } catch (e: any) {
      return {
        ok: false,
        inserted: false,
        id: null,
        edited,
        error: String(e?.message || "approval_review_insert_failed"),
      };
    }
  }
}
