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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const bucket = String(body?.bucket ?? "").trim();
  const singlePath = String(body?.path ?? "").trim();
  const arrPaths = Array.isArray(body?.paths) ? body!.paths : [];
  const paths = [singlePath, ...arrPaths].map((p) => String(p ?? "").trim()).filter(Boolean);

  if (!bucket || paths.length === 0) {
    return jsonError("Missing bucket/path(s)", 400);
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

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  function parsePathParts(p: string) {
    return p.split("/").filter(Boolean);
  }

  async function validatePathForBucket(p: string) {
    const parts = parsePathParts(p);

    if (bucket === ATTACHMENTS_BUCKET) {
      // New: agents/<uid>/leads/<leadId>/...
      if (parts.length >= 5 && parts[0] === "agents" && parts[1] === user.id && parts[2] === "leads") {
        return;
      }
      // Legacy: <leadId>/...
      if (parts.length >= 2) {
        const leadId = parts[0];
        // Optional ownership check (best-effort): ensure lead belongs to this agent
        const { data: lead, error: leadErr } = await admin
          .from("leads")
          .select("id, agent_id")
          .eq("id", leadId)
          .single();

        if (leadErr || !lead) return jsonError("Lead not found", 404);
        if (String((lead as any).agent_id) !== String(user.id)) return jsonError("Forbidden", 403);
        return;
      }
      return jsonError("Invalid path", 400);
    }

    if (bucket === PROPERTY_IMAGES_BUCKET) {
      // New: agents/<uid>/properties/<propertyId>/...
      if (parts.length >= 5 && parts[0] === "agents" && parts[1] === user.id && parts[2] === "properties") {
        const propertyId = Number(parts[3]);
        if (!Number.isFinite(propertyId)) return jsonError("Invalid propertyId", 400);

        const { data: prop, error: propErr } = await admin
          .from("properties")
          .select("id, agent_id")
          .eq("id", propertyId)
          .single();

        if (propErr || !prop) return jsonError("Property not found", 404);
        if (String((prop as any).agent_id) !== String(user.id)) return jsonError("Forbidden", 403);
        return;
      }

      // Legacy: <propertyId>/...
      if (parts.length >= 2) {
        const propertyId = Number(parts[0]);
        if (!Number.isFinite(propertyId)) return jsonError("Invalid propertyId", 400);

        const { data: prop, error: propErr } = await admin
          .from("properties")
          .select("id, agent_id")
          .eq("id", propertyId)
          .single();

        if (propErr || !prop) return jsonError("Property not found", 404);
        if (String((prop as any).agent_id) !== String(user.id)) return jsonError("Forbidden", 403);
        return;
      }

      return jsonError("Invalid path", 400);
    }

    return jsonError("Invalid bucket", 400);
  }

  // TTL: allow 1–60 minutes (default 10 min)
  const requested = Number(body?.expiresIn);
  const ttl = Number.isFinite(requested)
    ? Math.max(60, Math.min(3600, requested))
    : 600;

  for (const p of paths) {
    const maybeErr = await validatePathForBucket(p);
    if (maybeErr instanceof NextResponse) return maybeErr;
  }

  const out: Record<string, string> = {};

  for (const p of paths) {
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(p, ttl);
    if (error || !data?.signedUrl) {
      return jsonError(error?.message || "Could not create signed url", 400);
    }
    out[p] = data.signedUrl;
  }

  // Backward compatibility: if caller used `path` (single), keep old response shape
  if (body?.path && paths.length === 1) {
    return NextResponse.json({ signedUrl: out[paths[0]], expiresIn: ttl });
  }

  return NextResponse.json({ signedUrls: out, expiresIn: ttl });
}
