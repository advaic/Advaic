type CanaryVariant = "stable" | "candidate";

export type CanaryDeploymentSelection = {
  deployment: string;
  variant: CanaryVariant;
  canaryPercent: number;
  bucket: number;
  unitKey: string;
  candidateConfigured: boolean;
};

function clampPercent(input: unknown) {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function hashUnitKey(input: string) {
  // Lightweight deterministic hash (FNV-1a 32-bit)
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickCanaryDeployment(args: {
  stableDeployment: string;
  candidateDeployment?: string | null;
  canaryPercent?: number | string | null;
  unitKey: string;
}): CanaryDeploymentSelection {
  const stable = String(args.stableDeployment || "").trim();
  const candidate = String(args.candidateDeployment || "").trim();
  const canaryPercent = clampPercent(args.canaryPercent);
  const unitKey = String(args.unitKey || "default");
  const bucket = (hashUnitKey(unitKey) % 10_000) / 100;

  if (!candidate || canaryPercent <= 0) {
    return {
      deployment: stable,
      variant: "stable",
      canaryPercent,
      bucket,
      unitKey,
      candidateConfigured: Boolean(candidate),
    };
  }

  if (canaryPercent >= 100 || bucket < canaryPercent) {
    return {
      deployment: candidate,
      variant: "candidate",
      canaryPercent,
      bucket,
      unitKey,
      candidateConfigured: true,
    };
  }

  return {
    deployment: stable,
    variant: "stable",
    canaryPercent,
    bucket,
    unitKey,
    candidateConfigured: true,
  };
}

export function formatModelTag(args: {
  base?: string;
  deployment: string;
  variant: CanaryVariant;
}) {
  const base = String(args.base || "azure").trim();
  const deployment = String(args.deployment || "").trim() || "unknown";
  const variant = args.variant === "candidate" ? "candidate" : "stable";
  return `${base}:${deployment}:${variant}`;
}
