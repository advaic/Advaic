import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

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
  console.error(`playwright-auth: ${message}`);
  process.exit(1);
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

function resolveOutputPath(envFile) {
  const configured =
    envValue("PLAYWRIGHT_AUTH_STORAGE_STATE", envFile) ||
    envValue("PLAYWRIGHT_AUTH_OUTPUT", envFile) ||
    ".auth/app-user.json";
  return path.isAbsolute(configured) ? configured : path.join(cwd, configured);
}

const envFile = readEnvFile(path.join(cwd, ".env.local"));

if (process.argv.includes("--help")) {
  console.log(
    [
      "Create a Playwright storageState for a real app user.",
      "",
      "Required env:",
      "- PLAYWRIGHT_TEST_EMAIL",
      "- PLAYWRIGHT_TEST_PASSWORD",
      "",
      "Optional env:",
      "- PLAYWRIGHT_BASE_URL (default: http://127.0.0.1:4010)",
      "- PLAYWRIGHT_AUTH_STORAGE_STATE or PLAYWRIGHT_AUTH_OUTPUT",
      "- PLAYWRIGHT_LOGIN_PATH (default: /login?next=/app/startseite)",
      "- PLAYWRIGHT_HEADLESS=0 to watch the login",
    ].join("\n"),
  );
  process.exit(0);
}

const email = envValue("PLAYWRIGHT_TEST_EMAIL", envFile);
const password = envValue("PLAYWRIGHT_TEST_PASSWORD", envFile);
const baseURL = envValue("PLAYWRIGHT_BASE_URL", envFile) || "http://127.0.0.1:4010";
const loginPath =
  envValue("PLAYWRIGHT_LOGIN_PATH", envFile) || "/login?next=/app/startseite";
const headless = !/^(0|false|no)$/i.test(
  envValue("PLAYWRIGHT_HEADLESS", envFile) || "1",
);
const outputPath = resolveOutputPath(envFile);

if (!email) fail("PLAYWRIGHT_TEST_EMAIL fehlt.");
if (!password) fail("PLAYWRIGHT_TEST_PASSWORD fehlt.");

const browser = await chromium.launch({ headless });

try {
  const page = await browser.newPage({ baseURL });
  await page.goto(loginPath, { waitUntil: "domcontentloaded" });

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page
    .locator('input[autocomplete="current-password"], input[type="password"]')
    .first();
  const submitButton = page.getByRole("button", { name: /Einloggen/i }).first();

  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await passwordInput.fill(password);
  await emailInput.fill(email);

  await Promise.all([
    page.waitForURL(/\/app\/(startseite|onboarding)(?:[/?#]|$)/, {
      timeout: 30_000,
    }),
    submitButton.click(),
  ]);

  await page.waitForLoadState("networkidle").catch(() => {});
  if (/\/login(?:[/?#]|$)/.test(new URL(page.url()).pathname)) {
    fail(
      "Login ist wieder auf /login gelandet. Pruefe E-Mail/Passwort oder ob der Session-Cookie serverseitig nicht gesetzt wurde.",
    );
  }

  const storageState = await page.context().storageState();
  if (!hasPersistedAuth(storageState)) {
    fail(
      "Storage-State ist leer. Session wurde nicht persistent gespeichert. Bitte Login im Browser pruefen und den Lauf erneut starten.",
    );
  }

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(storageState, null, 2),
    "utf8",
  );

  const relOutput = path.relative(cwd, outputPath) || outputPath;
  console.log(`storageState gespeichert: ${relOutput}`);
  console.log(`naechster Schritt: npm run playwright:lead`);
} finally {
  await browser.close();
}
