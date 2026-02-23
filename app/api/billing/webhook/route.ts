import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { stripeRequest, unixToIso, verifyStripeWebhook } from "@/lib/billing/stripe";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: any };
};

async function upsertCustomer(args: {
  supabase: any;
  agentId: string;
  stripeCustomerId: string;
  email?: string | null;
  name?: string | null;
  raw?: any;
}) {
  const { supabase, agentId, stripeCustomerId, email, name, raw } = args;
  await (supabase.from("billing_customers") as any).upsert(
    {
      agent_id: agentId,
      stripe_customer_id: stripeCustomerId,
      email: email || null,
      name: name || null,
      raw: raw || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent_id" },
  );
}

async function findAgentIdByCustomerId(supabase: any, stripeCustomerId: string) {
  if (!stripeCustomerId) return "";
  const { data } = await (supabase.from("billing_customers") as any)
    .select("agent_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return data?.agent_id ? String(data.agent_id) : "";
}

function firstPriceFromSubscription(sub: any) {
  const first = sub?.items?.data?.[0];
  const price = first?.price || null;
  return price;
}

async function upsertSubscription(args: {
  supabase: any;
  agentId: string;
  stripeCustomerId: string;
  sub: any;
}) {
  const { supabase, agentId, stripeCustomerId, sub } = args;
  const price = firstPriceFromSubscription(sub);

  await (supabase.from("billing_subscriptions") as any).upsert(
    {
      agent_id: agentId,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: String(sub.id || ""),
      status: sub.status ? String(sub.status) : "unknown",
      plan_key: sub?.metadata?.plan_key
        ? String(sub.metadata.plan_key)
        : price?.lookup_key
          ? String(price.lookup_key)
          : null,
      price_id: price?.id ? String(price.id) : null,
      currency: price?.currency ? String(price.currency) : null,
      amount_cents:
        typeof price?.unit_amount === "number" ? Number(price.unit_amount) : null,
      interval: price?.recurring?.interval
        ? String(price.recurring.interval)
        : null,
      current_period_start: unixToIso(sub.current_period_start),
      current_period_end: unixToIso(sub.current_period_end),
      cancel_at_period_end: !!sub.cancel_at_period_end,
      canceled_at: unixToIso(sub.canceled_at),
      trial_end: unixToIso(sub.trial_end),
      raw: sub,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function upsertInvoice(args: {
  supabase: any;
  agentId: string;
  invoice: any;
}) {
  const { supabase, agentId, invoice } = args;

  await (supabase.from("billing_invoices") as any).upsert(
    {
      agent_id: agentId,
      stripe_invoice_id: String(invoice.id || ""),
      stripe_subscription_id: invoice.subscription
        ? String(invoice.subscription)
        : null,
      stripe_customer_id: invoice.customer ? String(invoice.customer) : null,
      status: invoice.status ? String(invoice.status) : null,
      currency: invoice.currency ? String(invoice.currency) : null,
      amount_due:
        typeof invoice.amount_due === "number" ? Number(invoice.amount_due) : null,
      amount_paid:
        typeof invoice.amount_paid === "number" ? Number(invoice.amount_paid) : null,
      hosted_invoice_url: invoice.hosted_invoice_url
        ? String(invoice.hosted_invoice_url)
        : null,
      invoice_pdf: invoice.invoice_pdf ? String(invoice.invoice_pdf) : null,
      period_start: unixToIso(invoice.period_start),
      period_end: unixToIso(invoice.period_end),
      paid_at: unixToIso(invoice.status_transitions?.paid_at),
      raw: invoice,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" },
  );
}

async function enrichAndUpsertSubscription(args: {
  supabase: any;
  agentId: string;
  stripeCustomerId: string;
  subscriptionId: string;
}) {
  const { supabase, agentId, stripeCustomerId, subscriptionId } = args;
  if (!subscriptionId) return;

  const sub = await stripeRequest<any>({
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    method: "GET",
  });

  await upsertSubscription({
    supabase,
    agentId,
    stripeCustomerId: stripeCustomerId || String(sub.customer || ""),
    sub,
  });
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");
  let verify:
    | { ok: true }
    | { ok: false; error: string };
  try {
    verify = verifyStripeWebhook({ payload, signatureHeader });
  } catch (e: any) {
    return NextResponse.json(
      { error: "webhook_config_error", details: String(e?.message || e) },
      { status: 500 },
    );
  }

  if (!verify.ok) {
    const reason = "error" in verify ? verify.error : "invalid_signature";
    return NextResponse.json(
      { error: "invalid_signature", details: reason },
      { status: 400 },
    );
  }

  let event: StripeEvent | null = null;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const obj = event?.data?.object || {};
  const type = String(event?.type || "");

  try {
    if (type === "checkout.session.completed") {
      const mode = String(obj?.mode || "");
      if (mode !== "subscription") {
        return NextResponse.json({ received: true, ignored: true });
      }

      const stripeCustomerId = String(obj?.customer || "");
      let agentId = String(
        obj?.metadata?.agent_id || obj?.client_reference_id || "",
      ).trim();

      if (!agentId) {
        agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      }

      if (!agentId || !stripeCustomerId) {
        return NextResponse.json({ received: true, skipped: "missing_mapping" });
      }

      await upsertCustomer({
        supabase,
        agentId,
        stripeCustomerId,
        email: obj?.customer_details?.email || null,
        name: obj?.customer_details?.name || null,
        raw: obj,
      });

      const subscriptionId = String(obj?.subscription || "").trim();
      if (subscriptionId) {
        await enrichAndUpsertSubscription({
          supabase,
          agentId,
          stripeCustomerId,
          subscriptionId,
        });
      }
    }

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const stripeCustomerId = String(obj?.customer || "");
      let agentId = String(obj?.metadata?.agent_id || "").trim();
      if (!agentId) {
        agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      }

      if (!agentId || !stripeCustomerId) {
        return NextResponse.json({ received: true, skipped: "missing_mapping" });
      }

      await upsertSubscription({
        supabase,
        agentId,
        stripeCustomerId,
        sub: obj,
      });
    }

    if (
      type === "invoice.paid" ||
      type === "invoice.payment_failed" ||
      type === "invoice.finalized"
    ) {
      const stripeCustomerId = String(obj?.customer || "");
      const agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      if (!agentId) {
        return NextResponse.json({ received: true, skipped: "missing_mapping" });
      }

      await upsertInvoice({ supabase, agentId, invoice: obj });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "webhook_handler_failed", details: String(e?.message || e) },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true, id: event?.id || null, type });
}
