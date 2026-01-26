// app/api/pipeline/outlook/fetch/run/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

/**
 * Outlook Delta Fetch Runner (production-hardened)
 *
 * What it does:
 * - Looks for email_connections(provider="outlook") where needs_backfill=true (or delta not initialized)
 * - Refreshes access token if needed
 * - Runs Microsoft Graph delta query against Inbox messages
 * - Upserts inbound messages into `messages` (dedupe via outlook_message_id unique index)
 * - Upserts/creates leads (agent_id + email) and stores outlook_conversation_id mapping
 * - Updates email_connections.outlook_delta_link + clears needs_backfill when done
 *
 * IMPORTANT:
 * - This runner is intentionally minimal & deterministic.
 * - It does NOT do classification/intent here (keep runners isolated).
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeString(x: unknown, max = 5000) {
  return String(x ?? "").slice(0, max);
}

function lowerTrim(x: unknown, max = 320) {
  return safeString(x, max).trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

type OutlookConnectionRow = {
  id: number | string;
  agent_id: string;
  provider: string | null;
  status: string | null;
  email_address: string | null;

  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;

  // sync flags/state
  needs_backfill: boolean;
  outlook_delta_link: string | null;

  // subscription (not used here, but useful for audit)
  outlook_subscription_id: string | null;
  outlook_subscription_expiration: string | null;

  watch_active: boolean;
  last_error: string | null;
};

type GraphDeltaResponse = {
  value?: any[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
};

async function refreshOutlookAccessToken(args: { refreshToken: string }) {
  const clientId =
    process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID;
  const clientSecret =
    process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET env vars"
    );
  }

  // Tenant can be "common" to support personal + work/school accounts
  const tenant =
    process.env.MICROSOFT_TENANT_ID ||
    process.env.AZURE_AD_TENANT_ID ||
    "common";

  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", args.refreshToken);
  // IMPORTANT: must match what you requested at consent time.
  // "offline_access Mail.Read" is typical; add Mail.ReadWrite only if you truly need it.
  body.set("scope", "https://graph.microsoft.com/.default");

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const t = await resp?.text().catch(() => "");
    throw new Error(`Outlook token refresh failed: ${resp?.status} ${t}`);
  }

  const json = (await resp.json().catch(() => null)) as any;
  const accessToken =
    typeof json?.access_token === "string" ? json.access_token : "";
  const refreshToken =
    typeof json?.refresh_token === "string" ? json.refresh_token : null;
  const expiresIn = Number(json?.expires_in);

  if (!accessToken || !Number.isFinite(expiresIn)) {
    throw new Error("Outlook token refresh returned invalid payload");
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken,
    refreshToken, // may be null (often not returned)
    expiresAt,
  };
}

function tokenIsValid(expiresAtIso: string | null) {
  if (!expiresAtIso) return false;
  const t = Date.parse(expiresAtIso);
  if (!Number.isFinite(t)) return false;
  // refresh a bit early (2 minutes)
  return t - Date.now() > 2 * 60 * 1000;
}

async function graphGet(url: string, accessToken: string) {
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      // Prefer minimal metadata to reduce payload
      Prefer: 'outlook.body-content-type="text"',
    },
  }).catch(() => null);

  if (!resp) throw new Error("Graph request failed (network)");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Graph request failed: ${resp.status} ${t}`);
  }

  const json = (await resp.json().catch(() => null)) as any;
  if (!json || typeof json !== "object") {
    throw new Error("Graph response invalid JSON");
  }
  return json as GraphDeltaResponse;
}

/**
 * Best default for you:
 * - Inbox delta: catches new inbound reliably
 * - Select only fields we need to do lead/message upsert + minimal preview
 */
function buildInitialInboxDeltaUrl(top = 50) {
  const $top = clamp(top, 1, 200);
  const select = [
    "id",
    "subject",
    "bodyPreview",
    "from",
    "replyTo",
    "toRecipients",
    "ccRecipients",
    "receivedDateTime",
    "sentDateTime",
    "isDraft",
    "internetMessageId",
    "conversationId",
  ].join(",");

  // Inbox delta (best for your “lead inquiry” workflow)
  // Note: /me/mailFolders('Inbox')/messages/delta supports delta links.
  return `https://graph.microsoft.com/v1.0/me/mailFolders('Inbox')/messages/delta?$select=${encodeURIComponent(
    select
  )}&$top=${$top}`;
}

function extractEmailAddress(addrObj: any): string | null {
  const raw =
    addrObj?.emailAddress?.address ??
    addrObj?.address ??
    addrObj?.email ??
    null;
  const e = typeof raw === "string" ? raw.trim() : "";
  if (!e) return null;
  return e;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function safePreview(text: unknown, max = 2400) {
  // bodyPreview already text-ish, but be defensive
  const t = safeString(text, max);
  return t.replace(/\s+/g, " ").trim();
}

async function findOrCreateLead(args: {
  supabase: any;
  agentId: string;
  email: string;
  outlookConversationId: string | null;
  subject: string | null;
}) {
  const { supabase, agentId } = args;
  const email = normalizeEmail(args.email);

  // Try find lead by exact email (case-insensitive)
  const { data: existing } = await (supabase.from("leads") as any)
    .select("id, email, outlook_conversation_id")
    .eq("agent_id", agentId)
    // NOTE: we store emails lowercased in practice; if not, this still works if DB collation is case-sensitive.
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    // Best-effort update conversation id if missing
    if (!existing.outlook_conversation_id && args.outlookConversationId) {
      await (supabase.from("leads") as any)
        .update({
          outlook_conversation_id: args.outlookConversationId,
          email_provider: "outlook",
        })
        .eq("id", existing.id)
        .eq("agent_id", agentId);
    }
    return String(existing.id);
  }

  // Create new lead
  const { data: created } = await (supabase.from("leads") as any)
    .insert({
      agent_id: agentId,
      email,
      email_provider: "outlook",
      outlook_conversation_id: args.outlookConversationId,
      subject: args.subject ? safeString(args.subject, 180) : null,
      last_message_at: nowIso(),
    })
    .select("id")
    .single();

  return created?.id ? String(created.id) : null;
}

async function upsertInboundMessage(args: {
  supabase: any;
  agentId: string;
  leadId: string;
  outlookMessageId: string;
  internetMessageId: string | null;
  conversationId: string | null;
  receivedAt: string | null;
  subject: string | null;
  fromEmail: string;
  snippet: string;
}) {
  const { supabase } = args;

  // We store inbound mails as sender="user"
  // status: "inbox_new" is a good start signal for your pipeline (classify -> intent -> route -> draft).
  const row: Record<string, any> = {
    agent_id: args.agentId,
    lead_id: args.leadId,
    sender: "user",
    email_provider: "outlook",

    outlook_message_id: args.outlookMessageId,
    outlook_internet_message_id: args.internetMessageId,
    outlook_conversation_id: args.conversationId,

    // Store subject/snippet/text where your downstream expects it
    subject: args.subject ? safeString(args.subject, 200) : null,
    snippet: safeString(args.snippet, 800),
    text: safeString(args.snippet, 2400),

    email_address: args.fromEmail, // inbound sender
    timestamp: args.receivedAt
      ? new Date(args.receivedAt).toISOString()
      : nowIso(),

    visible_to_agent: true,

    // Pipeline stage start
    status: "inbox_new",
    approval_required: false,
  };

  // Dedupe by outlook_message_id (unique index exists)
  const { error } = await (supabase.from("messages") as any).upsert(row, {
    onConflict: "outlook_message_id",
  });

  if (error) throw new Error(`message upsert failed: ${error.message}`);
}

export async function POST() {
  const supabase = supabaseAdmin();

  // Pull outlook connections that need backfill
  const { data: conns, error: connsErr } = await (
    supabase.from("email_connections") as any
  )
    .select(
      "id, agent_id, provider, status, email_address, access_token, refresh_token, expires_at, needs_backfill, outlook_delta_link, outlook_subscription_id, outlook_subscription_expiration, watch_active, last_error"
    )
    .eq("provider", "outlook")
    // Process those flagged OR never initialized delta yet
    .or("needs_backfill.eq.true,outlook_delta_link.is.null")
    .in("status", ["connected", "active"])
    .order("id", { ascending: true })
    .limit(20);

  if (connsErr) {
    return NextResponse.json(
      { error: "Failed to load email_connections", details: connsErr.message },
      { status: 500 }
    );
  }

  if (!conns || conns.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  const results: any[] = [];

  for (const c of conns as OutlookConnectionRow[]) {
    const connId = String(c.id);
    const agentId = String(c.agent_id || "");

    if (!agentId) {
      results.push({ connId, ok: false, reason: "missing_agent_id" });
      continue;
    }

    // Token handling
    let accessToken = c.access_token || null;
    let refreshToken = c.refresh_token || null;
    let expiresAt = c.expires_at || null;

    try {
      if (!refreshToken) {
        // Fail-closed: cannot fetch without refresh token
        await (supabase.from("email_connections") as any)
          .update({
            last_error: "missing_refresh_token",
            needs_backfill: false,
          })
          .eq("id", c.id);

        results.push({ connId, ok: false, reason: "missing_refresh_token" });
        continue;
      }

      if (!accessToken || !tokenIsValid(expiresAt)) {
        const refreshed = await refreshOutlookAccessToken({
          refreshToken,
        });
        accessToken = refreshed.accessToken;
        expiresAt = refreshed.expiresAt;
        if (refreshed.refreshToken) refreshToken = refreshed.refreshToken;

        // Persist refreshed tokens
        await (supabase.from("email_connections") as any)
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            last_error: null,
          })
          .eq("id", c.id);
      }

      // Delta loop
      let url = c.outlook_delta_link || buildInitialInboxDeltaUrl(50);
      let pageCount = 0;
      let itemCount = 0;
      let deltaLink: string | null = null;

      // Cap work per run per connection (keeps cron bounded)
      const MAX_PAGES = 12;

      while (url && pageCount < MAX_PAGES) {
        pageCount += 1;

        const data = await graphGet(url, accessToken!);

        const items = Array.isArray(data.value) ? data.value : [];
        for (const it of items) {
          // delta can include removals
          if (it?.["@removed"]) continue;

          const outlookMessageId = safeString(it?.id, 200).trim();
          if (!outlookMessageId) continue;

          // Ignore drafts
          if (it?.isDraft === true) continue;

          const subject = it?.subject ? safeString(it.subject, 200) : null;
          const bodyPreview = safePreview(it?.bodyPreview, 2400);

          // from email
          const fromEmail = extractEmailAddress(it?.from);
          if (!fromEmail) continue;

          // only process inbound-ish
          // (We’re pulling Inbox delta, so this is already mostly inbound.)
          const conversationId = it?.conversationId
            ? safeString(it.conversationId, 200)
            : null;

          const internetMessageId = it?.internetMessageId
            ? safeString(it.internetMessageId, 400)
            : null;

          const receivedAt = it?.receivedDateTime
            ? safeString(it.receivedDateTime, 64)
            : it?.sentDateTime
            ? safeString(it.sentDateTime, 64)
            : null;

          const leadId = await findOrCreateLead({
            supabase,
            agentId,
            email: fromEmail,
            outlookConversationId: conversationId,
            subject,
          });

          if (!leadId) continue;

          await upsertInboundMessage({
            supabase,
            agentId,
            leadId,
            outlookMessageId,
            internetMessageId,
            conversationId,
            receivedAt,
            subject,
            fromEmail: normalizeEmail(fromEmail),
            snippet: bodyPreview || subject || "Neue Nachricht",
          });

          // Update lead recency (best-effort)
          await (supabase.from("leads") as any)
            .update({
              last_message_at: receivedAt
                ? new Date(receivedAt).toISOString()
                : nowIso(),
              email_provider: "outlook",
              outlook_conversation_id: conversationId,
            })
            .eq("id", leadId)
            .eq("agent_id", agentId);

          itemCount += 1;
        }

        if (typeof data["@odata.nextLink"] === "string") {
          url = data["@odata.nextLink"];
        } else {
          url = "";
        }

        if (typeof data["@odata.deltaLink"] === "string") {
          deltaLink = data["@odata.deltaLink"];
        }
      }

      // Persist delta link + clear backfill flag
      const patch: Record<string, any> = {
        needs_backfill: false,
        last_error: null,
      };
      if (deltaLink) patch.outlook_delta_link = deltaLink;

      await (supabase.from("email_connections") as any)
        .update(patch)
        .eq("id", c.id);

      results.push({
        connId,
        agentId,
        ok: true,
        pages: pageCount,
        items: itemCount,
        deltaUpdated: !!deltaLink,
      });
    } catch (e: any) {
      const msg = safeString(e?.message || e, 5000);

      // Fail-closed but keep needs_backfill true so it retries next run
      await (supabase.from("email_connections") as any)
        .update({
          last_error: msg,
          needs_backfill: true,
        })
        .eq("id", c.id);

      results.push({ connId, agentId, ok: false, error: msg });
      continue;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
