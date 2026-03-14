import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const cwd = process.cwd();
const configPath = path.join(cwd, "lib", "video", "production-videos.json");
const outputDate = process.env.VIDEO_EXPORT_DATE || new Date().toISOString().slice(0, 10);
const outputDir = path.join(cwd, "docs", "video-renders", outputDate);
const tempDir = path.join(outputDir, ".tmp");

function fail(message, code = 1) {
  console.error(`playwright-record-marketing-videos: ${message}`);
  process.exit(code);
}

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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadConfig() {
  const payload = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Array.isArray(payload?.videos) || !payload.videos.length) {
    fail("Keine Produktionsvideos in der Konfiguration gefunden.");
  }
  return payload.videos;
}

const envFile = readEnvFile(path.join(cwd, ".env.local"));
const baseURL = envValue("PLAYWRIGHT_BASE_URL", envFile) || "http://127.0.0.1:4010";
const filter = String(process.env.VIDEO_IDS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const buildResult = spawnSync("node", ["scripts/build-marketing-video-assets.mjs"], {
  cwd,
  encoding: "utf8",
  stdio: "inherit",
});

if (buildResult.status !== 0) {
  fail("Konnte Video-Assets vor dem Recording nicht bauen.", buildResult.status || 1);
}

const allVideos = loadConfig();
const videos = filter.length
  ? allVideos.filter((video) => filter.includes(video.id) || filter.includes(video.slug))
  : allVideos;

if (!videos.length) {
  fail(`VIDEO_IDS=${filter.join(",")} hat keine passenden Videos gefunden.`);
}

ensureDir(outputDir);
ensureDir(tempDir);

const manifest = {
  generatedAt: new Date().toISOString(),
  baseURL,
  videos: [],
};

const browser = await chromium.launch({
  headless: process.env.PLAYWRIGHT_HEADLESS !== "0",
});

try {
  for (const video of videos) {
    const runtimeMs = video.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1600, height: 900 },
      recordVideo: {
        dir: tempDir,
        size: { width: 1600, height: 900 },
      },
      colorScheme: "light",
    });

    const page = await context.newPage();
    const videoUrl = `/demo?view=videos&id=${video.id}&clean=1&autoplay=1`;
    await page.goto(videoUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-tour="marketing-video-player"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(1_000);
    await page.waitForTimeout(runtimeMs + 1_500);

    const recorded = page.video();
    await context.close();

    const recordedPath = recorded ? await recorded.path() : null;
    if (!recordedPath || !fs.existsSync(recordedPath)) {
      fail(`Kein aufgezeichnetes WebM für ${video.id} gefunden.`);
    }

    const targetVideoPath = path.join(outputDir, `${video.slug}.webm`);
    fs.copyFileSync(recordedPath, targetVideoPath);

    const sourceCaptionPath = path.join(cwd, "public", "videos", "captions", `${video.slug}.vtt`);
    const sourceAudioPath = path.join(cwd, "public", "videos", "audio", `${video.slug}.m4a`);
    const sourcePosterPath = path.join(cwd, "public", "videos", "posters", `${video.slug}.png`);

    fs.copyFileSync(sourceCaptionPath, path.join(outputDir, `${video.slug}.vtt`));
    fs.copyFileSync(sourceAudioPath, path.join(outputDir, `${video.slug}.m4a`));
    fs.copyFileSync(sourcePosterPath, path.join(outputDir, `${video.slug}.png`));

    manifest.videos.push({
      id: video.id,
      title: video.title,
      runtimeMs,
      page: videoUrl,
      webm: `${video.slug}.webm`,
      audio: `${video.slug}.m4a`,
      captions: `${video.slug}.vtt`,
      poster: `${video.slug}.png`,
    });
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`marketing video exports written: ${videos.length} videos -> ${outputDir}`);
