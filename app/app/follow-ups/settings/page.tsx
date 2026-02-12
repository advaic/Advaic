"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
} from "lucide-react";

type FollowupSettings = {
  followups_enabled_default: boolean;

  followups_max_stage_rent: number; // 0..2
  followups_max_stage_buy: number; // 0..2

  followups_delay_hours_stage1: number; // 1..336
  followups_delay_hours_stage2: number; // 1..336

  followups_sender_mode: string | null; // nullable for future
};

const DEFAULTS: FollowupSettings = {
  followups_enabled_default: true,
  followups_max_stage_rent: 2,
  followups_max_stage_buy: 2,
  followups_delay_hours_stage1: 24,
  followups_delay_hours_stage2: 72,
  followups_sender_mode: null,
};

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.round(n);
  return Math.min(max, Math.max(min, i));
}

export default function FollowupsSettingsUI() {
  const supabase = useSupabaseClient<Database>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState<FollowupSettings>(DEFAULTS);

  const canSave = useMemo(() => {
    // simple guardrails (must match your SQL constraints)
    if (form.followups_max_stage_rent < 0 || form.followups_max_stage_rent > 2)
      return false;
    if (form.followups_max_stage_buy < 0 || form.followups_max_stage_buy > 2)
      return false;

    if (
      form.followups_delay_hours_stage1 < 1 ||
      form.followups_delay_hours_stage1 > 336
    )
      return false;

    if (
      form.followups_delay_hours_stage2 < 1 ||
      form.followups_delay_hours_stage2 > 336
    )
      return false;

    return true;
  }, [form]);

  async function load() {
    try {
      setLoading(true);

      // Preferred: load via API (keeps logic centralized)
      const res = await fetch("/api/agent/settings/followups", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok) {
        throw new Error(
          String(data?.error || "failed_to_load_followup_settings"),
        );
      }

      const raw = (data?.settings || data || {}) as Partial<FollowupSettings>;

      const next: FollowupSettings = {
        followups_enabled_default:
          typeof raw.followups_enabled_default === "boolean"
            ? raw.followups_enabled_default
            : DEFAULTS.followups_enabled_default,

        followups_max_stage_rent: clampInt(
          raw.followups_max_stage_rent,
          0,
          2,
          DEFAULTS.followups_max_stage_rent,
        ),
        followups_max_stage_buy: clampInt(
          raw.followups_max_stage_buy,
          0,
          2,
          DEFAULTS.followups_max_stage_buy,
        ),

        followups_delay_hours_stage1: clampInt(
          raw.followups_delay_hours_stage1,
          1,
          336,
          DEFAULTS.followups_delay_hours_stage1,
        ),
        followups_delay_hours_stage2: clampInt(
          raw.followups_delay_hours_stage2,
          1,
          336,
          DEFAULTS.followups_delay_hours_stage2,
        ),

        followups_sender_mode:
          raw.followups_sender_mode === null ||
          typeof raw.followups_sender_mode === "string"
            ? raw.followups_sender_mode
            : null,
      };

      setForm(next);
      setDirty(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Fehler beim Laden der Einstellungen.");
      // keep defaults
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!canSave || saving) return;

    try {
      setSaving(true);

      const payload: FollowupSettings = {
        ...form,
        followups_max_stage_rent: clampInt(
          form.followups_max_stage_rent,
          0,
          2,
          2,
        ),
        followups_max_stage_buy: clampInt(
          form.followups_max_stage_buy,
          0,
          2,
          2,
        ),
        followups_delay_hours_stage1: clampInt(
          form.followups_delay_hours_stage1,
          1,
          336,
          24,
        ),
        followups_delay_hours_stage2: clampInt(
          form.followups_delay_hours_stage2,
          1,
          336,
          72,
        ),
      };

      const res = await fetch("/api/agent/settings/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok) {
        throw new Error(
          String(data?.error || "failed_to_save_followup_settings"),
        );
      }

      setDirty(false);
      toast.success("Einstellungen gespeichert.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-10 w-72 bg-white rounded-xl border border-gray-200 animate-pulse mb-3" />
          <div className="h-4 w-[520px] bg-white rounded-xl border border-gray-200 animate-pulse mb-6" />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="followups-settings-page"
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/app/follow-ups"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Zurück"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Link>

              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Follow-up Einstellungen
              </h1>

              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Definiere, <span className="font-medium">ob</span> Follow-ups
              standardmäßig aktiv sind,{" "}
              <span className="font-medium">wie viele</span> pro Intent
              (Miete/Kauf) erlaubt sind und{" "}
              <span className="font-medium">wann</span> sie ausgelöst werden.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              title="Neu laden"
            >
              <RefreshCw className="h-4 w-4" />
              Neu laden
            </button>

            <button
              onClick={save}
              disabled={!dirty || !canSave || saving}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Speichern"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              Global Defaults (Agent)
              {dirty && (
                <span className="ml-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Ungespeichert
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              Änderungen gelten für neue/ungeplante Follow-ups.
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Toggle */}
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-medium">
                    Follow-ups standardmäßig aktiv
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Wenn deaktiviert, werden Follow-ups{" "}
                    <span className="font-medium">nicht automatisch</span>{" "}
                    geplant (außer du aktivierst es pro Lead/Property).
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={!!form.followups_enabled_default}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        followups_enabled_default: e.target.checked,
                      }));
                      setDirty(true);
                    }}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    {form.followups_enabled_default ? "An" : "Aus"}
                  </span>
                </label>
              </div>
            </div>

            {/* Max stages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingBox
                title="Max. Follow-ups (Miete)"
                desc="Wie viele Follow-ups maximal bei Mietanfragen gesendet werden dürfen."
              >
                <select
                  value={form.followups_max_stage_rent}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      followups_max_stage_rent: clampInt(
                        e.target.value,
                        0,
                        2,
                        2,
                      ),
                    }));
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                >
                  <option value={0}>0 (keine)</option>
                  <option value={1}>1 Follow-up</option>
                  <option value={2}>2 Follow-ups</option>
                </select>
              </SettingBox>

              <SettingBox
                title="Max. Follow-ups (Kauf)"
                desc="Wie viele Follow-ups maximal bei Kaufanfragen gesendet werden dürfen."
              >
                <select
                  value={form.followups_max_stage_buy}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      followups_max_stage_buy: clampInt(
                        e.target.value,
                        0,
                        2,
                        2,
                      ),
                    }));
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                >
                  <option value={0}>0 (keine)</option>
                  <option value={1}>1 Follow-up</option>
                  <option value={2}>2 Follow-ups</option>
                </select>
              </SettingBox>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingBox
                title="1. Follow-up nach (Stunden)"
                desc="Standard: 24h nach letzter Aktivität / fehlender Antwort."
              >
                <input
                  type="number"
                  min={1}
                  max={336}
                  value={form.followups_delay_hours_stage1}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      followups_delay_hours_stage1: clampInt(
                        e.target.value,
                        1,
                        336,
                        24,
                      ),
                    }));
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </SettingBox>

              <SettingBox
                title="2. Follow-up nach (Stunden)"
                desc="Standard: 72h nach dem ersten Follow-up."
              >
                <input
                  type="number"
                  min={1}
                  max={336}
                  value={form.followups_delay_hours_stage2}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      followups_delay_hours_stage2: clampInt(
                        e.target.value,
                        1,
                        336,
                        72,
                      ),
                    }));
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </SettingBox>
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-gray-200 bg-[#fbfbfc] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-700 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    Empfehlung (V1)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    24h + 72h funktioniert zuverlässig, wirkt nicht spammy und
                    lässt genug Zeit für echte Antworten. Für besonders heiße
                    Leads können wir später Lead- oder Property-Overrides
                    anbieten.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions (mobile-friendly) */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={save}
                disabled={!dirty || !canSave || saving}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Speichern
              </button>
            </div>
          </div>
        </div>

        {/* Small note */}
        <p className="text-xs text-gray-500 mt-4">
          Hinweis: Diese Seite setzt nur die Agent-Defaults. Lead- und
          Property-Overrides (falls vorhanden) überschreiben diese Defaults.
        </p>
      </div>
    </div>
  );
}

function SettingBox({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
