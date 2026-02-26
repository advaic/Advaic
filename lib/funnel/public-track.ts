import { resolveLandingConversion } from "@/lib/marketing/conversion-map";
import { canUseCategory } from "@/lib/marketing/cookie-consent";

type PublicTrackInput = {
  event: string;
  source?: string;
  path?: string;
  pageGroup?: string;
  ctaVariant?: string;
  meta?: Record<string, unknown>;
};

const VID_KEY = "advaic_public_vid_v1";
const SID_KEY = "advaic_public_sid_v1";
const ENTRY_KEY = "advaic_public_entry_v1";

type EntryContext = {
  entry_path: string;
  entry_query: string | null;
  entry_referrer: string | null;
  entry_at: string;
};

function getOrCreateStorageId(key: string, session = false): string | null {
  if (typeof window === "undefined") return null;
  const storage = session ? window.sessionStorage : window.localStorage;
  try {
    const current = storage.getItem(key);
    if (current && current.trim()) return current;
    const next = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
}

function getEntryContext(): EntryContext | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(ENTRY_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as EntryContext;
      if (parsed?.entry_path) return parsed;
    }

    const created: EntryContext = {
      entry_path: window.location.pathname,
      entry_query: window.location.search || null,
      entry_referrer: document.referrer || null,
      entry_at: new Date().toISOString(),
    };
    window.sessionStorage.setItem(ENTRY_KEY, JSON.stringify(created));
    return created;
  } catch {
    return null;
  }
}

export async function trackPublicEvent(input: PublicTrackInput): Promise<void> {
  if (typeof window === "undefined") return;
  if (!canUseCategory("analytics")) return;
  const event = String(input.event || "").trim();
  if (!event) return;

  const visitorId = getOrCreateStorageId(VID_KEY, false);
  const sessionId = getOrCreateStorageId(SID_KEY, true);
  const entryContext = getEntryContext();
  const conversion = resolveLandingConversion(window.location.pathname);

  const rawMeta =
    input.meta && typeof input.meta === "object" && !Array.isArray(input.meta) ? input.meta : {};

  const autoMeta: Record<string, unknown> = {
    event_schema: "public_marketing_v2",
    section:
      typeof rawMeta.section === "string"
        ? rawMeta.section
        : typeof rawMeta.component === "string"
          ? rawMeta.component
          : "unspecified",
    current_path: window.location.pathname,
    current_query: window.location.search || null,
    current_hash: window.location.hash || null,
    landing_family: conversion.family,
    landing_reporting_key: conversion.reportingKey,
    landing_stage: conversion.stage,
    landing_primary_href: conversion.primaryHref,
    landing_secondary_href: conversion.secondaryHref,
    ...entryContext,
  };

  const payload = {
    event,
    source: input.source || "marketing",
    path: input.path || window.location.pathname,
    page_group: input.pageGroup || null,
    cta_variant: input.ctaVariant || null,
    visitor_id: visitorId,
    session_id: sessionId,
    referrer: document.referrer || null,
    meta: { ...autoMeta, ...rawMeta },
  };

  try {
    await fetch("/api/funnel/public-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Tracking must never block UI.
  }
}
