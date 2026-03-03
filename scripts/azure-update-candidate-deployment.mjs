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

function setGithubOutput(key, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (!outFile) return;
  fs.appendFileSync(outFile, `${key}=${String(value)}\n`, "utf8");
}

async function armFetch(url, init = {}) {
  const token = must("AZURE_ARM_ACCESS_TOKEN");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  return { ok: res.ok, status: res.status, json, text };
}

function buildArmUrl() {
  const sub = must("AZURE_SUBSCRIPTION_ID");
  const rg = must("AZURE_RESOURCE_GROUP");
  const account = must("AZURE_OPENAI_ACCOUNT_NAME");
  const deployment = must("AZURE_CANDIDATE_DEPLOYMENT_NAME");
  const api = opt("AZURE_DEPLOYMENT_API_VERSION", "2024-10-01");
  return `https://management.azure.com/subscriptions/${encodeURIComponent(sub)}/resourceGroups/${encodeURIComponent(rg)}/providers/Microsoft.CognitiveServices/accounts/${encodeURIComponent(account)}/deployments/${encodeURIComponent(deployment)}?api-version=${encodeURIComponent(api)}`;
}

function sanitizeBody(existing, fineTunedModel) {
  const skuName =
    opt("AZURE_DEPLOYMENT_SKU_NAME") ||
    String(existing?.sku?.name || "Standard").trim() ||
    "Standard";
  const skuCapacity = Number(
    opt("AZURE_DEPLOYMENT_SKU_CAPACITY") || existing?.sku?.capacity || 10
  );

  const body = {
    sku: {
      name: skuName,
      capacity: Number.isFinite(skuCapacity) ? skuCapacity : 10,
    },
    properties: {
      model: {
        format:
          String(existing?.properties?.model?.format || "OpenAI").trim() ||
          "OpenAI",
        name: fineTunedModel,
        version:
          opt("AZURE_DEPLOYMENT_MODEL_VERSION") ||
          String(existing?.properties?.model?.version || "1").trim() ||
          "1",
      },
      versionUpgradeOption:
        opt("AZURE_DEPLOYMENT_VERSION_UPGRADE_OPTION") ||
        String(existing?.properties?.versionUpgradeOption || "NoAutoUpgrade"),
    },
  };

  const raiPolicyName =
    opt("AZURE_DEPLOYMENT_RAI_POLICY_NAME") ||
    String(existing?.properties?.raiPolicyName || "").trim();
  if (raiPolicyName) {
    body.properties.raiPolicyName = raiPolicyName;
  }

  return body;
}

async function main() {
  const fineTunedModel = must("FINE_TUNED_MODEL");
  const armUrl = buildArmUrl();

  console.log("[deploy] loading existing candidate deployment...");
  const current = await armFetch(armUrl, { method: "GET" });
  const existing = current.ok ? current.json : null;
  const creating = !current.ok && current.status === 404;

  if (!current.ok && !creating) {
    throw new Error(
      `Failed to load candidate deployment: ${current.status} ${current.text || ""}`
    );
  }

  const body = sanitizeBody(existing, fineTunedModel);
  console.log(
    `[deploy] ${creating ? "creating" : "updating"} candidate deployment with model=${fineTunedModel}`
  );

  const put = await armFetch(armUrl, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!put.ok) {
    const errMsg = put.json?.error?.message || put.text || "unknown";
    throw new Error(`Candidate deployment update failed: ${errMsg}`);
  }

  const pollSeconds = Math.max(
    5,
    Math.min(120, Number(opt("AZURE_DEPLOYMENT_POLL_SECONDS", "20")))
  );
  const timeoutMinutes = Math.max(
    5,
    Math.min(180, Number(opt("AZURE_DEPLOYMENT_TIMEOUT_MINUTES", "30")))
  );
  const deadline = Date.now() + timeoutMinutes * 60 * 1000;

  while (Date.now() < deadline) {
    const stateRes = await armFetch(armUrl, { method: "GET" });
    if (!stateRes.ok) {
      console.log(`[deploy] poll status=${stateRes.status}`);
    } else {
      const state = String(
        stateRes.json?.properties?.provisioningState || "unknown"
      ).toLowerCase();
      console.log(`[deploy] provisioningState=${state}`);
      if (state === "succeeded") {
        setGithubOutput("candidate_deployment_name", must("AZURE_CANDIDATE_DEPLOYMENT_NAME"));
        setGithubOutput("candidate_model_name", fineTunedModel);
        return;
      }
      if (state === "failed" || state === "canceled") {
        throw new Error(`Candidate deployment provisioning failed: ${state}`);
      }
    }
    await new Promise((r) => setTimeout(r, pollSeconds * 1000));
  }

  throw new Error(`Candidate deployment timeout after ${timeoutMinutes} minutes`);
}

main().catch((err) => {
  console.error(`[deploy] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
