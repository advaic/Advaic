import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const defaultStorageState = path.join(cwd, ".auth/app-user.json");

function fail(message, code = 1) {
  console.error(`playwright-run-authenticated: ${message}`);
  process.exit(code);
}

function readStorageState(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasPersistedAuth(state) {
  const cookieCount = Array.isArray(state?.cookies) ? state.cookies.length : 0;
  const localStorageCount = Array.isArray(state?.origins)
    ? state.origins.reduce(
        (sum, origin) =>
          sum + (Array.isArray(origin?.localStorage) ? origin.localStorage.length : 0),
        0,
      )
    : 0;
  return cookieCount > 0 || localStorageCount > 0;
}

function resolveStoragePath() {
  const configured = String(process.env.PLAYWRIGHT_AUTH_STORAGE_STATE || "").trim();
  if (!configured) return defaultStorageState;
  return path.isAbsolute(configured) ? configured : path.join(cwd, configured);
}

function resolveLeadId() {
  const explicitLeadId = String(process.env.PLAYWRIGHT_LEAD_ID || "").trim();
  if (explicitLeadId) return explicitLeadId;

  const leadResult = spawnSync("node", ["scripts/playwright-find-lead.mjs"], {
    cwd,
    env: process.env,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });

  if (leadResult.status !== 0) {
    process.stderr.write(leadResult.stderr || "");
    fail("Konnte PLAYWRIGHT_LEAD_ID nicht automatisch aufloesen.", leadResult.status || 1);
  }

  process.stdout.write(leadResult.stdout || "");
  const match = String(leadResult.stdout || "").match(/^PLAYWRIGHT_LEAD_ID=(.+)$/m);
  if (!match?.[1]) {
    fail("Lead-Helper hat keine PLAYWRIGHT_LEAD_ID ausgegeben.");
  }
  return String(match[1]).trim();
}

if (process.argv.includes("--help")) {
  console.log(
    [
      "Run the authenticated Playwright suite with automatic lead resolution.",
      "",
      "Default behavior:",
      "- validates .auth/app-user.json (or PLAYWRIGHT_AUTH_STORAGE_STATE)",
      "- resolves PLAYWRIGHT_LEAD_ID automatically if not already set",
      "- runs `npx playwright test tests/playwright`",
      "",
      "Examples:",
      "- npm run playwright:ui:auth",
      "- npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts",
      "- PLAYWRIGHT_LEAD_ID=<uuid> npm run playwright:ui:auth -- --headed",
    ].join("\n"),
  );
  process.exit(0);
}

const storagePath = resolveStoragePath();
const storageState = readStorageState(storagePath);
if (!hasPersistedAuth(storageState)) {
  const rel = path.relative(cwd, storagePath) || storagePath;
  fail(
    `Kein gueltiger Storage-State unter ${rel}. Fuehre zuerst npm run playwright:auth aus.`,
  );
}

const leadId = resolveLeadId();
const playwrightArgs = process.argv.slice(2);
const hasExplicitTarget = playwrightArgs.some((arg) => !arg.startsWith("-"));
const args = ["playwright", "test"];
if (!hasExplicitTarget) {
  args.push("tests/playwright");
}
args.push(...playwrightArgs);

const result = spawnSync("npx", args, {
  cwd,
  env: {
    ...process.env,
    PLAYWRIGHT_AUTH_STORAGE_STATE: storagePath,
    PLAYWRIGHT_LEAD_ID: leadId,
  },
  stdio: "inherit",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}
fail("Playwright-Lauf wurde unerwartet beendet.");
