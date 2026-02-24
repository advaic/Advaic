// app/api/slack/interactions/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { decryptSecretFromStorage } from "@/lib/security/secrets";

export const runtime = "nodejs";
const OUTBOUND_TIMEOUT_MS = 15_000;
const ACTION_BY_ID = {
  advaic_approve: "approve",
  advaic_reject: "reject",
  advaic_escalate: "escalate",
} as const;
type SlackAction = (typeof ACTION_BY_ID)[keyof typeof ACTION_BY_ID];

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function siteUrl() {
  return mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
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
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("request_timeout");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Slack signature verification:
 * basestring = "v0:" + timestamp + ":" + rawBody
 * signature  = "v0=" + hex(hmac_sha256(signing_secret, basestring))
 */
function verifySlackSignature(args: {
  signingSecret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
}) {
  const { signingSecret, timestamp, signature, rawBody } = args;

  if (!timestamp || !signature) return { ok: false, error: "missing_headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, error: "bad_timestamp" };

  // prevent replay attacks: reject if older than 5 minutes
  const ageSeconds = Math.abs(Date.now() / 1000 - ts);
  if (ageSeconds > 60 * 5) return { ok: false, error: "timestamp_too_old" };

  const base = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto
    .createHmac("sha256", signingSecret)
    .update(base, "utf8")
    .digest("hex");

  const expected = `v0=${hmac}`;

  // timing-safe compare
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return { ok: false, error: "sig_mismatch" };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true } : { ok: false, error: "sig_mismatch" };
}

function parseFormEncoded(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

async function slackChatUpdate(args: {
  accessToken: string;
  channelId: string;
  ts: string;
  text: string;
  blocks?: any[];
}) {
  const resp = await fetchWithTimeout("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: args.channelId,
      ts: args.ts,
      text: args.text,
      ...(Array.isArray(args.blocks) ? { blocks: args.blocks } : {}),
      unfurl_links: false,
      unfurl_media: false,
    }),
  });

  const json = (await resp.json().catch(() => null)) as any;
  if (!resp.ok || !json?.ok) {
    throw new Error(`slack_update_failed:${json?.error || resp.status}`);
  }
}

async function callInternal(path: string, payload: any) {
  const resp = await fetchWithTimeout(`${siteUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(String(data?.error || `http_${resp.status}`));
  }
  return data;
}

type SlackConnection = {
  accessToken: string;
  authedUserId: string;
  teamId: string | null;
};

async function loadSlackConnection(args: {
  supabase: any;
  agentId: string;
}): Promise<{ data: SlackConnection | null; error: string | null }> {
  const { supabase, agentId } = args;

  const candidates = [
    {
      select: "access_token, authed_user_id, team_id",
      map: (r: any) => ({
        accessToken: decryptSecretFromStorage(r?.access_token),
        authedUserId: String(r?.authed_user_id || "").trim(),
        teamId: String(r?.team_id || "").trim() || null,
      }),
    },
    {
      select: "access_token, slack_authed_user_id, team_id",
      map: (r: any) => ({
        accessToken: decryptSecretFromStorage(r?.access_token),
        authedUserId: String(r?.slack_authed_user_id || "").trim(),
        teamId: String(r?.team_id || "").trim() || null,
      }),
    },
    {
      select: "access_token, authed_user_id, slack_team_id",
      map: (r: any) => ({
        accessToken: decryptSecretFromStorage(r?.access_token),
        authedUserId: String(r?.authed_user_id || "").trim(),
        teamId: String(r?.slack_team_id || "").trim() || null,
      }),
    },
    {
      select: "access_token, slack_authed_user_id, slack_team_id",
      map: (r: any) => ({
        accessToken: decryptSecretFromStorage(r?.access_token),
        authedUserId: String(r?.slack_authed_user_id || "").trim(),
        teamId: String(r?.slack_team_id || "").trim() || null,
      }),
    },
  ];

  let lastErr: string | null = null;
  for (const c of candidates) {
    const { data, error } = await (supabase.from("slack_connections") as any)
      .select(c.select)
      .eq("agent_id", agentId)
      .maybeSingle();

    if (error) {
      lastErr = String(error.message || "slack_query_failed");
      continue;
    }

    if (!data) {
      return { data: null, error: null };
    }

    const mapped = c.map(data);
    if (mapped.accessToken && mapped.authedUserId) {
      return { data: mapped, error: null };
    }
  }

  return { data: null, error: lastErr || "missing_slack_credentials" };
}

function statusBlocks(args: {
  title: string;
  statusLine: string;
  url: string;
  leadName?: string;
}) {
  const leadLine = args.leadName ? `*Interessent:* ${args.leadName}\n` : "";
  return [
    {
      type: "header",
      text: { type: "plain_text", text: args.title.slice(0, 150) },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${leadLine}${args.statusLine}\n*Link:* <${args.url}|Im Dashboard öffnen>`,
      },
    },
  ];
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // 1) Verify Slack signature
  const verify = verifySlackSignature({
    signingSecret: mustEnv("SLACK_SIGNING_SECRET"),
    timestamp: req.headers.get("x-slack-request-timestamp"),
    signature: req.headers.get("x-slack-signature"),
    rawBody,
  });

  if (!verify.ok) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", details: verify.error },
      { status: 401 },
    );
  }

  // 2) Slack sends x-www-form-urlencoded with "payload={...json...}"
  const form = parseFormEncoded(rawBody);
  const payloadRaw = form["payload"];
  if (!payloadRaw) {
    return NextResponse.json(
      { ok: false, error: "missing_payload" },
      { status: 400 },
    );
  }

  let slackPayload: any = null;
  try {
    slackPayload = JSON.parse(payloadRaw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_payload_json" },
      { status: 400 },
    );
  }

  // We only handle interactive message button clicks (block_actions)
  if (slackPayload?.type !== "block_actions") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const action = Array.isArray(slackPayload.actions)
    ? slackPayload.actions[0]
    : null;
  const actionId = String(action?.action_id || "").trim();
  const value = String(action?.value || "").trim();

  if (!actionId || !value) {
    return NextResponse.json(
      { ok: false, error: "missing_action" },
      { status: 400 },
    );
  }

  // Our buttons use value = JSON({event_id, agent_id, lead_id, draft_message_id, action})
  let parsedValue: any = null;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_action_value" },
      { status: 400 },
    );
  }

  const agentId = String(parsedValue?.agent_id || "").trim();
  const leadId = String(parsedValue?.lead_id || "").trim();
  const draftMessageId = String(parsedValue?.draft_message_id || "").trim();
  const eventId = String(parsedValue?.event_id || "").trim() || null;
  const valueAction = String(parsedValue?.action || "").trim();
  const chosen: SlackAction | null =
    ACTION_BY_ID[actionId as keyof typeof ACTION_BY_ID] || null;

  // Slack message identifiers for updating the message
  const channelId = String(slackPayload?.channel?.id || "").trim();
  const messageTs = String(slackPayload?.message?.ts || "").trim();

  if (!agentId || !channelId || !messageTs) {
    return NextResponse.json(
      { ok: false, error: "missing_context" },
      { status: 400 },
    );
  }
  if (!chosen) {
    return NextResponse.json(
      { ok: false, error: "unknown_action" },
      { status: 400 },
    );
  }
  if (valueAction && valueAction !== chosen) {
    return NextResponse.json(
      { ok: false, error: "action_mismatch" },
      { status: 400 },
    );
  }

  // 3) Load Slack token for this agent (DM token)
  const supabase = supabaseAdmin();
  const slackConn = await loadSlackConnection({ supabase, agentId });
  if (slackConn.error || !slackConn.data?.accessToken) {
    return NextResponse.json(
      { ok: false, error: slackConn.error || "slack_not_connected" },
      { status: 400 },
    );
  }

  // Guard against cross-workspace or cross-user action replay.
  const requestTeamId = String(
    slackPayload?.team?.id || slackPayload?.user?.team_id || "",
  ).trim();
  const requestUserId = String(slackPayload?.user?.id || "").trim();
  if (
    slackConn.data.teamId &&
    requestTeamId &&
    slackConn.data.teamId !== requestTeamId
  ) {
    return NextResponse.json(
      { ok: false, error: "team_mismatch" },
      { status: 403 },
    );
  }
  if (
    slackConn.data.authedUserId &&
    requestUserId &&
    slackConn.data.authedUserId !== requestUserId
  ) {
    return NextResponse.json(
      { ok: false, error: "user_mismatch" },
      { status: 403 },
    );
  }

  // Optional: pull lead name for nicer status text
  let leadName = "";
  try {
    const { data: lead } = await (supabase.from("leads") as any)
      .select("name")
      .eq("id", leadId)
      .eq("agent_id", agentId)
      .maybeSingle();
    leadName = String(lead?.name || "").trim();
  } catch {
    // ignore
  }

  // 4) Execute action via internal routes (fail-closed)
  const title = "Advaic – Entscheidung verarbeitet";
  const approvalLink = `${siteUrl()}/app/zur-freigabe`;
  const escalationLink = `${siteUrl()}/app/eskalationen`;

  try {
    if (chosen === "approve") {
      if (!draftMessageId) throw new Error("missing_draft_message_id");

      const { data: msg, error: msgErr } = await (supabase.from("messages") as any)
        .select("id, lead_id, status, approval_required, send_status")
        .eq("id", draftMessageId)
        .eq("agent_id", agentId)
        .maybeSingle();

      if (msgErr) throw new Error(`message_lookup_failed:${msgErr.message}`);
      if (!msg?.id) throw new Error("message_not_found");
      if (leadId && String(msg.lead_id || "").trim() !== leadId) {
        throw new Error("message_lead_mismatch");
      }

      const alreadyApproved =
        !msg.approval_required &&
        (String(msg.status || "").trim() === "approved" ||
          String(msg.status || "").trim() === "ready_to_send" ||
          String(msg.send_status || "").trim() === "sending" ||
          String(msg.send_status || "").trim() === "sent");

      if (!alreadyApproved) {
        await callInternal("/api/messages/approve", {
          agent_id: agentId,
          message_id: draftMessageId,
          event_id: eventId,
        });
      }

      await slackChatUpdate({
        accessToken: slackConn.data.accessToken,
        channelId,
        ts: messageTs,
        text: alreadyApproved ? "✅ Bereits freigegeben" : "✅ Freigegeben",
        blocks: statusBlocks({
          title,
          statusLine: alreadyApproved
            ? "✅ *Bereits freigegeben* – die Aktion wurde schon vorher verarbeitet."
            : "✅ *Freigegeben* – der Entwurf wurde freigegeben und Versand wurde angestoßen.",
          url: approvalLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    if (chosen === "reject") {
      if (!draftMessageId) throw new Error("missing_draft_message_id");

      const { data: msg, error: msgErr } = await (supabase.from("messages") as any)
        .select("id, lead_id, status, approval_required")
        .eq("id", draftMessageId)
        .eq("agent_id", agentId)
        .maybeSingle();

      if (msgErr) throw new Error(`message_lookup_failed:${msgErr.message}`);
      if (!msg?.id) throw new Error("message_not_found");
      if (leadId && String(msg.lead_id || "").trim() !== leadId) {
        throw new Error("message_lead_mismatch");
      }

      const alreadyRejected =
        !msg.approval_required && String(msg.status || "").trim() === "rejected";

      if (!alreadyRejected) {
        await callInternal("/api/messages/reject", {
          agent_id: agentId,
          message_id: draftMessageId,
          event_id: eventId,
        });
      }

      await slackChatUpdate({
        accessToken: slackConn.data.accessToken,
        channelId,
        ts: messageTs,
        text: alreadyRejected ? "❌ Bereits abgelehnt" : "❌ Abgelehnt",
        blocks: statusBlocks({
          title,
          statusLine: alreadyRejected
            ? "❌ *Bereits abgelehnt* – die Aktion wurde schon vorher verarbeitet."
            : "❌ *Abgelehnt* – der Entwurf wurde verworfen.",
          url: approvalLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    if (chosen === "escalate") {
      if (!leadId) throw new Error("missing_lead_id");

      const { data: lead, error: leadErr } = await (supabase.from("leads") as any)
        .select("id, escalated")
        .eq("id", leadId)
        .eq("agent_id", agentId)
        .maybeSingle();

      if (leadErr) throw new Error(`lead_lookup_failed:${leadErr.message}`);
      if (!lead?.id) throw new Error("lead_not_found");

      const alreadyEscalated = !!lead.escalated;
      if (!alreadyEscalated) {
        await callInternal("/api/leads/escalate", {
          agent_id: agentId,
          lead_id: leadId,
          reason: "Slack action: escalate",
          event_id: eventId,
        });
      }

      await slackChatUpdate({
        accessToken: slackConn.data.accessToken,
        channelId,
        ts: messageTs,
        text: alreadyEscalated ? "🚨 Bereits eskaliert" : "🚨 Eskaliert",
        blocks: statusBlocks({
          title,
          statusLine: alreadyEscalated
            ? "🚨 *Bereits eskaliert* – die Aktion wurde schon vorher verarbeitet."
            : "🚨 *Eskaliert* – KI ist pausiert, der Fall ist jetzt in Eskalationen.",
          url: escalationLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (e: any) {
    const errMsg = String(e?.message || "action_failed")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    const fallbackUrl = chosen === "escalate" ? escalationLink : approvalLink;

    // Update slack message to show failure, but keep it actionable? (We remove buttons to avoid loops.)
    try {
      await slackChatUpdate({
        accessToken: slackConn.data.accessToken,
        channelId,
        ts: messageTs,
        text: "⚠️ Fehler",
        blocks: statusBlocks({
          title: "Advaic – Fehler bei Aktion",
          statusLine: `⚠️ *Fehlgeschlagen:* ${errMsg}`,
          url: fallbackUrl,
          leadName,
        }),
      });
    } catch {
      // ignore secondary errors
    }

    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 });
  }
}
