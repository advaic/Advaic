"use client";

export type CookieConsentPreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_STORAGE_KEY = "advaic_cookie_consent_v1";
export const COOKIE_CONSENT_COOKIE_NAME = "advaic_cookie_consent_v1";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 Tage

function parseConsent(raw: string | null | undefined): CookieConsentPreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      version: 1,
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const parts = document.cookie.split(";").map((x) => x.trim());
  for (const part of parts) {
    if (part.startsWith(needle)) {
      return decodeURIComponent(part.slice(needle.length));
    }
  }
  return null;
}

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const fromStorage = parseConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {}

  return parseConsent(readCookie(COOKIE_CONSENT_COOKIE_NAME));
}

export function writeCookieConsent(prefs: Pick<CookieConsentPreferences, "analytics" | "marketing">) {
  if (typeof window === "undefined") return;
  const payload: CookieConsentPreferences = {
    version: 1,
    necessary: true,
    analytics: !!prefs.analytics,
    marketing: !!prefs.marketing,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {}

  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  }

  try {
    window.dispatchEvent(new CustomEvent("advaic:cookie-consent-changed", { detail: payload }));
  } catch {}
}

export function canUseCategory(category: "analytics" | "marketing"): boolean {
  const consent = readCookieConsent();
  if (!consent) return false;
  return category === "analytics" ? consent.analytics : consent.marketing;
}
