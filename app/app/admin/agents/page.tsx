export const dynamic = "force-dynamic";

import { headers } from "next/headers";

async function getOriginFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function getAgents(q?: string) {
  const base = "/api/admin/agents";
  const url = q ? `${base}?q=${encodeURIComponent(q)}` : base;

  // IMPORTANT: Server Components fetch does NOT automatically forward the user's auth cookies.
  // Without forwarding cookies, the admin guard will treat the request as unauthenticated.
  const h = await headers();
  const cookie = h.get("cookie") || "";
  const origin = await getOriginFromHeaders();

  const res = await fetch(new URL(url, origin), {
    cache: "no-store",
    headers: cookie ? { cookie } : {},
  });

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data?.error || "Failed to load agents");

  // support both {agents:[...]} and {ok:true, agents:[...]} shapes
  return Array.isArray((data as any)?.agents) ? (data as any).agents : [];
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = searchParams?.q || "";
  const agents = await getAgents(q);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin • Agents</h1>
            <div className="text-sm text-gray-600 mt-1">
              Admins sehen alle Agents. Klick = Detailseite.
            </div>
          </div>

          <form className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Suche (Name, Email, Company)…"
              className="w-72 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
            <button className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-amber-200 hover:bg-gray-800">
              Suchen
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] text-sm text-gray-600">
            {agents.length} Agents
          </div>

          <div className="divide-y divide-gray-200">
            {agents.map((a: any) => (
              <a
                key={a.id}
                href={`/app/admin/agents/${a.id}`}
                className="block px-4 md:px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {a.name || "—"}{" "}
                      <span className="text-xs text-gray-500">
                        • {a.company || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {a.email}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">
                    {a.created_at
                      ? new Date(a.created_at).toLocaleDateString("de-DE")
                      : ""}
                  </div>
                </div>
              </a>
            ))}
            {agents.length === 0 && (
              <div className="px-4 md:px-6 py-6 text-sm text-gray-600">
                Keine Treffer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
