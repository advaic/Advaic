import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // 1️⃣ Admin Gate
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  // 2️⃣ Service-role Supabase client (bypasses RLS safely)
  const supa = supabaseAdmin();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  // 3️⃣ Base query (source of truth: public.agents)
  let query = (supa.from("agents") as any)
    .select("id, email, name, company, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  // 4️⃣ Optional search
  if (q) {
    query = query.or(
      `email.ilike.%${q}%,name.ilike.%${q}%,company.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load agents", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    count: count ?? data?.length ?? 0,
    agents: data ?? [],
  });
}
