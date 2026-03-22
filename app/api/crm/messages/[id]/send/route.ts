import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  decryptSecretFromStorage,
  encryptSecretForStorage,
} from "@/lib/security/secrets";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
} from "@/lib/crm/acqIntelligence";
import {
  collectTriggerEvidence,
  evaluateFirstTouchGuardrails,
} from "@/lib/crm/cadenceRules";
import {
  assessResearchReadiness,
} from "@/lib/crm/outboundQuality";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
  persistQualityReview,
} from "@/lib/crm/qualityReviewEngine";
import { updateContactCandidateStatus } from "@/lib/crm/contactResolutionEngine";
import { loadCurrentLearningSnapshot } from "@/lib/crm/learningLoop";
import { evaluateSendTiming } from "@/lib/crm/timingPolicy";

export const runtime = "nodejs";

type SendProvider = "gmail" | "outlook";
type ProviderSendSuccess = {
  ok: true;
  provider: SendProvider;
  fromEmail: string;
  providerMessageId: string | null;
  providerThreadId: string | null;
};
type ProviderSendError = {
  ok: false;
  error: string;
  details?: string;
};

function isSendError(
  result: ProviderSendSuccess | ProviderSendError,
): result is ProviderSendError {
  return result.ok === false;
}

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json(
    { ok: false, error, ...(details ? { details } : {}) },
    { status },
  );
}

function normalizeLine(value: unknown, max = 300) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 6000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function base64UrlEncode(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildGmailRaw(args: {
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
}) {
  const lines = [
    ...(args.fromEmail ? [`From: ${args.fromEmail}`] : []),
    `To: ${args.toEmail}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    args.body,
  ];
  return base64UrlEncode(lines.join("\r\n"));
}

function parseIsoOrNull(v: any): string | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isTokenExpired(expiresAtIso: string | null) {
  if (!expiresAtIso) return true;
  const t = new Date(expiresAtIso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() > t - 2 * 60 * 1000;
}

async function refreshOutlookAccessToken(args: { refreshToken: string }) {
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const form = new URLSearchParams();
  form.set("client_id", mustEnv("OUTLOOK_CLIENT_ID"));
  form.set("client_secret", mustEnv("OUTLOOK_CLIENT_SECRET"));
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", args.refreshToken);
  form.set("scope", "https://graph.microsoft.com/.default");

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const txt = await resp?.text().catch(() => "");
    return {
      ok: false as const,
      error: "outlook_token_refresh_failed",
      details: txt.slice(0, 400),
    };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const accessToken =
    typeof data?.access_token === "string" ? data.access_token : "";
  const refreshToken =
    typeof data?.refresh_token === "string" ? data.refresh_token : undefined;
  const expiresIn = Number(data?.expires_in ?? 0);
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return {
      ok: false as const,
      error: "outlook_token_refresh_invalid_response",
      details: "No access token in refresh response.",
    };
  }

  const expiresAtIso = new Date(Date.now() + expiresIn * 1000).toISOString();
  return {
    ok: true as const,
    accessToken,
    refreshToken,
    expiresAtIso,
  };
}

async function resolveProvider(args: {
  supabase: any;
  agentId: string;
  requested: string;
}) {
  const rowsRes = await (args.supabase.from("email_connections") as any)
    .select("provider, status")
    .eq("agent_id", args.agentId)
    .in("provider", ["gmail", "outlook"])
    .in("status", ["connected", "active"]);
  if (rowsRes.error) {
    return {
      ok: false as const,
      error: "email_connection_lookup_failed",
      details: rowsRes.error.message,
    };
  }

  const available = new Set(
    ((rowsRes.data || []) as any[])
      .map((r) => String(r?.provider || "").trim().toLowerCase())
      .filter((v) => v === "gmail" || v === "outlook"),
  );

  if (args.requested === "gmail" || args.requested === "outlook") {
    if (!available.has(args.requested)) {
      return {
        ok: false as const,
        error: "requested_provider_not_connected",
        details: `${args.requested} ist nicht verbunden.`,
      };
    }
    return { ok: true as const, provider: args.requested as SendProvider };
  }

  const preferredRaw = String(process.env.CRM_DEFAULT_EMAIL_PROVIDER || "")
    .trim()
    .toLowerCase();
  const preferred: SendProvider = preferredRaw === "outlook" ? "outlook" : "gmail";
  if (available.has(preferred)) {
    return { ok: true as const, provider: preferred };
  }
  if (available.has("gmail")) return { ok: true as const, provider: "gmail" as const };
  if (available.has("outlook"))
    return { ok: true as const, provider: "outlook" as const };

  return {
    ok: false as const,
    error: "no_email_provider_connected",
    details: "Weder Gmail noch Outlook ist verbunden.",
  };
}

async function sendViaGmail(args: {
  supabase: any;
  agentId: string;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<ProviderSendSuccess | ProviderSendError> {
  const { data: conn, error: connErr } = await (args.supabase.from("email_connections") as any)
    .select("id, refresh_token, email_address, status")
    .eq("agent_id", args.agentId)
    .eq("provider", "gmail")
    .in("status", ["connected", "active"])
    .maybeSingle();

  if (connErr || !conn) {
    return {
      ok: false as const,
      error: "gmail_not_connected",
      details: connErr?.message || "Gmail-Verbindung nicht gefunden.",
    };
  }

  const refreshToken = decryptSecretFromStorage(conn.refresh_token || "");
  if (!refreshToken) {
    return {
      ok: false as const,
      error: "gmail_refresh_token_missing",
      details: "Gmail muss neu verbunden werden.",
    };
  }

  const oauth2 = new google.auth.OAuth2(
    mustEnv("GOOGLE_CLIENT_ID"),
    mustEnv("GOOGLE_CLIENT_SECRET"),
    new URL("/api/auth/gmail/callback", mustEnv("NEXT_PUBLIC_SITE_URL")).toString(),
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const fromEmail = normalizeLine(conn.email_address || "", 200);
  const raw = buildGmailRaw({
    fromEmail,
    toEmail: args.toEmail,
    subject: args.subject,
    body: args.body,
  });

  try {
    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
    return {
      ok: true as const,
      provider: "gmail" as const,
      fromEmail,
      providerMessageId: String(sendRes.data.id || "").trim() || null,
      providerThreadId: String(sendRes.data.threadId || "").trim() || null,
    };
  } catch (e: any) {
    return {
      ok: false as const,
      error: "gmail_send_failed",
      details: String(e?.message || "Gmail send failed"),
    };
  }
}

async function sendViaOutlook(args: {
  supabase: any;
  agentId: string;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<ProviderSendSuccess | ProviderSendError> {
  const { data: conn, error: connErr } = await (args.supabase.from("email_connections") as any)
    .select(
      "id, refresh_token, access_token, expires_at, status, email_address, outlook_mailbox_id",
    )
    .eq("agent_id", args.agentId)
    .eq("provider", "outlook")
    .in("status", ["connected", "active"])
    .maybeSingle();

  if (connErr || !conn) {
    return {
      ok: false as const,
      error: "outlook_not_connected",
      details: connErr?.message || "Outlook-Verbindung nicht gefunden.",
    };
  }

  const refreshToken = decryptSecretFromStorage(conn.refresh_token || "");
  if (!refreshToken) {
    return {
      ok: false as const,
      error: "outlook_refresh_token_missing",
      details: "Outlook muss neu verbunden werden.",
    };
  }

  let accessToken = decryptSecretFromStorage(conn.access_token || "");
  const expiresAtIso = parseIsoOrNull(conn.expires_at);
  if (!accessToken || isTokenExpired(expiresAtIso)) {
    const refreshed = await refreshOutlookAccessToken({ refreshToken });
    if (!refreshed.ok) {
      return {
        ok: false,
        error: refreshed.error,
        details: refreshed.details,
      };
    }

    accessToken = refreshed.accessToken;
    await (args.supabase.from("email_connections") as any)
      .update({
        access_token: encryptSecretForStorage(refreshed.accessToken),
        expires_at: refreshed.expiresAtIso,
        ...(refreshed.refreshToken
          ? { refresh_token: encryptSecretForStorage(refreshed.refreshToken) }
          : {}),
        last_error: null,
        status: "active",
      })
      .eq("id", conn.id);
  }

  const fromEmail = normalizeLine(conn.email_address || "", 200);

  const resp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: args.subject,
        body: {
          contentType: "Text",
          content: args.body,
        },
        toRecipients: [{ emailAddress: { address: args.toEmail } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return {
      ok: false as const,
      error: "outlook_send_failed",
      details: txt.slice(0, 400),
    };
  }

  return {
    ok: true as const,
    provider: "outlook" as const,
    fromEmail,
    providerMessageId:
      normalizeLine(resp.headers.get("request-id") || "", 200) || null,
    providerThreadId: null,
  };
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const messageId = String(id || "").trim();
  if (!messageId) {
    return jsonError(400, "missing_message_id");
  }

  const body = await req.json().catch(() => null);
  const requestedProvider = String(body?.provider || "auto").trim().toLowerCase();
  const explicitTo = normalizeLine(body?.to_email || "", 320).toLowerCase();

  const supabase = createSupabaseAdminClient();

  const { data: message, error: messageErr } = await (supabase.from("crm_outreach_messages") as any)
    .select(
      "id, prospect_id, agent_id, channel, message_kind, subject, body, status, sent_at, external_message_id, metadata",
    )
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (messageErr) {
    return jsonError(500, "crm_message_lookup_failed", messageErr.message);
  }
  if (!message) {
    return jsonError(404, "message_not_found");
  }
  if (String(message.status || "").toLowerCase() === "sent") {
    return NextResponse.json({
      ok: true,
      status: "already_sent",
      message: {
        id: message.id,
        status: message.status,
        sent_at: message.sent_at,
      },
    });
  }

  const { data: prospect, error: prospectErr } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, contact_email, city, region, preferred_channel, object_focus, share_miete_percent, share_kauf_percent, active_listings_count, new_listings_30d, automation_readiness, target_group, process_hint, personalization_hook, personalization_evidence, source_checked_at",
    )
    .eq("id", String(message.prospect_id))
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (prospectErr) {
    return jsonError(500, "crm_prospect_lookup_failed", prospectErr.message);
  }
  if (!prospect) {
    return jsonError(404, "prospect_not_found");
  }

  const oldMeta =
    message.metadata && typeof message.metadata === "object"
      ? (message.metadata as Record<string, any>)
      : {};
  const inferred = inferSegmentAndPlaybook(prospect || null);
  const learningSnapshot = await loadCurrentLearningSnapshot(supabase, String(auth.user.id)).catch(() => null);
  const templateVariant =
    String(
      (oldMeta as any)?.template_variant ||
        (oldMeta as any)?.recommended_code ||
        message.message_kind ||
        "",
    ).trim() || null;
  if (normalizeLine(message.channel || "", 24).toLowerCase() !== "email") {
    return jsonError(
      400,
      "crm_non_email_send_unsupported",
      "Dieser Draft ist kein E-Mail-Touch. Bitte außerhalb des E-Mail-Senders umsetzen oder manuell als gesendet markieren.",
    );
  }
  const strategyContactChannel = normalizeLine((oldMeta as any)?.strategy_contact_channel || "", 24).toLowerCase();
  const strategyContactValue = normalizeLine((oldMeta as any)?.strategy_contact_value || "", 320);
  const toEmail =
    explicitTo ||
    (strategyContactChannel === "email" ? strategyContactValue.toLowerCase() : "") ||
    normalizeLine(prospect.contact_email || "", 320).toLowerCase();
  if (!toEmail || !isValidEmail(toEmail)) {
    return jsonError(
      400,
      "missing_or_invalid_contact_email",
      "Bitte beim Prospect eine gültige Kontakt-E-Mail pflegen.",
    );
  }

  const subject =
    normalizeLine(
      message.subject ||
        `Kurzer Austausch zu Ihrem Prozess bei ${String(prospect.company_name || "").trim()}`,
      180,
    ) || "Kurzer Austausch";
  const messageBody = normalizeText(message.body, 6000);
  if (!messageBody) {
    return jsonError(400, "empty_message_body");
  }
  if (String(message.message_kind || "").toLowerCase() === "first_touch") {
    const meta = oldMeta && typeof oldMeta === "object" ? oldMeta : {};
    const triggerEvidence = collectTriggerEvidence({
      companyName: normalizeLine(prospect.company_name, 160),
      city: normalizeLine((prospect as any).city, 120) || null,
      region: normalizeLine((prospect as any).region, 120) || null,
      objectFocus: normalizeLine(prospect.object_focus, 24) || null,
      activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
        ? Number(prospect.active_listings_count)
        : null,
      newListings30d: Number.isFinite(Number((prospect as any).new_listings_30d))
        ? Number((prospect as any).new_listings_30d)
        : null,
      shareMietePercent: Number.isFinite(Number(prospect.share_miete_percent))
        ? Number(prospect.share_miete_percent)
        : null,
      shareKaufPercent: Number.isFinite(Number(prospect.share_kauf_percent))
        ? Number(prospect.share_kauf_percent)
        : null,
      targetGroup: normalizeText((prospect as any).target_group, 220) || null,
      processHint: normalizeText((prospect as any).process_hint, 220) || null,
      personalizationHook: normalizeText((prospect as any).personalization_hook, 220) || null,
      personalizationEvidence: normalizeText((prospect as any).personalization_evidence, 260) || null,
      sourceCheckedAt: normalizeLine((prospect as any).source_checked_at, 40) || null,
    });
    const researchReadiness = assessResearchReadiness({
      preferredChannel: normalizeLine((prospect as any).preferred_channel, 40) || "email",
      contactEmail: toEmail,
      personalizationHook: normalizeText((prospect as any).personalization_hook, 220) || null,
      personalizationEvidence: normalizeText((prospect as any).personalization_evidence, 260) || null,
      sourceCheckedAt: normalizeLine((prospect as any).source_checked_at, 40) || null,
      targetGroup: normalizeText((prospect as any).target_group, 220) || null,
      processHint: normalizeText((prospect as any).process_hint, 220) || null,
      activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
        ? Number(prospect.active_listings_count)
        : null,
      automationReadiness: normalizeLine((prospect as any).automation_readiness, 24) || null,
    });
    const groundedContext = await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId: String(message.prospect_id),
      messageId,
      channel: String(message.channel || ""),
      messageKind: String(message.message_kind || ""),
      segmentKey: String((meta as any)?.segment_key || "").trim() || inferred.segment_key,
      playbookKey: String((meta as any)?.playbook_key || "").trim() || inferred.playbook_key,
    });
    const outboundReview = evaluateGroundedOutboundMessageQuality({
      body: messageBody,
      subject,
      channel: String(message.channel || ""),
      messageKind: String(message.message_kind || ""),
      companyName: normalizeLine(prospect.company_name, 160) || null,
      city: normalizeLine((prospect as any).city, 120) || null,
      personalizationHook: normalizeText((prospect as any).personalization_hook, 220) || null,
      triggerEvidenceCount: Math.max(
        Number((meta as any)?.trigger_evidence_count || 0),
        triggerEvidence.length,
      ),
      researchReadiness,
      prospect: {
        company_name: normalizeLine(prospect.company_name, 160) || null,
        city: normalizeLine((prospect as any).city, 120) || null,
        preferred_channel: normalizeLine((prospect as any).preferred_channel, 40) || "email",
        contact_email: toEmail,
        personalization_hook: normalizeText((prospect as any).personalization_hook, 220) || null,
        personalization_evidence: normalizeText((prospect as any).personalization_evidence, 260) || null,
        source_checked_at: normalizeLine((prospect as any).source_checked_at, 40) || null,
        target_group: normalizeText((prospect as any).target_group, 220) || null,
        process_hint: normalizeText((prospect as any).process_hint, 220) || null,
        response_promise_public: normalizeText((prospect as any).response_promise_public, 180) || null,
        appointment_flow_public: normalizeText((prospect as any).appointment_flow_public, 180) || null,
        docs_flow_public: normalizeText((prospect as any).docs_flow_public, 180) || null,
        active_listings_count: Number.isFinite(Number(prospect.active_listings_count))
          ? Number(prospect.active_listings_count)
          : null,
        automation_readiness: normalizeLine((prospect as any).automation_readiness, 24) || null,
      },
      context: groundedContext,
      supportHints: triggerEvidence,
    });
    const guardrail = evaluateFirstTouchGuardrails({
      body: messageBody,
      triggerEvidenceCount: Math.max(
        Number((meta as any)?.trigger_evidence_count || 0),
        triggerEvidence.length,
      ),
    });
    if (!guardrail.pass) {
      await (supabase.from("crm_outreach_messages") as any)
        .update({
          metadata: {
            ...meta,
            send_guardrail_blocked_at: new Date().toISOString(),
            send_guardrail: guardrail,
            research_readiness: researchReadiness,
            outbound_review: outboundReview,
          },
        })
        .eq("id", messageId)
        .eq("agent_id", auth.user.id);
      return NextResponse.json(
        {
          ok: false,
          error: "first_touch_send_guardrail_failed",
          details:
            "Versand blockiert: Erstkontakt wirkt nicht natürlich genug oder enthält zu viel Roh-/Pitch-Sprache.",
          guardrail,
        },
        { status: 422 },
      );
    }
    if (outboundReview.status === "blocked") {
      await (supabase.from("crm_outreach_messages") as any)
        .update({
          metadata: {
            ...meta,
            send_quality_blocked_at: new Date().toISOString(),
            research_readiness: researchReadiness,
            outbound_review: outboundReview,
          },
        })
        .eq("id", messageId)
        .eq("agent_id", auth.user.id);
      return NextResponse.json(
        {
          ok: false,
          error: "outbound_quality_blocked",
          details: outboundReview.summary,
          review: outboundReview,
          research: researchReadiness,
        },
        { status: 422 },
      );
    }
    try {
      await persistQualityReview(supabase, {
        agentId: String(auth.user.id),
        prospectId: String(message.prospect_id),
        messageId,
        reviewScope: "send_gate",
        channel: String(message.channel || ""),
        messageKind: String(message.message_kind || ""),
        review: outboundReview,
        metadata: {
          mode: "provider_send",
        },
      });
    } catch {
      // Fail-open during send.
    }
  }

  const providerResolved = await resolveProvider({
    supabase,
    agentId: auth.user.id,
    requested: requestedProvider,
  });
  if (!providerResolved.ok) {
    return jsonError(400, providerResolved.error, providerResolved.details);
  }

  const nowIso = new Date().toISOString();
  const timingPolicy = evaluateSendTiming({
    channel: String(message.channel || "email"),
    prospect: {
      ...prospect,
      preferred_channel: String(message.channel || "email"),
    },
    learningSnapshot,
    startAt: nowIso,
    timezone: "Europe/Berlin",
  });
  let sendResult: ProviderSendSuccess | ProviderSendError;

  if (providerResolved.provider === "gmail") {
    sendResult = await sendViaGmail({
      supabase,
      agentId: auth.user.id,
      toEmail,
      subject,
      body: messageBody,
    });
  } else {
    sendResult = await sendViaOutlook({
      supabase,
      agentId: auth.user.id,
      toEmail,
      subject,
      body: messageBody,
    });
  }

  if (isSendError(sendResult)) {
    await (supabase.from("crm_outreach_messages") as any)
      .update({
        status: "failed",
        metadata: {
          ...oldMeta,
          last_send_error: sendResult.error,
          last_send_error_details: sendResult.details || null,
          last_send_attempt_at: nowIso,
          provider: providerResolved.provider,
          to_email: toEmail,
          timing_policy: timingPolicy,
        },
      })
      .eq("id", messageId)
      .eq("agent_id", auth.user.id);

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: String(message.prospect_id),
      p_agent_id: auth.user.id,
      p_event_type: "message_failed",
      p_message_id: messageId,
      p_details: `Versand fehlgeschlagen (${providerResolved.provider})`,
      p_metadata: {
        source: "crm_send",
        provider: providerResolved.provider,
        error: sendResult.error,
        timing_policy: timingPolicy,
        scheduled_for: normalizeLine((oldMeta as any)?.scheduled_for, 80) || null,
      },
    }) as any);

    await (supabase.from("crm_acq_activity_log") as any).insert({
      agent_id: auth.user.id,
      prospect_id: String(message.prospect_id),
      occurred_at: nowIso,
      channel: String(message.channel || "email"),
      action_type: "outbound_sent",
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      template_variant: templateVariant,
      cta_type: null,
      outcome: "negative",
      failure_reason: String(sendResult.error || "").trim() || "send_failed",
      quality_objective_score: computeObjectiveQualityScore({
        action_type: "outbound_sent",
        outcome: "negative",
        response_time_hours: null,
        personalization_depth: null,
        quality_self_score: null,
        has_postmortem: true,
      }),
      analysis_note: `Versand fehlgeschlagen über ${providerResolved.provider}`,
      postmortem_root_cause: "Technischer Versandfehler oder Provider-Antwort negativ.",
      postmortem_fix: "Adresse/Kanal prüfen und Versandpfad erneut ausführen.",
      postmortem_prevention:
        "Vor Versand Deliverability und Provider-Status automatisch prüfen.",
      metadata: {
        source: "crm_send",
        provider: providerResolved.provider,
        error: sendResult.error,
        segment_key: inferred.segment_key,
        playbook_key: inferred.playbook_key,
        scheduled_for: normalizeLine((oldMeta as any)?.scheduled_for, 80) || null,
        message_id: messageId,
        review_status: normalizeLine((oldMeta as any)?.outbound_review?.status, 40) || null,
        review_score:
          Number.isFinite(Number((oldMeta as any)?.outbound_review?.score))
            ? Number((oldMeta as any)?.outbound_review?.score)
            : null,
        unsupported_claim_count:
          Number((oldMeta as any)?.outbound_review?.evidence_alignment?.unsupported_claim_count || 0) || 0,
        weak_claim_count:
          Number((oldMeta as any)?.outbound_review?.evidence_alignment?.weak_claim_count || 0) || 0,
        research_status: normalizeLine((oldMeta as any)?.research_readiness?.status, 40) || null,
        research_score:
          Number.isFinite(Number((oldMeta as any)?.research_readiness?.score))
            ? Number((oldMeta as any)?.research_readiness?.score)
            : null,
        strategy_contact_channel: normalizeLine((oldMeta as any)?.strategy_contact_channel, 40) || null,
        strategy_contact_value: normalizeLine((oldMeta as any)?.strategy_contact_value, 220) || null,
        strategy_contact_confidence:
          Number.isFinite(Number((oldMeta as any)?.strategy_contact_confidence))
            ? Number((oldMeta as any)?.strategy_contact_confidence)
            : null,
        strategy_risk_level: normalizeLine((oldMeta as any)?.strategy_risk_level, 40) || null,
        office_profile: timingPolicy.office_profile,
        timing_override: timingPolicy.timing_override,
        timing_score: timingPolicy.timing_score,
        timing_weekday: timingPolicy.weekday,
        timing_hour_bucket: timingPolicy.hour_bucket,
        timing_reason: timingPolicy.reason,
      },
    });

    return jsonError(500, sendResult.error, sendResult.details);
  }

  const trackingMeta = {
    ...oldMeta,
    provider: sendResult.provider,
    provider_message_id: sendResult.providerMessageId,
    provider_thread_id: sendResult.providerThreadId,
    to_email: toEmail,
    from_email: sendResult.fromEmail || null,
    last_send_attempt_at: nowIso,
    last_send_error: null,
    last_send_error_details: null,
    timing_policy: timingPolicy,
  };

  const { data: updated, error: updateErr } = await (supabase.from("crm_outreach_messages") as any)
    .update({
      status: "sent",
      sent_at: nowIso,
      external_message_id: sendResult.providerMessageId || null,
      metadata: trackingMeta,
    })
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, external_message_id, metadata, created_at, updated_at",
    )
    .single();

  if (updateErr) {
    return jsonError(500, "crm_message_update_failed", updateErr.message);
  }

  if ((oldMeta as any)?.strategy_contact_candidate_id) {
    try {
      await updateContactCandidateStatus(supabase, {
        agentId: auth.user.id,
        prospectId: String(message.prospect_id),
        contactCandidateId: normalizeLine((oldMeta as any)?.strategy_contact_candidate_id, 120) || null,
        validationStatus: "used",
        metadataPatch: {
          last_used_at: nowIso,
          last_used_message_id: messageId,
          last_used_provider: sendResult.provider,
        },
      });
    } catch {
      // Fail-open during send.
    }
  }

  await ((supabase as any).rpc("crm_register_outreach_event", {
    p_prospect_id: String(message.prospect_id),
    p_agent_id: auth.user.id,
    p_event_type: "message_sent",
    p_message_id: messageId,
    p_details: `Versendet über ${sendResult.provider}`,
    p_metadata: {
      source: "crm_send",
      provider: sendResult.provider,
      provider_message_id: sendResult.providerMessageId,
      provider_thread_id: sendResult.providerThreadId,
      timing_policy: timingPolicy,
      scheduled_for: normalizeLine((oldMeta as any)?.scheduled_for, 80) || null,
    },
  }) as any);

  await (supabase.from("crm_acq_activity_log") as any).insert({
    agent_id: auth.user.id,
    prospect_id: String(message.prospect_id),
    occurred_at: nowIso,
    channel: String(message.channel || "email"),
    action_type: "outbound_sent",
    segment_key: inferred.segment_key,
    playbook_key: inferred.playbook_key,
    template_variant: templateVariant,
    cta_type: null,
    outcome: "pending",
    personalization_depth:
      typeof (updated as any)?.personalization_score === "number"
        ? Math.max(0, Math.min(100, Math.round((updated as any).personalization_score)))
        : null,
    quality_self_score: null,
    quality_objective_score: computeObjectiveQualityScore({
      action_type: "outbound_sent",
      outcome: "pending",
      response_time_hours: null,
      personalization_depth:
        typeof (updated as any)?.personalization_score === "number"
          ? Math.max(0, Math.min(100, Math.round((updated as any).personalization_score)))
          : null,
      quality_self_score: null,
      has_postmortem: false,
    }),
    analysis_note: `Versendet über ${sendResult.provider}`,
    metadata: {
      source: "crm_send",
      provider: sendResult.provider,
      provider_message_id: sendResult.providerMessageId,
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      scheduled_for: normalizeLine((oldMeta as any)?.scheduled_for, 80) || null,
      message_id: messageId,
      review_status: normalizeLine((oldMeta as any)?.outbound_review?.status, 40) || null,
      review_score:
        Number.isFinite(Number((oldMeta as any)?.outbound_review?.score))
          ? Number((oldMeta as any)?.outbound_review?.score)
          : null,
      unsupported_claim_count:
        Number((oldMeta as any)?.outbound_review?.evidence_alignment?.unsupported_claim_count || 0) || 0,
      weak_claim_count:
        Number((oldMeta as any)?.outbound_review?.evidence_alignment?.weak_claim_count || 0) || 0,
      research_status: normalizeLine((oldMeta as any)?.research_readiness?.status, 40) || null,
      research_score:
        Number.isFinite(Number((oldMeta as any)?.research_readiness?.score))
          ? Number((oldMeta as any)?.research_readiness?.score)
          : null,
      strategy_contact_channel: normalizeLine((oldMeta as any)?.strategy_contact_channel, 40) || null,
      strategy_contact_value: normalizeLine((oldMeta as any)?.strategy_contact_value, 220) || null,
      strategy_contact_confidence:
        Number.isFinite(Number((oldMeta as any)?.strategy_contact_confidence))
          ? Number((oldMeta as any)?.strategy_contact_confidence)
          : null,
      strategy_risk_level: normalizeLine((oldMeta as any)?.strategy_risk_level, 40) || null,
      office_profile: timingPolicy.office_profile,
      timing_override: timingPolicy.timing_override,
      timing_score: timingPolicy.timing_score,
      timing_weekday: timingPolicy.weekday,
      timing_hour_bucket: timingPolicy.hour_bucket,
      timing_reason: timingPolicy.reason,
    },
  });

  return NextResponse.json({
    ok: true,
    message: updated,
    tracking: {
      provider: sendResult.provider,
      to_email: toEmail,
      from_email: sendResult.fromEmail,
      provider_message_id: sendResult.providerMessageId,
      provider_thread_id: sendResult.providerThreadId,
      sent_at: nowIso,
    },
  });
}
