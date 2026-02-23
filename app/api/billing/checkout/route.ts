import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, requireRouteUser } from "@/lib/supabase/routeAuth";
import { stripeRequest } from "@/lib/billing/stripe";

export const runtime = "nodejs";

type Body = {
  plan_key?: string;
  success_path?: string;
  cancel_path?: string;
};

const DEFAULT_TRIAL_DAYS = 14;
const MAX_TRIAL_DAYS = 90;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

function siteUrl() {
  return mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
}

function priceIdForPlan(planKey: string) {
  const map: Record<string, string | undefined> = {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  };
  return map[planKey] || "";
}

function configuredTrialDays() {
  const raw = String(process.env.STRIPE_TRIAL_DAYS || "").trim();
  if (!raw) return DEFAULT_TRIAL_DAYS;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > MAX_TRIAL_DAYS) {
    return DEFAULT_TRIAL_DAYS;
  }
  return n;
}

export async function POST(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    const planKey = String(body?.plan_key || "pro_monthly").trim();
    const priceId = priceIdForPlan(planKey);

    if (!priceId) {
      return NextResponse.json(
        { error: "plan_not_configured", details: `No Stripe price for ${planKey}` },
        { status: 400 },
      );
    }

    const successPath = String(
      body?.success_path || "/app/konto/abo?checkout=success",
    ).trim();
    const cancelPath = String(
      body?.cancel_path || "/app/konto/abo?checkout=cancel",
    ).trim();

    if (!isSafePath(successPath) || !isSafePath(cancelPath)) {
      return NextResponse.json({ error: "invalid_paths" }, { status: 400 });
    }

    const agentId = String(auth.user.id);
    const email = String(auth.user.email || "").trim() || undefined;
    const supabase = createSupabaseAdminClient();
    const trialDays = configuredTrialDays();

    let stripeCustomerId = "";
    const { data: customerRow } = await (supabase.from("billing_customers") as any)
      .select("stripe_customer_id")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (customerRow?.stripe_customer_id) {
      stripeCustomerId = String(customerRow.stripe_customer_id);
    } else {
      const customer = await stripeRequest<{ id: string }>({
        path: "/customers",
        method: "POST",
        body: {
          email,
          metadata: { agent_id: agentId },
        },
      });
      stripeCustomerId = String(customer.id);

      await (supabase.from("billing_customers") as any).upsert(
        {
          agent_id: agentId,
          stripe_customer_id: stripeCustomerId,
        },
        { onConflict: "agent_id" },
      );
    }

    // Trial is only granted for first subscription checkout to prevent unlimited re-trials.
    let hasSubscriptionHistory = true;
    const historyRes = await (supabase.from("billing_subscriptions") as any)
      .select("stripe_subscription_id", { count: "exact", head: true })
      .eq("agent_id", agentId);
    if (!historyRes.error) {
      hasSubscriptionHistory = Number(historyRes.count || 0) > 0;
    }

    const subscriptionData: Record<string, any> = {
      metadata: {
        agent_id: agentId,
        plan_key: planKey,
      },
    };
    if (!hasSubscriptionHistory && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const session = await stripeRequest<{ id: string; url: string | null }>({
      path: "/checkout/sessions",
      method: "POST",
      body: {
        mode: "subscription",
        customer: stripeCustomerId,
        client_reference_id: agentId,
        success_url: `${siteUrl()}${successPath}`,
        cancel_url: `${siteUrl()}${cancelPath}`,
        allow_promotion_codes: true,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          agent_id: agentId,
          plan_key: planKey,
        },
        subscription_data: subscriptionData,
      },
    });

    if (!session?.url) {
      return NextResponse.json(
        { error: "checkout_session_missing_url" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      checkout_url: String(session.url),
      session_id: String(session.id || ""),
      trial_days_applied:
        !hasSubscriptionHistory && trialDays > 0 ? Number(trialDays) : 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "billing_checkout_failed", details: String(e?.message || e) },
      { status: 500 },
    );
  }
}
