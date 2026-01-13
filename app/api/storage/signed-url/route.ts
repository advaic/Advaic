import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  bucket?: string;
  path?: string;
  expiresIn?: number;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const bucket = String(body?.bucket ?? "").trim();
  const path = String(body?.path ?? "").trim();

  if (!bucket || !path) {
    return jsonError("Missing bucket/path", 400);
  }

  // Buckets we allow signing for
  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

  const allowed = new Set([ATTACHMENTS_BUCKET, PROPERTY_IMAGES_BUCKET]);
  if (!allowed.has(bucket)) {
    return jsonError("Invalid bucket", 400);
  }

  // Authenticate via cookie session
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

  if (authErr || !user) {
    return jsonError("Unauthorized", 401);
  }

  // Critical security check: only allow signed URLs for paths owned by this user.
  // All our storage paths must start with `agents/<uid>/...`
  const prefix = `agents/${user.id}/`;
  if (!path.startsWith(prefix)) {
    return jsonError("Forbidden", 403);
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // TTL: allow 1–60 minutes (default 10 min)
  const requested = Number(body?.expiresIn);
  const ttl = Number.isFinite(requested)
    ? Math.max(60, Math.min(3600, requested))
    : 600;

  // Per-bucket structure + ownership checks
  const parts = path.split("/").filter(Boolean);

  if (bucket === ATTACHMENTS_BUCKET) {
    // expected: agents/<uid>/leads/<leadId>/...
    if (parts.length < 5 || parts[0] !== "agents" || parts[1] !== user.id || parts[2] !== "leads") {
      return jsonError("Invalid path", 400);
    }

    // leadId is parts[3]; optional DB check could be added later
  }

  if (bucket === PROPERTY_IMAGES_BUCKET) {
    // expected: agents/<uid>/properties/<propertyId>/...
    if (parts.length < 5 || parts[0] !== "agents" || parts[1] !== user.id || parts[2] !== "properties") {
      return jsonError("Invalid path", 400);
    }

    const propertyId = Number(parts[3]);
    if (!Number.isFinite(propertyId)) {
      return jsonError("Invalid propertyId", 400);
    }

    // Strong ownership check: property must belong to this agent
    const { data: prop, error: propErr } = await admin
      .from("properties")
      .select("id, agent_id")
      .eq("id", propertyId)
      .single();

    if (propErr || !prop) {
      return jsonError("Property not found", 404);
    }

    if (String((prop as any).agent_id) !== String(user.id)) {
      return jsonError("Forbidden", 403);
    }
  }

  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, ttl);

  if (error || !data?.signedUrl) {
    return jsonError(error?.message || "Could not create signed url", 400);
  }

  return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: ttl });
}
