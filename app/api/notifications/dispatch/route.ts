import { NextResponse } from "next/server";
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
  // should be https in prod
  return mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
}

function buildTitleForEvent(type: string) {
  switch (type) {
    case "approval_required_created":
      return "Neue Nachricht zur Freigabe";
    case "escalation_created":
      return "Neue Eskalation";
    case "lead_escalated":
      return "Neue Eskalation";
    default:
      return "Advaic Update";
  }
}

function buildBodyForEvent(type: string) {
  switch (type) {
    case "approval_required_created":
      return "Neue Nachricht zur Freigabe.";
    case "escalation_created":
      return "Gespräch wurde eskaliert.";
    case "lead_escalated":
      return "Gespräch wurde eskaliert.";
    default:
      return "Neues Update im Advaic Dashboard.";
  }
}
// --- Helper functions for formatting/escaping ---
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTs(ts: unknown): string {
  if (!ts) return "–";
  let d: Date | null = null;
  try {
    d = new Date(ts as any);
    if (!Number.isFinite(d.getTime())) return "–";
    return d.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "–";
  }
}

function previewText(v: unknown, max = 900) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function buildSlackBlocksForApproval(args: {
  title: string;
  leadName: string;
  inboundText?: string;
  draftText?: string;
  url: string;
  actionPayload: {
    event_id: string;
    agent_id: string;
    lead_id: string;
    draft_message_id: string;
  };
  lastLeadAt?: string;
  draftAt?: string;
}) {
  const inbound = previewText(args.inboundText, 900);
  const draft = previewText(args.draftText, 900);
  const formattedTime = formatTs(args.lastLeadAt || args.draftAt);

  const actionValue = (action: "approve" | "reject" | "escalate") =>
    JSON.stringify({ ...args.actionPayload, action }).slice(0, 2000);

  return [
    {
      type: "header",
      text: { type: "plain_text", text: args.title.slice(0, 150) },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*Interessent:* ${args.leadName || "Unbekannt"}\n*Link:* <${args.url}|Zur Freigabe öffnen>\n*Zeit:* ${formattedTime}`,
      },
    },
    inbound
      ? {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Letzte Nachricht (Interessent, ${formatTs(args.lastLeadAt)}):*\n> ${inbound.replace(/\n/g, "\n> ")}`,
          },
        }
      : null,
    draft
      ? {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Vorschlag von Advaic (Entwurf, ${formatTs(args.draftAt)}):*\n> ${draft.replace(/\n/g, "\n> ")}`,
          },
        }
      : null,
    {
      type: "actions",
      elements: [
        {
          type: "button",
          style: "primary",
          text: { type: "plain_text", text: "Freigeben & senden" },
          action_id: "advaic_approve",
          value: actionValue("approve"),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Ablehnen" },
          action_id: "advaic_reject",
          value: actionValue("reject"),
          confirm: {
            title: { type: "plain_text", text: "Ablehnen?" },
            text: {
              type: "mrkdwn",
              text: "Der Entwurf wird verworfen. Fortfahren?",
            },
            confirm: { type: "plain_text", text: "Ja, ablehnen" },
            deny: { type: "plain_text", text: "Abbrechen" },
          },
        },
        {
          type: "button",
          style: "danger",
          text: { type: "plain_text", text: "Eskalieren" },
          action_id: "advaic_escalate",
          value: actionValue("escalate"),
          confirm: {
            title: { type: "plain_text", text: "Eskalieren?" },
            text: {
              type: "mrkdwn",
              text: "KI wird pausiert und der Fall landet in Eskalationen.",
            },
            confirm: { type: "plain_text", text: "Eskalieren" },
            deny: { type: "plain_text", text: "Abbrechen" },
          },
        },
      ],
    },
  ].filter(Boolean);
}

function buildSlackBlocksForEscalation(args: {
  title: string;
  leadName: string;
  inboundText?: string;
  inboundAt?: string;
  reason?: string;
  url: string;
}): any[] {
  const blocks: any[] = [];
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: args.title.slice(0, 150) },
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `*Interessent:* ${args.leadName || "Unbekannt"}\n*Zeit:* ${formatTs(args.inboundAt)}\n*Link:* <${args.url}|Im Dashboard öffnen>`,
    },
  });
  if (args.inboundText) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*Letzte Nachricht (Interessent, ${formatTs(args.inboundAt)}):*\n> ${previewText(args.inboundText, 900).replace(/\n/g, "\n> ")}`,
      },
    });
  }
  if (args.reason) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Grund:* ${args.reason}`,
      },
    });
  }
  return blocks;
}

async function sendSlackMessage(args: {
  accessToken: string;
  authedUserId: string;
  text: string;
  blocks?: any[];
}) {
  // 1) open DM
  const openResp = await fetch("https://slack.com/api/conversations.open", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ users: args.authedUserId }),
  });

  const openJson = (await openResp.json().catch(() => null)) as any;
  if (!openResp.ok || !openJson?.ok || !openJson?.channel?.id) {
    throw new Error(`slack_open_failed:${openJson?.error || openResp.status}`);
  }

  const channelId = String(openJson.channel.id);

  // 2) post message (supports Block Kit)
  const postResp = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: channelId,
      text: args.text,
      ...(Array.isArray(args.blocks) ? { blocks: args.blocks } : {}),
      unfurl_links: false,
      unfurl_media: false,
    }),
  });

  const postJson = (await postResp.json().catch(() => null)) as any;
  if (!postResp.ok || !postJson?.ok) {
    throw new Error(`slack_post_failed:${postJson?.error || postResp.status}`);
  }
}

async function sendEmailResend(args: {
  to: string;
  subject: string;
  bodyText: string;
  html?: string;
}) {
  const apiKey = mustEnv("RESEND_API_KEY");
  const from = mustEnv("ADVAIC_EMAIL_FROM"); // e.g. "Advaic <no-reply@updates.advaic.com>"

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      text: args.bodyText,
      ...(args.html ? { html: args.html } : {}),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `resend_send_failed:http_${resp.status}:${text.slice(0, 300)}`,
    );
  }
}

async function safeJson<T = any>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

async function enrichApprovalPayload(args: {
  supabase: any;
  agentId: string;
  event: any;
}): Promise<any> {
  const { supabase, agentId, event } = args;

  const payload =
    event?.payload && typeof event.payload === "object" ? event.payload : {};

  const draftMessageId = String(
    payload?.draft_message_id || event?.entity_id || "",
  ).trim();
  if (!draftMessageId) return payload;

  // Select timestamp too
  const { data: draftMsg } = await (supabase.from("messages") as any)
    .select("id, lead_id, agent_id, text, snippet, timestamp")
    .eq("id", draftMessageId)
    .maybeSingle();

  const leadId = String(payload?.lead_id || draftMsg?.lead_id || "").trim();

  let leadName = String(payload?.lead_name || "").trim();
  if (leadId && !leadName) {
    const { data: lead } = await (supabase.from("leads") as any)
      .select("id, name")
      .eq("id", leadId)
      .eq("agent_id", agentId)
      .maybeSingle();
    leadName = String(lead?.name || "").trim();
  }

  let inboundPreview = String(payload?.inbound_preview || "").trim();
  let lastLeadMessageAt: string | null = null;
  if (leadId && !inboundPreview) {
    // Select timestamp too
    const { data: lastUser } = await (supabase.from("messages") as any)
      .select("text, snippet, timestamp")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    inboundPreview = String(lastUser?.text || lastUser?.snippet || "").trim();
    lastLeadMessageAt = lastUser?.timestamp ? String(lastUser.timestamp) : null;
  } else if (leadId) {
    // If inbound_preview is present, try to get its timestamp
    const { data: lastUser } = await (supabase.from("messages") as any)
      .select("text, snippet, timestamp")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastLeadMessageAt = lastUser?.timestamp ? String(lastUser.timestamp) : null;
  }

  let draftPreview = String(payload?.draft_preview || "").trim();
  let draftMessageAt: string | null = null;
  if (!draftPreview) {
    draftPreview = String(draftMsg?.text || draftMsg?.snippet || "").trim();
    draftMessageAt = draftMsg?.timestamp ? String(draftMsg.timestamp) : null;
  } else {
    draftMessageAt = draftMsg?.timestamp ? String(draftMsg.timestamp) : null;
  }

  const deepLink = String(payload?.deep_link || "/app/zur-freigabe").trim();

  return {
    ...payload,
    lead_id: leadId || payload?.lead_id || null,
    lead_name: leadName || payload?.lead_name || null,
    inbound_preview: inboundPreview || payload?.inbound_preview || null,
    draft_preview: draftPreview || payload?.draft_preview || null,
    draft_message_id: draftMessageId,
    deep_link: deepLink,
    last_lead_message_at: lastLeadMessageAt,
    draft_message_at: draftMessageAt || (draftMsg?.timestamp ? String(draftMsg.timestamp) : null),
  };
}

async function enrichEscalationPayload(args: {
  supabase: any;
  agentId: string;
  event: any;
}): Promise<any> {
  const { supabase, agentId, event } = args;

  const payload =
    event?.payload && typeof event.payload === "object" ? event.payload : {};

  const leadId = String(payload?.lead_id || event?.entity_id || "").trim();

  let leadName = String(payload?.lead_name || "").trim();
  if (leadId && !leadName) {
    const { data: lead } = await (supabase.from("leads") as any)
      .select("id, name")
      .eq("id", leadId)
      .eq("agent_id", agentId)
      .maybeSingle();
    leadName = String(lead?.name || "").trim();
  }

  let inboundPreview = String(payload?.inbound_preview || "").trim();
  let lastLeadMessageAt: string | null = null;
  if (leadId && !inboundPreview) {
    const { data: lastUser } = await (supabase.from("messages") as any)
      .select("text, snippet, timestamp")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    inboundPreview = String(lastUser?.text || lastUser?.snippet || "").trim();
    lastLeadMessageAt = lastUser?.timestamp ? String(lastUser.timestamp) : null;
  } else if (leadId) {
    const { data: lastUser } = await (supabase.from("messages") as any)
      .select("text, snippet, timestamp")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastLeadMessageAt = lastUser?.timestamp ? String(lastUser.timestamp) : null;
  }

  const deepLink = String(payload?.deep_link || "/app/eskalationen").trim();
  const escalationReason =
    typeof payload?.escalation_reason === "string"
      ? payload.escalation_reason
      : typeof payload?.reason === "string"
      ? payload.reason
      : "";

  return {
    ...payload,
    lead_id: leadId || payload?.lead_id || null,
    lead_name: leadName || payload?.lead_name || null,
    inbound_preview: inboundPreview || payload?.inbound_preview || null,
    deep_link: deepLink,
    last_lead_message_at: lastLeadMessageAt,
    escalation_reason: escalationReason,
  };
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  // Optional: protect internal call
  const secret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");
  const headerSecret = req.headers.get("x-advaic-internal-secret") || "";
  if (headerSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await safeJson<{ event_id?: string | null }>(req);
  const onlyEventId = body?.event_id ? String(body.event_id).trim() : "";

  const limit = 25;
  const MAX_ATTEMPTS = 5;

  // Backoff settings
  const BASE_BACKOFF_SECONDS = 30; // 30s, then 60s, 120s, ...
  const MAX_BACKOFF_SECONDS = 60 * 60; // cap at 1h
  const RATE_LIMIT_BACKOFF_SECONDS = 10 * 60; // 10 min on 429/ratelimited

  const nowIso = new Date().toISOString();

  // Load pending deliveries + event + agent_id
  // NOTE: We also support optional next_attempt_at (exponential backoff). If it's in the future, we skip.
  let q = (supabase.from("notification_deliveries") as any)
    .select(
      "id, event_id, channel, status, attempts, last_error, created_at, next_attempt_at, notification_events ( id, agent_id, type, payload, created_at, entity_type, entity_id )",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (onlyEventId) {
    q = q.eq("event_id", onlyEventId);
  }

  const { data: deliveries, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: "failed_to_load_deliveries", details: error.message },
      { status: 500 },
    );
  }

  if (!deliveries?.length) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  const results: any[] = [];

  for (const d of deliveries as any[]) {
    const deliveryId = String(d.id);

    // Skip if this delivery is not due yet
    const nextAttemptAt = d?.next_attempt_at
      ? new Date(String(d.next_attempt_at))
      : null;
    if (nextAttemptAt && Number.isFinite(nextAttemptAt.getTime())) {
      if (nextAttemptAt.getTime() > Date.now()) {
        results.push({
          deliveryId,
          status: "not_due_yet",
          next_attempt_at: String(d.next_attempt_at),
        });
        continue;
      }
    }

    // Atomically claim this delivery so parallel dispatch calls can't double-send.
    const { data: claimed, error: claimErr } = await (
      supabase.from("notification_deliveries") as any
    )
      .update({ status: "sending", next_attempt_at: null })
      .eq("id", deliveryId)
      .eq("status", "pending")
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
      .select("id, attempts")
      .maybeSingle();

    if (claimErr) {
      results.push({
        deliveryId,
        status: "claim_failed",
        error: claimErr.message,
      });
      continue;
    }

    // If another worker already claimed/sent it, skip.
    if (!claimed?.id) {
      results.push({
        deliveryId,
        status: "already_claimed",
      });
      continue;
    }

    const channel = String(d.channel);
    const event = d.notification_events;
    const eventId = String(d.event_id);
    const agentId = String(event?.agent_id || "");

    const fail = async (msg: string) => {
      const nextAttempts = Number(d.attempts ?? 0) + 1;
      const shouldRetry = nextAttempts < MAX_ATTEMPTS;

      // Exponential backoff: 30s, 60s, 120s, ... capped.
      let backoffSeconds = Math.min(
        MAX_BACKOFF_SECONDS,
        BASE_BACKOFF_SECONDS * Math.pow(2, Math.max(0, nextAttempts - 1)),
      );

      // Rate limit/backpressure handling
      const lower = String(msg || "").toLowerCase();
      if (
        lower.includes("http_429") ||
        lower.includes("ratelimited") ||
        lower.includes("rate_limited") ||
        lower.includes("too many requests")
      ) {
        backoffSeconds = Math.max(backoffSeconds, RATE_LIMIT_BACKOFF_SECONDS);
      }

      const nextAttemptAtIso = shouldRetry
        ? new Date(Date.now() + backoffSeconds * 1000).toISOString()
        : null;

      await (supabase.from("notification_deliveries") as any)
        .update({
          status: shouldRetry ? "pending" : "failed",
          attempts: nextAttempts,
          last_error: msg.slice(0, 500),
          next_attempt_at: nextAttemptAtIso,
        })
        .eq("id", deliveryId);

      results.push({
        deliveryId,
        eventId,
        channel,
        status: shouldRetry ? "retry_scheduled" : "failed",
        attempts: nextAttempts,
        next_attempt_at: nextAttemptAtIso,
        error: msg,
      });
    };

    const ok = async () => {
      await (supabase.from("notification_deliveries") as any)
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: Number(d.attempts ?? 0) + 1,
          last_error: null,
          next_attempt_at: null,
        })
        .eq("id", deliveryId);

      results.push({ deliveryId, eventId, channel, status: "sent" });
    };

    try {
      if (!agentId) {
        await fail("missing_agent_id");
        continue;
      }

      const alreadyAttempts = Number(d.attempts ?? 0);
      if (alreadyAttempts >= MAX_ATTEMPTS) {
        // Mark as failed permanently.
        await (supabase.from("notification_deliveries") as any)
          .update({
            status: "failed",
            last_error: "max_attempts_reached",
          })
          .eq("id", deliveryId);

        results.push({
          deliveryId,
          eventId,
          channel,
          status: "failed",
          attempts: alreadyAttempts,
          error: "max_attempts_reached",
        });
        continue;
      }

      // Get notification settings
      const { data: settings } = await (
        supabase.from("agent_notification_settings") as any
      )
        .select("agent_id, contact_email, slack_connected")
        .eq("agent_id", agentId)
        .maybeSingle();

      const type = String(event?.type || "unknown");

      // Best-effort payload enrichment so notifications are always detailed.
      let payload = (event?.payload || {}) as any;
      if (type === "approval_required_created") {
        payload = await enrichApprovalPayload({ supabase, agentId, event });
      } else if (type === "escalation_created" || type === "lead_escalated") {
        payload = await enrichEscalationPayload({ supabase, agentId, event });
      }

      // Persist enriched payload (best-effort; never break dispatch)
      try {
        if (event?.id) {
          await (supabase.from("notification_events") as any)
            .update({ payload })
            .eq("id", String(event.id));
        }
      } catch {
        // swallow
      }

      const title = buildTitleForEvent(type);

      // payload-aware details
      const leadName = String(payload?.lead_name || "").trim();
      const inboundPreview = previewText(payload?.inbound_preview, 900);
      const draftPreview = previewText(payload?.draft_preview, 900);
      const inboundAt = String(payload?.last_lead_message_at || "");
      const draftAt = String(payload?.draft_message_at || "");
      const escalationReason = String(payload?.escalation_reason || payload?.reason || "").trim();

      const bodyBase = buildBodyForEvent(type);
      const bodyParts: string[] = [];
      if (leadName) bodyParts.push(`Interessent: ${leadName}`);
      bodyParts.push(`Zeit: ${formatTs(inboundAt || draftAt || event?.created_at)}`);
      if (inboundPreview)
        bodyParts.push(`Letzte Nachricht (Interessent): ${inboundPreview}`);
      if (type === "approval_required_created" && draftPreview)
        bodyParts.push(`Vorschlag von Advaic: ${draftPreview}`);
      if (
        (type === "escalation_created" || type === "lead_escalated") &&
        escalationReason
      )
        bodyParts.push(`Grund: ${escalationReason}`);

      const deepLink = String(payload?.deep_link || "/app");
      const url = `${siteUrl()}${deepLink}`;

      const text = `${title}\n${bodyParts.join("\n")}\n\nÖffnen: ${url}`;

      if (channel === "dashboard") {
        // Nothing to send externally - mark sent.
        await ok();
        continue;
      }

      if (channel === "slack") {
        if (!settings?.slack_connected) {
          await fail("slack_not_connected");
          continue;
        }

        const { data: slack } = await (
          supabase.from("slack_connections") as any
        )
          .select("access_token, authed_user_id")
          .eq("agent_id", agentId)
          .maybeSingle();

        if (!slack?.access_token || !slack?.authed_user_id) {
          await fail("missing_slack_credentials");
          continue;
        }

        let blocks: any[] | undefined = undefined;
        if (type === "approval_required_created") {
          blocks = buildSlackBlocksForApproval({
            title,
            leadName,
            inboundText: inboundPreview,
            draftText: draftPreview,
            url,
            actionPayload: {
              event_id: String(eventId),
              agent_id: String(agentId),
              lead_id: String(payload?.lead_id || ""),
              draft_message_id: String(payload?.draft_message_id || ""),
            },
            lastLeadAt: inboundAt,
            draftAt,
          });
        } else if (type === "escalation_created" || type === "lead_escalated") {
          blocks = buildSlackBlocksForEscalation({
            title,
            leadName,
            inboundText: inboundPreview,
            inboundAt,
            reason: escalationReason,
            url,
          });
        }

        await sendSlackMessage({
          accessToken: String(slack.access_token),
          authedUserId: String(slack.authed_user_id),
          text,
          blocks,
        });

        await ok();
        continue;
      }

      if (channel === "email") {
        const to = String(settings?.contact_email || "").trim();
        if (!to) {
          await fail("missing_contact_email");
          continue;
        }

        // Compose HTML email with Zeit, boxed messages, Grund
        const htmlParts: string[] = [];
        htmlParts.push(
          `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color: #111827;">`
        );
        htmlParts.push(
          `<h2 style="margin:0 0 8px 0; font-size: 18px;">${escapeHtml(title)}</h2>`
        );
        htmlParts.push(
          `<p style="margin:0 0 12px 0; font-size: 14px;">${escapeHtml(bodyBase)}</p>`
        );
        if (leadName)
          htmlParts.push(
            `<p style="margin:0 0 12px 0; font-size: 14px;"><strong>Interessent:</strong> ${escapeHtml(leadName)}</p>`
          );
        htmlParts.push(
          `<p style="margin:0 0 12px 0; font-size: 14px;"><strong>Zeit:</strong> ${escapeHtml(formatTs(inboundAt || draftAt || event?.created_at))}</p>`
        );
        if (inboundPreview) {
          htmlParts.push(`
            <div style="margin:0 0 12px 0; padding:12px; border:1px solid #E5E7EB; border-radius:12px; background:#F9FAFB;">
              <div style="font-size:12px; color:#6B7280; margin:0 0 6px 0;">Letzte Nachricht (Interessent)${inboundAt ? " – " + escapeHtml(formatTs(inboundAt)) : ""}</div>
              <div style="white-space:pre-wrap; font-size:14px;">${escapeHtml(inboundPreview)}</div>
            </div>
          `);
        }
        if (type === "approval_required_created" && draftPreview) {
          htmlParts.push(`
            <div style="margin:0 0 16px 0; padding:12px; border:1px solid #FBBF24; border-radius:12px; background:#FFF7ED;">
              <div style="font-size:12px; color:#92400E; margin:0 0 6px 0;">Vorschlag von Advaic (Entwurf)${draftAt ? " – " + escapeHtml(formatTs(draftAt)) : ""}</div>
              <div style="white-space:pre-wrap; font-size:14px;">${escapeHtml(draftPreview)}</div>
            </div>
          `);
        }
        if ((type === "escalation_created" || type === "lead_escalated") && escalationReason) {
          htmlParts.push(`
            <div style="margin:0 0 16px 0; padding:10px 14px; border:1px solid #F87171; border-radius:8px; background:#FEF2F2;">
              <div style="font-size:13px; color:#B91C1C;"><strong>Grund der Eskalation:</strong> ${escapeHtml(escalationReason)}</div>
            </div>
          `);
        }
        htmlParts.push(`
          <a href="${escapeHtml(url)}" style="display:inline-block; padding:10px 14px; background:#111827; color:#FDE68A; text-decoration:none; border-radius:10px; font-weight:600; font-size:14px;">
            Im Dashboard öffnen
          </a>
          <p style="margin:16px 0 0 0; font-size:12px; color:#6B7280;">Falls der Button nicht funktioniert: ${escapeHtml(url)}</p>
        `);
        htmlParts.push(`</div>`);

        await sendEmailResend({
          to,
          subject: `[Advaic] ${title}`,
          bodyText: `${bodyParts.join("\n")}\n\nLink: ${url}\n`,
          html: htmlParts.join(""),
        });

        await ok();
        continue;
      }

      await fail(`unknown_channel:${channel}`);
    } catch (e: any) {
      await fail(e?.message || "send_failed");
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
