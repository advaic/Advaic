import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const cwd = process.cwd();
const captureDate =
  process.env.SCREENSHOT_SET_DATE || new Date().toISOString().slice(0, 10);
const outputDir = path.join(cwd, "docs", "marketing-screenshots", captureDate);
const rawDir = path.join(outputDir, "raw");
const publicRawDir = path.join(cwd, "public", "marketing-screenshots", "core", "raw");

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
  console.error(`playwright-capture-core-screenshots: ${message}`);
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
          sum +
          (Array.isArray(origin?.localStorage) ? origin.localStorage.length : 0),
        0,
      )
    : 0;
  return cookieCount > 0 || localStorageCount > 0;
}

function resolveStoragePath(envFile) {
  const configured = envValue("PLAYWRIGHT_AUTH_STORAGE_STATE", envFile);
  if (!configured) return path.join(cwd, ".auth", "app-user.json");
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
    fail(
      "Konnte PLAYWRIGHT_LEAD_ID nicht automatisch auflösen.",
      leadResult.status || 1,
    );
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

if (!hasPersistedAuth(storageState)) {
  fail(
    "Kein gültiger Auth-Storage-State gefunden. Bitte zuerst npm run playwright:auth ausführen.",
  );
}

const leadId = resolveLeadId();

const captureTargets = [
  {
    id: "dashboard-startmodul",
    title: "Dashboard – Startmodul",
    route: "/app/startseite",
    selector: '[data-tour="dashboard-quickstart"]',
    message: "Der Einstieg in die Automatisierung bleibt kontrolliert und schrittweise.",
    usage: "Homepage, Produkt, Video 1",
  },
  {
    id: "dashboard-systemstatus",
    title: "Dashboard – Systemstatus",
    route: "/app/startseite",
    selector: '[data-tour="dashboard-system-health"]',
    message: "Versand, Deliverability und Lernkurve werden als Betriebszustand sichtbar.",
    usage: "Homepage, Sicherheit, Video 2",
  },
  {
    id: "dashboard-automation",
    title: "Dashboard – Automationssteuerung",
    route: "/app/startseite",
    selector: '[data-tour="dashboard-automation-control"]',
    message: "Guardrails und Sandbox steuern den Rollout, nicht ein Blackbox-Schalter.",
    usage: "Produkt, Autopilot, Video 2",
  },
  {
    id: "messages-inbox",
    title: "Nachrichten – Inbox",
    route: "/app/nachrichten",
    selector: '[data-tour="messages-list"]',
    message: "Die Inbox priorisiert offene Arbeit statt nur neue E-Mails aufzulisten.",
    usage: "Produkt, So funktioniert's, Video 1",
  },
  {
    id: "messages-filters",
    title: "Nachrichten – Schnellfilter",
    route: "/app/nachrichten",
    selector: '[data-tour="messages-quickfilters"]',
    message: "Freigabe, Eskalation und Priorität sind mit einem Klick erreichbar.",
    usage: "Produkt, Follow-up-Logik, Video 1",
  },
  {
    id: "conversation-thread",
    title: "Konversation – Arbeitsfläche",
    route: `/app/nachrichten/${leadId}`,
    selector: '[data-tour="conversation-thread-card"]',
    message: "Die eigentliche Antwortarbeit läuft in einer ruhigen Produktionsfläche.",
    usage: "Produkt, Freigabe-Inbox, Video 1",
  },
  {
    id: "conversation-context",
    title: "Konversation – Kontextleiste",
    route: `/app/nachrichten/${leadId}`,
    selector: '[data-tour="conversation-context-rail"]',
    message: "Objektbezug, Regeln und Follow-ups bleiben neben der E-Mail sichtbar.",
    usage: "Produkt, Qualitätschecks, Video 2",
  },
  {
    id: "approval-review-flow",
    title: "Freigabe – Prüf-Reihenfolge",
    route: "/app/zur-freigabe",
    parentSelector: '[data-tour="approval-card"]',
    selector: '[data-tour="approval-review-order"]',
    message: "Freigaben folgen einer festen Reihenfolge statt Bauchgefühl.",
    usage: "Produkt, Freigabe-Inbox, Video 3",
  },
  {
    id: "approval-decision",
    title: "Freigabe – Entscheidung",
    route: "/app/zur-freigabe",
    parentSelector: '[data-tour="approval-card"]',
    selector: '[data-tour="approval-decision"]',
    message: "Senden, Bearbeiten und Ablehnen sind klar getrennte Entscheidungen.",
    usage: "Produkt, Sicherheit, Video 3",
  },
  {
    id: "tone-style-setup",
    title: "Ton & Stil – Setup",
    route: "/app/ton-und-stil",
    selector: '[data-tour="tone-style-card"]',
    message: "Antwortstil wird wie ein Setup gepflegt, nicht wie ein loses Formular.",
    usage: "Produkt, Ton & Stil, Video 3",
  },
  {
    id: "tone-style-preview",
    title: "Ton & Stil – Vorschau",
    route: "/app/ton-und-stil",
    selector: '[data-tour="tone-style-preview-card"]',
    message: "Änderungen werden direkt an einer realen Antwortvorschau sichtbar.",
    usage: "Produkt, Ton & Stil, Video 3",
  },
  {
    id: "billing-plan-access",
    title: "Abo – Plan & Zugriff",
    route: "/app/konto/abo",
    selector: '[data-tour="account-billing-plan-card"]',
    message: "Planstatus und Zugriffsmodell sind ohne Support-Rückfrage verständlich.",
    usage: "Preise, Abo, interner Sales-Kontext",
  },
];

function resolveLocator(page, target) {
  if (target.parentSelector) {
    return page
      .locator(target.parentSelector)
      .first()
      .locator(target.selector)
      .first();
  }
  return page.locator(target.selector).first();
}

async function captureTarget(browser, target) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    storageState: storagePath,
    colorScheme: "light",
  });

  try {
    const page = await context.newPage();
    await page.goto(target.route, { waitUntil: "domcontentloaded" });
    await settle(page);
    await dismissCookieBanner(page);
    await settle(page);

    const locator = resolveLocator(page, target);
    await locator.waitFor({ state: "visible", timeout: 15_000 });
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const outputPath = path.join(rawDir, `${target.id}.png`);
    const publicOutputPath = path.join(publicRawDir, `${target.id}.png`);
    await locator.screenshot({ path: outputPath });
    await fs.promises.copyFile(outputPath, publicOutputPath);

    return {
      ...target,
      file: path.relative(cwd, outputPath),
      publicFile: path.relative(cwd, publicOutputPath),
      finalUrl: page.url(),
      viewport: { width: 1440, height: 900 },
    };
  } finally {
    await context.close();
  }
}

await fs.promises.mkdir(rawDir, { recursive: true });
await fs.promises.mkdir(publicRawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const manifest = [];

  for (const target of captureTargets) {
    const captured = await captureTarget(browser, target);
    manifest.push(captured);
    console.log(`captured ${captured.file}`);
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`core screenshot set gespeichert: ${path.relative(cwd, outputDir)}`);
} finally {
  await browser.close();
}
