import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { stripeRequest, unixToIso, verifyStripeWebhook } from "@/lib/billing/stripe";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  created?: number;
  data?: { object?: any };
};

type WebhookEventRow = {
  event_id: string;
  status: string | null;
  attempt_count: number | null;
  last_attempt_at: string | null;
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

function isTableMissingError(error: any) {
  const code = String(error?.code || "").toUpperCase();
  const msg = String(error?.message || "").toLowerCase();
  return code === "42P01" || msg.includes("billing_webhook_events");
}

function isUniqueViolation(error: any) {
  const code = String(error?.code || "").toUpperCase();
  return code === "23505";
}

function isRecentAttempt(lastAttemptAt: string | null, maxAgeSeconds = 120) {
  if (!lastAttemptAt) return false;
  const ts = new Date(lastAttemptAt).getTime();
  if (!Number.isFinite(ts)) return false;
  const ageMs = Date.now() - ts;
  return ageMs >= 0 && ageMs <= maxAgeSeconds * 1000;
}

async function getWebhookEventById(supabase: any, eventId: string) {
  const { data, error } = await (supabase.from("billing_webhook_events") as any)
    .select("event_id, status, attempt_count, last_attempt_at")
    .eq("event_id", eventId)
    .maybeSingle();
  return { data: (data || null) as WebhookEventRow | null, error };
}

async function insertWebhookEventProcessing(args: {
  supabase: any;
  event: StripeEvent;
  payload: string;
}) {
  const { supabase, event, payload } = args;
  const now = new Date().toISOString();
  return (supabase.from("billing_webhook_events") as any).insert({
    event_id: String(event.id || "").trim(),
    event_type: String(event.type || "").trim() || "unknown",
    status: "processing",
    attempt_count: 1,
    received_at: now,
    last_attempt_at: now,
    payload: event || payload || null,
    updated_at: now,
  });
}

async function updateWebhookEventProcessing(args: {
  supabase: any;
  event: StripeEvent;
  existing: WebhookEventRow;
  payload: string;
}) {
  const { supabase, event, existing, payload } = args;
  const now = new Date().toISOString();
  const attempts = Math.max(Number(existing.attempt_count || 1) + 1, 1);
  return (supabase.from("billing_webhook_events") as any)
    .update({
      event_type: String(event.type || "").trim() || "unknown",
      status: "processing",
      attempt_count: attempts,
      last_attempt_at: now,
      error: null,
      payload: event || payload || null,
      updated_at: now,
    })
    .eq("event_id", String(existing.event_id || ""));
}

async function markWebhookEventProcessed(args: {
  supabase: any;
  eventId: string;
  result: any;
}) {
  const now = new Date().toISOString();
  return (args.supabase.from("billing_webhook_events") as any)
    .update({
      status: "processed",
      processed_at: now,
      last_attempt_at: now,
      error: null,
      result: args.result || null,
      updated_at: now,
    })
    .eq("event_id", args.eventId);
}

async function markWebhookEventFailed(args: {
  supabase: any;
  eventId: string;
  result: any;
  error: string;
}) {
  const now = new Date().toISOString();
  return (args.supabase.from("billing_webhook_events") as any)
    .update({
      status: "failed",
      last_attempt_at: now,
      error: String(args.error || "").slice(0, 4000),
      result: args.result || null,
      updated_at: now,
    })
    .eq("event_id", args.eventId);
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

  const eventId = String(event?.id || "").trim();
  if (!eventId) {
    return NextResponse.json(
      { error: "invalid_event", details: "missing_event_id" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const obj = event?.data?.object || {};
  const type = String(event?.type || "");
  const result: Record<string, any> = {
    received: true,
    id: eventId,
    type,
  };

  let loggingEnabled = true;
  let existing: WebhookEventRow | null = null;

  {
    const existingRes = await getWebhookEventById(supabase, eventId);
    if (existingRes.error) {
      if (!isTableMissingError(existingRes.error)) {
        console.error("billing_webhook_events read failed:", existingRes.error);
      }
      loggingEnabled = false;
    } else {
      existing = existingRes.data;
    }
  }

  if (loggingEnabled && existing) {
    const status = String(existing.status || "").toLowerCase();
    if (status === "processed") {
      return NextResponse.json({
        received: true,
        id: eventId,
        type,
        idempotent: true,
      });
    }

    if (status === "processing" && isRecentAttempt(existing.last_attempt_at)) {
      return NextResponse.json({
        received: true,
        id: eventId,
        type,
        in_flight: true,
      });
    }

    const upd = await updateWebhookEventProcessing({
      supabase,
      event,
      existing,
      payload,
    });
    if (upd?.error && !isTableMissingError(upd.error)) {
      console.error("billing_webhook_events update processing failed:", upd.error);
      loggingEnabled = false;
    }
  }

  if (loggingEnabled && !existing) {
    const ins = await insertWebhookEventProcessing({ supabase, event, payload });
    if (ins?.error) {
      if (isUniqueViolation(ins.error)) {
        const refetch = await getWebhookEventById(supabase, eventId);
        if (!refetch.error && refetch.data) {
          const status = String(refetch.data.status || "").toLowerCase();
          if (status === "processed") {
            return NextResponse.json({
              received: true,
              id: eventId,
              type,
              idempotent: true,
            });
          }
          if (
            status === "processing" &&
            isRecentAttempt(refetch.data.last_attempt_at)
          ) {
            return NextResponse.json({
              received: true,
              id: eventId,
              type,
              in_flight: true,
            });
          }
          await updateWebhookEventProcessing({
            supabase,
            event,
            existing: refetch.data,
            payload,
          });
        }
      } else if (!isTableMissingError(ins.error)) {
        console.error("billing_webhook_events insert failed:", ins.error);
        loggingEnabled = false;
      } else {
        loggingEnabled = false;
      }
    }
  }

  try {
    let handled = false;

    if (type === "checkout.session.completed") {
      handled = true;
      const mode = String(obj?.mode || "");
      if (mode !== "subscription") {
        result.ignored = true;
      } else {
        const stripeCustomerId = String(obj?.customer || "");
        let agentId = String(
          obj?.metadata?.agent_id || obj?.client_reference_id || "",
        ).trim();

        if (!agentId) {
          agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
        }

        if (!agentId || !stripeCustomerId) {
          result.skipped = "missing_mapping";
        } else {
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
      }
    }

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      handled = true;
      const stripeCustomerId = String(obj?.customer || "");
      let agentId = String(obj?.metadata?.agent_id || "").trim();
      if (!agentId) {
        agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      }

      if (!agentId || !stripeCustomerId) {
        result.skipped = "missing_mapping";
      } else {
        await upsertSubscription({
          supabase,
          agentId,
          stripeCustomerId,
          sub: obj,
        });
      }
    }

    if (
      type === "invoice.paid" ||
      type === "invoice.payment_failed" ||
      type === "invoice.finalized"
    ) {
      handled = true;
      const stripeCustomerId = String(obj?.customer || "");
      const agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      if (!agentId) {
        result.skipped = "missing_mapping";
      } else {
        await upsertInvoice({ supabase, agentId, invoice: obj });
      }
    }

    if (!handled) result.ignored = true;

    if (loggingEnabled) {
      const done = await markWebhookEventProcessed({
        supabase,
        eventId,
        result,
      });
      if (done?.error && !isTableMissingError(done.error)) {
        console.error("billing_webhook_events mark processed failed:", done.error);
      }
    }

    return NextResponse.json(result);
  } catch (e: any) {
    if (loggingEnabled) {
      const failed = await markWebhookEventFailed({
        supabase,
        eventId,
        result: {
          ...result,
          failed_at: new Date().toISOString(),
        },
        error: String(e?.message || e),
      });
      if (failed?.error && !isTableMissingError(failed.error)) {
        console.error("billing_webhook_events mark failed failed:", failed.error);
      }
    }

    return NextResponse.json(
      { error: "webhook_handler_failed", details: String(e?.message || e) },
      { status: 500 },
    );
  }
}
