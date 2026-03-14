const OWNER_ENV_NAMES = [
  "ADVAIC_OWNER_USER_IDS",
  "ADVAIC_OWNER_USER_ID",
  "ADMIN_DASHBOARD_USER_IDS",
  "ADMIN_DASHBOARD_USER_ID",
] as const;

const INTERNAL_PREMIUM_ENV_NAMES = [
  "ADVAIC_INTERNAL_PREMIUM_USER_IDS",
  "ADVAIC_INTERNAL_PREMIUM_USER_ID",
] as const;

function parseConfiguredUserIds(envNames: readonly string[]) {
  const ids = new Set<string>();

  for (const envName of envNames) {
    const raw = String(process.env[envName] || "").trim();
    if (!raw) continue;

    for (const candidate of raw.split(",")) {
      const normalized = candidate.trim();
      if (normalized) ids.add(normalized);
    }
  }

  return Array.from(ids);
}

export function getOwnerUserIds(): string[] {
  return parseConfiguredUserIds(OWNER_ENV_NAMES);
}

export function getInternalPremiumUserIds(): string[] {
  return Array.from(
    new Set([
      ...getOwnerUserIds(),
      ...parseConfiguredUserIds(INTERNAL_PREMIUM_ENV_NAMES),
    ]),
  );
}

export function isOwnerUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getOwnerUserIds().includes(String(userId).trim());
}

export function hasInternalPremiumAccess(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getInternalPremiumUserIds().includes(String(userId).trim());
}
