import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  bucket?: string;
  path?: string;
  paths?: string[];
  expiresIn?: number;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizePaths(body: Body | null) {
  const single = String(body?.path ?? "").trim();
  const many = Array.isArray(body?.paths) ? body!.paths : [];
  const paths = (single ? [single] : many)
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);
  return paths;
}

function isSafePath(p: string) {
  // basic traversal hardening
  if (p.includes("..")) return false;
  if (p.startsWith("/")) return false;
  return true;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

async function getUserFromCookieSession(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseAuth = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();

  return { user, authErr };
}

function getAllowedBuckets() {
  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

  return {
    ATTACHMENTS_BUCKET,
    PROPERTY_IMAGES_BUCKET,
    allowed: new Set([ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET]),
  };
}

function clampTtl(expiresIn?: number) {
  // TTL: 1–60 minutes (default 10 min)
  const requested = Number(expiresIn);
  const ttl = Number.isFinite(requested)
    ? Math.max(60, Math.min(3600, requested))
    : 600;
  return ttl;
}

async function assertAllowedPath(params: {
  bucket: string;
  path: string;
  userId: string;
  admin: ReturnType<typeof createClient<Database>>;
  ATTACHMENTS_BUCKET: string;
  PROPERTY_IMAGES_BUCKET: string;
}) {
  const { bucket, path, userId, admin, ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET } =
    params;

  const parts = path.split("/").filter(Boolean);

  if (bucket === ATTACHMENTS_BUCKET) {
    // attachments MUST be in agents/<uid>/leads/<leadId>/...
    if (
      parts.length < 5 ||
      parts[0] !== "agents" ||
      parts[1] !== userId ||
      parts[2] !== "leads"
    ) {
      throw new Error("Forbidden");
    }
    return;
  }

  if (bucket === PROPERTY_IMAGES_BUCKET) {
    // allow BOTH:
    // A) agents/<uid>/properties/<propertyId>/...
    // B) <propertyId>/... (legacy)
    let propertyId: string | null = null;

    const isNew =
      parts.length >= 5 &&
      parts[0] === "agents" &&
      parts[1] === userId &&
      parts[2] === "properties" &&
      !!parts[3];

    if (isNew) {
      propertyId = String(parts[3]);
    } else {
      if (parts.length < 2 || !parts[0]) {
        throw new Error("Forbidden");
      }
      propertyId = String(parts[0]);
    }

    // Only allow UUID property ids (matches `properties.id` type)
    if (!isUuid(propertyId)) {
      throw new Error("Forbidden");
    }

    // Strong ownership check (works for uuid AND numeric)
    const { data: prop, error: propErr } = await admin
      .from("properties")
      .select("id, agent_id")
      .eq("id", propertyId)
      .single();

    if (propErr || !prop) throw new Error("NotFound");
    if (String((prop as any).agent_id) !== String(userId)) {
      throw new Error("Forbidden");
    }

    return;
  }

  // Should never happen due to "allowed buckets" check
  throw new Error("Invalid bucket");
}

export async function GET(req: NextRequest) {
  const bucketParam = String(req.nextUrl.searchParams.get("bucket") ?? "").trim();
  const pathParam = String(req.nextUrl.searchParams.get("path") ?? "").trim();
  const expiresInParam = req.nextUrl.searchParams.get("expiresIn");

  const body: Body = {
    bucket: bucketParam || undefined,
    path: pathParam || undefined,
    expiresIn: expiresInParam ? Number(expiresInParam) : undefined,
  };

  const bucket =
    String(body?.bucket ?? "").trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";
  const paths = normalizePaths(body);

  if (!bucket || paths.length === 0)
    return jsonError("Missing bucket/path(s)", 400);
  if (!paths.every(isSafePath)) return jsonError("Invalid path", 400);

  const { ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET, allowed } = getAllowedBuckets();
  if (!allowed.has(bucket)) return jsonError("Invalid bucket", 400);

  const { user, authErr } = await getUserFromCookieSession(req);
  if (authErr || !user) return jsonError("Unauthorized", 401);

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ttl = clampTtl(body?.expiresIn);

  try {
    const p = paths[0];

    await assertAllowedPath({
      bucket,
      path: p,
      userId: user.id,
      admin,
      ATTACHMENTS_BUCKET,
      PROPERTY_IMAGES_BUCKET,
    });

    const { data, error } = await admin.storage.from(bucket).createSignedUrl(p, ttl);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Could not create signed url");
    }

    // Redirect so <img src="/api/storage/signed-url?path=..."> works
    const r = NextResponse.redirect(data.signedUrl);
    r.headers.set("Cache-Control", "no-store");
    return r;
  } catch (e: any) {
    const msg = String(e?.message || "Forbidden");
    if (msg === "NotFound") return jsonError("Property not found", 404);
    if (msg === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const bucket =
    String(body?.bucket ?? "").trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";
  const paths = normalizePaths(body);

  if (!bucket || paths.length === 0)
    return jsonError("Missing bucket/path(s)", 400);
  if (!paths.every(isSafePath)) return jsonError("Invalid path", 400);

  const { ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET, allowed } = getAllowedBuckets();
  if (!allowed.has(bucket)) return jsonError("Invalid bucket", 400);

  const { user, authErr } = await getUserFromCookieSession(req);
  if (authErr || !user) return jsonError("Unauthorized", 401);

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ttl = clampTtl(body?.expiresIn);

  try {
    // Validate each path
    for (const p of paths) {
      await assertAllowedPath({
        bucket,
        path: p,
        userId: user.id,
        admin,
        ATTACHMENTS_BUCKET,
        PROPERTY_IMAGES_BUCKET,
      });
    }

    // Create signed urls (parallel)
    const pairs = await Promise.all(
      paths.map(async (p) => {
        const { data, error } = await admin.storage
          .from(bucket)
          .createSignedUrl(p, ttl);
        if (error || !data?.signedUrl) {
          throw new Error(error?.message || "Could not create signed url");
        }
        return [p, data.signedUrl] as const;
      })
    );

    const out: Record<string, string> = Object.fromEntries(pairs);

    // return single or batch shape
    if (paths.length === 1) {
      const r = NextResponse.json({ signedUrl: out[paths[0]], expiresIn: ttl });
      r.headers.set("Cache-Control", "no-store");
      return r;
    }
    const r = NextResponse.json({ signedUrls: out, expiresIn: ttl });
    r.headers.set("Cache-Control", "no-store");
    return r;
  } catch (e: any) {
    const msg = String(e?.message || "Forbidden");
    if (msg === "NotFound") return jsonError("Property not found", 404);
    if (msg === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}