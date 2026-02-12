// app/api/pipeline/outlook/fetch/run/route.ts
import { NextRequest, NextResponse } from "next/server";
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

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
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

function toIsoOrNow(v: string | null) {
  try {
    return v ? new Date(v).toISOString() : nowIso();
  } catch {
    return nowIso();
  }
}

function isFutureIso(v: string | null) {
  if (!v) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t > Date.now();
}

function addHoursIso(baseIso: string, hours: number) {
  const t = Date.parse(baseIso);
  if (!Number.isFinite(t)) return null;
  return new Date(t + hours * 60 * 60 * 1000).toISOString();
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
      "Missing MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET env vars",
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
    const err = new Error(
      `Graph request failed: ${resp.status} ${t}`,
    ) as Error & {
      status?: number;
      body?: string;
    };
    err.status = resp.status;
    err.body = t;
    throw err;
  }

  const json = (await resp.json().catch(() => null)) as any;
  if (!json || typeof json !== "object") {
    throw new Error("Graph response invalid JSON");
  }
  return json as GraphDeltaResponse;
}

function isDeltaGoneError(e: any) {
  const status = Number(e?.status);
  if (status === 410) return true;
  const body = String(e?.body || e?.message || "").toLowerCase();
  return (
    body.includes("syncstatenotfound") ||
    body.includes("deltatoken") ||
    (body.includes("invalid") && body.includes("delta"))
  );
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
    select,
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

function looksLikeNoReply(email: string | null) {
  const e = (email || "").toLowerCase();
  if (!e) return false;
  const patterns = ["no-reply", "noreply", "do-not-reply", "donotreply"];
  return patterns.some((p) => e.includes(p));
}

function looksLikePortalSender(email: string | null) {
  const e = (email || "").toLowerCase();
  if (!e) return false;
  // Add only the portals we actually expect. Conservative list.
  const portals = [
    "immoscout",
    "immowelt",
    "immonet",
    "funda",
    "pararius",
    "rightmove",
    "zoopla",
    "idealista",
  ];
  return portals.some((p) => e.includes(p));
}

function pickLeadEmail(args: {
  fromEmail: string;
  replyToEmail: string | null;
  agentMailboxEmail: string | null;
}) {
  const from = normalizeEmail(args.fromEmail);
  const replyTo = args.replyToEmail ? normalizeEmail(args.replyToEmail) : null;

  // Never use the agent mailbox as lead email.
  const agent = args.agentMailboxEmail
    ? normalizeEmail(args.agentMailboxEmail)
    : null;

  const fromIsBad = looksLikeNoReply(from) || looksLikePortalSender(from);
  const replyToIsUs = !!agent && !!replyTo && replyTo === agent;
  const replyToIsBad = !replyTo || looksLikeNoReply(replyTo) || replyToIsUs;

  // If sender looks like portal/no-reply, prefer replyTo if it looks usable.
  if (fromIsBad && !replyToIsBad) return replyTo;

  // Otherwise, default to from.
  return from;
}

function sameEmail(a: string | null, b: string | null) {
  const aa = a ? normalizeEmail(a) : "";
  const bb = b ? normalizeEmail(b) : "";
  return !!aa && !!bb && aa === bb;
}

function safePreview(text: unknown, max = 2400) {
  // bodyPreview already text-ish, but be defensive
  const t = safeString(text, max);
  return t.replace(/\s+/g, " ").trim();
}

function computeFollowupPlan(args: {
  nowIso: string;
  followupsEnabled: boolean;
  pausedUntil: string | null;
}) {
  if (!args.followupsEnabled) {
    return {
      followup_status: "idle" as const,
      followup_next_at: null as string | null,
      // Keep paused_until as-is (agent may re-enable later)
      followup_paused_until: args.pausedUntil,
    };
  }

  // If snoozed into the future, keep the snooze date (do not override).
  if (isFutureIso(args.pausedUntil)) {
    return {
      followup_status: "planned" as const,
      followup_next_at: args.pausedUntil,
      followup_paused_until: args.pausedUntil,
    };
  }

  // Default: stage 1 planned for +24h from last inbound user message
  const nextAt = addHoursIso(args.nowIso, 24);
  return {
    followup_status: nextAt
      ? ("planned" as const)
      : ("idle" as const),
    followup_next_at: nextAt,
    followup_paused_until: null as string | null,
  };
}

async function getAgentFollowupsEnabled(supabase: any, agentId: string) {
  // We want follow-ups to respect the agent's real setting.
  // If the setting/table is missing or unreadable, we fail open to `true` to avoid breaking the pipeline.
  try {
    const { data, error } = await (supabase.from("agent_settings") as any)
      .select("followups_enabled")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (error) return true;

    const v = (data as any)?.followups_enabled;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;

    return true;
  } catch {
    return true;
  }
}

async function findOrCreateLead(args: {
  supabase: any;
  agentId: string;
  email: string;
  replyToEmail: string | null;
  agentMailboxEmail: string | null;
  outlookConversationId: string | null;
  subject: string | null;
  inboundIso: string;
}) {
  const { supabase, agentId } = args;

  const chosenEmail = pickLeadEmail({
    fromEmail: args.email,
    replyToEmail: args.replyToEmail,
    agentMailboxEmail: args.agentMailboxEmail,
  });

  // 0) Prefer conversationId mapping (thread-equivalent) to avoid creating duplicates
  if (args.outlookConversationId) {
    const { data: byConv } = await (supabase.from("leads") as any)
      .select("id, email, outlook_conversation_id")
      .eq("agent_id", agentId)
      .eq("outlook_conversation_id", args.outlookConversationId)
      .limit(1)
      .maybeSingle();

    if (byConv?.id) {
      const existingEmail =
        typeof byConv.email === "string" ? byConv.email : "";
      const existingNorm = existingEmail ? normalizeEmail(existingEmail) : "";
      const chosenNorm = chosenEmail ? normalizeEmail(chosenEmail) : "";

      const existingIsBad = !existingNorm || looksLikeNoReply(existingNorm);
      const chosenLooksGood = !!chosenNorm && !looksLikeNoReply(chosenNorm);

      // Upgrade lead email if we currently have empty/no-reply and we now have a better one
      if (existingIsBad && chosenLooksGood) {
        await (supabase.from("leads") as any)
          .update({
            email: chosenNorm,
            email_provider: "outlook",
          })
          .eq("id", byConv.id)
          .eq("agent_id", agentId);
      } else {
        // still ensure provider is set
        await (supabase.from("leads") as any)
          .update({ email_provider: "outlook" })
          .eq("id", byConv.id)
          .eq("agent_id", agentId);
      }

      return String(byConv.id);
    }
  }

  // 1) Fallback: try find lead by exact email
  const emailNorm = normalizeEmail(chosenEmail);

  const { data: existing } = await (supabase.from("leads") as any)
    .select("id, email, outlook_conversation_id")
    .eq("agent_id", agentId)
    .ilike("email", emailNorm)
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

  // 2) Create new lead
  const agentFollowupsEnabled = await getAgentFollowupsEnabled(supabase, agentId);

  const initialPlan = computeFollowupPlan({
    nowIso: args.inboundIso,
    followupsEnabled: agentFollowupsEnabled,
    pausedUntil: null,
  });

  const { data: created } = await (supabase.from("leads") as any)
    .insert({
      agent_id: agentId,
      email: emailNorm,
      email_provider: "outlook",
      outlook_conversation_id: args.outlookConversationId,
      subject: args.subject ? safeString(args.subject, 180) : null,

      last_message_at: args.inboundIso,
      last_user_message_at: args.inboundIso,

      followups_enabled: agentFollowupsEnabled,
      followup_stage: 0,
      followup_status: initialPlan.followup_status,
      followup_next_at: initialPlan.followup_next_at,
      followup_stop_reason: null,
      followup_paused_until: initialPlan.followup_paused_until,
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
  // status: "inbox_new" is the start signal for your pipeline (classify -> intent -> route -> draft).
  const row: Record<string, any> = {
    agent_id: args.agentId,
    lead_id: args.leadId,
    sender: "user",
    email_provider: "outlook",

    outlook_message_id: args.outlookMessageId,
    outlook_internet_message_id: args.internetMessageId,
    outlook_conversation_id: args.conversationId,

    subject: args.subject ? safeString(args.subject, 200) : null,
    snippet: safeString(args.snippet, 800),
    text: safeString(args.snippet, 2400),

    email_address: normalizeEmail(args.fromEmail), // inbound sender
    timestamp: args.receivedAt
      ? new Date(args.receivedAt).toISOString()
      : nowIso(),

    visible_to_agent: true,

    status: "inbox_new",
    approval_required: false,
  };

  // IMPORTANT:
  // Using upsert(onConflict: outlook_message_id) can fail if the DB only has a *partial* unique index.
  // So we do a normal insert and treat duplicate-key as success (idempotent).
  const { error } = await (supabase.from("messages") as any).insert(row);

  if (!error) return;

  const code = String((error as any).code || "");
  // Postgres unique_violation
  if (code === "23505") return;

  throw new Error(
    `message insert failed: ${(error as any).message || "unknown"}`,
  );
}

export async function POST(req: NextRequest) {
  // Protect pipeline runner: only callable by internal cron/queue
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = supabaseAdmin();

  // Pull outlook connections that need backfill
  const { data: conns, error: connsErr } = await (
    supabase.from("email_connections") as any
  )
    .select(
      "id, agent_id, provider, status, email_address, access_token, refresh_token, expires_at, needs_backfill, outlook_delta_link, outlook_subscription_id, outlook_subscription_expiration, watch_active, last_error",
    )
    .eq("provider", "outlook")
    .in("status", ["connected", "active"])
    // Run for ALL active Outlook connections so delta polling keeps working.
    // needs_backfill=true just means we might need to reset/initialize state.
    .order("id", { ascending: true })
    .limit(20);

  if (connsErr) {
    return NextResponse.json(
      { error: "Failed to load email_connections", details: connsErr.message },
      { status: 500 },
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
      let url = c.outlook_delta_link || buildInitialInboxDeltaUrl(100);
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

          // reply-to (portal systems often put the real lead here)
          const replyToEmail =
            Array.isArray(it?.replyTo) && it.replyTo.length > 0
              ? extractEmailAddress(it.replyTo[0])
              : null;

          // Skip self-sent/outbound copies (prevents drafting replies to the agent's own messages)
          if (c.email_address && sameEmail(fromEmail, c.email_address))
            continue;

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

          const inboundIso = toIsoOrNow(receivedAt);

          const leadId = await findOrCreateLead({
            supabase,
            agentId,
            email: fromEmail,
            replyToEmail,
            agentMailboxEmail: c.email_address || null,
            outlookConversationId: conversationId,
            subject,
            inboundIso,
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
            fromEmail: fromEmail,
            snippet: bodyPreview || subject || "Neue Nachricht",
          });

          // Update lead recency + follow-up scheduling state (best-effort)
          // Inbound message => last_user_message_at should move forward.
          // Follow-up sequencing should reset to stage 0 and plan next_at (+24h) if enabled and not paused.
          let followupsEnabled = true;
          let pausedUntil: string | null = null;

          const { data: fuState, error: fuStateErr } = await (
            supabase.from("leads") as any
          )
            .select("followups_enabled, followup_paused_until")
            .eq("id", leadId)
            .eq("agent_id", agentId)
            .maybeSingle();

          if (!fuStateErr && fuState) {
            followupsEnabled = Boolean(
              (fuState as any).followups_enabled ?? true,
            );
            pausedUntil = (fuState as any).followup_paused_until
              ? toIsoOrNow(String((fuState as any).followup_paused_until))
              : null;
          }

          const plan = computeFollowupPlan({
            nowIso: inboundIso,
            followupsEnabled,
            pausedUntil,
          });

          const leadPatch: Record<string, any> = {
            last_message_at: inboundIso,
            last_user_message_at: inboundIso,
            email_provider: "outlook",
            outlook_conversation_id: conversationId,

            // Follow-up state reset on inbound
            followup_stage: 0,
            followup_status: plan.followup_status,
            followup_stop_reason: null,
            followup_next_at: plan.followup_next_at,

            // Keep paused_until consistent with plan (don't override future snooze)
            followup_paused_until: plan.followup_paused_until,
          };

          await (supabase.from("leads") as any)
            .update(leadPatch)
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

      // Keep a mirror in watch_expiration for unified monitoring dashboards (optional field)
      if (c.outlook_subscription_expiration) {
        patch.watch_expiration = c.outlook_subscription_expiration;
      }

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

      // If delta state is gone/expired, reset the delta link so the next run re-initializes.
      const resetDelta = isDeltaGoneError(e);

      await (supabase.from("email_connections") as any)
        .update({
          last_error: msg,
          needs_backfill: true,
          ...(resetDelta ? { outlook_delta_link: null } : {}),
        })
        .eq("id", c.id);

      results.push({
        connId,
        agentId,
        ok: false,
        error: msg,
        resetDelta,
      });
      continue;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
