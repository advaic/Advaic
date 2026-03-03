import fs from "node:fs";
import path from "node:path";

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

function apiVersion() {
  return opt("AZURE_OPENAI_API_VERSION_FINE_TUNE", "2024-10-21");
}

function endpointBase() {
  return must("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, "");
}

async function uploadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Datei nicht gefunden: ${filePath}`);
  }

  const key = must("AZURE_OPENAI_API_KEY");
  const form = new FormData();
  const content = await fs.promises.readFile(filePath);
  const filename = path.basename(filePath);
  const blob = new Blob([content], { type: "application/jsonl" });

  form.append("purpose", "fine-tune");
  form.append("file", blob, filename);

  const url = `${endpointBase()}/openai/files?api-version=${encodeURIComponent(apiVersion())}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": key },
    body: form,
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
    throw new Error(`Azure file upload failed (${filename}): ${msg}`);
  }

  const fileId = String(json?.id || "").trim();
  if (!fileId) {
    throw new Error(`Azure upload response enthält keine file id (${filename}).`);
  }

  return fileId;
}

async function main() {
  const trainPath = must("AZURE_FT_TRAIN_FILE_PATH");
  const validPath = opt("AZURE_FT_VALID_FILE_PATH");

  console.log(`[upload] train file: ${trainPath}`);
  const trainingFileId = await uploadFile(trainPath);
  console.log(`[upload] training_file_id=${trainingFileId}`);
  setGithubOutput("training_file_id", trainingFileId);

  let validationFileId = "";
  if (validPath) {
    console.log(`[upload] valid file: ${validPath}`);
    validationFileId = await uploadFile(validPath);
    console.log(`[upload] validation_file_id=${validationFileId}`);
    setGithubOutput("validation_file_id", validationFileId);
  } else {
    console.log("[upload] Kein Validierungsfile gesetzt.");
  }
}

main().catch((err) => {
  console.error(`[upload] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
