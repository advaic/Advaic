type OperatorFeedbackArgs = {
  agentId: string;
  subjectType: "candidate" | "strategy" | "draft" | "contact";
  subjectId: string;
  feedbackValue: "accept" | "reject" | "approve" | "needs_work" | "wrong_contact" | "preferred";
  prospectId?: string | null;
  candidateId?: string | null;
  strategyDecisionId?: string | null;
  messageId?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
};

function clean(value: unknown, max = 300) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function recordOperatorFeedback(supabase: any, args: OperatorFeedbackArgs) {
  if (!args.agentId || !args.subjectId) return;
  const { error } = await (supabase.from("crm_operator_feedback") as any).insert({
    agent_id: args.agentId,
    subject_type: clean(args.subjectType, 24),
    subject_id: args.subjectId,
    prospect_id: args.prospectId || null,
    candidate_id: args.candidateId || null,
    strategy_decision_id: args.strategyDecisionId || null,
    message_id: args.messageId || null,
    feedback_value: clean(args.feedbackValue, 24),
    notes: clean(args.notes, 500) || null,
    metadata: args.metadata && typeof args.metadata === "object" ? args.metadata : {},
  });
  if (error) {
    throw error;
  }
}
