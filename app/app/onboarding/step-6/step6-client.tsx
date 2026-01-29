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

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="rounded-[14px] border p-4"
      style={{
        background: "var(--card, #FFFFFF)",
        borderColor: "var(--divider, rgba(0,0,0,0.06))",
      }}
    >
      <div className="text-[13px] font-semibold">{title}</div>
      <div
        className="mt-1 text-[13px] leading-relaxed"
        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
      >
        {desc}
      </div>
    </div>
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

  if (!res.ok) {
    return {
      ok: false,
      error: String(json?.error || "update_failed"),
      details: json?.details,
    };
  }

  return { ok: true as const, data: json };
}

export default function Step6Client() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const headline = useMemo(() => {
    if (done) return "Alles bereit.";
    return "Onboarding abgeschlossen.";
  }, [done]);

  async function finish() {
    setError(null);
    setSaving(true);

    // ✅ Mark onboarding complete in your onboarding table
    const upd = await onboardingUpdate({
      step_finish_done: true,
      completed_at: new Date().toISOString(),
      current_step: 6,
    });

    if (!upd.ok) {
      setSaving(false);
      setError(upd.error);
      return;
    }

    setSaving(false);
    setDone(true);

    // Small UX: quick redirect to /app after “success”
    setTimeout(() => {
      router.push("/app");
    }, 450);
  }

  return (
    <div>
      <Pill text="Fertig" />

      <h1
        className="mt-3 text-[28px] font-semibold tracking-tight"
        style={{ color: "var(--text, #0E0E11)" }}
      >
        {headline}
      </h1>

      <p
        className="mt-2 text-[14px] leading-relaxed"
        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
      >
        Ab jetzt siehst du neue Anfragen, Entwürfe zur Freigabe und klare
        nächste Schritte direkt im Dashboard.
      </p>

      {/* Error box */}
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

      {/* Success hero */}
      <div
        className="mt-6 rounded-[16px] border p-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(201,162,63,0.10), rgba(255,255,255,0.9))",
          borderColor: "rgba(201,162,63,0.25)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[14px] font-semibold">Premium-Setup aktiv</div>
            <div
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Advaic fokussiert auf Lead- & Portal-Mails, blendet irrelevantes
              aus und gibt dir volle Kontrolle über alles, was rausgeht.
            </div>
          </div>

          <div className="flex gap-2">
            <SecondaryButton onClick={() => router.push("/app/konto")}>
              Konto
            </SecondaryButton>

            <PrimaryButton
              onClick={() => {
                // If user already finished before, just go
                if (done) router.push("/app");
                else void finish();
              }}
              loading={saving}
            >
              {done ? "Zum Dashboard" : "Onboarding beenden"}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <MiniCard
          title="1) Zur Freigabe"
          desc="Wenn Advaic antwortet, siehst du den Entwurf zuerst. Du kannst ihn anpassen, freigeben oder ablehnen."
        />
        <MiniCard
          title="2) Qualität & Sicherheit"
          desc="Newsletter/Spam werden ignoriert. Kritisches wird markiert und nie automatisch beantwortet."
        />
        <MiniCard
          title="3) Objekt-Infos"
          desc="Je besser deine Objekte, desto besser die Antworten. Du kannst jederzeit manuell ergänzen oder Sync aktivieren."
        />
        <MiniCard
          title="4) Ton & Stil"
          desc="Dein Stil sitzt jetzt als Default. Du kannst ihn jederzeit feinjustieren (Beispiele, Dos & Don’ts, Signatur)."
        />
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SecondaryButton
          onClick={() => router.push("/app/onboarding/step-5")}
        >
          Zurück
        </SecondaryButton>

        <PrimaryButton
          onClick={() => (done ? router.push("/app") : void finish())}
          loading={saving}
        >
          {done ? "Zum Dashboard" : "Fertigstellen & starten"}
        </PrimaryButton>
      </div>

      <div
        className="mt-4 text-[12px]"
        style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
      >
        Tipp: Über „Transparenz“ oben rechts siehst du jederzeit, welche Regeln
        aktiv sind und was Advaic gerade macht.
      </div>
    </div>
  );
}
