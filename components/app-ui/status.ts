export type StatusTone = "brand" | "success" | "warning" | "danger" | "neutral";

const badgeClassByTone: Record<StatusTone, string> = {
  brand: "app-badge-brand",
  success: "border app-status-success",
  warning: "border app-status-warning",
  danger: "border app-status-danger",
  neutral: "border app-status-neutral",
};

const surfaceClassByTone: Record<StatusTone, string> = {
  brand: "app-surface-brand",
  success: "app-surface-success",
  warning: "app-surface-warning",
  danger: "app-surface-danger",
  neutral: "app-surface-neutral",
};

const rowClassByTone: Record<StatusTone, string> = {
  brand: "app-row-brand",
  success: "app-row-success",
  warning: "app-row-warning",
  danger: "app-row-danger",
  neutral: "app-row-neutral",
};

export function statusBadgeClass(tone: StatusTone): string {
  return badgeClassByTone[tone];
}

export function statusSurfaceClass(tone: StatusTone): string {
  return surfaceClassByTone[tone];
}

export function statusRowClass(tone: StatusTone): string {
  return rowClassByTone[tone];
}
