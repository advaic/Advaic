import Link from "next/link";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function ensureAgentSettingsRow(agentId: string) {
  const supabase = supabaseAdmin();
  // upsert minimal row so toggles always work
  await (supabase.from("agent_settings") as any).upsert(
    {
      agent_id: agentId,
    },
    { onConflict: "agent_id" },
  );
}

async function setAgentSetting(agentId: string, patch: Record<string, any>) {
  const supabase = supabaseAdmin();
  await ensureAgentSettingsRow(agentId);
  const { error } = await (supabase.from("agent_settings") as any)
    .update({ ...patch })
    .eq("agent_id", agentId);
  if (error) throw new Error(error.message);
}

// -------- Server Actions (Admin-only; access already guarded by middleware + /api/admin/_guard) --------
async function actionToggleAutosend(formData: FormData) {
  "use server";
  const agentId = String(formData.get("agent_id") || "").trim();
  const next = String(formData.get("next") || "").trim();
  if (!agentId) throw new Error("Missing agent_id");
  const nextBool = next === "true";
  await setAgentSetting(agentId, { autosend_enabled: nextBool });
  revalidatePath(`/app/admin/agents/${agentId}`);
}

async function actionToggleFollowupsDefault(formData: FormData) {
  "use server";
  const agentId = String(formData.get("agent_id") || "").trim();
  const next = String(formData.get("next") || "").trim();
  if (!agentId) throw new Error("Missing agent_id");
  const nextBool = next === "true";
  await setAgentSetting(agentId, { followups_enabled_default: nextBool });
  revalidatePath(`/app/admin/agents/${agentId}`);
}

async function actionSetOnboardingCompleted(formData: FormData) {
  "use server";
  const agentId = String(formData.get("agent_id") || "").trim();
  const next = String(formData.get("next") || "").trim();
  if (!agentId) throw new Error("Missing agent_id");
  const nextBool = next === "true";
  await setAgentSetting(agentId, { onboarding_completed: nextBool });
  revalidatePath(`/app/admin/agents/${agentId}`);
}


async function getBaseUrl() {
  // Works in dev + prod, including Vercel previews.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function getAgentDetail(id: string) {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/admin/agents/${id}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load agent detail");
  return data;
}

export default async function AdminAgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getAgentDetail(params.id);
  const a = data.agent;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/app/admin/agents"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Zurück
            </Link>
            <h1 className="text-2xl font-semibold mt-2">
              {a?.name || "Agent"}{" "}
              <span className="text-sm text-gray-500 font-normal">
                • {a?.email}
              </span>
            </h1>
            <div className="text-sm text-gray-600 mt-1">{a?.company || "—"}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                label={`Autosend: ${data.settings?.autosend_enabled ? "An" : "Aus"}`}
                tone={data.settings?.autosend_enabled ? "ok" : "warn"}
              />
              <Badge
                label={`Follow-ups Default: ${data.settings?.followups_enabled_default ? "An" : "Aus"}`}
                tone={data.settings?.followups_enabled_default ? "ok" : "warn"}
              />
              <Badge
                label={`Onboarding: ${data.settings?.onboarding_completed ? "Fertig" : "Offen"}`}
                tone={data.settings?.onboarding_completed ? "ok" : "neutral"}
              />
              <Badge label={`Created: ${fmt(a?.created_at)}`} tone="neutral" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/admin/overview"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Admin Overview
            </Link>
            <Link
              href="/app/admin/outbox"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Outbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Panel title="Settings">
            <KV
              k="autosend_enabled"
              v={String(!!data.settings?.autosend_enabled)}
            />
            <KV
              k="followups_enabled_default"
              v={String(!!data.settings?.followups_enabled_default)}
            />
            <KV
              k="onboarding_completed"
              v={String(!!data.settings?.onboarding_completed)}
            />
            <KV k="updated_at" v={fmt(data.settings?.updated_at)} />
          </Panel>

          <Panel title="Admin Actions">
            <div className="text-sm text-gray-600">
              Änderungen wirken sofort. Diese Controls sind nur für Admins gedacht.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <form action={actionToggleAutosend}>
                <input type="hidden" name="agent_id" value={String(a?.id || params.id)} />
                <input
                  type="hidden"
                  name="next"
                  value={String(!data.settings?.autosend_enabled)}
                />
                <button
                  className={`rounded-xl px-3 py-2 text-sm border transition-colors ${
                    data.settings?.autosend_enabled
                      ? "bg-gray-900 text-amber-200 border-gray-900 hover:bg-gray-800"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Autosend {data.settings?.autosend_enabled ? "deaktivieren" : "aktivieren"}
                </button>
              </form>

              <form action={actionToggleFollowupsDefault}>
                <input type="hidden" name="agent_id" value={String(a?.id || params.id)} />
                <input
                  type="hidden"
                  name="next"
                  value={String(!data.settings?.followups_enabled_default)}
                />
                <button
                  className={`rounded-xl px-3 py-2 text-sm border transition-colors ${
                    data.settings?.followups_enabled_default
                      ? "bg-gray-900 text-amber-200 border-gray-900 hover:bg-gray-800"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Follow-ups Default {data.settings?.followups_enabled_default ? "deaktivieren" : "aktivieren"}
                </button>
              </form>

              <form action={actionSetOnboardingCompleted}>
                <input type="hidden" name="agent_id" value={String(a?.id || params.id)} />
                <input
                  type="hidden"
                  name="next"
                  value={String(!data.settings?.onboarding_completed)}
                />
                <button
                  className={`rounded-xl px-3 py-2 text-sm border transition-colors ${
                    data.settings?.onboarding_completed
                      ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      : "bg-gray-900 text-amber-200 border-gray-900 hover:bg-gray-800"
                  }`}
                  title="Nur für Debug/Support: setzt onboarding_completed in agent_settings"
                >
                  Onboarding {data.settings?.onboarding_completed ? "auf offen setzen" : "auf fertig setzen"}
                </button>
              </form>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Tipp: Wenn ein Agent z.B. Follow-ups komplett verhindern will, ist „Follow-ups Default deaktivieren“ der schnellste globale Schalter.
            </div>
          </Panel>

          <Panel title="Connections">
            {(data.connections || []).length === 0 ? (
              <div className="text-sm text-gray-600">Keine Connections.</div>
            ) : (
              <div className="space-y-2">
                {(data.connections || []).map((c: any) => (
                  <div
                    key={c.id}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{c.provider}</div>
                      <Badge
                        label={String(c.status || "unknown")}
                        tone={String(c.status || "").toLowerCase().includes("active") ? "ok" : "neutral"}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {c.email_address || "—"}
                    </div>
                    {c.last_error && (
                      <div className="text-xs text-red-700 mt-1">
                        {c.last_error}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      updated: {fmt(c.updated_at)} • expires:{" "}
                      {fmt(c.expires_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Panel title="Recent Sends">
            {(data.recent_sends || []).length === 0 ? (
              <div className="text-sm text-gray-600">Keine Sends gefunden.</div>
            ) : (
              <div className="space-y-2">
                {(data.recent_sends || []).slice(0, 20).map((m: any) => (
                  <div
                    key={m.id}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="text-sm font-medium">
                      {m.send_status} • {m.email_provider || "?"}{" "}
                      {m.was_followup ? "• followup" : ""}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fmt(m.timestamp)} • sent: {fmt(m.sent_at)}
                    </div>
                    {m.send_error && (
                      <div className="text-xs text-red-700 mt-2 whitespace-pre-wrap">
                        {m.send_error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Recent Leads">
            {(data.recent_leads || []).length === 0 ? (
              <div className="text-sm text-gray-600">Keine Leads gefunden.</div>
            ) : (
              <div className="space-y-2">
                {(data.recent_leads || []).slice(0, 20).map((l: any) => (
                  <div
                    key={l.id}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="text-sm font-medium">{l.name || "—"}</div>
                    <div className="text-sm text-gray-600">{l.email || "—"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      provider: {l.email_provider || "?"} • followups_enabled:{" "}
                      {String(!!l.followups_enabled)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      last_message: {fmt(l.last_message_at)} • last_agent:{" "}
                      {fmt(l.last_agent_message_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] font-medium">
        {title}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm border-b border-gray-100 py-2 last:border-b-0">
      <div className="text-gray-600">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function fmt(v: any) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("de-DE");
  } catch {
    return String(v);
  }
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral";
}) {
  const base = "rounded-full px-2.5 py-1 text-xs font-medium border";
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-gray-200 bg-gray-50 text-gray-700";
  return <span className={`${base} ${cls}`}>{label}</span>;
}
