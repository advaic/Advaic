import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const cwd = process.cwd();
const today = "2026-03-10";
const outputDir = path.join(cwd, "docs", "ui-audit", today);

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

function fail(message, code = 1) {
  console.error(`playwright-capture-ui-audit: ${message}`);
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

function resolveStoragePath(envFile) {
  const configured = envValue("PLAYWRIGHT_AUTH_STORAGE_STATE", envFile);
  if (!configured) return path.join(cwd, ".auth/app-user.json");
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
  if (!match?.[1]) fail("Lead-Helper hat keine PLAYWRIGHT_LEAD_ID ausgegeben.");
  return String(match[1]).trim();
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function dismissCookieBanner(page) {
  const necessaryButton = page.getByRole("button", { name: "Nur notwendige" });
  const acceptButton = page.getByRole("button", { name: "Alle akzeptieren" });
  if (await necessaryButton.isVisible().catch(() => false)) {
    await necessaryButton.click();
    await page.waitForTimeout(150);
    return;
  }
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
    await page.waitForTimeout(150);
  }
}

const envFile = readEnvFile(path.join(cwd, ".env.local"));
const baseURL = envValue("PLAYWRIGHT_BASE_URL", envFile) || "http://127.0.0.1:4010";
const storagePath = resolveStoragePath(envFile);
const storageState = readStorageState(storagePath);
const leadId = resolveLeadId();

if (!hasPersistedAuth(storageState)) {
  fail("Kein gueltiger Auth-Storage-State gefunden. Bitte zuerst npm run playwright:auth ausfuehren.");
}

const routes = [
  { slug: "home", path: "/", auth: false },
  { slug: "produkt", path: "/produkt", auth: false },
  { slug: "dashboard", path: "/app/startseite", auth: true },
  { slug: "messages", path: "/app/nachrichten", auth: true },
  { slug: "conversation", path: `/app/nachrichten/${leadId}`, auth: true },
  { slug: "approvals", path: "/app/zur-freigabe", auth: true },
];

const viewports = [
  { slug: "desktop", width: 1440, height: 900 },
  { slug: "mobile", width: 390, height: 844 },
];

await fs.promises.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const manifest = [];

  for (const route of routes) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: viewport.width, height: viewport.height },
        storageState: route.auth ? storagePath : undefined,
      });

      const page = await context.newPage();
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await settle(page);
      await dismissCookieBanner(page);
      await settle(page);

      const foldFileName = `${route.slug}-${viewport.slug}-fold.png`;
      const foldTargetPath = path.join(outputDir, foldFileName);
      await page.screenshot({ path: foldTargetPath, fullPage: false });

      const fileName = `${route.slug}-${viewport.slug}.png`;
      const targetPath = path.join(outputDir, fileName);
      await page.screenshot({ path: targetPath, fullPage: true });

      manifest.push({
        route: route.path,
        slug: route.slug,
        viewport: viewport.slug,
        width: viewport.width,
        height: viewport.height,
        auth: route.auth,
        final_url: page.url(),
        fold_file: path.relative(cwd, foldTargetPath),
        file: path.relative(cwd, targetPath),
      });

      await context.close();
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`ui audit screenshots gespeichert: ${path.relative(cwd, outputDir)}`);
} finally {
  await browser.close();
}
