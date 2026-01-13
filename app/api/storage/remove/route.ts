import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  bucket?: string;
  paths?: string[];
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isSafePath(p: string) {
  if (!p) return false;
  if (p.includes("..")) return false;
  if (p.startsWith("/")) return false;
  return true;
}

function stripQueryAndHash(s: string) {
  return s.split("?")[0].split("#")[0];
}

function normalizeStoragePath(input: string, bucket: string): string {
  const raw = stripQueryAndHash(String(input ?? "").trim());
  if (!raw) return "";

  // If a full URL is provided, extract the object path after `/object/`.
  // Examples:
  // - https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<path>
  // - https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  try {
    const u = new URL(raw);
    const path = u.pathname; // no query
    const marker = "/storage/v1/object/";
    const idx = path.indexOf(marker);
    if (idx >= 0) {
      const after = path.slice(idx + marker.length); // e.g. sign/<bucket>/<path>
      const parts = after.split("/").filter(Boolean);
      if (parts.length >= 3) {
        // parts[0] is scope (public|sign|authenticated|...) or sometimes "sign"
        // parts[1] is bucket
        const b = parts[1];
        const rest = parts.slice(2).join("/");
        if (b === bucket) return rest;
      }
      // Fallback: try to find `/<bucket>/` anywhere after marker
      const bucketNeedle = `/${bucket}/`;
      const bIdx = after.indexOf(bucketNeedle);
      if (bIdx >= 0) return after.slice(bIdx + bucketNeedle.length);
    }
  } catch {
    // not a URL
  }

  // If path is prefixed with bucket, strip it
  if (raw.startsWith(`${bucket}/`)) return raw.slice(bucket.length + 1);

  // If path starts with a leading slash, strip it
  if (raw.startsWith("/")) return raw.slice(1);

  return raw;
}

async function handleRemove(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const bucket = String(body?.bucket ?? "").trim();
  const rawPaths = Array.isArray(body?.paths)
    ? body!.paths.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  if (!bucket || rawPaths.length === 0)
    return jsonError("Missing bucket/paths", 400);

  const paths = rawPaths
    .map((p) => normalizeStoragePath(p, bucket))
    .filter(Boolean);

  if (paths.length === 0) return jsonError("Invalid path", 400);
  if (!paths.every(isSafePath)) return jsonError("Invalid path", 400);

  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";

  const allowed = new Set([ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET]);
  if (!allowed.has(bucket)) return jsonError("Invalid bucket", 400);

  // Create a mutable response for SSR auth cookie updates
  const cookieRes = NextResponse.next();

  const supabaseAuth = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          cookieRes.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieRes.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();
  if (authErr || !user) {
    const out = jsonError("Unauthorized", 401);
    // best-effort copy any cookies that might have been set
    try {
      (cookieRes.cookies.getAll?.() ?? []).forEach((c: any) =>
        out.cookies.set(c)
      );
    } catch {}
    return out;
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // minimal ownership checks for property images (covers legacy + new)
  async function assertAllowedPath(path: string) {
    const parts = path.split("/").filter(Boolean);

    if (bucket === ATTACHMENTS_BUCKET) {
      if (
        parts.length < 5 ||
        parts[0] !== "agents" ||
        parts[1] !== user.id ||
        parts[2] !== "leads"
      ) {
        throw new Error("Forbidden");
      }
      return;
    }

    if (bucket === PROPERTY_IMAGES_BUCKET) {
      let propertyId: string | null = null;

      const isNew =
        parts.length >= 5 &&
        parts[0] === "agents" &&
        parts[1] === user.id &&
        parts[2] === "properties" &&
        Boolean(parts[3]);

      if (isNew) {
        propertyId = String(parts[3]);
      } else {
        // legacy: <propertyId>/<filename>
        if (parts.length < 2 || !parts[0]) throw new Error("Forbidden");
        propertyId = String(parts[0]);
      }

      const { data: prop, error: propErr } = await admin
        .from("properties")
        .select("id, agent_id")
        .eq("id", propertyId as any)
        .single();

      if (propErr || !prop) throw new Error("NotFound");
      if (String((prop as any).agent_id) !== String(user.id))
        throw new Error("Forbidden");
      return;
    }
  }

  try {
    for (const p of paths) await assertAllowedPath(p);

    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      const out = jsonError(error.message, 400);
      try {
        (cookieRes.cookies.getAll?.() ?? []).forEach((c: any) =>
          out.cookies.set(c)
        );
      } catch {}
      return out;
    }

    const out = NextResponse.json({ ok: true, removed: paths.length, bucket, paths });
    try {
      (cookieRes.cookies.getAll?.() ?? []).forEach((c: any) => out.cookies.set(c));
    } catch {}
    return out;
  } catch (e: any) {
    const msg = String(e?.message || "Forbidden");
    let out: NextResponse;
    if (msg === "NotFound") out = jsonError("Property not found", 404);
    else if (msg === "Forbidden") out = jsonError("Forbidden", 403);
    else out = jsonError(msg, 400);

    try {
      (cookieRes.cookies.getAll?.() ?? []).forEach((c: any) => out.cookies.set(c));
    } catch {}
    return out;
  }
}

export async function POST(req: NextRequest) {
  return handleRemove(req);
}

export async function DELETE(req: NextRequest) {
  return handleRemove(req);
}
