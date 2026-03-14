import { existsSync, readFileSync } from "node:fs";

const defaultAuthStorageState = ".auth/app-user.json";
const requestedAuthStorageState = String(
  process.env.PLAYWRIGHT_AUTH_STORAGE_STATE || "",
).trim();
const rawAuthStorageState = requestedAuthStorageState || defaultAuthStorageState;
const rawLeadId = String(process.env.PLAYWRIGHT_LEAD_ID || "").trim();

function hasPersistedAuth(storagePath: string) {
  if (!storagePath || !existsSync(storagePath)) return false;

  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8"));
    const cookieCount = Array.isArray(parsed?.cookies) ? parsed.cookies.length : 0;
    const localStorageCount = Array.isArray(parsed?.origins)
      ? parsed.origins.reduce((sum: number, origin: { localStorage?: unknown[] }) => {
          return sum + (Array.isArray(origin?.localStorage) ? origin.localStorage.length : 0);
        }, 0)
      : 0;
    return cookieCount > 0 || localStorageCount > 0;
  } catch {
    return false;
  }
}

export const authStorageState = hasPersistedAuth(rawAuthStorageState)
  ? rawAuthStorageState
  : undefined;

export const hasAuthStorageState = Boolean(authStorageState);
export const leadId = rawLeadId || undefined;

export const authSkipReason = requestedAuthStorageState
  ? `PLAYWRIGHT_AUTH_STORAGE_STATE does not point to a readable, non-empty storageState JSON: ${requestedAuthStorageState}`
  : `Create ${defaultAuthStorageState} via npm run playwright:auth or set PLAYWRIGHT_AUTH_STORAGE_STATE to a non-empty storageState JSON with persisted auth.`;

export const leadSkipReason = leadId
  ? ""
  : "Set PLAYWRIGHT_LEAD_ID to a valid lead id for conversation-route tests.";
