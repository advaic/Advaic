import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INCLUDE_DIRS = ["app", "components/marketing"];
const INCLUDE_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mdx"]);
const IGNORE_PREFIXES = ["app/app", "app/api", "app/actions"];
const STRICT_REVIEW = process.env.COPY_CHECK_STRICT_REVIEW === "1";

const CORE_SURFACE_PATTERNS = [
  /^app\/page\.tsx$/,
  /^app\/preise\/page\.tsx$/,
  /^app\/produkt\/page\.tsx$/,
  /^components\/marketing\/Hero\.tsx$/,
  /^components\/marketing\/HowItWorks\.tsx$/,
  /^components\/marketing\/ProductVisualAuthority\.tsx$/,
  /^components\/marketing\/TrustByDesign\.tsx$/,
  /^components\/marketing\/Pricing\.tsx$/,
  /^components\/marketing\/FAQ\.tsx$/,
  /^components\/marketing\/FinalCTA\.tsx$/,
  /^components\/marketing\/CTAExperiment\.tsx$/,
  /^components\/marketing\/produkt\/Hero\.tsx$/,
  /^components\/marketing\/produkt\/FinalCTA\.tsx$/,
  /^components\/marketing\/produkt\/TrustFoundations\.tsx$/,
  /^app\/sicherheit\/page\.tsx$/,
  /^app\/autopilot\/page\.tsx$/,
  /^app\/email-automatisierung-immobilienmakler\/page\.tsx$/,
  /^app\/ki-fuer-immobilienmakler\/page\.tsx$/,
  /^app\/qualitaetschecks\/page\.tsx$/,
];

function matchesAny(relPath, patterns = []) {
  return patterns.some((pattern) => pattern.test(relPath));
}

const RULES = [
  {
    severity: "error",
    pattern: /\bLeadprozess\b/gi,
    message: "Bitte 'Interessenten-Prozess' verwenden.",
  },
  {
    severity: "error",
    pattern: /\bLead-Prozess\b/gi,
    message: "Bitte 'Interessenten-Prozess' verwenden.",
  },
  {
    severity: "error",
    pattern: /\bLead-Signal\b/gi,
    message: "Bitte 'Interessenten-Signal' oder präzise Prozessformulierung verwenden.",
  },
  {
    severity: "error",
    pattern: /\bdein(?:e|en|er|em|es)?\b/gi,
    message: "Public-Copy nutzt 'Sie'-Ansprache statt 'du/dein'.",
  },
  {
    severity: "error",
    pattern: /\bdu\b/gi,
    message: "Public-Copy nutzt 'Sie'-Ansprache statt 'du'.",
  },
  {
    severity: "error",
    pattern: /Datenschutzerklärung/gi,
    message: "Bitte 'Datenschutzhinweise' verwenden.",
  },
  {
    severity: "error",
    pattern: /\bImmoscout\b/gi,
    message: "Bitte 'ImmoScout24' schreiben.",
  },
  {
    severity: "error",
    pattern: /Prozessnächste-Schritte/gi,
    message: "Bitte 'nächste Prozessschritte' schreiben.",
  },
  {
    severity: "error",
    pattern: /\bmehr [^.!?\n]{1,40},\s*weniger [^.!?\n]{1,40}\b/gi,
    message: "Bitte 'mehr/weniger'-Formeln in Public-Copy vermeiden oder konkret belegen.",
  },
  {
    severity: "error",
    pattern: /\bdies statt das\b/gi,
    message: "Bitte generische 'dies statt das'-Kontraste vermeiden.",
  },
  {
    severity: "error",
    pattern: /\bglasklar\b/gi,
    message: "Bitte generische Superlative wie 'glasklar' vermeiden.",
  },
  {
    severity: "error",
    pattern: /\bnahtlos\b/gi,
    message: "Bitte generische Produktfloskeln wie 'nahtlos' vermeiden.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bStandardfälle?\b/gi,
    message:
      "Bitte auf Kernflächen nicht pauschal von 'Standardfällen' sprechen, sondern das fachliche Kriterium nennen.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bStandardanfragen?\b/gi,
    message:
      "Bitte auf Kernflächen nicht pauschal von 'Standardanfragen' sprechen, sondern das fachliche Kriterium nennen.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bunklare Fälle?\b/gi,
    message:
      "Bitte auf Kernflächen 'unklare Fälle' durch konkrete Freigabegründe ersetzen.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bheikle Fälle?\b/gi,
    message:
      "Bitte auf Kernflächen 'heikle Fälle' durch konkrete Freigabegründe ersetzen.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bUnsicherheit\b/gi,
    message:
      "Bitte auf Kernflächen 'Unsicherheit' nicht abstrakt verwenden, sondern die konkrete Risikoursache nennen.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bPreisdetails\b/gi,
    message: "Bitte präzisere CTA-Copy als 'Preisdetails' verwenden.",
  },
  {
    severity: "error",
    include: CORE_SURFACE_PATTERNS,
    pattern: /\bFragen klären\b/gi,
    message: "Bitte präzisere CTA-Copy als 'Fragen klären' verwenden.",
  },
  {
    severity: "review",
    pattern: /\bStandardfälle?\b/gi,
    message:
      "Review: 'Standardfälle' möglichst durch konkrete Kriterien wie Objektbezug, vollständige Angaben oder Versandfreigabe ersetzen.",
  },
  {
    severity: "review",
    pattern: /\bStandardanfragen?\b/gi,
    message:
      "Review: 'Standardanfragen' möglichst durch konkrete Kriterien wie Objektbezug, vollständige Angaben oder Versandfreigabe ersetzen.",
  },
  {
    severity: "review",
    pattern: /\bunklare Fälle?\b/gi,
    message:
      "Review: 'unklare Fälle' möglichst durch konkrete Freigabegründe ersetzen.",
  },
  {
    severity: "review",
    pattern: /\bheikle Fälle?\b/gi,
    message:
      "Review: 'heikle Fälle' möglichst durch konkrete Freigabegründe ersetzen.",
  },
  {
    severity: "review",
    pattern: /\bUnsicherheit\b/gi,
    message:
      "Review: 'Unsicherheit' möglichst durch konkrete Risiko- oder Freigabeursachen ersetzen.",
  },
  {
    severity: "review",
    pattern: /\bBlindflug\b/gi,
    message: "Review: Bildsprache wie 'Blindflug' in Public-Copy möglichst vermeiden.",
  },
  {
    severity: "review",
    pattern: /\bnicht nur\b/gi,
    message: "Review: 'nicht nur'-Kontrastformeln möglichst konkreter formulieren.",
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
      if (rule.include && !matchesAny(file.relPath, rule.include)) continue;
      if (rule.exclude && matchesAny(file.relPath, rule.exclude)) continue;
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = lineFromIndex(content, match.index);
        const value = match[0];
        violations.push({
          severity: rule.severity || "error",
          file: file.relPath,
          line,
          value,
          message: rule.message,
        });
      }
    }
  }

  const errors = violations.filter((item) => item.severity === "error");
  const reviews = violations.filter((item) => item.severity === "review");

  if (errors.length === 0 && reviews.length === 0) {
    console.log("copy:check passed. Keine Glossar-Verstöße in Public-Copy gefunden.");
    return;
  }

  if (errors.length > 0) {
    console.error("copy:check failed. Harte Glossar-Verstöße gefunden:\n");
    for (const item of errors) {
      console.error(`- ${item.file}:${item.line} -> "${item.value}" | ${item.message}`);
    }
  }

  if (reviews.length > 0) {
    const stream = errors.length > 0 || STRICT_REVIEW ? console.error : console.log;
    stream("\ncopy:check review-hinweise:\n");
    for (const item of reviews) {
      stream(`- ${item.file}:${item.line} -> "${item.value}" | ${item.message}`);
    }
  }

  if (errors.length > 0 || (STRICT_REVIEW && reviews.length > 0)) {
    process.exitCode = 1;
    return;
  }

  console.log(`\ncopy:check passed mit ${reviews.length} Review-Hinweisen.`);
}

await main();
