import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, requireRouteUser } from "@/lib/supabase/routeAuth";

export const runtime = "nodejs";

type BillingSummary = {
  plan: {
    key: string;
    status: string;
    name: string;
    price_monthly_cents: number | null;
    currency: string | null;
    interval: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
  customer: {
    stripe_customer_id: string | null;
  };
  dunning: {
    is_active: boolean;
    status: string;
    amount_due_cents: number | null;
    currency: string | null;
    failure_message: string | null;
    last_failed_at: string | null;
    next_payment_attempt_at: string | null;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    last_email_sent_at: string | null;
  } | null;
  invoices: Array<{
    id: string;
    status: string | null;
    amount_due_cents: number | null;
    amount_paid_cents: number | null;
    currency: string | null;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    period_start: string | null;
    period_end: string | null;
    paid_at: string | null;
    created_at: string | null;
  }>;
};

function formatPlanName(key: string) {
  if (key === "pro_monthly") return "Advaic Pro (Monatlich)";
  if (key === "team_monthly") return "Advaic Team (Monatlich)";
  if (key === "starter_monthly") return "Advaic Starter (Monatlich)";
  return "Advaic Free";
}

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (!auth.ok) return auth.response;

  const agentId = String(auth.user.id);
  const supabase = createSupabaseAdminClient();

  const { data: customer } = await (supabase.from("billing_customers") as any)
    .select("stripe_customer_id")
    .eq("agent_id", agentId)
    .maybeSingle();

  const { data: subscription } = await (supabase.from("billing_subscriptions") as any)
    .select(
      "plan_key, status, amount_cents, currency, interval, current_period_start, current_period_end, cancel_at_period_end, updated_at",
    )
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoices } = await (supabase.from("billing_invoices") as any)
    .select(
      "stripe_invoice_id, status, amount_due, amount_paid, currency, hosted_invoice_url, invoice_pdf, period_start, period_end, paid_at, created_at",
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(20);

  let dunning: any = null;
  try {
    const dunningRes = await (supabase.from("billing_dunning_cases") as any)
      .select(
        "is_active, status, amount_due, currency, failure_message, last_failed_at, next_payment_attempt_at, hosted_invoice_url, invoice_pdf, last_email_sent_at",
      )
      .eq("agent_id", agentId)
      .maybeSingle();
    if (!dunningRes.error && dunningRes.data) {
      dunning = dunningRes.data;
    }
  } catch {
    // fail-open for projects where migration is not deployed yet
  }

  const planKey = String(subscription?.plan_key || "free");
  const summary: BillingSummary = {
    plan: {
      key: planKey,
      status: String(subscription?.status || "inactive"),
      name: formatPlanName(planKey),
      price_monthly_cents:
        typeof subscription?.amount_cents === "number" ? subscription.amount_cents : null,
      currency: subscription?.currency ? String(subscription.currency) : null,
      interval: subscription?.interval ? String(subscription.interval) : null,
      current_period_start: subscription?.current_period_start
        ? String(subscription.current_period_start)
        : null,
      current_period_end: subscription?.current_period_end
        ? String(subscription.current_period_end)
        : null,
      cancel_at_period_end: !!subscription?.cancel_at_period_end,
    },
    customer: {
      stripe_customer_id: customer?.stripe_customer_id
        ? String(customer.stripe_customer_id)
        : null,
    },
    dunning: dunning
      ? {
          is_active: !!dunning.is_active,
          status: String(dunning.status || "unknown"),
          amount_due_cents:
            typeof dunning.amount_due === "number" ? Number(dunning.amount_due) : null,
          currency: dunning.currency ? String(dunning.currency) : null,
          failure_message: dunning.failure_message
            ? String(dunning.failure_message)
            : null,
          last_failed_at: dunning.last_failed_at ? String(dunning.last_failed_at) : null,
          next_payment_attempt_at: dunning.next_payment_attempt_at
            ? String(dunning.next_payment_attempt_at)
            : null,
          hosted_invoice_url: dunning.hosted_invoice_url
            ? String(dunning.hosted_invoice_url)
            : null,
          invoice_pdf: dunning.invoice_pdf ? String(dunning.invoice_pdf) : null,
          last_email_sent_at: dunning.last_email_sent_at
            ? String(dunning.last_email_sent_at)
            : null,
        }
      : null,
    invoices: Array.isArray(invoices)
      ? invoices.map((inv: any) => ({
          id: String(inv.stripe_invoice_id || ""),
          status: inv.status ? String(inv.status) : null,
          amount_due_cents:
            typeof inv.amount_due === "number" ? Number(inv.amount_due) : null,
          amount_paid_cents:
            typeof inv.amount_paid === "number" ? Number(inv.amount_paid) : null,
          currency: inv.currency ? String(inv.currency) : null,
          hosted_invoice_url: inv.hosted_invoice_url
            ? String(inv.hosted_invoice_url)
            : null,
          invoice_pdf: inv.invoice_pdf ? String(inv.invoice_pdf) : null,
          period_start: inv.period_start ? String(inv.period_start) : null,
          period_end: inv.period_end ? String(inv.period_end) : null,
          paid_at: inv.paid_at ? String(inv.paid_at) : null,
          created_at: inv.created_at ? String(inv.created_at) : null,
        }))
      : [],
  };

  return NextResponse.json({ ok: true, summary });
}
