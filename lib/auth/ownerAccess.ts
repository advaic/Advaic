const FALLBACK_OWNER_USER_ID = "3582c768-0edd-4536-9501-268b881599df";

export function getOwnerUserId(): string {
  return (
    String(process.env.ADVAIC_OWNER_USER_ID || "").trim() ||
    String(process.env.ADMIN_DASHBOARD_USER_ID || "").trim() ||
    FALLBACK_OWNER_USER_ID
  );
}

export function isOwnerUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return String(userId).trim() === getOwnerUserId();
}
