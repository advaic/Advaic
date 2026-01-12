import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const { bucket, path, expiresIn } = (body || {}) as {
    bucket?: string;
    path?: string;
    expiresIn?: number;
  };

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket/path" }, { status: 400 });
  }

  // Must be signed previews for attachments bucket only
  const allowedBucket =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";
  if (bucket !== allowedBucket) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  // Authenticate
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Critical security check: only allow signed URLs for paths owned by this user.
  // Your upload path is: agents/<uid>/leads/<leadId>/...
  const prefix = `agents/${user.id}/`;
  if (!path.startsWith(prefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ttl = Number.isFinite(expiresIn)
    ? Math.max(30, Math.min(600, expiresIn!))
    : 300;

  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, ttl);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Could not create signed url" },
      { status: 400 }
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: ttl });
}
