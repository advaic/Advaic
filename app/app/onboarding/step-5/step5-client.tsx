"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Pill({ text }: { text: string }) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium"
      style={{
        borderColor: "var(--divider, rgba(0,0,0,0.06))",
        background: "rgba(0,0,0,0.02)",
        color: "var(--textMuted, rgba(14,14,17,0.65))",
      }}
    >
      {text}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = !!disabled || !!loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "rounded-[12px] border px-5 py-3 text-[14px] font-medium transition",
        isDisabled && "opacity-60"
      )}
      style={{
        borderColor: "var(--gold, #C9A23F)",
        background: "var(--black, #0E0E11)",
        color: "#fff",
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--gold, #C9A23F)";
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--black, #0E0E11)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 0 3px var(--goldGlow, rgba(201,162,63,0.22))";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--black, #0E0E11)";
        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {loading ? "Speichert…" : children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] border px-4 py-3 text-[14px] font-medium transition"
      style={{
        borderColor: "var(--border, rgba(0,0,0,0.08))",
        color: "var(--text, #0E0E11)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--gold, #C9A23F)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border, rgba(0,0,0,0.08))";
      }}
    >
      {children}
    </button>
  );
}

function OptionCard({
  title,
  description,
  selected,
  badge,
  onClick,
  right,
}: {
  title: string;
  description: string;
  selected: boolean;
  badge?: string;
  onClick: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[14px] border p-4 text-left transition",
        selected ? "shadow-[0_10px_30px_rgba(0,0,0,0.08)]" : ""
      )}
      style={{
        background: "var(--card, #FFFFFF)",
        borderColor: selected
          ? "rgba(201,162,63,0.55)"
          : "var(--border, rgba(0,0,0,0.08))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold">{title}</div>
            {badge ? (
              <span
                className="rounded-full border px-2 py-[3px] text-[11px] font-medium"
                style={{
                  borderColor: "rgba(201,162,63,0.35)",
                  background: "rgba(201,162,63,0.12)",
                  color: "var(--black, #0E0E11)",
                }}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <div
            className="mt-1 text-[13px] leading-relaxed"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            {description}
          </div>
        </div>

        {right ? <div className="pt-1">{right}</div> : null}
      </div>

      {selected ? (
        <div
          className="mt-3 rounded-[12px] border px-3 py-2 text-[12px] font-medium"
          style={{
            borderColor: "rgba(201,162,63,0.35)",
            background: "rgba(201,162,63,0.10)",
            color: "var(--black, #0E0E11)",
          }}
        >
          Ausgewählt
        </div>
      ) : null}
    </button>
  );
}

async function onboardingUpdate(body: Record<string, any>) {
  const res = await fetch("/api/onboarding/update", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) return { ok: false, error: "network_error" as const };
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok)
    return {
      ok: false,
      error: String(json?.error || "update_failed"),
      details: json?.details,
    };
  return { ok: true as const, data: json };
}

export default function Step5Client() {
  const router = useRouter();

  const [choice, setChoice] = useState<"immoscout" | "manual" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => choice !== null, [choice]);

  function startImmoScout() {
    setChoice("immoscout");
    // ⬇️ falls dein Start-Endpoint anders heißt, hier ändern:
    window.location.href = "/api/auth/immoscout/start";
  }

  function goManualCreate() {
    setChoice("manual");
    // ⬇️ HIER deinen echten Pfad rein (zu deiner HinzufuegenPage)
    router.push("/app/immobilien/hinzufuegen");
  }

  async function continueNext() {
    setError(null);
    if (!canContinue) return;

    setSaving(true);

    const upd = await onboardingUpdate({
      step_listings_sync_done: true,
      current_step: 6,
    });

    if (!upd.ok) {
      setError(upd.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/app/onboarding/step-6");
  }

  return (
    <div>
      <Pill text="Objektdaten" />

      <h1
        className="mt-3 text-[28px] font-semibold tracking-tight"
        style={{ color: "var(--text, #0E0E11)" }}
      >
        Objektdaten verbinden
      </h1>

      <p
        className="mt-2 text-[14px] leading-relaxed"
        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
      >
        Damit Advaic korrekt antwortet, braucht es eine zuverlässige Objektquelle.
        Du kannst später jederzeit weitere Objekte hinzufügen.
      </p>

      {error ? (
        <div
          className="mt-5 rounded-[14px] border p-4"
          style={{
            borderColor: "rgba(220,38,38,0.18)",
            background: "rgba(220,38,38,0.06)",
          }}
        >
          <div className="text-[13px] font-semibold">Hinweis</div>
          <div
            className="mt-1 text-[13px]"
            style={{ color: "rgba(220,38,38,0.85)" }}
          >
            {String(error)}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <OptionCard
          title="ImmoScout verbinden"
          badge="Empfohlen"
          description="Automatischer Sync deiner Exposés. Ideal für schnelle, korrekte Antworten."
          selected={choice === "immoscout"}
          onClick={startImmoScout}
          right={
            <div
              className="rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: "#FFD400", color: "#0E0E11" }}
            >
              Connect
            </div>
          }
        />

        <OptionCard
          title="Manuell Immobilie hinzufügen"
          description="Lege ein Objekt als Entwurf an. Bilder & Details werden privat gespeichert (signed URLs)."
          selected={choice === "manual"}
          onClick={goManualCreate}
          right={
            <div
              className="rounded-full border px-3 py-1 text-[12px] font-semibold"
              style={{
                borderColor: "rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                color: "rgba(14,14,17,0.75)",
              }}
            >
              Öffnen
            </div>
          }
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SecondaryButton onClick={() => router.push("/app/onboarding/step-4")}>
          Zurück
        </SecondaryButton>

        <PrimaryButton
          onClick={continueNext}
          disabled={!canContinue}
          loading={saving}
        >
          Weiter
        </PrimaryButton>
      </div>

      <div
        className="mt-4 text-[12px]"
        style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
      >
        Hinweis: Wenn du ImmoScout später verbinden willst, geht das jederzeit in
        den Einstellungen.
      </div>
    </div>
  );
}