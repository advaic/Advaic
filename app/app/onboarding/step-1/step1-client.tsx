"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingRow = {
  current_step: number;
  step_welcome_done: boolean;
  completed_at: string | null;
};

type StatusResponse =
  | { ok: true; onboarding: OnboardingRow | null }
  | { error: string; details?: string };

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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function AdvaicCtaButton({
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

export default function Step1Client() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<OnboardingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentStep = useMemo(() => row?.current_step ?? 1, [row]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      let st = await fetchStatus();

      // if onboarding missing -> bootstrap -> refetch
      if ("ok" in st && st.ok === true && !st.onboarding) {
        const booted = await bootstrap();
        if (booted) st = await fetchStatus();
      }

      if (cancelled) return;

      if ("ok" in st && st.ok === true) {
        setRow(st.onboarding);

        // If already completed → send to app
        if (st.onboarding?.completed_at) {
          router.replace("/app");
          return;
        }

        // If user is behind, keep them on step 1.
        // If they already progressed, send them forward.
        if ((st.onboarding?.current_step || 1) > 1) {
          router.replace("/app/onboarding/step-2");
          return;
        }

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

  async function onStart() {
    try {
      setSaving(true);
      setError(null);

      await updateOnboarding({
        step_welcome_done: true,
        current_step: 2,
      });

      router.push("/app/onboarding/step-2");
    } catch (e: any) {
      setError(String(e?.message || "update_failed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Pill>Willkommen</Pill>
        <div className="text-[22px] font-semibold tracking-tight">
          Dein Postfach. Dein Stil.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Pill>Willkommen</Pill>
        {currentStep > 1 && (
          <span
            className="rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.14)",
              color: "var(--black, #0E0E11)",
            }}
          >
            Fortgeschritten ✓
          </span>
        )}
      </div>

      <div>
        <h1 className="text-[30px] font-semibold tracking-tight">
          Dein Postfach. Dein Stil. Keine verlorenen Leads.
        </h1>

        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
        >
          Advaic beantwortet Anfragen automatisch — über deine eigene Adresse.
          Du behältst Kontrolle, siehst klare Regeln, und sparst jeden Tag Zeit.
        </p>

        <p
          className="mt-2 text-[13px]"
          style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
        >
          Einrichtung dauert ca. 5 Minuten. Alles transparent.
        </p>
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
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AdvaicCtaButton onClick={onStart} disabled={saving}>
          {saving ? "Startet…" : "Onboarding starten"}
        </AdvaicCtaButton>

        <div
          className="flex flex-wrap gap-2 text-[12px]"
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
        >
          <span
            className="rounded-full border px-3 py-1"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            DSGVO-fokussiert
          </span>
          <span
            className="rounded-full border px-3 py-1"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            Kein Spam / Newsletter
          </span>
          <span
            className="rounded-full border px-3 py-1"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            Freigabe möglich
          </span>
        </div>
      </div>

      {/* Optional: Right panel content is already in layout; keep step itself minimal */}
    </div>
  );
}
