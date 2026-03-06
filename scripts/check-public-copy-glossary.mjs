import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INCLUDE_DIRS = ["app", "components/marketing"];
const INCLUDE_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mdx"]);
const IGNORE_PREFIXES = ["app/app", "app/api", "app/actions"];

const RULES = [
  {
    pattern: /\bLeadprozess\b/gi,
    message: "Bitte 'Interessenten-Prozess' verwenden.",
  },
  {
    pattern: /\bLead-Prozess\b/gi,
    message: "Bitte 'Interessenten-Prozess' verwenden.",
  },
  {
    pattern: /\bLead-Signal\b/gi,
    message: "Bitte 'Interessenten-Signal' oder präzise Prozessformulierung verwenden.",
  },
  {
    pattern: /\bdein(?:e|en|er|em|es)?\b/gi,
    message: "Public-Copy nutzt 'Sie'-Ansprache statt 'du/dein'.",
  },
  {
    pattern: /\bdu\b/gi,
    message: "Public-Copy nutzt 'Sie'-Ansprache statt 'du'.",
  },
  {
    pattern: /Datenschutzerklärung/gi,
    message: "Bitte 'Datenschutzhinweise' verwenden.",
  },
  {
    pattern: /\bImmoscout\b/gi,
    message: "Bitte 'ImmoScout24' schreiben.",
  },
  {
    pattern: /Prozessnächste-Schritte/gi,
    message: "Bitte 'nächste Prozessschritte' schreiben.",
  },
];

function shouldIgnore(relPath) {
  return IGNORE_PREFIXES.some((prefix) => relPath === prefix || relPath.startsWith(`${prefix}/`));
}

async function walk(baseDir, relBase = "") {
  const absPath = path.join(ROOT, baseDir, relBase);
  let entries = [];
  try {
    entries = await fs.readdir(absPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const nextRel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const fullPath = path.join(absPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(baseDir, nextRel);
      files.push(...nested);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!INCLUDE_EXTENSIONS.has(ext)) continue;
    files.push({ fullPath, relPath: path.join(baseDir, nextRel).replace(/\\/g, "/") });
  }
  return files;
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

async function main() {
  const allFiles = [];
  for (const dir of INCLUDE_DIRS) {
    const files = await walk(dir);
    allFiles.push(...files);
  }

  const violations = [];
  for (const file of allFiles) {
    if (shouldIgnore(file.relPath)) continue;
    const content = await fs.readFile(file.fullPath, "utf8");

    for (const rule of RULES) {
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = lineFromIndex(content, match.index);
        const value = match[0];
        violations.push({
          file: file.relPath,
          line,
          value,
          message: rule.message,
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log("copy:check passed. Keine Glossar-Verstöße in Public-Copy gefunden.");
    return;
  }

  console.error("copy:check failed. Glossar-Verstöße gefunden:\n");
  for (const item of violations) {
    console.error(`- ${item.file}:${item.line} -> "${item.value}" | ${item.message}`);
  }
  process.exitCode = 1;
}

await main();
