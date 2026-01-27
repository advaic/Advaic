// app/api/outlook/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

/**
 * Microsoft Graph Webhook endpoint (production-hardened)
 *
 * Supports:
 * - Validation handshake: GET/POST with ?validationToken=...
 * - Receiving notifications for Outlook subscriptions
 *
 * Webhooks MUST respond fast (<10s). We only do minimal DB updates here.
 * Actual fetching should happen in a separate runner (delta query).
 */

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Pragma", "no-cache");
  return res;
}

function safeString(x: unknown, max = 500): string {
  return String(x ?? "").slice(0, max);
}

/**
 * Graph sends validationToken as query param.
 * Must respond with 200 + plain text token.
 */
function maybeHandleValidation(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("validationToken");
  if (!token) return null;

  const res = new NextResponse(token, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
  return noStore(res);
}

type GraphNotification = {
  subscriptionId?: string;
  subscriptionExpirationDateTime?: string;
  changeType?: string;
  resource?: string;
  clientState?: string;
  tenantId?: string;
  lifecycleEvent?: string;
  resourceData?: {
    id?: string;
    "@odata.type"?: string;
  };
};

type GraphWebhookBody = {
  value?: GraphNotification[];
};

function extractMailboxIdFromResource(resource: string): string | null {
  // best-effort only; examples:
  // /users/{id}/mailFolders('Inbox')/messages
  // /users/{id}/messages
  const m = resource.match(/\/users\/([^\/]+)\//i);
  return m?.[1] ? m[1] : null;
}

function isLifecycleEventReauth(event: string | null) {
  const e = (event || "").toLowerCase();
  return e === "reauthorizationrequired";
}

function isLifecycleEventRemoved(event: string | null) {
  const e = (event || "").toLowerCase();
  return e === "subscriptionremoved";
}

export async function GET(req: NextRequest) {
  const validation = maybeHandleValidation(req);
  if (validation) return validation;
  return noStore(NextResponse.json({ ok: true }, { status: 200 }));
}

export async function POST(req: NextRequest) {
  // 1) Validation handshake (Graph can use POST with validationToken query)
  const validation = maybeHandleValidation(req);
  if (validation) return validation;

  // 2) Parse body (fail-closed: ack 202 and do nothing on parse errors)
  const body = (await req.json().catch(() => null)) as GraphWebhookBody | null;

  // Always ACK quickly so Graph doesn't retry/spike.
  const ack = noStore(NextResponse.json({ ok: true }, { status: 202 }));

  if (!body || !Array.isArray(body.value) || body.value.length === 0) {
    return ack;
  }

  const supabase = supabaseAdmin();

  // Dedupe by subscriptionId and collect best-effort patch intentions.
  const bySub = new Map<
    string,
    {
      subscriptionId: string;
      expiration?: string | null;
      mailboxId?: string | null;
      clientState?: string | null;
      invalidClientState?: boolean;
      lifecycleEvent?: string | null;
    }
  >();

  for (const n of body.value) {
    const subId = safeString(n?.subscriptionId, 200).trim();
    if (!subId) continue;

    const gotClientState = n?.clientState ? safeString(n.clientState, 200) : "";

    const resource = safeString(n?.resource, 500);
    const mailboxId = resource ? extractMailboxIdFromResource(resource) : null;

    const lifecycleEvent = n?.lifecycleEvent
      ? safeString(n.lifecycleEvent, 50)
      : null;

    const prev = bySub.get(subId);
    if (!prev) {
      bySub.set(subId, {
        subscriptionId: subId,
        expiration: n?.subscriptionExpirationDateTime
          ? safeString(n.subscriptionExpirationDateTime, 120)
          : null,
        mailboxId,
        clientState: gotClientState || null,
        invalidClientState: false,
        lifecycleEvent,
      });
    } else {
      if (!prev.clientState && gotClientState) prev.clientState = gotClientState;
      if (n?.subscriptionExpirationDateTime) {
        prev.expiration = safeString(n.subscriptionExpirationDateTime, 120);
      }
      if (!prev.mailboxId && mailboxId) prev.mailboxId = mailboxId;
      if (!prev.lifecycleEvent && lifecycleEvent)
        prev.lifecycleEvent = lifecycleEvent;
    }
  }

  const subIds = Array.from(bySub.keys());
  if (subIds.length === 0) return ack;

  // Fetch all matching connections in one query (reduces DB roundtrips).
  const { data: conns } = await (supabase.from("email_connections") as any)
    .select("id, outlook_subscription_id, watch_topic")
    .eq("provider", "outlook")
    .in("outlook_subscription_id", subIds);

  const connBySubId = new Map<
    string,
    { id: string; expectedClientState: string | null }
  >();
  for (const c of conns || []) {
    if (c?.outlook_subscription_id && c?.id) {
      connBySubId.set(String(c.outlook_subscription_id), {
        id: String(c.id),
        expectedClientState:
          typeof c.watch_topic === "string" && c.watch_topic.trim()
            ? c.watch_topic.trim()
            : null,
      });
    }
  }

  const nowIso = new Date().toISOString();

  // Apply minimal updates per known subscription.
  // - invalid clientState: mark error, do NOT set needs_backfill
  // - lifecycle reauth: mark last_error + needs_backfill (so runner can renew)
  // - lifecycle removed: mark watch_active=false
  // - normal notification: needs_backfill=true, clear last_error
  for (const item of bySub.values()) {
    const conn = connBySubId.get(item.subscriptionId);
    const rowId = conn?.id;
    if (!rowId) continue; // unknown subscription id

    const expectedClientState = conn?.expectedClientState;
    const gotClientState = item.clientState;

    const invalidClientState =
      !!expectedClientState &&
      !!gotClientState &&
      gotClientState !== expectedClientState;

    const missingClientState = !!expectedClientState && !gotClientState;

    try {
      // Invalid or missing clientState: anti-spoof fail-closed
      if (invalidClientState || missingClientState) {
        await (supabase.from("email_connections") as any)
          .update({
            last_error: missingClientState
              ? "webhook_missing_client_state"
              : "webhook_invalid_client_state",
            watch_active: true,
            watch_last_renewed_at: nowIso,
          })
          .eq("id", rowId);
        continue;
      }

      const lifecycle = item.lifecycleEvent
        ? String(item.lifecycleEvent)
        : null;

      if (isLifecycleEventRemoved(lifecycle)) {
        await (supabase.from("email_connections") as any)
          .update({
            watch_active: false,
            last_error: "outlook_subscription_removed",
            watch_last_renewed_at: nowIso,
          })
          .eq("id", rowId);
        continue;
      }

      if (isLifecycleEventReauth(lifecycle)) {
        // Graph asks us to renew; set flag so your renew runner prioritizes it.
        const patch: Record<string, any> = {
          needs_backfill: true,
          last_error: "outlook_reauth_required",
          watch_active: true,
          watch_last_renewed_at: nowIso,
        };
        if (item.expiration) {
          patch.outlook_subscription_expiration = item.expiration;
          patch.watch_expiration = item.expiration;
        }
        if (item.mailboxId) patch.outlook_mailbox_id = item.mailboxId;

        await (supabase.from("email_connections") as any)
          .update(patch)
          .eq("id", rowId);
        continue;
      }

      // Normal notification
      const patch: Record<string, any> = {
        needs_backfill: true,
        last_error: null,
        watch_active: true,
        watch_last_renewed_at: nowIso,
      };

      if (item.expiration) {
        patch.outlook_subscription_expiration = item.expiration;
        patch.watch_expiration = item.expiration;
      }
      if (item.mailboxId) {
        patch.outlook_mailbox_id = item.mailboxId;
      }

      await (supabase.from("email_connections") as any)
        .update(patch)
        .eq("id", rowId);
    } catch {
      // swallow errors; webhook must always ack quickly
      continue;
    }
  }

  return ack;
}
