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

  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";

  const allowed = new Set([ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET]);
  if (!allowed.has(bucket)) return jsonError("Invalid bucket", 400);

  // Auth via cookie session
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
  if (authErr || !user) return jsonError("Unauthorized", 401);

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // TTL: 1–60 minutes (default 10 min)
  const requested = Number(body?.expiresIn);
  const ttl = Number.isFinite(requested)
    ? Math.max(60, Math.min(3600, requested))
    : 600;

  async function assertAllowedPath(path: string) {
    const parts = path.split("/").filter(Boolean);

    if (bucket === ATTACHMENTS_BUCKET) {
      // attachments MUST be in agents/<uid>/leads/<leadId>/...
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

    // PROPERTY_IMAGES_BUCKET:
    // allow BOTH:
    // A) agents/<uid>/properties/<propertyId>/...
    // B) <propertyId>/...  (legacy)
    if (bucket === PROPERTY_IMAGES_BUCKET) {
      let propertyId: number | null = null;

      const isNew =
        parts.length >= 5 &&
        parts[0] === "agents" &&
        parts[1] === user.id &&
        parts[2] === "properties" &&
        Number.isFinite(Number(parts[3]));

      if (isNew) {
        propertyId = Number(parts[3]);
      } else {
        // legacy: first segment must be numeric propertyId
        if (parts.length < 2 || !Number.isFinite(Number(parts[0]))) {
          throw new Error("Forbidden");
        }
        propertyId = Number(parts[0]);
      }

      // Strong ownership check
      const { data: prop, error: propErr } = await admin
        .from("properties")
        .select("id, agent_id")
        .eq("id", propertyId)
        .single();

      if (propErr || !prop) throw new Error("NotFound");
      if (String((prop as any).agent_id) !== String(user.id))
        throw new Error("Forbidden");

      return;
    }
  }

  try {
    // Validate each path
    for (const p of paths) await assertAllowedPath(p);

    // Create signed urls
    const out: Record<string, string> = {};
    for (const p of paths) {
      const { data, error } = await admin.storage
        .from(bucket)
        .createSignedUrl(p, ttl);
      if (error || !data?.signedUrl)
        throw new Error(error?.message || "Could not create signed url");
      out[p] = data.signedUrl;
    }

    // return single or batch shape
    if (paths.length === 1) {
      return NextResponse.json({ signedUrl: out[paths[0]], expiresIn: ttl });
    }
    return NextResponse.json({ signedUrls: out, expiresIn: ttl });
  } catch (e: any) {
    const msg = String(e?.message || "Forbidden");
    if (msg === "NotFound") return jsonError("Property not found", 404);
    if (msg === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
