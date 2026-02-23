import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { stripeRequest, unixToIso, verifyStripeWebhook } from "@/lib/billing/stripe";

export const runtime = "nodejs";
const DUNNING_EMAIL_RETRY_HOURS = 24;
const OUTBOUND_TIMEOUT_MS = 15_000;

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

type DunningCaseRow = {
  agent_id: string;
  is_active: boolean | null;
  status: string | null;
  last_failed_invoice_id: string | null;
  last_failed_at: string | null;
  last_payment_attempt_at: string | null;
  next_payment_attempt_at: string | null;
  attempt_count: number | null;
  amount_due: number | null;
  currency: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  failure_code: string | null;
  failure_message: string | null;
  last_email_sent_at: string | null;
  email_send_count: number | null;
  last_email_error: string | null;
  resolved_at: string | null;
  updated_at: string | null;
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

function isLikelyEmail(v: unknown) {
  const s = String(v || "").trim();
  if (!s || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function envOrNull(name: string) {
  const v = String(process.env[name] || "").trim();
  return v || null;
}

function isoFromAny(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return unixToIso(v);
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (Number.isFinite(d.getTime())) return d.toISOString();
  }
  return null;
}

function isDunningTableMissingError(error: any) {
  const code = String(error?.code || "").toUpperCase();
  const msg = String(error?.message || "").toLowerCase();
  return code === "42P01" || msg.includes("billing_dunning_cases");
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = OUTBOUND_TIMEOUT_MS,
) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getDunningCaseByAgentId(supabase: any, agentId: string) {
  const { data, error } = await (supabase.from("billing_dunning_cases") as any)
    .select(
      "agent_id, is_active, status, last_failed_invoice_id, last_failed_at, last_payment_attempt_at, next_payment_attempt_at, attempt_count, amount_due, currency, hosted_invoice_url, invoice_pdf, failure_code, failure_message, last_email_sent_at, email_send_count, last_email_error, resolved_at, updated_at",
    )
    .eq("agent_id", agentId)
    .maybeSingle();

  return { data: (data || null) as DunningCaseRow | null, error };
}

function shouldSendDunningEmail(args: {
  current: DunningCaseRow | null;
  invoiceId: string;
}) {
  const { current, invoiceId } = args;
  if (!current) return true;
  if (String(current.last_failed_invoice_id || "") !== String(invoiceId || "")) {
    return true;
  }

  const last = current.last_email_sent_at ? new Date(current.last_email_sent_at) : null;
  if (!last || !Number.isFinite(last.getTime())) return true;
  const elapsedMs = Date.now() - last.getTime();
  if (elapsedMs < 0) return false;
  return elapsedMs >= DUNNING_EMAIL_RETRY_HOURS * 60 * 60 * 1000;
}

async function resolveDunningCase(args: {
  supabase: any;
  agentId: string;
  reason: string;
  invoiceId?: string | null;
}) {
  const { supabase, agentId, reason, invoiceId } = args;
  const now = new Date().toISOString();
  return (supabase.from("billing_dunning_cases") as any).upsert(
    {
      agent_id: agentId,
      is_active: false,
      status: String(reason || "resolved"),
      resolved_at: now,
      last_failed_invoice_id: invoiceId ? String(invoiceId) : null,
      failure_code: null,
      failure_message: null,
      last_email_error: null,
      updated_at: now,
    },
    { onConflict: "agent_id" },
  );
}

async function upsertDunningCaseFromFailedInvoice(args: {
  supabase: any;
  agentId: string;
  invoice: any;
}) {
  const { supabase, agentId, invoice } = args;
  const now = new Date().toISOString();
  const invoiceId = String(invoice?.id || "");
  const attemptCountRaw = Number(invoice?.attempt_count);
  const existing = await getDunningCaseByAgentId(supabase, agentId);

  const attemptCount =
    Number.isFinite(attemptCountRaw) && attemptCountRaw >= 0
      ? Math.floor(attemptCountRaw)
      : Math.max(Number(existing.data?.attempt_count || 0) + 1, 1);

  const failureCode =
    String(
      invoice?.last_finalization_error?.code ||
        invoice?.last_payment_error?.code ||
        invoice?.payment_intent?.last_payment_error?.code ||
        "",
    ).trim() || null;

  const failureMessage =
    String(
      invoice?.last_finalization_error?.message ||
        invoice?.last_payment_error?.message ||
        invoice?.payment_intent?.last_payment_error?.message ||
        "Zahlung konnte nicht eingezogen werden.",
    )
      .trim()
      .slice(0, 1500);

  const update = await (supabase.from("billing_dunning_cases") as any).upsert(
    {
      agent_id: agentId,
      is_active: true,
      status: "payment_failed",
      last_failed_invoice_id: invoiceId || null,
      last_failed_at: now,
      last_payment_attempt_at: isoFromAny(invoice?.status_transitions?.finalized_at) || now,
      next_payment_attempt_at: isoFromAny(invoice?.next_payment_attempt),
      attempt_count: attemptCount,
      amount_due:
        typeof invoice?.amount_due === "number" ? Number(invoice.amount_due) : null,
      currency: invoice?.currency ? String(invoice.currency).toUpperCase() : null,
      hosted_invoice_url: invoice?.hosted_invoice_url
        ? String(invoice.hosted_invoice_url)
        : null,
      invoice_pdf: invoice?.invoice_pdf ? String(invoice.invoice_pdf) : null,
      failure_code: failureCode,
      failure_message: failureMessage,
      resolved_at: null,
      raw: invoice || null,
      updated_at: now,
    },
    { onConflict: "agent_id" },
  );

  return {
    update,
    caseBeforeUpdate: existing.data,
    invoiceId,
    failureMessage,
  };
}

function formatAmount(cents: number | null, currency: string | null) {
  if (typeof cents !== "number") return null;
  const c = String(currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: c,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${c}`;
  }
}

async function findBillingEmail(args: {
  supabase: any;
  agentId: string;
  fallbackFromInvoice?: string | null;
}) {
  const { supabase, agentId, fallbackFromInvoice } = args;
  const fromInvoice = String(fallbackFromInvoice || "").trim();
  if (isLikelyEmail(fromInvoice)) return fromInvoice;

  const { data: customer } = await (supabase.from("billing_customers") as any)
    .select("email")
    .eq("agent_id", agentId)
    .maybeSingle();
  const fromCustomer = String(customer?.email || "").trim();
  if (isLikelyEmail(fromCustomer)) return fromCustomer;

  const { data: agent } = await (supabase.from("agents") as any)
    .select("email")
    .eq("id", agentId)
    .maybeSingle();
  const fromAgent = String(agent?.email || "").trim();
  if (isLikelyEmail(fromAgent)) return fromAgent;

  try {
    const lookup = await supabase.auth.admin.getUserById(agentId);
    const fromAuth = String(lookup?.data?.user?.email || "").trim();
    if (isLikelyEmail(fromAuth)) return fromAuth;
  } catch {
    // ignore
  }

  return "";
}

async function sendDunningEmailResend(args: {
  to: string;
  amountDueCents: number | null;
  currency: string | null;
  hostedInvoiceUrl: string | null;
  accountUrl: string;
  failureMessage: string;
}) {
  const apiKey = envOrNull("RESEND_API_KEY");
  const from = envOrNull("ADVAIC_EMAIL_FROM");
  if (!apiKey || !from) {
    return {
      ok: false as const,
      error: "resend_not_configured",
    };
  }
  if (!isLikelyEmail(args.to)) {
    return {
      ok: false as const,
      error: "invalid_recipient_email",
    };
  }

  const amount = formatAmount(args.amountDueCents, args.currency);
  const primaryCta = args.hostedInvoiceUrl || args.accountUrl;
  const subject = "Zahlung fehlgeschlagen: Bitte Zahlungsmethode aktualisieren";
  const bodyText = [
    "Hallo,",
    "",
    "wir konnten die letzte Zahlung für dein Advaic-Abo nicht erfolgreich abbuchen.",
    amount ? `Offener Betrag: ${amount}` : null,
    args.failureMessage ? `Grund: ${args.failureMessage}` : null,
    "",
    "Bitte aktualisiere jetzt deine Zahlungsmethode:",
    primaryCta,
    "",
    `Alternativ im Konto-Bereich: ${args.accountUrl}`,
    "",
    "Wenn du bereits aktualisiert hast, kannst du diese Nachricht ignorieren.",
    "",
    "Viele Grüße",
    "Advaic",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px 0">Zahlung fehlgeschlagen</h2>
      <p>Wir konnten die letzte Zahlung für dein Advaic-Abo nicht erfolgreich abbuchen.</p>
      ${amount ? `<p><strong>Offener Betrag:</strong> ${amount}</p>` : ""}
      ${args.failureMessage ? `<p><strong>Grund:</strong> ${args.failureMessage}</p>` : ""}
      <p style="margin:18px 0">
        <a href="${primaryCta}" style="background:#111;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block">Zahlungsmethode aktualisieren</a>
      </p>
      <p>Alternativ im Konto-Bereich: <a href="${args.accountUrl}">${args.accountUrl}</a></p>
      <p>Wenn du bereits aktualisiert hast, kannst du diese Nachricht ignorieren.</p>
      <p>Viele Grüße<br/>Advaic</p>
    </div>
  `.trim();

  try {
    const resp = await fetchWithTimeout("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject,
        text: bodyText,
        html,
      }),
    });

    const body = (await resp.json().catch(() => null)) as any;
    if (!resp.ok || !body?.id) {
      const reason = String(
        body?.error?.message || body?.message || body?.error || `http_${resp.status}`,
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);
      return { ok: false as const, error: reason || "unknown_send_error" };
    }

    return { ok: true as const, messageId: String(body.id) };
  } catch (e: any) {
    return {
      ok: false as const,
      error: String(e?.message || e || "send_failed").slice(0, 300),
    };
  }
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

        const subStatus = String(obj?.status || "").toLowerCase();
        if (subStatus === "active" || subStatus === "trialing") {
          const clear = await resolveDunningCase({
            supabase,
            agentId,
            reason: "subscription_ok",
            invoiceId: null,
          });
          if (clear?.error && !isDunningTableMissingError(clear.error)) {
            console.error("billing_dunning_cases clear on subscription failed:", clear.error);
          }
        }
      }
    }

    if (type === "invoice.paid" || type === "invoice.payment_failed" || type === "invoice.finalized") {
      handled = true;
      const stripeCustomerId = String(obj?.customer || "");
      const agentId = await findAgentIdByCustomerId(supabase, stripeCustomerId);
      if (!agentId) {
        result.skipped = "missing_mapping";
      } else {
        await upsertInvoice({ supabase, agentId, invoice: obj });

        if (type === "invoice.payment_failed") {
          const dunningUpdate = await upsertDunningCaseFromFailedInvoice({
            supabase,
            agentId,
            invoice: obj,
          });
          if (dunningUpdate.update?.error) {
            if (!isDunningTableMissingError(dunningUpdate.update.error)) {
              console.error(
                "billing_dunning_cases upsert payment_failed failed:",
                dunningUpdate.update.error,
              );
            }
            result.dunning = "table_missing_or_write_failed";
          } else {
            const invoiceId = String(obj?.id || "");
            const shouldSendMail = shouldSendDunningEmail({
              current: dunningUpdate.caseBeforeUpdate,
              invoiceId,
            });

            if (shouldSendMail) {
              const baseSiteUrl = envOrNull("NEXT_PUBLIC_SITE_URL") || "";
              const accountUrl = baseSiteUrl
                ? `${baseSiteUrl.replace(/\/$/, "")}/app/konto/abo`
                : "/app/konto/abo";
              const toEmail = await findBillingEmail({
                supabase,
                agentId,
                fallbackFromInvoice: obj?.customer_email || null,
              });

              if (toEmail) {
                const send = await sendDunningEmailResend({
                  to: toEmail,
                  amountDueCents:
                    typeof obj?.amount_due === "number" ? Number(obj.amount_due) : null,
                  currency: obj?.currency ? String(obj.currency) : null,
                  hostedInvoiceUrl: obj?.hosted_invoice_url
                    ? String(obj.hosted_invoice_url)
                    : null,
                  accountUrl,
                  failureMessage: dunningUpdate.failureMessage,
                });

                if (send.ok) {
                  const sentAt = new Date().toISOString();
                  const prevCount = Number(
                    dunningUpdate.caseBeforeUpdate?.email_send_count || 0,
                  );
                  const mark = await (supabase.from("billing_dunning_cases") as any)
                    .update({
                      last_email_sent_at: sentAt,
                      email_send_count: Math.max(prevCount + 1, 1),
                      last_email_error: null,
                      updated_at: sentAt,
                    })
                    .eq("agent_id", agentId);
                  if (mark?.error && !isDunningTableMissingError(mark.error)) {
                    console.error(
                      "billing_dunning_cases update email sent state failed:",
                      mark.error,
                    );
                  }
                  result.dunning_email = "sent";
                } else {
                  const err = String(send.error || "send_failed").slice(0, 500);
                  const mark = await (supabase.from("billing_dunning_cases") as any)
                    .update({
                      last_email_error: err,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("agent_id", agentId);
                  if (mark?.error && !isDunningTableMissingError(mark.error)) {
                    console.error(
                      "billing_dunning_cases update email error failed:",
                      mark.error,
                    );
                  }
                  result.dunning_email = `failed:${err}`;
                }
              } else {
                result.dunning_email = "skipped:no_recipient";
              }
            } else {
              result.dunning_email = "skipped:recently_sent";
            }

            result.dunning = "active";
          }
        }

        if (type === "invoice.paid") {
          const clear = await resolveDunningCase({
            supabase,
            agentId,
            reason: "payment_recovered",
            invoiceId: String(obj?.id || "").trim() || null,
          });
          if (clear?.error && !isDunningTableMissingError(clear.error)) {
            console.error("billing_dunning_cases resolve on invoice.paid failed:", clear.error);
          } else {
            result.dunning = "resolved";
          }
        }
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
