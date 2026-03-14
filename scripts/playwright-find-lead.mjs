import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function envValue(key, envFile) {
  return String(process.env[key] || envFile[key] || "").trim();
}

function fail(message) {
  console.error(`playwright-find-lead: ${message}`);
  process.exit(1);
}

async function resolveAgentId(admin, envFile) {
  const explicitAgentId = envValue("PLAYWRIGHT_AGENT_ID", envFile);
  if (explicitAgentId) return explicitAgentId;

  const email = envValue("PLAYWRIGHT_TEST_EMAIL", envFile).toLowerCase();
  if (email) {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) fail(`Konnte Auth-Users nicht laden: ${error.message}`);
      const match = (data.users || []).find(
        (user) => String(user.email || "").trim().toLowerCase() === email,
      );
      if (match?.id) return String(match.id);
      if ((data.users || []).length < 200) break;
    }
    fail(
      `Kein Supabase-User fuer PLAYWRIGHT_TEST_EMAIL gefunden. Alternativ PLAYWRIGHT_AGENT_ID direkt setzen.`,
    );
  }

  return (
    envValue("E2E_AGENT_ID", envFile) ||
    envValue("ADVAIC_OWNER_USER_ID", envFile) ||
    envValue("ADMIN_DASHBOARD_USER_ID", envFile) ||
    envValue("ADVAIC_ADMIN_USER_ID", envFile)
  );
}

const envFile = readEnvFile(path.join(cwd, ".env.local"));

if (process.argv.includes("--help")) {
  console.log(
    [
      "Find a usable lead id for Playwright conversation tests.",
      "",
      "Resolution order for agent id:",
      "1. PLAYWRIGHT_AGENT_ID",
      "2. Supabase user resolved from PLAYWRIGHT_TEST_EMAIL",
      "3. E2E_AGENT_ID / ADVAIC_OWNER_USER_ID / ADMIN_DASHBOARD_USER_ID / ADVAIC_ADMIN_USER_ID",
      "",
      "Required env:",
      "- NEXT_PUBLIC_SUPABASE_URL",
      "- SUPABASE_SERVICE_ROLE_KEY",
    ].join("\n"),
  );
  process.exit(0);
}

const supabaseUrl = envValue("NEXT_PUBLIC_SUPABASE_URL", envFile);
const serviceRoleKey = envValue("SUPABASE_SERVICE_ROLE_KEY", envFile);

if (!supabaseUrl) fail("NEXT_PUBLIC_SUPABASE_URL fehlt.");
if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY fehlt.");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const agentId = await resolveAgentId(admin, envFile);

if (!agentId) {
  fail(
    "Konnte keine agent_id aufloesen. Setze PLAYWRIGHT_AGENT_ID oder PLAYWRIGHT_TEST_EMAIL.",
  );
}

async function findLead(queryBuilder) {
  const { data, error } = await queryBuilder;
  if (error) fail(`Lead-Query fehlgeschlagen: ${error.message}`);
  return data || [];
}

let leads = await findLead(
  admin
    .from("leads")
    .select("id, name, status, archived_at, last_message_at, updated_at")
    .eq("agent_id", agentId)
    .is("archived_at", null)
    .neq("status", "done")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(5),
);

if (!leads.length) {
  leads = await findLead(
    admin
      .from("leads")
      .select("id, name, status, archived_at, last_message_at, updated_at")
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false })
      .limit(5),
  );
}

if (!leads.length) {
  fail(
    `Keine Leads fuer agent_id ${agentId} gefunden. Nimm einen User mit Testdaten oder seed zuerst einen Lead.`,
  );
}

const [lead] = leads;
console.log(`agent_id=${agentId}`);
console.log(`PLAYWRIGHT_LEAD_ID=${lead.id}`);
console.log(
  `lead=${lead.name || "Unbekannt"} status=${lead.status || "-"} updated_at=${lead.updated_at || "-"}`,
);
