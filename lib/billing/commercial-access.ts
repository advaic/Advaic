import { hasInternalPremiumAccess, isOwnerUserId } from "@/lib/auth/ownerAccess";

const DEFAULT_TRIAL_DAYS = 14;
const MIN_TRIAL_DAYS = 1;
const MAX_TRIAL_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

type SubscriptionSnapshot = {
  plan_key: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
};

type SupabaseLike = {
  from: (table: string) => any;
};

export type CommercialAccessState =
  | "paid_active"
  | "trial_active"
  | "trial_expired";

export type CommercialAccess = {
  state: CommercialAccessState;
  trial_days_total: number;
  trial_day_number: number;
  trial_days_remaining: number;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_urgent: boolean;
  upgrade_required: boolean;
  billing: {
    plan_key: string;
    status: string;
    entitled: boolean;
  };
  internal_override?: boolean;
  internal_override_reason?: "owner" | "internal_premium";
  owner_override?: boolean;
};

function safeInt(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function configuredTrialDays() {
  const candidates = [process.env.APP_TRIAL_DAYS, process.env.STRIPE_TRIAL_DAYS];
  for (const raw of candidates) {
    const n = safeInt(raw);
    if (n === null) continue;
    if (n < MIN_TRIAL_DAYS || n > MAX_TRIAL_DAYS) continue;
    return n;
  }
  return DEFAULT_TRIAL_DAYS;
}

function parseIso(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * DAY_MS);
}

function normalizeStatus(raw: unknown): string {
  return String(raw || "").trim().toLowerCase() || "inactive";
}

function normalizePlanKey(raw: unknown): string {
  return String(raw || "free").trim().toLowerCase() || "free";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcWindowMetrics(args: {
  start: Date;
  end: Date;
  now: Date;
  fallbackTotalDays: number;
}) {
  const { start, end, now, fallbackTotalDays } = args;
  const spanMs = Math.max(DAY_MS, end.getTime() - start.getTime());
  const totalDays = Math.max(
    1,
    safeInt(Math.ceil(spanMs / DAY_MS)) ?? fallbackTotalDays,
  );
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
  const dayNumber = clamp(totalDays - remainingDays + 1, 1, totalDays);

  return {
    totalDays,
    remainingDays,
    dayNumber,
  };
}

export function deriveCommercialAccess(args: {
  agentCreatedAt: string | null;
  subscription: SubscriptionSnapshot | null;
  now?: Date;
}): CommercialAccess {
  const now = args.now ?? new Date();
  const configuredDays = configuredTrialDays();
  const signupStart = parseIso(args.agentCreatedAt) ?? now;
  const signupEnd = addDays(signupStart, configuredDays);

  const status = normalizeStatus(args.subscription?.status);
  const planKey = normalizePlanKey(args.subscription?.plan_key);
  const entitled = planKey !== "free" && ENTITLED_STATUSES.has(status);
  const paidActive = entitled && status !== "trialing";

  const stripeTrialEnd =
    parseIso(args.subscription?.trial_end) ??
    parseIso(args.subscription?.current_period_end);
  const stripeTrialStart =
    parseIso(args.subscription?.current_period_start) ??
    (stripeTrialEnd ? addDays(stripeTrialEnd, -configuredDays) : null);
  const stripeTrialActive =
    status === "trialing" &&
    !!stripeTrialEnd &&
    stripeTrialEnd.getTime() > now.getTime();

  const signupTrialActive = signupEnd.getTime() > now.getTime();

  let state: CommercialAccessState = "trial_expired";
  let windowStart = signupStart;
  let windowEnd = signupEnd;

  if (paidActive) {
    state = "paid_active";
  } else if (stripeTrialActive) {
    state = "trial_active";
    windowStart = stripeTrialStart ?? signupStart;
    windowEnd = stripeTrialEnd ?? signupEnd;
  } else if (signupTrialActive) {
    state = "trial_active";
  }

  const metrics = calcWindowMetrics({
    start: windowStart,
    end: windowEnd,
    now,
    fallbackTotalDays: configuredDays,
  });
  const urgentThreshold = Math.max(5, Math.round(metrics.totalDays * 0.35));

  return {
    state,
    trial_days_total: metrics.totalDays,
    trial_day_number: metrics.dayNumber,
    trial_days_remaining: metrics.remainingDays,
    trial_started_at: windowStart.toISOString(),
    trial_ends_at: windowEnd.toISOString(),
    is_urgent: state === "trial_active" && metrics.remainingDays <= urgentThreshold,
    upgrade_required: state === "trial_expired",
    billing: {
      plan_key: planKey,
      status,
      entitled,
    },
  };
}

export function applyInternalCommercialAccessOverride(
  agentId: string | null | undefined,
  access: CommercialAccess,
): CommercialAccess {
  if (!agentId) return access;

  const overrideReason = isOwnerUserId(agentId)
    ? "owner"
    : hasInternalPremiumAccess(agentId)
      ? "internal_premium"
      : null;

  if (!overrideReason) return access;

  return {
    ...access,
    state: "paid_active",
    trial_day_number: access.trial_days_total,
    trial_days_remaining: 0,
    is_urgent: false,
    upgrade_required: false,
    billing: {
      plan_key:
        access.billing.plan_key && access.billing.plan_key !== "free"
          ? access.billing.plan_key
          : "starter_monthly",
      status: "active",
      entitled: true,
    },
    internal_override: true,
    internal_override_reason: overrideReason,
    owner_override: overrideReason === "owner",
  };
}

export async function getCommercialAccess(args: {
  supabase: SupabaseLike;
  agentId: string;
}) {
  const { supabase, agentId } = args;

  const [{ data: agent, error: agentErr }, { data: subscription, error: subErr }] =
    await Promise.all([
      (supabase.from("agents") as any)
        .select("created_at")
        .eq("id", agentId)
        .maybeSingle(),
      (supabase.from("billing_subscriptions") as any)
        .select(
          "plan_key, status, current_period_start, current_period_end, trial_end, updated_at",
        )
        .eq("agent_id", agentId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const missingTable =
    String(subErr?.code || "") === "42P01" ||
    String(subErr?.message || "").toLowerCase().includes("billing_subscriptions");

  const access = applyInternalCommercialAccessOverride(
    agentId,
    deriveCommercialAccess({
      agentCreatedAt: agent?.created_at ? String(agent.created_at) : null,
      subscription: missingTable
        ? null
        : ((subscription || null) as SubscriptionSnapshot | null),
    }),
  );

  return {
    ok: !agentErr && (!subErr || missingTable),
    access,
    error: agentErr || (missingTable ? null : subErr) || null,
  };
}

export function paymentRequiredMeta(access: CommercialAccess) {
  return {
    error: "payment_required",
    details:
      "Deine Testphase ist beendet. Bitte aktiviere Starter, um Auto-Senden und Follow-ups weiter zu nutzen.",
    billing_access: access,
    next_action: {
      type: "open_billing",
      path: "/app/konto/abo",
    },
  } as const;
}
