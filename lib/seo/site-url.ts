const DEFAULT_SITE_URL = "https://www.advaic.com";

export function getSiteUrl(): string {
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}
