import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { google } from "googleapis";
import { stripeRequest } from "@/lib/billing/stripe";
import {
  decryptSecretFromStorage,
  encryptSecretForStorage,
} from "@/lib/security/secrets";

export const runtime = "nodejs";

const CONFIRM_VALUES = new Set(["KONTO LOESCHEN", "KONTO LÖSCHEN", "DELETE"]);

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function createRouteClient(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
}

function createAdminClient() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function createVerifierClient() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function stripQueryAndHash(value: string) {
  return String(value || "").split("?")[0].split("#")[0];
}

function normalizeStoragePath(input: string, bucket: string): string {
  const raw = stripQueryAndHash(String(input || "").trim());
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const path = url.pathname;
    const marker = "/storage/v1/object/";
    const idx = path.indexOf(marker);
    if (idx >= 0) {
      const after = path.slice(idx + marker.length);
      const parts = after.split("/").filter(Boolean);
      if (parts.length >= 3) {
        const b = parts[1];
        const rest = parts.slice(2).join("/");
        if (b === bucket) return rest;
      }
      const needle = `/${bucket}/`;
      const nIdx = after.indexOf(needle);
      if (nIdx >= 0) return after.slice(nIdx + needle.length);
    }
  } catch {
    // not a URL
  }

  if (raw.startsWith(`${bucket}/`)) return raw.slice(bucket.length + 1);
  if (raw.startsWith("/")) return raw.slice(1);
  return raw;
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function tokenStillValid(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const ts = Date.parse(String(expiresAt));
  if (!Number.isFinite(ts)) return false;
  return ts - Date.now() > 2 * 60 * 1000;
}

async function refreshOutlookAccessToken(refreshToken: string) {
  const clientId =
    process.env.OUTLOOK_CLIENT_ID ||
    process.env.MICROSOFT_CLIENT_ID ||
    process.env.AZURE_AD_CLIENT_ID ||
    "";
  const clientSecret =
    process.env.OUTLOOK_CLIENT_SECRET ||
    process.env.MICROSOFT_CLIENT_SECRET ||
    process.env.AZURE_AD_CLIENT_SECRET ||
    "";
  if (!clientId || !clientSecret) {
    throw new Error("missing_outlook_client_env");
  }

  const tenant =
    process.env.OUTLOOK_TENANT_ID ||
    process.env.MICROSOFT_TENANT_ID ||
    process.env.AZURE_AD_TENANT_ID ||
    "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", refreshToken);
  form.set(
    "scope",
    process.env.OUTLOOK_REFRESH_SCOPE ||
      "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
  );

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const t = await resp?.text().catch(() => "");
    throw new Error(`outlook_token_refresh_failed:${resp?.status ?? 0}:${t.slice(0, 220)}`);
  }

  const data = (await resp.json().catch(() => null)) as any;
  const accessToken = String(data?.access_token || "");
  const newRefreshToken = data?.refresh_token ? String(data.refresh_token) : null;
  const expiresIn = Number(data?.expires_in);
  if (!accessToken || !Number.isFinite(expiresIn)) {
    throw new Error("outlook_token_refresh_invalid_payload");
  }
  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAtIso: new Date(Date.now() + Math.max(300, expiresIn - 60) * 1000).toISOString(),
  };
}

async function revokeOutlookSubscription(accessToken: string, subscriptionId: string) {
  const url = `https://graph.microsoft.com/v1.0/subscriptions/${encodeURIComponent(subscriptionId)}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => null);
  if (!resp) throw new Error("outlook_delete_subscription_network_error");
  if (resp.status === 404 || resp.status === 410) return;
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`outlook_delete_subscription_failed:${resp.status}:${t.slice(0, 220)}`);
  }
}

async function revokeGoogleToken(token: string) {
  if (!token) return;
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  }).catch(() => null);
}

function gmailRedirectUri() {
  const explicit = String(process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (explicit) return explicit;
  const site = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!site) return "http://localhost:3000/api/auth/gmail/callback";
  return new URL("/api/auth/gmail/callback", site).toString();
}

async function stopGmailWatch(refreshToken: string) {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret || !refreshToken) return;

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    gmailRedirectUri(),
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  try {
    await gmail.users.stop({ userId: "me" });
  } catch {
    // Ignore if watch already stopped / token invalid.
  }
}

async function cancelStripeSubscriptions(admin: ReturnType<typeof createAdminClient>, agentId: string) {
  const { data: subs } = await (admin.from("billing_subscriptions") as any)
    .select("stripe_subscription_id,status")
    .eq("agent_id", agentId);
  for (const row of subs || []) {
    const subId = String(row?.stripe_subscription_id || "").trim();
    const status = String(row?.status || "").toLowerCase();
    if (!subId) continue;
    if (["canceled", "incomplete_expired", "unpaid"].includes(status)) continue;
    try {
      await stripeRequest({
        path: `/subscriptions/${encodeURIComponent(subId)}/cancel`,
        method: "POST",
        body: {},
      });
    } catch {
      // best-effort only
    }
  }
}

async function deprovisionExternalIntegrations(
  admin: ReturnType<typeof createAdminClient>,
  agentId: string,
) {
  const { data: conns } = await (admin.from("email_connections") as any)
    .select(
      "id,provider,refresh_token,access_token,expires_at,outlook_subscription_id",
    )
    .eq("agent_id", agentId);

  for (const conn of conns || []) {
    const provider = String(conn?.provider || "").toLowerCase();
    const refreshToken = decryptSecretFromStorage(conn?.refresh_token || "");
    const accessToken = decryptSecretFromStorage(conn?.access_token || "");
    const expiresAt = conn?.expires_at ? String(conn.expires_at) : null;

    if (provider === "gmail") {
      await stopGmailWatch(refreshToken);
      await revokeGoogleToken(refreshToken);
      if (accessToken) await revokeGoogleToken(accessToken);
      continue;
    }

    if (provider === "outlook") {
      const subId = String(conn?.outlook_subscription_id || "").trim();
      let usableToken = accessToken;
      if (!usableToken || !tokenStillValid(expiresAt)) {
        if (refreshToken) {
          try {
            const refreshed = await refreshOutlookAccessToken(refreshToken);
            usableToken = refreshed.accessToken;
            await (admin.from("email_connections") as any)
              .update({
                access_token: encryptSecretForStorage(refreshed.accessToken),
                refresh_token: encryptSecretForStorage(
                  refreshed.refreshToken || refreshToken,
                ),
                expires_at: refreshed.expiresAtIso,
                updated_at: new Date().toISOString(),
              })
              .eq("id", conn.id);
          } catch {
            usableToken = "";
          }
        }
      }

      if (usableToken && subId) {
        try {
          await revokeOutlookSubscription(usableToken, subId);
        } catch {
          // best-effort only
        }
      }
    }
  }

  await cancelStripeSubscriptions(admin, agentId);
}

async function removeStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  paths: string[],
) {
  const unique = Array.from(
    new Set(
      paths
        .map((p) => String(p || "").trim())
        .filter((p) => p && !p.startsWith("/") && !p.includes("..")),
    ),
  );
  if (!unique.length) return;

  for (const part of chunked(unique, 100)) {
    const { error } = await admin.storage.from(bucket).remove(part);
    if (error) {
      console.warn("[account/delete] storage remove warning", {
        bucket,
        count: part.length,
        message: error.message,
      });
    }
  }
}

async function listStorageFilesByPrefix(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
) {
  const root = String(prefix || "").trim().replace(/^\/+|\/+$/g, "");
  if (!root) return [] as string[];

  const files: string[] = [];
  const queue = [root];
  const seen = new Set<string>();

  while (queue.length) {
    const folder = queue.shift()!;
    if (seen.has(folder)) continue;
    seen.add(folder);

    let offset = 0;
    while (true) {
      const { data, error } = await (admin.storage.from(bucket) as any).list(folder, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error || !Array.isArray(data) || data.length === 0) break;

      for (const item of data as any[]) {
        const name = String(item?.name || "").trim();
        if (!name || name === "." || name === "..") continue;
        const fullPath = `${folder}/${name}`;
        // Folder objects typically don't have an id in Supabase list results.
        if (!item?.id) queue.push(fullPath);
        else files.push(fullPath);
      }

      if (data.length < 100) break;
      offset += 100;
      if (offset > 5000) break;
    }
  }

  return files;
}

async function tryDeleteByPropertyIds(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  propertyIds: string[],
) {
  if (!propertyIds.length) return;
  const { error } = await (admin.from(table as any) as any).delete().in("property_id", propertyIds);
  if (error) {
    const m = String(error.message || "");
    if (
      m.includes("does not exist") ||
      m.includes("relation") ||
      (m.includes("column") && m.includes("property_id"))
    ) {
      return;
    }
  }
}

async function purgeAgentStorageObjects(
  admin: ReturnType<typeof createAdminClient>,
  agentId: string,
) {
  const attachmentsBucket =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const propertyImagesBucket =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    process.env.PROPERTY_IMAGES_BUCKET ||
    "property-images";

  const { data: properties } = await (admin.from("properties") as any)
    .select("id, image_urls")
    .eq("agent_id", agentId);

  const propertyIds = (properties || [])
    .map((p: any) => String(p?.id || "").trim())
    .filter(Boolean);

  const imagePathsFromProperties: string[] = [];
  for (const row of properties || []) {
    const urls = Array.isArray((row as any)?.image_urls) ? (row as any).image_urls : [];
    for (const raw of urls) {
      const normalized = normalizeStoragePath(String(raw || ""), propertyImagesBucket);
      if (normalized) imagePathsFromProperties.push(normalized);
    }
  }

  const { data: propertyImageRows } = propertyIds.length
    ? await (admin.from("property_images") as any)
        .select("image_url")
        .in("property_id", propertyIds)
    : ({ data: [] } as any);

  const imagePathsFromPropertyTable = (propertyImageRows || [])
    .map((r: any) => normalizeStoragePath(String(r?.image_url || ""), propertyImagesBucket))
    .filter(Boolean);

  const { data: emailAttRows } = await (admin.from("email_attachments") as any)
    .select("storage_bucket, storage_path, path")
    .eq("agent_id", agentId);

  const attachmentByBucket: Record<string, string[]> = {};
  for (const row of emailAttRows || []) {
    const bucket = String(row?.storage_bucket || attachmentsBucket).trim();
    const rawPath = String(row?.storage_path || row?.path || "").trim();
    if (!bucket || !rawPath) continue;
    attachmentByBucket[bucket] = attachmentByBucket[bucket] || [];
    attachmentByBucket[bucket].push(normalizeStoragePath(rawPath, bucket));
  }

  for (const [bucket, paths] of Object.entries(attachmentByBucket)) {
    await removeStoragePaths(admin, bucket, paths);
  }

  await removeStoragePaths(admin, propertyImagesBucket, [
    ...imagePathsFromProperties,
    ...imagePathsFromPropertyTable,
  ]);

  const attachmentPrefixPaths = await listStorageFilesByPrefix(
    admin,
    attachmentsBucket,
    `agents/${agentId}/leads`,
  );
  await removeStoragePaths(admin, attachmentsBucket, attachmentPrefixPaths);

  const propertyPrefixPaths = await listStorageFilesByPrefix(
    admin,
    propertyImagesBucket,
    `agents/${agentId}/properties`,
  );
  await removeStoragePaths(admin, propertyImagesBucket, propertyPrefixPaths);

  for (const propertyId of propertyIds) {
    const legacyPaths = await listStorageFilesByPrefix(admin, propertyImagesBucket, propertyId);
    await removeStoragePaths(admin, propertyImagesBucket, legacyPaths);
  }

  await tryDeleteByPropertyIds(admin, "property_images", propertyIds);
  await tryDeleteByPropertyIds(admin, "property_sources", propertyIds);
  await tryDeleteByPropertyIds(admin, "property_followup_policies", propertyIds);
}

async function tryDeleteByAgentId(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  agentId: string,
) {
  const { error } = await (admin.from(table as any) as any).delete().eq("agent_id", agentId);
  if (error) {
    const m = String(error.message || "");
    if (
      m.includes("does not exist") ||
      m.includes("relation") ||
      (m.includes("column") && m.includes("agent_id"))
    ) {
      return;
    }
  }
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteClient(req, res);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as {
    current_password?: string;
    confirm_text?: string;
  } | null;

  const currentPassword = String(body?.current_password || "");
  const confirmText = String(body?.confirm_text || "").trim().toUpperCase();

  if (!currentPassword) {
    return jsonError(400, "Aktuelles Passwort ist erforderlich");
  }
  if (!CONFIRM_VALUES.has(confirmText)) {
    return jsonError(400, "Bestätigungstext ungültig");
  }
  if (!user.email) {
    return jsonError(400, "Benutzerkonto hat keine E-Mail-Adresse");
  }

  const verifier = createVerifierClient();
  const { error: verifyErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) return jsonError(400, "Aktuelles Passwort ist falsch");

  const admin = createAdminClient();
  try {
    await deprovisionExternalIntegrations(admin, user.id);
  } catch (e) {
    // Deprovisioning is best-effort and must not block account deletion.
    console.warn("[account/delete] external deprovision failed:", e);
  }
  try {
    await purgeAgentStorageObjects(admin, user.id);
  } catch (e) {
    console.warn("[account/delete] storage purge failed:", e);
  }

  // Best effort cleanup for app tables before deleting auth user.
  const agentScopedTables = [
    "agent_notification_settings",
    "billing_customers",
    "billing_subscriptions",
    "billing_invoices",
    "agent_style",
    "agent_style_examples",
    "agent_settings",
    "agent_onboarding",
    "agent_tour_state",
    "agent_tour_step_events",
    "agent_tours",
    "documents",
    "email_attachments",
    "email_classifications",
    "email_message_bodies",
    "followup_configs",
    "followups_queue_v1",
    "followup_history",
    "lead_copilot_state",
    "lead_property_state",
    "message_intents",
    "notification_events",
    "notification_deliveries",
    "email_connections",
    "immoscout_connections",
    "message_drafts",
    "message_qas",
    "message_routes",
    "messages",
    "properties",
    "leads",
    "slack_connections",
  ];
  for (const table of agentScopedTables) {
    await tryDeleteByAgentId(admin, table, user.id);
  }

  await (admin.from("agents") as any).delete().eq("id", user.id);

  const { error: deleteUserErr } = await admin.auth.admin.deleteUser(user.id, false);
  if (deleteUserErr) {
    return jsonError(500, `Konto konnte nicht gelöscht werden: ${deleteUserErr.message}`);
  }

  return NextResponse.json({ ok: true });
}
