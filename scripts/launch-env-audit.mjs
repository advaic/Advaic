import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

function parseEnvFile(filePath) {
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

function getValue(key, fileEnv) {
  return String(process.env[key] || fileEnv[key] || "").trim();
}

function isSensitiveKey(key) {
  return /(SECRET|SERVICE_ROLE|ANON_KEY|TOKEN|API_KEY|PASSWORD)/i.test(key);
}

const requiredCore = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADVAIC_INTERNAL_PIPELINE_SECRET",
  "ADVAIC_SECRET_ENCRYPTION_KEY",
];

const recommendedOps = [
  "ADVAIC_OPS_ALERT_WEBHOOK_URL",
];

const requiredLegal = [
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

const recommendedLegal = [
  "NEXT_PUBLIC_LEGAL_VAT_ID",
  "NEXT_PUBLIC_LEGAL_CONTACT_PHONE",
  "NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL",
];

const envFile = parseEnvFile(envPath);

function printGroup(title, keys, required = true) {
  console.log(`\n${title}`);
  let missing = 0;
  for (const key of keys) {
    const v = getValue(key, envFile);
    const ok = v.length > 0;
    if (!ok) missing += 1;
    console.log(`${ok ? "PASS" : required ? "OFFEN" : "HINWEIS"}  ${key}`);
  }
  return missing;
}

const missingCore = printGroup("Kernwerte", requiredCore, true);
const missingLegal = printGroup("Rechtliche Pflichtwerte", requiredLegal, true);
printGroup("Empfohlene Zusatzwerte", recommendedLegal, false);
printGroup("Empfohlene Ops-Werte", recommendedOps, false);

const totalMissing = missingCore + missingLegal;
console.log(`\nErgebnis: ${totalMissing === 0 ? "LAUNCHFÄHIG (Env)" : `NICHT LAUNCHFÄHIG (Env), ${totalMissing} Pflichtwerte fehlen`}`);

if (totalMissing > 0) {
  console.log("\nCopy-Paste Vorlage (fehlende Werte ausfüllen):\n");
  const all = [...requiredCore, ...requiredLegal, ...recommendedLegal, ...recommendedOps];
  for (const key of all) {
    const v = getValue(key, envFile);
    if (isSensitiveKey(key)) {
      console.log(`${key}=REPLACE_IN_SECRET_MANAGER`);
      continue;
    }
    console.log(`${key}=${v}`);
  }
  process.exit(1);
}
