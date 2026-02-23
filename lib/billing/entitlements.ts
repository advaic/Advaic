import { NextResponse } from "next/server";

export type PlanTier = "free" | "starter" | "pro" | "team";
export type PaidFeatureKey = "copilot_generate" | "response_templates_generate";

type BillingRow = {
  plan_key: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

type SupabaseLike = {
  from: (table: string) => any;
};

const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

const TIER_ORDER: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  team: 3,
};

const FEATURE_REQUIREMENTS: Record<PaidFeatureKey, { minTier: PlanTier }> = {
  copilot_generate: { minTier: "starter" },
  response_templates_generate: { minTier: "starter" },
};

export type BillingEntitlements = {
  planKey: string;
  planTier: PlanTier;
  status: string;
  entitled: boolean;
  requiresPaymentAction: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

function normalizePlanTier(planKey: string): PlanTier {
  const key = planKey.toLowerCase();
  if (key === "team_monthly") return "team";
  if (key === "pro_monthly") return "pro";
  if (key === "starter_monthly") return "starter";
  if (key === "free" || key === "") return "free";
  return "starter";
}

function normalizeStatus(raw: string | null | undefined): string {
  const v = String(raw || "").trim().toLowerCase();
  return v || "inactive";
}

export function deriveEntitlements(row: BillingRow | null): BillingEntitlements {
  const planKey = String(row?.plan_key || "free").trim() || "free";
  const status = normalizeStatus(row?.status);
  const planTier = normalizePlanTier(planKey);
  const entitled = ENTITLED_STATUSES.has(status) && planTier !== "free";

  return {
    planKey,
    planTier,
    status,
    entitled,
    requiresPaymentAction: status === "past_due",
    currentPeriodEnd: row?.current_period_end ? String(row.current_period_end) : null,
    cancelAtPeriodEnd: !!row?.cancel_at_period_end,
  };
}

export async function getBillingEntitlements(args: {
  supabase: SupabaseLike;
  agentId: string;
}) {
  const { supabase, agentId } = args;
  const { data, error } = await (supabase.from("billing_subscriptions") as any)
    .select("plan_key, status, current_period_end, cancel_at_period_end, updated_at")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error, entitlements: deriveEntitlements(null) };
  }

  return {
    ok: true as const,
    entitlements: deriveEntitlements((data || null) as BillingRow | null),
  };
}

export function hasFeatureAccess(
  entitlements: BillingEntitlements,
  feature: PaidFeatureKey,
) {
  const requirement = FEATURE_REQUIREMENTS[feature];
  if (!entitlements.entitled) return false;
  return TIER_ORDER[entitlements.planTier] >= TIER_ORDER[requirement.minTier];
}

export function paymentRequiredResponse(args: {
  feature: PaidFeatureKey;
  entitlements: BillingEntitlements;
}) {
  const { feature, entitlements } = args;
  const requirement = FEATURE_REQUIREMENTS[feature];
  return NextResponse.json(
    {
      error: "payment_required",
      details: "Dein aktueller Plan hat keinen Zugriff auf dieses Feature.",
      feature,
      required_plan_tier: requirement.minTier,
      current: {
        plan_key: entitlements.planKey,
        plan_tier: entitlements.planTier,
        status: entitlements.status,
        requires_payment_action: entitlements.requiresPaymentAction,
      },
      next_action: {
        type: "open_billing",
        path: "/app/konto/abo",
      },
    },
    { status: 402 },
  );
}

