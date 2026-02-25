import fs from "node:fs";
import path from "node:path";

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

function exists(rel) {
  return fs.existsSync(path.join(cwd, rel));
}

const envFile = readEnvFile(path.join(cwd, ".env.local"));
const checks = [];

function addCheck({ id, ok, message, hint }) {
  checks.push({ id, ok, message, hint: hint || "" });
}

const requiredEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADVAIC_INTERNAL_PIPELINE_SECRET",
  "ADVAIC_SECRET_ENCRYPTION_KEY",
];

for (const key of requiredEnv) {
  const value = envValue(key, envFile);
  addCheck({
    id: `env:${key}`,
    ok: value.length > 0,
    message: value.length > 0 ? `${key} gesetzt` : `${key} fehlt`,
    hint: value.length > 0 ? "" : "In .env.local oder Runtime-Umgebung setzen.",
  });
}

const legalEnv = [
  "NEXT_PUBLIC_LEGAL_COMPANY_NAME",
  "NEXT_PUBLIC_LEGAL_FORM",
  "NEXT_PUBLIC_LEGAL_REPRESENTED_BY",
  "NEXT_PUBLIC_LEGAL_ADDRESS_STREET",
  "NEXT_PUBLIC_LEGAL_ADDRESS_ZIP_CITY",
  "NEXT_PUBLIC_LEGAL_ADDRESS_COUNTRY",
  "NEXT_PUBLIC_LEGAL_REGISTER_COURT",
  "NEXT_PUBLIC_LEGAL_REGISTER_NUMBER",
  "NEXT_PUBLIC_LEGAL_CONTACT_EMAIL",
];

for (const key of legalEnv) {
  const value = envValue(key, envFile);
  addCheck({
    id: `legal:${key}`,
    ok: value.length > 0,
    message:
      value.length > 0
        ? `${key} gesetzt`
        : `${key} fehlt (Impressum/Datenschutz ggf. unvollständig)`,
    hint: value.length > 0 ? "" : "Vor Launch verpflichtend ergänzen.",
  });
}

const requiredFiles = [
  "docs/launch-checklist.md",
  "docs/launch-readiness-status.md",
  "docs/go-live-compliance-checklist.md",
  "docs/supabase-cron-setup.md",
  "docs/subprocessor-register.md",
  "docs/avv-prozess.md",
  "docs/vvt.md",
  "docs/tom.md",
  "docs/dsar-runbook.md",
  "docs/incident-breach-runbook.md",
  "docs/aufbewahrung-loeschkonzept.md",
  "docs/rollen-und-zugriffskonzept.md",
  "docs/dsb-pruefung.md",
  "app/unterauftragsverarbeiter/page.tsx",
  "app/app/admin/ops/page.tsx",
  "app/api/pipeline/ops/alerts/run/route.ts",
  "app/api/admin/ops/status/route.ts",
];

for (const rel of requiredFiles) {
  addCheck({
    id: `file:${rel}`,
    ok: exists(rel),
    message: exists(rel) ? `${rel} vorhanden` : `${rel} fehlt`,
  });
}

const pass = checks.filter((c) => c.ok).length;
const fail = checks.length - pass;

console.log(`Launch-Readiness-Check: ${pass}/${checks.length} PASS, ${fail} OFFEN`);
for (const c of checks) {
  const icon = c.ok ? "PASS" : "OFFEN";
  console.log(`[${icon}] ${c.id} -> ${c.message}`);
  if (!c.ok && c.hint) console.log(`       Tipp: ${c.hint}`);
}

if (fail > 0) process.exit(1);
