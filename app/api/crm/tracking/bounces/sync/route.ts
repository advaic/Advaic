import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { runContactRepair } from "@/lib/crm/contactResolutionEngine";

export const runtime = "nodejs";

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 1600) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function parseIsoOrNull(value: unknown) {
  const s = String(value || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const BOUNCE_PATTERNS = [
  /delivery status notification/i,
  /mailer-daemon/i,
  /undeliverable/i,
  /recipient address rejected/i,
  /\buser unknown\b/i,
  /\bmailbox unavailable\b/i,
  /\b5[0-9]{2}\b/,
  /zustellung fehlgeschlagen/i,
  /nicht zugestellt/i,
  /unzustellbar/i,
];

function isBounceLike(input: string) {
  if (!input.trim()) return false;
  let hits = 0;
  for (const p of BOUNCE_PATTERNS) {
    if (p.test(input)) hits += 1;
  }
  return hits >= 1;
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const limit = Math.max(20, Math.min(500, Number(body?.limit || 220)));
  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

  const { data: sentMessages, error: sentErr } = await (supabase.from(
    "crm_outreach_messages",
  ) as any)
    .select("id, prospect_id, sent_at, metadata, status")
    .eq("agent_id", agentId)
    .eq("status", "sent")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (sentErr) {
    return NextResponse.json(
      { ok: false, error: "crm_sent_messages_fetch_failed", details: sentErr.message },
      { status: 500 },
    );
  }

  const messages = Array.isArray(sentMessages) ? (sentMessages as any[]) : [];
  if (messages.length === 0) {
    return NextResponse.json({
      ok: true,
      scanned: 0,
      bounce_detected: 0,
      skipped: 0,
    });
  }

  const messageIds = messages.map((m) => String(m.id || "")).filter(Boolean);
  const { data: existingFailures, error: failErr } = await (supabase.from(
    "crm_outreach_events",
  ) as any)
    .select("message_id, metadata, details")
    .eq("agent_id", agentId)
    .eq("event_type", "message_failed")
    .in("message_id", messageIds);

  if (failErr) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_existing_failure_fetch_failed",
        details: failErr.message,
      },
      { status: 500 },
    );
  }

  const alreadyBounced = new Set<string>();
  for (const row of (existingFailures || []) as any[]) {
    const messageId = String(row?.message_id || "").trim();
    if (!messageId) continue;
    const meta =
      row?.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, any>)
        : {};
    const bounceFlag = Boolean(meta?.bounce_detected);
    const details = normalizeLine(row?.details || "", 300).toLowerCase();
    if (bounceFlag || details.includes("bounce") || details.includes("zustellung")) {
      alreadyBounced.add(messageId);
    }
  }

  let bounceDetected = 0;
  let skipped = 0;

  for (const msg of messages) {
    const crmMessageId = String(msg?.id || "").trim();
    const prospectId = String(msg?.prospect_id || "").trim();
    const sentAt = parseIsoOrNull(msg?.sent_at);
    if (!crmMessageId || !prospectId || !sentAt) {
      skipped += 1;
      continue;
    }
    if (alreadyBounced.has(crmMessageId)) {
      skipped += 1;
      continue;
    }

    const meta =
      msg?.metadata && typeof msg.metadata === "object"
        ? (msg.metadata as Record<string, any>)
        : {};
    const provider = normalizeLine(meta?.provider || "", 40).toLowerCase();
    const threadId = normalizeLine(meta?.provider_thread_id || "", 220);
    if (provider !== "gmail" || !threadId) {
      skipped += 1;
      continue;
    }

    const inboundRes = await (supabase.from("messages") as any)
      .select("id, timestamp, text, snippet, gmail_thread_id, sender")
      .eq("agent_id", agentId)
      .eq("sender", "user")
      .eq("gmail_thread_id", threadId)
      .gt("timestamp", sentAt)
      .order("timestamp", { ascending: true })
      .limit(5);

    if (inboundRes.error) {
      skipped += 1;
      continue;
    }

    const inboundRows = Array.isArray(inboundRes.data) ? inboundRes.data : [];
    const bounceMsg = inboundRows.find((row: any) =>
      isBounceLike(
        `${normalizeText(row?.text || "", 800)}\n${normalizeText(row?.snippet || "", 400)}`,
      ),
    ) as any;

    if (!bounceMsg) {
      skipped += 1;
      continue;
    }

    const inboundText = normalizeText(
      `${bounceMsg?.text || ""}\n${bounceMsg?.snippet || ""}`,
      700,
    );
    const detectedAt = parseIsoOrNull(bounceMsg?.timestamp) || new Date().toISOString();

    await (supabase.from("crm_outreach_messages") as any)
      .update({
        status: "failed",
        metadata: {
          ...meta,
          last_send_error: "bounce_detected",
          last_send_error_details: inboundText.slice(0, 400),
          bounce_detected: true,
          bounce_detected_at: detectedAt,
          bounce_inbound_message_id: String(bounceMsg?.id || ""),
        },
      })
      .eq("id", crmMessageId)
      .eq("agent_id", agentId);

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: prospectId,
      p_agent_id: agentId,
      p_event_type: "message_failed",
      p_message_id: crmMessageId,
      p_details: "Bounce/NDR erkannt: Zustellung fehlgeschlagen",
      p_metadata: {
        source: "crm_bounce_sync",
        provider: "gmail",
        bounce_detected: true,
        inbound_message_id: String(bounceMsg?.id || ""),
      },
    }) as any);

    await (supabase.from("crm_prospects") as any)
      .update({
        do_not_contact: true,
        next_action:
          "E-Mail unzustellbar: Kontaktdaten prüfen oder alternativen Kanal nutzen",
        next_action_at: new Date().toISOString(),
      })
      .eq("id", prospectId)
      .eq("agent_id", agentId);

    try {
      await runContactRepair(supabase, {
        agentId,
        prospectId,
        triggerType: "bounce",
        messageId: crmMessageId,
      });
    } catch {
      // Fail-open: bounce detection should still complete even if repair logging fails.
    }

    bounceDetected += 1;
    alreadyBounced.add(crmMessageId);
  }

  return NextResponse.json({
    ok: true,
    scanned: messages.length,
    bounce_detected: bounceDetected,
    skipped,
  });
}
