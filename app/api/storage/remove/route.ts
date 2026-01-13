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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const bucket = String(body?.bucket ?? "").trim();
  const paths = Array.isArray(body?.paths)
    ? body!.paths
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (!bucket || paths.length === 0)
    return jsonError("Missing bucket/paths", 400);
  if (!paths.every(isSafePath)) return jsonError("Invalid path", 400);

  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";

  const allowed = new Set([ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET]);
  if (!allowed.has(bucket)) return jsonError("Invalid bucket", 400);

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
      let propertyId: number | null = null;

      const isNew =
        parts.length >= 5 &&
        parts[0] === "agents" &&
        parts[1] === user.id &&
        parts[2] === "properties" &&
        Number.isFinite(Number(parts[3]));

      if (isNew) propertyId = Number(parts[3]);
      else {
        if (parts.length < 2 || !Number.isFinite(Number(parts[0])))
          throw new Error("Forbidden");
        propertyId = Number(parts[0]);
      }

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
    for (const p of paths) await assertAllowedPath(p);

    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) return jsonError(error.message, 400);

    return NextResponse.json({ ok: true, removed: paths.length });
  } catch (e: any) {
    const msg = String(e?.message || "Forbidden");
    if (msg === "NotFound") return jsonError("Property not found", 404);
    if (msg === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
