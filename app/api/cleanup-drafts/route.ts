// File: /app/api/cleanup-drafts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Deletes stale draft properties + their mirrored images from the private `property-images` bucket.
 *
 * IMPORTANT:
 * - Your current schema stores image paths in `properties.image_urls` (text[]), NOT `property_images`.
 * - We only delete when the draft has been inactive for a while (based on `last_edit_at` if present,
 *   else `draft_started_at`, else `created_at`).
 * - Route is internal-only. Use GitHub Actions / cron with x-advaic-internal-secret.
 */
export async function POST(req: NextRequest) {
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Default: delete drafts inactive for 24h.
  // You can override in cron by sending JSON: { "minutes": 60 }
  const body = await req.json().catch(() => null);
  const minutes = Number(body?.minutes);
  const cutoffMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 24 * 60;

  const now = Date.now();
  const cutoffIso = new Date(now - cutoffMinutes * 60 * 1000).toISOString();

  // Fetch candidate drafts. Keep selection minimal.
  // We rely on your `properties` schema:
  // - status (text, default 'draft')
  // - image_urls (text[])
  // - last_edit_at (timestamptz, nullable)
  // - draft_started_at (timestamptz, not null)
  // - created_at (timestamptz, nullable)
  const { data: drafts, error: fetchError } = await (supabase
    .from("properties") as any)
    .select("id, agent_id, status, image_urls, last_edit_at, draft_started_at, created_at")
    .eq("status", "draft")
    // conservative: if last_edit_at exists and is recent, we won't delete; same for draft_started_at
    .or(
      `last_edit_at.is.null,last_edit_at.lt.${cutoffIso},draft_started_at.lt.${cutoffIso},created_at.lt.${cutoffIso}`
    )
    .limit(200);

  if (fetchError) {
    console.error("[cleanup-drafts] Failed to fetch drafts:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }

  const results: Array<{
    property_id: string;
    deleted: boolean;
    deleted_images?: number;
    error?: string;
  }> = [];

  for (const d of drafts || []) {
    const propertyId = String(d.id);

    try {
      // Determine last activity timestamp (fail-safe: prefer last_edit_at)
      const lastActivity =
        (d.last_edit_at ? new Date(String(d.last_edit_at)) : null) ||
        (d.draft_started_at ? new Date(String(d.draft_started_at)) : null) ||
        (d.created_at ? new Date(String(d.created_at)) : null);

      if (!lastActivity) {
        // If we cannot determine activity, do NOT delete.
        results.push({
          property_id: propertyId,
          deleted: false,
          error: "missing_activity_timestamp",
        });
        continue;
      }

      if (lastActivity.toISOString() > cutoffIso) {
        // still fresh
        results.push({ property_id: propertyId, deleted: false });
        continue;
      }

      // 1) Delete images from bucket (paths are already stored as bucket-relative paths)
      const imageUrls: string[] = Array.isArray(d.image_urls)
        ? (d.image_urls as unknown[])
            .map((x) => (typeof x === "string" ? x : ""))
            .filter(Boolean)
        : [];

      let deletedImages = 0;
      if (imageUrls.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from("property-images")
          .remove(imageUrls);

        if (storageErr) {
          // Log but keep going — we still delete the DB row to avoid draft buildup.
          console.error(
            `[cleanup-drafts] Storage delete failed for ${propertyId}:`,
            storageErr
          );
        } else {
          deletedImages = imageUrls.length;
        }
      }

      // 2) Delete the property row
      const { error: delErr } = await (supabase.from("properties") as any)
        .delete()
        .eq("id", propertyId)
        .eq("status", "draft");

      if (delErr) {
        results.push({
          property_id: propertyId,
          deleted: false,
          deleted_images: deletedImages,
          error: delErr.message,
        });
        continue;
      }

      results.push({
        property_id: propertyId,
        deleted: true,
        deleted_images: deletedImages,
      });
    } catch (e: any) {
      results.push({
        property_id: propertyId,
        deleted: false,
        error: String(e?.message || e),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    cutoff_minutes: cutoffMinutes,
    candidates: drafts?.length || 0,
    deleted: results.filter((r) => r.deleted).length,
    results,
  });
}

// For safety, we do not expose GET in production.
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
