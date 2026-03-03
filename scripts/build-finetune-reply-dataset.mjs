import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function must(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function opt(name, fallback = "") {
  const v = String(process.env[name] || "").trim();
  return v || fallback;
}

function num(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function hashPct(seed) {
  const hex = crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
  const n = Number.parseInt(hex, 16);
  return Number.isFinite(n) ? (n % 100) / 100 : 0.5;
}

function norm(text, { collapseNewlines = false } = {}) {
  const s = String(text || "").replace(/\r/g, "").trim();
  if (!s) return "";
  const lines = s.split("\n").map((l) => l.trim());
  if (collapseNewlines) return lines.join(" ").replace(/\s+/g, " ").trim();
  return lines.join("\n").replace(/[ \t]+/g, " ").trim();
}

function sentLike(msg) {
  const sendStatus = String(msg?.send_status || "").toLowerCase().trim();
  const status = String(msg?.status || "").toLowerCase().trim();
  return (
    sendStatus === "sent" ||
    ["sent", "approved", "auto_sent", "freigegeben_gesendet"].includes(status)
  );
}

function toJsonl(rows) {
  return rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "");
}

function setGithubOutput(key, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (!outFile) return;
  fs.appendFileSync(outFile, `${key}=${String(value)}\n`, "utf8");
}

async function loadPassQas({
  supa,
  sinceIso,
  maxRows,
  promptKeys,
  agentId,
}) {
  const pageSize = 500;
  const rows = [];
  let from = 0;

  while (rows.length < maxRows) {
    let q = supa
      .from("message_qas")
      .select(
        "id, agent_id, lead_id, inbound_message_id, draft_message_id, prompt_key, verdict, created_at",
      )
      .gte("created_at", sinceIso)
      .eq("verdict", "pass")
      .not("draft_message_id", "is", null)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (promptKeys.length > 0) q = q.in("prompt_key", promptKeys);
    if (agentId) q = q.eq("agent_id", agentId);

    const { data, error } = await q;
    if (error) throw new Error(`message_qas query failed: ${error.message}`);

    const page = Array.isArray(data) ? data : [];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows.slice(0, maxRows);
}

async function loadMessagesByIds({ supa, ids }) {
  const map = new Map();
  for (const part of chunk(ids, 180)) {
    const { data, error } = await supa
      .from("messages")
      .select("id, sender, text, send_status, status, was_followup")
      .in("id", part);

    if (error) throw new Error(`messages query failed: ${error.message}`);

    for (const row of data || []) {
      map.set(String(row.id), row);
    }
  }
  return map;
}

async function main() {
  const supabaseUrl = must("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = must("SUPABASE_SERVICE_ROLE_KEY");

  const lookbackDays = clamp(Math.floor(num("FT_DATA_LOOKBACK_DAYS", 45)), 1, 365);
  const maxRows = clamp(Math.floor(num("FT_DATA_MAX_QA_ROWS", 4000)), 100, 20000);
  const minExamples = clamp(Math.floor(num("FT_DATA_MIN_EXAMPLES", 80)), 20, 10000);
  const validRatio = clamp(num("FT_DATA_VALID_RATIO", 0.12), 0.05, 0.4);
  const minInboundChars = clamp(Math.floor(num("FT_DATA_MIN_INBOUND_CHARS", 20)), 5, 500);
  const minDraftChars = clamp(Math.floor(num("FT_DATA_MIN_DRAFT_CHARS", 40)), 10, 1200);
  const requireSent = ["1", "true", "yes", "on"].includes(
    String(opt("FT_DATA_REQUIRE_SENT", "true")).toLowerCase(),
  );
  const promptKeys = opt("FT_DATA_PROMPT_KEYS", "qa_recheck_v1,followup_qa_v2")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const outputDir = path.resolve(
    process.cwd(),
    opt("FT_DATA_OUTPUT_DIR", ".artifacts/fine-tune/reply-writer"),
  );
  const agentId = opt("FT_DATA_AGENT_ID");
  const systemPrompt =
    opt("FT_DATA_SYSTEM_PROMPT") ||
    "Sie schreiben präzise, freundliche E-Mail-Antworten für deutsche Immobilienmakler. Keine erfundenen Fakten. Wenn Informationen fehlen, fragen Sie klar nach.";

  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const supa = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[dataset] Lade QA-Daten seit ${sinceIso} ...`);
  const qaRows = await loadPassQas({
    supa,
    sinceIso,
    maxRows,
    promptKeys,
    agentId,
  });

  if (!qaRows.length) {
    throw new Error("Keine passenden QA-Pass-Daten gefunden.");
  }

  const ids = Array.from(
    new Set(
      qaRows
        .flatMap((r) => [r?.inbound_message_id, r?.draft_message_id])
        .filter((id) => typeof id === "string" && id.length > 0),
    ),
  );
  console.log(`[dataset] Lade ${ids.length} Nachrichtenreferenzen ...`);
  const messageMap = await loadMessagesByIds({ supa, ids });

  const train = [];
  const valid = [];
  const seen = new Set();
  let droppedMissing = 0;
  let droppedFilter = 0;

  for (const qa of qaRows) {
    const inbound = messageMap.get(String(qa.inbound_message_id || ""));
    const draft = messageMap.get(String(qa.draft_message_id || ""));
    if (!inbound || !draft) {
      droppedMissing += 1;
      continue;
    }

    const inboundText = norm(inbound.text, { collapseNewlines: false });
    const draftText = norm(draft.text, { collapseNewlines: false });

    if (String(inbound.sender || "").toLowerCase() !== "user") {
      droppedFilter += 1;
      continue;
    }
    if (!["assistant", "agent"].includes(String(draft.sender || "").toLowerCase())) {
      droppedFilter += 1;
      continue;
    }
    if (inboundText.length < minInboundChars || draftText.length < minDraftChars) {
      droppedFilter += 1;
      continue;
    }
    if (requireSent && !sentLike(draft)) {
      droppedFilter += 1;
      continue;
    }

    const dedupeKey = crypto
      .createHash("sha1")
      .update(`${inboundText}\n---\n${draftText}`)
      .digest("hex");
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const msgType = inbound.was_followup ? "Follow-up" : "Antwort auf neue Anfrage";
    const userPrompt = [
      "Aufgabe: Formuliere eine präzise Antwort im Stil eines professionellen Immobilienmaklers.",
      `Typ: ${msgType}`,
      "Interessenten-Nachricht:",
      inboundText,
    ].join("\n");

    const example = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
        { role: "assistant", content: draftText },
      ],
    };

    const bucket = hashPct(String(qa.id || dedupeKey));
    if (bucket < validRatio) valid.push(example);
    else train.push(example);
  }

  const total = train.length + valid.length;
  if (total < minExamples) {
    throw new Error(
      `Zu wenig Trainingsbeispiele (${total}). Mindestens ${minExamples} erforderlich.`,
    );
  }
  if (!valid.length) {
    valid.push(train.pop());
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const trainPath = path.join(outputDir, "train.jsonl");
  const validPath = path.join(outputDir, "valid.jsonl");
  fs.writeFileSync(trainPath, toJsonl(train), "utf8");
  fs.writeFileSync(validPath, toJsonl(valid), "utf8");

  console.log(
    `[dataset] ok train=${train.length} valid=${valid.length} dropped_missing=${droppedMissing} dropped_filter=${droppedFilter}`,
  );
  console.log(`[dataset] train: ${trainPath}`);
  console.log(`[dataset] valid: ${validPath}`);

  setGithubOutput("train_path", trainPath);
  setGithubOutput("valid_path", validPath);
  setGithubOutput("train_count", train.length);
  setGithubOutput("valid_count", valid.length);
}

main().catch((err) => {
  console.error(`[dataset] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
