type Provider = "gmail" | "outlook";

export type EmailConnectionHealthRow = {
  provider: string | null;
  status?: string | null;
  watch_active?: boolean | null;
  watch_expiration?: string | null;
  outlook_subscription_expiration?: string | null;
  refresh_token?: string | null;
  last_error?: string | null;
};

export type ProviderConnectionHealth = {
  provider: Provider;
  total: number;
  connected: number;
  healthy: number;
  unhealthy: number;
  watch_inactive: number;
  expiring_24h: number;
  expired: number;
  missing_refresh_token: number;
  reauth_required: number;
  with_last_error: number;
};

export type EmailConnectionsHealthSummary = {
  by_provider: Record<Provider, ProviderConnectionHealth>;
  totals: {
    total: number;
    connected: number;
    healthy: number;
    unhealthy: number;
    expired: number;
    expiring_24h: number;
    action_required: number;
  };
};

const CONNECTED_STATUSES = new Set(["connected", "active", "watching"]);

function parseIsoMs(value: unknown) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function norm(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function createProviderHealth(provider: Provider): ProviderConnectionHealth {
  return {
    provider,
    total: 0,
    connected: 0,
    healthy: 0,
    unhealthy: 0,
    watch_inactive: 0,
    expiring_24h: 0,
    expired: 0,
    missing_refresh_token: 0,
    reauth_required: 0,
    with_last_error: 0,
  };
}

export function summarizeEmailConnectionsHealth(
  rows: EmailConnectionHealthRow[],
  nowMs = Date.now(),
): EmailConnectionsHealthSummary {
  const byProvider: Record<Provider, ProviderConnectionHealth> = {
    gmail: createProviderHealth("gmail"),
    outlook: createProviderHealth("outlook"),
  };

  for (const row of rows || []) {
    const providerRaw = norm(row?.provider);
    const provider: Provider | null =
      providerRaw === "gmail" ? "gmail" : providerRaw === "outlook" ? "outlook" : null;
    if (!provider) continue;

    const bucket = byProvider[provider];
    bucket.total += 1;

    const status = norm(row?.status);
    const connected = CONNECTED_STATUSES.has(status);
    if (connected) bucket.connected += 1;

    const watchActive = row?.watch_active !== false;
    if (connected && !watchActive) bucket.watch_inactive += 1;

    const refreshTokenPresent = String(row?.refresh_token || "").trim().length > 0;
    if (connected && !refreshTokenPresent) bucket.missing_refresh_token += 1;

    const lastError = norm(row?.last_error);
    if (lastError) bucket.with_last_error += 1;
    const reauthRequired =
      status === "needs_reconnect" ||
      lastError.includes("reauth") ||
      lastError.includes("missing_refresh_token");
    if (connected && reauthRequired) bucket.reauth_required += 1;

    const expirationSource =
      provider === "outlook"
        ? row?.outlook_subscription_expiration || row?.watch_expiration
        : row?.watch_expiration;
    const expirationMs = parseIsoMs(expirationSource);
    const expired = connected && expirationMs !== null && expirationMs <= nowMs;
    const expiring24h =
      connected &&
      expirationMs !== null &&
      expirationMs > nowMs &&
      expirationMs - nowMs <= 24 * 60 * 60 * 1000;
    if (expired) bucket.expired += 1;
    if (expiring24h) bucket.expiring_24h += 1;

    const unhealthy =
      connected &&
      (!watchActive || !refreshTokenPresent || reauthRequired || expired || status === "error");
    if (unhealthy) bucket.unhealthy += 1;
    if (connected && !unhealthy) bucket.healthy += 1;
  }

  const totals = {
    total: byProvider.gmail.total + byProvider.outlook.total,
    connected: byProvider.gmail.connected + byProvider.outlook.connected,
    healthy: byProvider.gmail.healthy + byProvider.outlook.healthy,
    unhealthy: byProvider.gmail.unhealthy + byProvider.outlook.unhealthy,
    expired: byProvider.gmail.expired + byProvider.outlook.expired,
    expiring_24h: byProvider.gmail.expiring_24h + byProvider.outlook.expiring_24h,
    action_required:
      byProvider.gmail.unhealthy +
      byProvider.outlook.unhealthy +
      byProvider.gmail.expiring_24h +
      byProvider.outlook.expiring_24h,
  };

  return {
    by_provider: byProvider,
    totals,
  };
}
