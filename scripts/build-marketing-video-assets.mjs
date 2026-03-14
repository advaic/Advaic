import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const configPath = path.join(cwd, "lib", "video", "production-videos.json");
const publicDir = path.join(cwd, "public", "videos");
const posterDir = path.join(publicDir, "posters");
const audioDir = path.join(publicDir, "audio");
const captionDir = path.join(publicDir, "captions");
const transcriptDir = path.join(publicDir, "transcripts");
const manifestPath = path.join(publicDir, "manifest.json");

function fail(message, code = 1) {
  console.error(`build-marketing-video-assets: ${message}`);
  process.exit(code);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readBriefSpeakerText(briefPath) {
  const raw = fs.readFileSync(path.join(cwd, briefPath), "utf8");
  const match = raw.match(/## Sprechertext\s+([\s\S]*?)\n## On-Screen-Texte/);
  if (!match?.[1]) {
    fail(`Konnte Sprechertext in ${briefPath} nicht finden.`);
  }

  return match[1]
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function formatVttTime(ms) {
  const total = Math.max(0, ms);
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1_000);
  const milliseconds = Math.floor(total % 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function buildVtt(video) {
  let cursor = 0;
  const lines = ["WEBVTT", ""];
  for (const scene of video.scenes) {
    const start = cursor;
    const end = cursor + scene.durationMs;
    lines.push(`${formatVttTime(start)} --> ${formatVttTime(end)}`);
    lines.push(scene.subtitle.trim());
    lines.push("");
    cursor = end;
  }
  return lines.join("\n");
}

function copyPoster(video) {
  const sourcePath = path.join(cwd, "public", video.posterSource.replace(/^\//, ""));
  if (!fs.existsSync(sourcePath)) {
    fail(`Poster-Quelle fehlt: ${video.posterSource}`);
  }
  const targetPath = path.join(posterDir, `${video.slug}.png`);
  fs.copyFileSync(sourcePath, targetPath);
  return `/videos/posters/${video.slug}.png`;
}

function buildAudio(video, transcriptText) {
  const txtPath = path.join(os.tmpdir(), `advaic-video-${video.slug}.txt`);
  const outputPath = path.join(audioDir, `${video.slug}.m4a`);

  fs.writeFileSync(txtPath, transcriptText, "utf8");

  const sayResult = spawnSync(
    "say",
    ["-v", String(video.voice || "Anna"), "-r", String(video.rate || 176), "-f", txtPath, "-o", outputPath],
    { cwd, encoding: "utf8" },
  );

  if (sayResult.status !== 0) {
    fail(`say konnte ${video.slug} nicht rendern.\n${sayResult.stderr || sayResult.stdout || ""}`);
  }

  return `/videos/audio/${video.slug}.m4a`;
}

ensureDir(publicDir);
ensureDir(posterDir);
ensureDir(audioDir);
ensureDir(captionDir);
ensureDir(transcriptDir);

const payload = readJson(configPath);
const videos = Array.isArray(payload?.videos) ? payload.videos : [];

if (!videos.length) {
  fail("Keine Produktionsvideos in der Konfiguration gefunden.");
}

const manifest = {
  generatedAt: new Date().toISOString(),
  videos: [],
};

for (const video of videos) {
  const transcriptText = readBriefSpeakerText(video.briefPath);
  const transcriptPath = path.join(transcriptDir, `${video.slug}.txt`);
  const captionPath = path.join(captionDir, `${video.slug}.vtt`);
  const poster = copyPoster(video);
  const audio = buildAudio(video, transcriptText);

  fs.writeFileSync(transcriptPath, transcriptText, "utf8");
  fs.writeFileSync(captionPath, buildVtt(video), "utf8");

  manifest.videos.push({
    id: video.id,
    title: video.title,
    slug: video.slug,
    runtimeMs: video.scenes.reduce((sum, scene) => sum + scene.durationMs, 0),
    poster,
    audio,
    captions: `/videos/captions/${video.slug}.vtt`,
    transcript: `/videos/transcripts/${video.slug}.txt`,
  });
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`video assets built: ${manifest.videos.length} videos`);
