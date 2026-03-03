import fs from "node:fs";

function must(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function opt(name, fallback = "") {
  const v = String(process.env[name] || "").trim();
  return v || fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function endpointBase() {
  return must("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, "");
}

function apiVersion() {
  return opt("AZURE_OPENAI_API_VERSION_FINE_TUNE", "2024-10-21");
}

async function azureFetch(path, init = {}) {
  const key = must("AZURE_OPENAI_API_KEY");
  const url = `${endpointBase()}${path}${path.includes("?") ? "&" : "?"}api-version=${encodeURIComponent(apiVersion())}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = json?.error?.message || text || `HTTP ${res.status}`;
    throw new Error(`Azure OpenAI ${path} failed: ${msg}`);
  }
  return json || {};
}

function setGithubOutput(key, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (!outFile) return;
  fs.appendFileSync(outFile, `${key}=${String(value)}\n`, "utf8");
}

async function main() {
  const model = must("AZURE_FT_BASE_MODEL");
  const trainingFile = must("AZURE_FT_TRAIN_FILE_ID");
  const validationFile = opt("AZURE_FT_VALID_FILE_ID");
  const pollSeconds = Math.max(5, Math.min(300, Number(opt("AZURE_FT_POLL_SECONDS", "30"))));
  const timeoutMinutes = Math.max(10, Math.min(24 * 60, Number(opt("AZURE_FT_TIMEOUT_MINUTES", "180"))));
  const suffix =
    opt("AZURE_FT_SUFFIX") ||
    `advaic-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;

  const createBody = {
    model,
    training_file: trainingFile,
    suffix,
  };
  if (validationFile) createBody.validation_file = validationFile;

  console.log("[ft] creating job...");
  const created = await azureFetch("/openai/fine_tuning/jobs", {
    method: "POST",
    body: JSON.stringify(createBody),
  });

  const jobId = String(created?.id || "");
  if (!jobId) throw new Error("Fine-tune job creation returned no id");

  console.log(`[ft] job created: ${jobId}`);
  setGithubOutput("job_id", jobId);

  const deadline = Date.now() + timeoutMinutes * 60 * 1000;
  let last = created;

  while (Date.now() < deadline) {
    await sleep(pollSeconds * 1000);
    last = await azureFetch(`/openai/fine_tuning/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
    });
    const status = String(last?.status || "unknown");
    console.log(`[ft] status=${status}`);

    if (status === "succeeded") {
      const fineTunedModel = String(last?.fine_tuned_model || "");
      if (!fineTunedModel) {
        throw new Error("Fine-tune succeeded but fine_tuned_model missing");
      }
      console.log(`[ft] fine_tuned_model=${fineTunedModel}`);
      setGithubOutput("fine_tuned_model", fineTunedModel);
      return;
    }

    if (status === "failed" || status === "cancelled") {
      const err =
        last?.error?.message ||
        last?.status_details ||
        JSON.stringify(last?.error || {});
      throw new Error(`Fine-tune job ${status}: ${err}`);
    }
  }

  throw new Error(`Fine-tune timeout after ${timeoutMinutes} minutes`);
}

main().catch((err) => {
  console.error(`[ft] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
