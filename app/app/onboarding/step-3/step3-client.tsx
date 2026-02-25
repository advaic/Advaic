"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackFunnelEvent } from "@/lib/funnel/track";

/**
 * IMPORTANT:
 * Set this to your real settings endpoint.
 * You previously mentioned you have /api/agent/settings (NOT agent-settings).
 */
const SETTINGS_ENDPOINT = "/api/agent/settings/autosend";

type OnboardingRow = {
  current_step: number;
  step_autosend_done: boolean;
  step_email_connected_done: boolean;
  completed_at: string | null;
};

type StatusResponse =
  | { ok: true; onboarding: OnboardingRow | null }
  | { error: string; details?: string };

type AutosendGateCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail?: string | null;
};

type AutosendGate = {
  eligible: boolean;
  checks: AutosendGateCheck[];
  reasons: string[];
  metrics?: {
    property_count?: number;
    reviewed_reply_count?: number;
    failed_sends_last_14d?: number;
    min_reviewed_replies?: number;
    max_failed_sends_last_14d?: number;
  };
};

async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/onboarding/status", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  }).catch(() => null);

  if (!res) return { error: "network_error" };
  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    return {
      error: String(json?.error || "status_failed"),
      details: json?.details,
    };
  }
  return json as StatusResponse;
}

async function bootstrap(): Promise<boolean> {
  const res = await fetch("/api/onboarding/bootstrap", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(() => null);
  return !!res?.ok;
}

async function updateOnboarding(patch: Record<string, any>) {
  const res = await fetch("/api/onboarding/update", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => null);

  const json = (await res?.json().catch(() => null)) as any;
  if (!res || !res.ok) throw new Error(String(json?.error || "update_failed"));
  return json;
}

/**
 * Settings API (best-effort):
 * - GET should return current settings
 * - POST/PATCH should update
 *
 * We keep it permissive because your backend might differ.
 */
async function fetchSettings(): Promise<any> {
  const res = await fetch(SETTINGS_ENDPOINT, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  }).catch(() => null);

  if (!res) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  return json;
}

async function saveSettings(patch: Record<string, any>) {
  // This endpoint supports GET/POST (no PATCH).
  const res = await fetch(SETTINGS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => null);

  const json = await res?.json().catch(() => null);
  if (!res || !res.ok) {
    const base = String(json?.error || json?.message || "settings_update_failed");
    const firstReason = Array.isArray(json?.autosend_gate?.reasons)
      ? String(json.autosend_gate.reasons[0] || "").trim()
      : "";
    const msg = firstReason ? `${base}: ${firstReason}` : base;
    throw new Error(msg);
  }
  return json;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium"
      style={{
        borderColor: "var(--border, rgba(0,0,0,0.08))",
        background: "rgba(0,0,0,0.02)",
        color: "var(--textMuted, rgba(14,14,17,0.65))",
      }}
    >
      {children}
    </span>
  );
}

function AdvaicPrimary({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-[12px] border px-5 py-3 text-[14px] font-semibold transition",
        disabled && "opacity-60"
      )}
      style={{
        borderColor: "var(--gold, #C9A23F)",
        background: "var(--black, #0E0E11)",
        color: "#fff",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "var(--gold, #C9A23F)";
        e.currentTarget.style.color = "var(--black, #0E0E11)";
        e.currentTarget.style.boxShadow =
          "0 0 0 3px var(--goldGlow, rgba(201,162,63,0.22))";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "var(--black, #0E0E11)";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  title,
  desc,
  recommended,
  active,
  disabled,
  onClick,
}: {
  title: string;
  desc: string;
  recommended?: boolean;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-[14px] border p-4 transition",
        disabled && "cursor-not-allowed opacity-70"
      )}
      style={{
        borderColor: disabled
          ? "var(--border, rgba(0,0,0,0.08))"
          : active
          ? "rgba(201,162,63,0.45)"
          : "var(--border, rgba(0,0,0,0.08))",
        boxShadow: disabled
          ? "none"
          : active
          ? "0 0 0 3px var(--goldGlow, rgba(201,162,63,0.22))"
          : "none",
        background: "#fff",
        transform: !disabled && active ? "translateY(-1px)" : "translateY(0px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold">{title}</div>
          <div
            className="mt-1 text-[13px] leading-relaxed"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            {desc}
          </div>
        </div>

        {recommended ? (
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.14)",
              color: "var(--black, #0E0E11)",
            }}
          >
            Empfohlen
          </span>
        ) : disabled ? (
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "var(--border, rgba(0,0,0,0.08))",
              background: "rgba(0,0,0,0.03)",
              color: "var(--textMuted, rgba(14,14,17,0.65))",
            }}
          >
            Vorerst gesperrt
          </span>
        ) : active ? (
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.14)",
              color: "var(--black, #0E0E11)",
            }}
          >
            Ausgewählt
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function Step3Client() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<OnboardingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<AutosendGate | null>(null);

  const [saving, setSaving] = useState(false);

  // We store the user's selection here:
  // "approval" = Freigabe; "auto" = Auto-Send
  const [mode, setMode] = useState<"approval" | "auto">("approval");

  const emailConnected = useMemo(
    () => Boolean(row?.step_email_connected_done),
    [row]
  );
  const autoUnlocked = useMemo(() => Boolean(gate?.eligible), [gate]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      let st = await fetchStatus();

      if ("ok" in st && st.ok === true && !st.onboarding) {
        const booted = await bootstrap();
        if (booted) st = await fetchStatus();
      }

      if (cancelled) return;

      if ("ok" in st && st.ok === true) {
        const ob = st.onboarding;
        setRow(ob);

        if (ob?.completed_at) {
          router.replace("/app");
          return;
        }

        // Guard: if step 2 not done, send back to email connect step
        if (!ob?.step_email_connected_done) {
          router.replace("/app/onboarding/step-2");
          return;
        }

        // If user already past this, forward
        if ((ob?.current_step || 1) > 3) {
          router.replace("/app/onboarding/step-4");
          return;
        }

        // Load autosend state and readiness (best effort)
        const settingsResp = await fetchSettings().catch(() => null);
        const autosendGate = settingsResp?.autosend_gate as AutosendGate | null;
        setGate(autosendGate);
        // Default bleibt bewusst konservativ auf Freigabe.
        setMode("approval");

        setLoading(false);
        return;
      }

      setError((st as any)?.error || "unknown_error");
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSaveAndContinue() {
    try {
      setSaving(true);
      setError(null);

      // We write in the most future-proof way:
      // - If your backend expects different key, it's still one place to adapt.
      const autosendEnabled = mode === "auto" && autoUnlocked;
      if (mode === "auto" && !autoUnlocked) {
        setMode("approval");
        throw new Error("Auto-Send ist erst möglich, wenn alle Trust-Gate-Punkte erfüllt sind.");
      }

      void trackFunnelEvent({
        event: "onboarding_control_saved",
        source: "onboarding_step_3",
        step: 3,
        meta: {
          selected_mode: mode,
          autosend_enabled: autosendEnabled,
          auto_unlocked: autoUnlocked,
        },
      });

      const saved = await saveSettings({
        // API expects exactly this key
        autosend_enabled: autosendEnabled,
      });
      if (saved?.autosend_gate) {
        setGate(saved.autosend_gate as AutosendGate);
      }

      await updateOnboarding({
        step_autosend_done: true,
        current_step: 4,
      });

      router.push("/app/onboarding/step-4");
    } catch (e: any) {
      setError(String(e?.message || "save_failed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Pill>Kontrolle</Pill>
        <div className="text-[22px] font-semibold tracking-tight">
          Kontrolle festlegen
        </div>
        <div
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          className="text-[14px]"
        >
          lädt…
        </div>
      </div>
    );
  }

  if (!emailConnected) {
    // Should be unreachable due to redirect guard, but keep safe.
    return (
      <div className="space-y-4">
        <Pill>Kontrolle</Pill>
        <div className="text-[22px] font-semibold tracking-tight">
          Bitte zuerst dein Postfach verbinden
        </div>
        <AdvaicPrimary
          onClick={() => router.push("/app/onboarding/step-2")}
        >
          Zu Schritt 2
        </AdvaicPrimary>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Pill>Kontrolle</Pill>
      </div>

      <div>
        <h1 className="text-[30px] font-semibold tracking-tight">
          Kontrolle festlegen
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
        >
          Standard ist Freigabe: Du siehst jede Antwort zuerst selbst. Das ist der sichere Start. Auto-Send wird erst
          freigeschaltet, wenn deine Sicherheitskriterien erfüllt sind.
        </p>
      </div>

      <div className="grid gap-3">
        <ChoiceCard
          title="Antworten zuerst zur Freigabe anzeigen"
          desc="Du siehst jede Antwort, bevor sie rausgeht. Ideal zum Start."
          recommended
          active={mode === "approval"}
          onClick={() => setMode("approval")}
        />
        <ChoiceCard
          title="Auto-Send aktivieren"
          desc="Wird erst aktiv, wenn Trust-Gate und Objektvoraussetzungen erfüllt sind."
          active={mode === "auto"}
          disabled={!autoUnlocked}
          onClick={() => setMode("auto")}
        />
      </div>

      <div
        className="rounded-[14px] border p-4"
        style={{
          borderColor: "var(--divider, rgba(0,0,0,0.06))",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[13px] font-semibold" style={{ color: "var(--text, #0E0E11)" }}>
            Trust-Gate für Auto-Send
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: autoUnlocked ? "rgba(34,197,94,0.35)" : "rgba(201,162,63,0.35)",
              background: autoUnlocked ? "rgba(34,197,94,0.14)" : "rgba(201,162,63,0.14)",
              color: "var(--black, #0E0E11)",
            }}
          >
            {autoUnlocked ? "Bereit für Auto-Send" : "Vorerst Freigabe-Modus"}
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          {(gate?.checks || []).map((check) => (
            <div
              key={check.key}
              className="rounded-[12px] border px-3 py-2"
              style={{
                borderColor: "var(--border, rgba(0,0,0,0.08))",
                background: "#fff",
              }}
            >
              <div className="text-[13px] font-medium" style={{ color: "var(--text, #0E0E11)" }}>
                {check.ok ? "✓ " : "○ "}
                {check.label}
              </div>
              {check.detail ? (
                <div className="mt-1 text-[12px]" style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}>
                  {check.detail}
                </div>
              ) : null}
            </div>
          ))}
          {!gate ? (
            <div
              className="rounded-[12px] border px-3 py-2 text-[12px]"
              style={{
                borderColor: "var(--border, rgba(0,0,0,0.08))",
                background: "#fff",
                color: "var(--textMuted, rgba(14,14,17,0.65))",
              }}
            >
              Trust-Gate wird geladen. Bis dahin bleibt Auto-Send vorsorglich deaktiviert.
            </div>
          ) : null}
        </div>

        {gate?.metrics ? (
          <div className="mt-3 text-[12px]" style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}>
            Aktuell: {gate.metrics.property_count ?? 0} Immobilien,{" "}
            {gate.metrics.reviewed_reply_count ?? 0}/{gate.metrics.min_reviewed_replies ?? 0} Freigaben ohne
            Textänderung, {gate.metrics.failed_sends_last_14d ?? 0} fehlgeschlagene Sendungen in 14 Tagen.
          </div>
        ) : null}
      </div>

      {/* Micro trust row */}
      <div
        className="rounded-[14px] border p-4 text-[13px] leading-relaxed"
        style={{
          borderColor: "var(--divider, rgba(0,0,0,0.06))",
          background: "rgba(0,0,0,0.02)",
          color: "var(--textMuted, rgba(14,14,17,0.65))",
        }}
      >
        <div
          className="font-semibold"
          style={{ color: "var(--text, #0E0E11)" }}
        >
          Immer aktiv:
        </div>
        <ul className="mt-2 space-y-1">
          <li>• Ohne hinterlegte Immobilien bleibt Auto-Send aus.</li>
          <li>• No-reply / Systemmails → nie beantworten</li>
          <li>• Rechnungen, Beschwerden, rechtliche Themen → markieren</li>
          <li>• Unklare Fälle → zur Freigabe</li>
        </ul>
      </div>

      {error && (
        <div
          className="rounded-[14px] border p-4 text-[13px]"
          style={{
            borderColor: "rgba(220,38,38,0.18)",
            background: "rgba(220,38,38,0.06)",
            color: "rgba(220,38,38,0.90)",
          }}
        >
          Fehler: {error}
          <div className="mt-2" style={{ color: "rgba(14,14,17,0.65)" }}>
            Falls das ein Endpoint-Problem ist: prüfe{" "}
            <code>{SETTINGS_ENDPOINT}</code> (GET + POST).
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AdvaicPrimary onClick={onSaveAndContinue} disabled={saving}>
          {saving ? "Speichert…" : "Speichern & weiter"}
        </AdvaicPrimary>

        <button
          type="button"
          onClick={() => router.push("/app/onboarding/step-2")}
          className="rounded-[12px] border px-4 py-3 text-[13px] font-medium transition"
          style={{
            borderColor: "var(--border, rgba(0,0,0,0.08))",
            background: "transparent",
            color: "var(--text, #0E0E11)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold, #C9A23F)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              "var(--border, rgba(0,0,0,0.08))";
          }}
        >
          Zurück
        </button>
      </div>
    </div>
  );
}
