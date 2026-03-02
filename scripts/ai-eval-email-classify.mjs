import fs from "node:fs";
import path from "node:path";

const baseUrl = String(process.env.BASE_URL || "http://127.0.0.1:4010").replace(/\/$/, "");
const internalSecret = String(process.env.INTERNAL_SECRET || "").trim();
const minAccuracy = Number(process.env.EVAL_MIN_ACCURACY || 0.95);
const strict = String(process.env.EVAL_STRICT || "true").toLowerCase() !== "false";
const datasetPath = path.join(process.cwd(), "scripts/evals/email-classify-goldset.v1.json");

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request(pathname, body) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(internalSecret ? { "x-advaic-internal-secret": internalSecret } : {}),
    },
    body: JSON.stringify(body),
  }).catch((e) => {
    throw new Error(`fetch failed (${pathname}): ${e instanceof Error ? e.message : String(e)}`);
  });

  const text = await res.text();
  return {
    status: res.status,
    json: safeJsonParse(text),
    text,
  };
}

async function probeReachable() {
  try {
    const res = await fetch(`${baseUrl}/api/outlook/webhook`, { method: "GET" });
    return res.status > 0;
  } catch {
    return false;
  }
}

function loadDataset() {
  if (!fs.existsSync(datasetPath)) fail(`dataset not found: ${datasetPath}`);
  const raw = fs.readFileSync(datasetPath, "utf8");
  const parsed = safeJsonParse(raw);
  if (!parsed || !Array.isArray(parsed.cases)) fail("invalid dataset format");
  return parsed;
}

async function main() {
  if (!internalSecret) {
    fail("INTERNAL_SECRET fehlt. Setze ADVAIC_INTERNAL_PIPELINE_SECRET als INTERNAL_SECRET.");
  }

  const reachable = await probeReachable();
  if (!reachable) {
    fail(`BASE_URL nicht erreichbar: ${baseUrl}`);
  }

  const dataset = loadDataset();
  const cases = dataset.cases;

  let passed = 0;
  const failures = [];

  for (const testCase of cases) {
    const id = String(testCase.id || "");
    const input = testCase.input || {};
    const expected = testCase.expected || {};

    const res = await request("/api/ai/email-classify", input);
    if (res.status !== 200 || !res.json) {
      failures.push({
        id,
        reason: `http_${res.status}`,
        expected,
        got: res.json || res.text.slice(0, 260),
      });
      continue;
    }

    const gotDecision = String(res.json?.decision || "");
    const gotType = String(res.json?.email_type || "");
    const ok =
      gotDecision === String(expected.decision || "") &&
      gotType === String(expected.email_type || "");

    if (ok) passed += 1;
    else {
      failures.push({
        id,
        reason: "mismatch",
        expected,
        got: {
          decision: gotDecision,
          email_type: gotType,
          confidence: res.json?.confidence ?? null,
          reason: res.json?.reason ?? null,
        },
      });
    }
  }

  const total = cases.length;
  const accuracy = total > 0 ? passed / total : 0;
  const accuracyPct = Math.round(accuracy * 10000) / 100;

  console.log(`AI Eval email-classify: ${passed}/${total} korrekt (${accuracyPct}%)`);
  if (failures.length > 0) {
    console.log("Fehlfälle:");
    for (const f of failures) {
      console.log(`- ${f.id}: ${f.reason}`);
      console.log(`  expected=${JSON.stringify(f.expected)}`);
      console.log(`  got=${JSON.stringify(f.got)}`);
    }
  }

  if (strict) {
    assert(
      accuracy >= minAccuracy,
      `Accuracy unter Grenzwert: ${accuracyPct}% < ${Math.round(minAccuracy * 10000) / 100}%`,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

