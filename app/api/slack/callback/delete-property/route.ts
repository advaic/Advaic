import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  propertyId?: string;
  agent_id?: string;
  agentId?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
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
    }
  );
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const propertyId = String(body?.propertyId || "").trim();

    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }

    const internal = isInternal(request);
    let actorAgentId = "";

    if (internal) {
      actorAgentId = String(body?.agent_id || body?.agentId || "").trim();
      if (!actorAgentId) {
        return NextResponse.json(
          { error: "missing_agent_id_for_internal_call" },
          { status: 400 }
        );
      }
    } else {
      const authRes = NextResponse.next();
      const authSupabase = supabaseFromReq(request, authRes);
      const {
        data: { user },
        error: userErr,
      } = await authSupabase.auth.getUser();

      if (userErr || !user?.id) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      actorAgentId = String(user.id);
    }

    const admin = supabaseAdmin();

    // Ownership guard: property must belong to the acting agent.
    const { data: property, error: propertyLookupErr } = await (
      admin.from("properties") as any
    )
      .select("id, agent_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (propertyLookupErr) {
      return NextResponse.json(
        { error: "Failed to load property: " + propertyLookupErr.message },
        { status: 500 }
      );
    }
    if (!property?.id) {
      return NextResponse.json({ error: "property_not_found" }, { status: 404 });
    }
    if (String(property.agent_id || "") !== actorAgentId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Fetch image records to get file paths for deletion from storage.
    const { data: imageRecords, error: fetchError } = await (
      admin.from("property_images") as any
    )
      .select("image_url")
      .eq("property_id", propertyId);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch image records: " + fetchError.message },
        { status: 500 }
      );
    }

    const filePaths = (imageRecords || [])
      .map((record: { image_url: string }) => {
        const match = String(record?.image_url || "").match(/property-images\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter((p): p is string => !!p);

    if (filePaths.length > 0) {
      const { error: storageDeleteError } = await admin.storage
        .from("property-images")
        .remove(filePaths);

      if (storageDeleteError) {
        return NextResponse.json(
          { error: "Failed to delete files from storage: " + storageDeleteError.message },
          { status: 500 }
        );
      }
    }

    // Delete all related image records.
    const { error: imageDeleteError } = await (admin.from("property_images") as any)
      .delete()
      .eq("property_id", propertyId);

    if (imageDeleteError) {
      return NextResponse.json(
        { error: "Failed to delete related images: " + imageDeleteError.message },
        { status: 500 }
      );
    }

    // Delete the property itself.
    const { error: propertyDeleteError } = await (admin.from("properties") as any)
      .delete()
      .eq("id", propertyId);

    if (propertyDeleteError) {
      return NextResponse.json(
        { error: "Failed to delete property: " + propertyDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
