// app/api/slack/interactions/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

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
  const resp = await fetch("https://slack.com/api/chat.update", {
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
  const resp = await fetch(`${siteUrl()}${path}`, {
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

  const slackPayload = JSON.parse(payloadRaw) as any;

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
  const chosen = String(parsedValue?.action || "").trim(); // approve|reject|escalate

  // Slack message identifiers for updating the message
  const channelId = String(slackPayload?.channel?.id || "").trim();
  const messageTs = String(slackPayload?.message?.ts || "").trim();

  if (!agentId || !channelId || !messageTs) {
    return NextResponse.json(
      { ok: false, error: "missing_context" },
      { status: 400 },
    );
  }

  // 3) Load Slack token for this agent (DM token)
  const supabase = supabaseAdmin();
  const { data: slackConn, error: slackErr } = await (
    supabase.from("slack_connections") as any
  )
    .select("access_token, authed_user_id, team_id, team_name")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (slackErr || !slackConn?.access_token) {
    return NextResponse.json(
      { ok: false, error: "slack_not_connected" },
      { status: 400 },
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
    if (chosen === "approve" || actionId === "advaic_approve") {
      if (!draftMessageId) throw new Error("missing_draft_message_id");
      await callInternal("/api/messages/approve", {
        agent_id: agentId,
        message_id: draftMessageId,
      });

      await slackChatUpdate({
        accessToken: String(slackConn.access_token),
        channelId,
        ts: messageTs,
        text: "✅ Freigegeben",
        blocks: statusBlocks({
          title,
          statusLine:
            "✅ *Freigegeben* – der Entwurf wurde zur Send-Pipeline freigegeben.",
          url: approvalLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    if (chosen === "reject" || actionId === "advaic_reject") {
      if (!draftMessageId) throw new Error("missing_draft_message_id");
      await callInternal("/api/messages/reject", {
        agent_id: agentId,
        message_id: draftMessageId,
      });

      await slackChatUpdate({
        accessToken: String(slackConn.access_token),
        channelId,
        ts: messageTs,
        text: "❌ Abgelehnt",
        blocks: statusBlocks({
          title,
          statusLine: "❌ *Abgelehnt* – der Entwurf wurde verworfen.",
          url: approvalLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    if (chosen === "escalate" || actionId === "advaic_escalate") {
      if (!leadId) throw new Error("missing_lead_id");
      await callInternal("/api/leads/escalate", {
        agent_id: agentId,
        lead_id: leadId,
        reason: "Slack action: escalate",
      });

      await slackChatUpdate({
        accessToken: String(slackConn.access_token),
        channelId,
        ts: messageTs,
        text: "🚨 Eskaliert",
        blocks: statusBlocks({
          title,
          statusLine:
            "🚨 *Eskaliert* – KI ist pausiert, der Fall ist jetzt in Eskalationen.",
          url: escalationLink,
          leadName,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    // Unknown action => mark message updated anyway
    await slackChatUpdate({
      accessToken: String(slackConn.access_token),
      channelId,
      ts: messageTs,
      text: "⚠️ Unbekannte Aktion",
      blocks: statusBlocks({
        title,
        statusLine: "⚠️ *Unbekannte Aktion* – bitte im Dashboard prüfen.",
        url: approvalLink,
        leadName,
      }),
    });

    return NextResponse.json({ ok: true, unknown_action: true });
  } catch (e: any) {
    const errMsg = String(e?.message || "action_failed").slice(0, 220);

    // Update slack message to show failure, but keep it actionable? (We remove buttons to avoid loops.)
    try {
      await slackChatUpdate({
        accessToken: String(slackConn.access_token),
        channelId,
        ts: messageTs,
        text: "⚠️ Fehler",
        blocks: statusBlocks({
          title: "Advaic – Fehler bei Aktion",
          statusLine: `⚠️ *Fehlgeschlagen:* ${errMsg}`,
          url: approvalLink,
          leadName,
        }),
      });
    } catch {
      // ignore secondary errors
    }

    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 });
  }
}
