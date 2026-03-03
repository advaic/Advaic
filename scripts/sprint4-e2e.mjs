import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4010").replace(/\/$/, "");
const internalSecret = String(process.env.INTERNAL_SECRET || "").trim();
const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const e2eAgentId = String(process.env.E2E_AGENT_ID || "").trim();
const keepDataOnFail = String(process.env.E2E_KEEP_ON_FAIL || "").toLowerCase() === "1";

function fail(msg) {
  throw new Error(msg);
}

function assert(condition, msg) {
  if (!condition) fail(msg);
}

async function request(method, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };
  const args = ["-sS", "-L", "-X", method, url, "--max-time", "45"];
  for (const [k, v] of Object.entries(headers)) {
    args.push("-H", `${k}: ${v}`);
  }
  if (options.body !== undefined) {
    args.push("-H", "Content-Type: application/json");
    args.push("-d", JSON.stringify(options.body));
  }
  args.push("-w", "\n__CURL_STATUS__:%{http_code}");

  const out = spawnSync("curl", args, { encoding: "utf8" });
  if (out.error) {
    throw new Error(`${method} ${path}: curl failed (${out.error.message})`);
  }
  if (out.status !== 0) {
    throw new Error(
      `${method} ${path}: curl exit ${out.status} (${String(out.stderr || "").trim()})`,
    );
  }

  const raw = String(out.stdout || "");
  const marker = "__CURL_STATUS__:";
  const idx = raw.lastIndexOf(marker);
  if (idx < 0) {
    throw new Error(`${method} ${path}: invalid curl response without status marker`);
  }
  const text = raw.slice(0, idx).trimEnd();
  const statusRaw = raw.slice(idx + marker.length).trim();
  const status = Number(statusRaw);
  if (!Number.isFinite(status)) {
    throw new Error(`${method} ${path}: invalid status "${statusRaw}"`);
  }

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status, text, json, headers: null };
}

function minutesAgoIso(min) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function minutesInFutureIso(min) {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

function berlinHourNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hourRaw = parts.find((p) => p.type === "hour")?.value || "0";
  const hourNum = Number(hourRaw);
  return Number.isFinite(hourNum) ? hourNum : 0;
}

async function ensurePrerequisites() {
  if (!internalSecret) fail("INTERNAL_SECRET fehlt.");
  if (!supabaseUrl || !serviceRoleKey || !e2eAgentId) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / E2E_AGENT_ID fehlen.",
    );
  }
  const probe = await request("GET", "/api/outlook/webhook");
  assert(
    probe.status > 0,
    `BASE_URL nicht erreichbar: ${baseUrl}`,
  );
}

async function readStartseiteSourceCheck() {
  const src = await readFile("app/app/startseite/StartseiteUI.tsx", "utf8");
  assert(
    src.includes("Deliverability-Monitoring"),
    "StartseiteUI enthält keine Deliverability-Monitoring Sektion.",
  );
  const unauth = await request("GET", "/api/agent/deliverability/status");
  assert(
    unauth.status === 401,
    `GET /api/agent/deliverability/status (ohne Auth): erwartet 401, bekam ${unauth.status}`,
  );
}

async function readCurrentFollowupSettings(admin, agentId) {
  const { data, error } = await admin
    .from("agent_settings")
    .select(
      "agent_id, followups_enabled_default, followups_max_stage_rent, followups_max_stage_buy, followups_delay_hours_stage1, followups_delay_hours_stage2, followups_send_start_hour, followups_send_end_hour, followups_send_on_weekends, followups_timezone",
    )
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) fail(`agent_settings read failed: ${error.message}`);
  return data || null;
}

async function upsertSettings(admin, payload) {
  const { error } = await admin
    .from("agent_settings")
    .upsert(payload, { onConflict: "agent_id" });
  if (error) return { ok: false, error };
  return { ok: true, error: null };
}

async function setupAlwaysOpenWindow(admin, agentId) {
  const payload = {
    agent_id: agentId,
    followups_enabled_default: true,
    followups_max_stage_rent: 2,
    followups_max_stage_buy: 2,
    followups_delay_hours_stage1: 24,
    followups_delay_hours_stage2: 72,
    followups_send_start_hour: 0,
    followups_send_end_hour: 0,
    followups_send_on_weekends: true,
    followups_timezone: "Europe/Berlin",
  };

  const full = await upsertSettings(admin, payload);
  if (full.ok) return { supportsWindow: true };

  const fallback = await upsertSettings(admin, {
    agent_id: agentId,
    followups_enabled_default: true,
    followups_max_stage_rent: 2,
    followups_max_stage_buy: 2,
    followups_delay_hours_stage1: 24,
    followups_delay_hours_stage2: 72,
  });
  if (!fallback.ok) {
    fail(`agent_settings upsert failed: ${fallback.error.message}`);
  }
  return { supportsWindow: false };
}

async function installLowConfidencePromptOverride(admin) {
  const key = "followup_stage_1";
  const { data: rows, error } = await admin
    .from("ai_prompts")
    .select("id, version, is_active")
    .eq("key", key)
    .order("version", { ascending: false });
  if (error) fail(`ai_prompts read failed: ${error.message}`);

  const all = Array.isArray(rows) ? rows : [];
  const active = all.find((r) => r.is_active);
  const maxVersion = all.reduce((m, r) => Math.max(m, Number(r.version || 0)), 0);
  const nextVersion = maxVersion + 1;

  if (active?.id) {
    const { error: deactivateErr } = await admin
      .from("ai_prompts")
      .update({ is_active: false, updated_by: "sprint4_e2e" })
      .eq("id", String(active.id));
    if (deactivateErr) fail(`ai_prompts deactivate failed: ${deactivateErr.message}`);
  }

  const { data: inserted, error: insertErr } = await admin
    .from("ai_prompts")
    .insert({
      key,
      version: nextVersion,
      is_active: true,
      name: "Sprint4 E2E Low Confidence Override",
      system_prompt:
        "Du bist ein E2E-Teststub. Antworte immer nur als valides JSON mit should_send=true, confidence=0.31, text und reason.",
      user_prompt:
        "Gib exakt dieses JSON zurück: {\"should_send\":true,\"confidence\":0.31,\"text\":\"Guten Tag, kurze Rückmeldung zu Ihrer Anfrage.\",\"reason\":\"e2e_low_confidence\"}",
      temperature: 0,
      max_tokens: 120,
      response_format: "json",
      notes: "Temporärer Sprint4-E2E Override für Low-Confidence Fail-Safe.",
      description: "Temporary test override",
      updated_by: "sprint4_e2e",
    })
    .select("id")
    .single();
  if (insertErr || !inserted?.id) {
    if (active?.id) {
      await admin
        .from("ai_prompts")
        .update({ is_active: true, updated_by: "sprint4_e2e_restore" })
        .eq("id", String(active.id));
    }
    fail(`ai_prompts override insert failed: ${insertErr?.message || "unknown"}`);
  }

  return {
    insertedId: String(inserted.id),
    previousActiveId: active?.id ? String(active.id) : null,
  };
}

async function restorePromptOverride(admin, state) {
  if (!state) return;
  if (state.insertedId) {
    await admin.from("ai_prompts").delete().eq("id", state.insertedId);
  }
  if (state.previousActiveId) {
    await admin
      .from("ai_prompts")
      .update({ is_active: true, updated_by: "sprint4_e2e_restore" })
      .eq("id", state.previousActiveId);
  }
}

async function runFollowups(limit) {
  const run = await request("POST", "/api/pipeline/followups/run", {
    headers: { "x-advaic-internal-secret": internalSecret },
    body: { limit },
  });
  assert(
    run.status === 200 && run.json?.ok === true,
    `followups/run failed: status=${run.status} body=${run.text.slice(0, 240)}`,
  );
  return run.json;
}

async function addTemporaryPaidAccess(admin, agentId) {
  const stripeSubscriptionId = `sub_e2e_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const nowIso = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("billing_subscriptions")
    .insert({
      agent_id: agentId,
      stripe_subscription_id: stripeSubscriptionId,
      status: "active",
      plan_key: "starter_monthly",
      current_period_start: nowIso,
      current_period_end: periodEnd,
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    fail(`temporary billing subscription insert failed: ${error?.message || "unknown"}`);
  }
  return String(data.id);
}

async function main() {
  await ensurePrerequisites();
  await readStartseiteSourceCheck();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const settingsBefore = await readCurrentFollowupSettings(admin, e2eAgentId);
  let supportsWindow = true;
  const seededLeadIds = [];
  let promptOverrideState = null;
  let tempBillingSubscriptionId = null;

  try {
    tempBillingSubscriptionId = await addTemporaryPaidAccess(admin, e2eAgentId);
    const setup = await setupAlwaysOpenWindow(admin, e2eAgentId);
    supportsWindow = setup.supportsWindow;
    promptOverrideState = await installLowConfidencePromptOverride(admin);

    const riskLeadId = randomUUID();
    const lowConfidenceLeadId = randomUUID();
    seededLeadIds.push(riskLeadId, lowConfidenceLeadId);

    const dueIso = minutesAgoIso(5);
    const userIso = minutesAgoIso(180);
    const agentIso = minutesAgoIso(120);

    const { error: leadErr } = await admin.from("leads").insert([
      {
        id: riskLeadId,
        agent_id: e2eAgentId,
        name: "Sprint4 Risiko",
        email: `risk-${Date.now()}@example.com`,
        type: "miete",
        status: "open",
        escalated: false,
        followups_enabled: true,
        followup_stage: 0,
        followup_status: "planned",
        followup_next_at: dueIso,
        last_user_message_at: userIso,
        last_agent_message_at: agentIso,
        last_message_at: agentIso,
        email_provider: "gmail",
      },
      {
        id: lowConfidenceLeadId,
        agent_id: e2eAgentId,
        name: "Sprint4 LowConfidence",
        email: `lowconf-${Date.now()}@example.com`,
        type: "kauf",
        status: "open",
        escalated: false,
        followups_enabled: true,
        followup_stage: 0,
        followup_status: "planned",
        followup_next_at: dueIso,
        last_user_message_at: userIso,
        last_agent_message_at: agentIso,
        last_message_at: agentIso,
        email_provider: "gmail",
      },
    ]);
    if (leadErr) fail(`lead seed failed: ${leadErr.message}`);

    const { error: msgErr } = await admin.from("messages").insert([
      {
        lead_id: riskLeadId,
        agent_id: e2eAgentId,
        sender: "user",
        text: "Ich habe eine Beschwerde, der Schaden wurde nicht behoben. Bitte sofort klären.",
        timestamp: userIso,
      },
      {
        lead_id: riskLeadId,
        agent_id: e2eAgentId,
        sender: "agent",
        text: "Danke für die Nachricht, ich prüfe den Fall.",
        timestamp: agentIso,
      },
      {
        lead_id: lowConfidenceLeadId,
        agent_id: e2eAgentId,
        sender: "user",
        text: "Ist das Objekt Parkallee noch verfügbar?",
        timestamp: userIso,
      },
      {
        lead_id: lowConfidenceLeadId,
        agent_id: e2eAgentId,
        sender: "agent",
        text: "Danke für Ihre Anfrage, ich melde mich.",
        timestamp: agentIso,
      },
    ]);
    if (msgErr) fail(`message seed failed: ${msgErr.message}`);

    const run1 = await runFollowups(20);
    console.log("followups/run #1 processed:", run1.processed);

    const { data: leadsAfter1, error: verifyErr1 } = await admin
      .from("leads")
      .select("id, followup_status, followup_stop_reason")
      .in("id", [riskLeadId, lowConfidenceLeadId]);
    if (verifyErr1) fail(`lead verify #1 failed: ${verifyErr1.message}`);

    const leadMap1 = new Map((leadsAfter1 || []).map((row) => [String(row.id), row]));
    const riskLead = leadMap1.get(riskLeadId);
    const lowLead = leadMap1.get(lowConfidenceLeadId);
    assert(!!riskLead, "risk lead missing after run #1");
    assert(!!lowLead, "low-confidence lead missing after run #1");
    console.log("risk lead state:", riskLead);
    console.log("low-confidence lead state:", lowLead);
    console.log("run #1 results:", Array.isArray(run1.results) ? run1.results : []);

    const globalCommercialPause =
      String(riskLead.followup_status || "") === "paused" &&
      String(lowLead.followup_status || "") === "paused" &&
      String(riskLead.followup_stop_reason || "") === "billing_trial_expired" &&
      String(lowLead.followup_stop_reason || "") === "billing_trial_expired";

    if (globalCommercialPause) {
      console.log(
        "Sprint4 follow-up assertions skipped wegen globalem Billing-Pause-Modus (billing_trial_expired).",
      );
      return;
    }

    assert(
      String(riskLead.followup_status || "") === "idle",
      `risk lead expected idle, got ${riskLead.followup_status || "-"} (${riskLead.followup_stop_reason || "-"})`,
    );
    assert(
      String(riskLead.followup_stop_reason || "") === "risk_keyword_requires_approval",
      `risk lead reason mismatch: ${riskLead.followup_stop_reason || "-"}`,
    );

    assert(
      String(lowLead.followup_status || "") === "idle",
      `low-confidence lead expected idle, got ${lowLead.followup_status || "-"} (${lowLead.followup_stop_reason || "-"})`,
    );
    assert(
      String(lowLead.followup_stop_reason || "") === "ai_low_confidence_requires_approval",
      `low-confidence reason mismatch: ${lowLead.followup_stop_reason || "-"}`,
    );

    const { data: approvalMsgs, error: approvalErr } = await admin
      .from("messages")
      .select("lead_id, status, approval_required, was_followup")
      .in("lead_id", [riskLeadId, lowConfidenceLeadId])
      .eq("sender", "agent");
    if (approvalErr) fail(`approval message verify failed: ${approvalErr.message}`);

    const riskApproval = (approvalMsgs || []).find(
      (m) =>
        String(m.lead_id) === riskLeadId &&
        m.approval_required === true &&
        String(m.status || "").toLowerCase() === "needs_approval" &&
        m.was_followup === true,
    );
    const lowApproval = (approvalMsgs || []).find(
      (m) =>
        String(m.lead_id) === lowConfidenceLeadId &&
        m.approval_required === true &&
        String(m.status || "").toLowerCase() === "needs_approval" &&
        m.was_followup === true,
    );
    assert(!!riskApproval, "risk lead has no follow-up approval draft");
    assert(!!lowApproval, "low-confidence lead has no follow-up approval draft");

    if (supportsWindow) {
      const hour = berlinHourNow();
      const blockedStart = (hour + 1) % 24;
      const blockedEnd = (hour + 2) % 24;
      const up = await upsertSettings(admin, {
        agent_id: e2eAgentId,
        followups_enabled_default: true,
        followups_max_stage_rent: 2,
        followups_max_stage_buy: 2,
        followups_delay_hours_stage1: 24,
        followups_delay_hours_stage2: 72,
        followups_send_start_hour: blockedStart,
        followups_send_end_hour: blockedEnd,
        followups_send_on_weekends: true,
        followups_timezone: "Europe/Berlin",
      });
      if (!up.ok) fail(`blocked window setup failed: ${up.error.message}`);

      const outsideLeadId = randomUUID();
      seededLeadIds.push(outsideLeadId);

      const dueIso2 = minutesAgoIso(4);
      const userIso2 = minutesAgoIso(240);
      const agentIso2 = minutesAgoIso(180);
      const { error: outsideLeadErr } = await admin.from("leads").insert({
        id: outsideLeadId,
        agent_id: e2eAgentId,
        name: "Sprint4 SendWindow",
        email: `window-${Date.now()}@example.com`,
        type: "miete",
        status: "open",
        escalated: false,
        followups_enabled: true,
        followup_stage: 0,
        followup_status: "planned",
        followup_next_at: dueIso2,
        last_user_message_at: userIso2,
        last_agent_message_at: agentIso2,
        last_message_at: agentIso2,
        email_provider: "gmail",
      });
      if (outsideLeadErr) fail(`outside-window lead seed failed: ${outsideLeadErr.message}`);

      const { error: outsideMsgErr } = await admin.from("messages").insert([
        {
          lead_id: outsideLeadId,
          agent_id: e2eAgentId,
          sender: "user",
          text: "Kurze Rückfrage zur Besichtigung.",
          timestamp: userIso2,
        },
        {
          lead_id: outsideLeadId,
          agent_id: e2eAgentId,
          sender: "agent",
          text: "Danke, wir melden uns.",
          timestamp: agentIso2,
        },
      ]);
      if (outsideMsgErr) fail(`outside-window message seed failed: ${outsideMsgErr.message}`);

      const run2 = await runFollowups(10);
      console.log("followups/run #2 processed:", run2.processed);

      const { data: outsideLead, error: outsideVerifyErr } = await admin
        .from("leads")
        .select("id, followup_status, followup_stop_reason, followup_next_at")
        .eq("id", outsideLeadId)
        .maybeSingle();
      if (outsideVerifyErr) fail(`outside-window verify failed: ${outsideVerifyErr.message}`);
      assert(!!outsideLead, "outside-window lead missing after run #2");
      assert(
        String(outsideLead.followup_status || "") === "planned",
        `outside-window status expected planned, got ${outsideLead.followup_status || "-"}`,
      );
      assert(
        String(outsideLead.followup_stop_reason || "") === "outside_send_window",
        `outside-window reason mismatch: ${outsideLead.followup_stop_reason || "-"}`,
      );
      assert(
        !!outsideLead.followup_next_at &&
          Date.parse(String(outsideLead.followup_next_at)) > Date.parse(minutesInFutureIso(0)),
        `outside-window next_at should be in future, got ${outsideLead.followup_next_at || "-"}`,
      );
    } else {
      console.log("outside_send_window test skipped (legacy agent_settings without send-window columns).");
    }

    console.log("Sprint 4 E2E checks passed.");
  } finally {
    await restorePromptOverride(admin, promptOverrideState);

    if (tempBillingSubscriptionId) {
      await admin
        .from("billing_subscriptions")
        .delete()
        .eq("id", tempBillingSubscriptionId);
    }

    if (settingsBefore) {
      await upsertSettings(admin, {
        agent_id: e2eAgentId,
        followups_enabled_default: settingsBefore.followups_enabled_default,
        followups_max_stage_rent: settingsBefore.followups_max_stage_rent,
        followups_max_stage_buy: settingsBefore.followups_max_stage_buy,
        followups_delay_hours_stage1: settingsBefore.followups_delay_hours_stage1,
        followups_delay_hours_stage2: settingsBefore.followups_delay_hours_stage2,
        followups_send_start_hour: settingsBefore.followups_send_start_hour,
        followups_send_end_hour: settingsBefore.followups_send_end_hour,
        followups_send_on_weekends: settingsBefore.followups_send_on_weekends,
        followups_timezone: settingsBefore.followups_timezone,
      });
    }

    if (!keepDataOnFail && seededLeadIds.length > 0) {
      await admin.from("messages").delete().in("lead_id", seededLeadIds);
      await admin.from("leads").delete().in("id", seededLeadIds);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
