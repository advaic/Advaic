import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4010").replace(
  /\/$/,
  "",
);
const internalSecret = String(process.env.INTERNAL_SECRET || "").trim();

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const e2eAgentId = String(process.env.E2E_AGENT_ID || "").trim();

function fail(msg) {
  throw new Error(msg);
}

function assert(condition, msg) {
  if (!condition) fail(msg);
}

async function request(method, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { method, headers, redirect: options.redirect || "follow" };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, init);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`${method} ${path}: fetch failed (${reason})`);
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json, headers: res.headers };
}

async function routeContractChecks() {
  const checks = [
    ["GET", "/produkt", 200],
    ["GET", "/api/outlook/webhook", 200],
    ["GET", "/api/gmail/push", 405],
    ["POST", "/api/messages/feedback", 401, {}],
    ["GET", "/api/agent/settings/followups", 401],
    ["POST", "/api/pipeline/followups/run", 401, {}],
  ];

  for (const c of checks) {
    const [method, path, expected, body] = c;
    console.log(`check ${method} ${path}`);
    const r = await request(method, path, body === undefined ? {} : { body });
    assert(
      r.status === expected,
      `${method} ${path}: expected ${expected}, got ${r.status}`,
    );
  }

  if (internalSecret) {
    console.log("check POST /api/pipeline/followups/run (with secret)");
    const r = await request("POST", "/api/pipeline/followups/run", {
      headers: { "x-advaic-internal-secret": internalSecret },
      body: { limit: 1 },
    });
    assert(
      r.status === 200,
      `POST /api/pipeline/followups/run (with secret): expected 200, got ${r.status}`,
    );
    assert(r.json?.ok === true, "followups/run with secret should return ok=true");
  }
}

async function probeBaseReachable() {
  try {
    const res = await fetch(`${baseUrl}/api/outlook/webhook`, {
      method: "GET",
      redirect: "follow",
    });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function ensureAgentSettings(admin, agentId) {
  const extendedPayload = {
    agent_id: agentId,
    followups_enabled_default: true,
    followups_max_stage_rent: 2,
    followups_max_stage_buy: 2,
    followups_delay_hours_stage1: 24,
    followups_delay_hours_stage2: 72,
    followups_send_start_hour: 8,
    followups_send_end_hour: 20,
    followups_send_on_weekends: false,
    followups_timezone: "Europe/Berlin",
  };

  const legacyPayload = {
    agent_id: agentId,
    followups_enabled_default: true,
    followups_max_stage_rent: 2,
    followups_max_stage_buy: 2,
    followups_delay_hours_stage1: 24,
    followups_delay_hours_stage2: 72,
  };

  try {
    const { error } = await admin
      .from("agent_settings")
      .upsert(extendedPayload, { onConflict: "agent_id" });
    if (error) throw error;
  } catch {
    const { error } = await admin
      .from("agent_settings")
      .upsert(legacyPayload, { onConflict: "agent_id" });
    if (error) throw error;
  }
}

function minutesAgoIso(min) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

async function runSyntheticSession() {
  if (!internalSecret) {
    console.log(
      "skip synthetic session: INTERNAL_SECRET fehlt (nur Route-Contract-Checks ausgeführt).",
    );
    return;
  }
  if (!supabaseUrl || !serviceRoleKey || !e2eAgentId) {
    console.log(
      "skip synthetic session: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / E2E_AGENT_ID fehlen.",
    );
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await ensureAgentSettings(admin, e2eAgentId);

  const leadMissingEmailId = randomUUID();
  const leadMaxStageId = randomUUID();

  const dueIso = minutesAgoIso(3);
  const userOldIso = minutesAgoIso(120);
  const agentOldIso = minutesAgoIso(180);

  try {
    const { error: leadErr } = await admin.from("leads").insert([
      {
        id: leadMissingEmailId,
        agent_id: e2eAgentId,
        name: "E2E Missing Email",
        email: null,
        type: "miete",
        followups_enabled: true,
        followup_stage: 0,
        followup_status: "planned",
        followup_next_at: dueIso,
        last_user_message_at: userOldIso,
        last_agent_message_at: agentOldIso,
        last_message_at: userOldIso,
        email_provider: "gmail",
      },
      {
        id: leadMaxStageId,
        agent_id: e2eAgentId,
        name: "E2E Max Stage",
        email: `e2e-max-stage+${Date.now()}@example.com`,
        type: "miete",
        followups_enabled: true,
        followup_stage: 2,
        followup_status: "planned",
        followup_next_at: dueIso,
        last_user_message_at: userOldIso,
        last_agent_message_at: agentOldIso,
        last_message_at: userOldIso,
        email_provider: "gmail",
      },
    ]);
    if (leadErr) {
      fail(`lead seed failed: ${leadErr.message}`);
    }

    const { error: msgErr } = await admin.from("messages").insert([
      {
        lead_id: leadMissingEmailId,
        agent_id: e2eAgentId,
        sender: "user",
        text: "Hallo, bitte Rückmeldung",
        timestamp: userOldIso,
      },
      {
        lead_id: leadMaxStageId,
        agent_id: e2eAgentId,
        sender: "user",
        text: "Bitte melden",
        timestamp: userOldIso,
      },
    ]);
    if (msgErr) {
      fail(`message seed failed: ${msgErr.message}`);
    }

    const run = await request("POST", "/api/pipeline/followups/run", {
      headers: { "x-advaic-internal-secret": internalSecret },
      body: { limit: 20 },
    });
    assert(
      run.status === 200,
      `synthetic followups/run expected 200, got ${run.status}`,
    );
    assert(run.json?.ok === true, "synthetic followups/run should return ok=true");

    const { data: leadsAfter, error: afterErr } = await admin
      .from("leads")
      .select("id, followup_status, followup_stop_reason, followup_next_at")
      .in("id", [leadMissingEmailId, leadMaxStageId]);
    if (afterErr) fail(`lead verify failed: ${afterErr.message}`);

    const byId = new Map((leadsAfter || []).map((r) => [String(r.id), r]));
    const missing = byId.get(leadMissingEmailId);
    const maxed = byId.get(leadMaxStageId);

    assert(!!missing, "missing-email lead not found after run");
    assert(!!maxed, "max-stage lead not found after run");

    assert(
      String(missing.followup_status || "") === "idle",
      `missing-email lead should be idle, got ${missing.followup_status}`,
    );
    assert(
      String(missing.followup_stop_reason || "") === "missing_lead_email",
      `missing-email lead reason should be missing_lead_email, got ${missing.followup_stop_reason}`,
    );

    assert(
      String(maxed.followup_status || "") === "idle",
      `max-stage lead should be idle, got ${maxed.followup_status}`,
    );
    assert(
      String(maxed.followup_stop_reason || "") === "max_stage_reached",
      `max-stage lead reason should be max_stage_reached, got ${maxed.followup_stop_reason}`,
    );

    console.log("synthetic test session passed.");
  } finally {
    await admin.from("messages").delete().in("lead_id", [leadMissingEmailId, leadMaxStageId]);
    await admin.from("leads").delete().in("id", [leadMissingEmailId, leadMaxStageId]);
  }
}

async function main() {
  const strict = String(process.env.CRITICAL_STRICT || "").toLowerCase() === "true";
  const reachable = await probeBaseReachable();

  if (!reachable) {
    if (strict) {
      fail(`BASE_URL nicht erreichbar: ${baseUrl}`);
    }
    console.log(
      `skip critical checks: BASE_URL nicht erreichbar (${baseUrl}). Setze CRITICAL_STRICT=true, um hard-fail zu erzwingen.`,
    );
    return;
  }

  await routeContractChecks();
  await runSyntheticSession();
  console.log("Critical flow checks passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
