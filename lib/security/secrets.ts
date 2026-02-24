import crypto from "crypto";

const PREFIX = "enc:v1:";
let warnedMissingKey = false;

function normalizeKey(raw: string): Buffer | null {
  const v = String(raw || "").trim();
  if (!v) return null;

  // 32-byte key as base64
  try {
    const b64 = Buffer.from(v, "base64");
    if (b64.length === 32) return b64;
  } catch {
    // noop
  }

  // 64-char hex (32 bytes)
  if (/^[a-fA-F0-9]{64}$/.test(v)) {
    return Buffer.from(v, "hex");
  }

  return null;
}

function getKey(): Buffer | null {
  return normalizeKey(process.env.ADVAIC_SECRET_ENCRYPTION_KEY || "");
}

export function isEncryptedSecret(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecretForStorage(value: unknown): string | null {
  const plain = String(value ?? "").trim();
  if (!plain) return null;

  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing ADVAIC_SECRET_ENCRYPTION_KEY");
    }
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[secrets] ADVAIC_SECRET_ENCRYPTION_KEY missing; storing plaintext secret in non-production mode.",
      );
    }
    return plain;
  }
  if (isEncryptedSecret(plain)) return plain;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");

  return `${PREFIX}${payload}`;
}

export function decryptSecretFromStorage(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (!isEncryptedSecret(raw)) {
    return raw;
  }

  const key = getKey();
  if (!key) return "";

  const encoded = raw.slice(PREFIX.length);
  try {
    const payload = Buffer.from(encoded, "base64");
    if (payload.length <= 12 + 16) return "";

    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const data = payload.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return plain;
  } catch {
    return "";
  }
}
