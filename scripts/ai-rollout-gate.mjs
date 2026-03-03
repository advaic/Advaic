import { createClient } from "@supabase/supabase-js";

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v, fallback = false) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return fallback;
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function pct(v, fallback) {
  const n = num(v, fallback);
  return Math.max(0, Math.min(1, n));
}

function laneFromModel(modelRaw) {
  const model = String(modelRaw || "").toLowerCase().trim();
  if (!model || model === "azure" || model.endsWith(":stable")) return "stable";
  if (model.endsWith(":candidate")) return "candidate";
  if (model.includes("candidate")) return "candidate";
  return "other";
}

function initStats() {
  return {
    total: 0,
    pass: 0,
    warn: 0,
    fail: 0,
  };
}

function pushVerdict(stats, verdictRaw) {
  const verdict = String(verdictRaw || "").toLowerCase().trim();
  if (!["pass", "warn", "fail"].includes(verdict)) return;
  stats.total += 1;
  stats[verdict] += 1;
}

function rates(stats) {
  if (!stats.total) {
    return { passRate: 0, warnRate: 0, failRate: 0 };
  }
  return {
    passRate: stats.pass / stats.total,
    warnRate: stats.warn / stats.total,
    failRate: stats.fail / stats.total,
  };
}

async function main() {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const lookbackHours = Math.max(1, Math.min(24 * 30, Math.floor(num(process.env.ROLLOUT_LOOKBACK_HOURS, 24))));
  const minCandidateSamples = Math.max(1, Math.floor(num(process.env.ROLLOUT_GATE_MIN_CANDIDATE_SAMPLES, 40)));
  const maxWarnDelta = pct(process.env.ROLLOUT_GATE_MAX_WARN_DELTA, 0.03);
  const maxFailDelta = pct(process.env.ROLLOUT_GATE_MAX_FAIL_DELTA, 0.01);
  const strict = bool(process.env.ROLLOUT_GATE_STRICT, false);

  const promptKeys = String(process.env.ROLLOUT_GATE_PROMPT_KEYS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const sinceIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();
  const supa = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = (supa.from("message_qas"))
    .select("id, model, prompt_key, verdict, created_at")
    .gte("created_at", sinceIso)
    .in("verdict", ["pass", "warn", "fail"])
    .order("created_at", { ascending: false })
    .limit(10_000);

  if (promptKeys.length > 0) {
    query = query.in("prompt_key", promptKeys);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`message_qas query failed: ${error.message}`);
  }

  const rows = Array.isArray(data) ? data : [];
  const globalStats = {
    stable: initStats(),
    candidate: initStats(),
    other: initStats(),
  };
  const byPrompt = new Map();

  for (const r of rows) {
    const lane = laneFromModel(r.model);
    pushVerdict(globalStats[lane], r.verdict);

    const key = String(r.prompt_key || "unknown");
    if (!byPrompt.has(key)) {
      byPrompt.set(key, {
        stable: initStats(),
        candidate: initStats(),
        other: initStats(),
      });
    }
    pushVerdict(byPrompt.get(key)[lane], r.verdict);
  }

  const globalStableRates = rates(globalStats.stable);
  const globalCandidateRates = rates(globalStats.candidate);
  const warnDelta = globalCandidateRates.warnRate - globalStableRates.warnRate;
  const failDelta = globalCandidateRates.failRate - globalStableRates.failRate;

  const gates = {
    enough_candidate_samples: globalStats.candidate.total >= minCandidateSamples,
    warn_delta_ok: warnDelta <= maxWarnDelta,
    fail_delta_ok: failDelta <= maxFailDelta,
  };

  const promptComparisons = [];
  for (const [promptKey, promptStats] of byPrompt.entries()) {
    const st = rates(promptStats.stable);
    const cd = rates(promptStats.candidate);
    promptComparisons.push({
      prompt_key: promptKey,
      stable_total: promptStats.stable.total,
      candidate_total: promptStats.candidate.total,
      stable: { ...promptStats.stable, ...st },
      candidate: { ...promptStats.candidate, ...cd },
      deltas: {
        warn: cd.warnRate - st.warnRate,
        fail: cd.failRate - st.failRate,
      },
    });
  }

  promptComparisons.sort((a, b) => {
    const aa = Math.max(a.deltas.warn, a.deltas.fail);
    const bb = Math.max(b.deltas.warn, b.deltas.fail);
    return bb - aa;
  });

  const summary = {
    ok: gates.enough_candidate_samples && gates.warn_delta_ok && gates.fail_delta_ok,
    strict,
    window: {
      lookback_hours: lookbackHours,
      since: sinceIso,
      rows: rows.length,
      prompt_keys: promptKeys.length ? promptKeys : null,
    },
    thresholds: {
      min_candidate_samples: minCandidateSamples,
      max_warn_delta: maxWarnDelta,
      max_fail_delta: maxFailDelta,
    },
    global: {
      stable: { ...globalStats.stable, ...globalStableRates },
      candidate: { ...globalStats.candidate, ...globalCandidateRates },
      other: globalStats.other,
      deltas: {
        warn: warnDelta,
        fail: failDelta,
      },
    },
    gates,
    prompts: promptComparisons,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (strict && !summary.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[rollout-gate] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
