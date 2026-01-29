"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingRow = {
  agent_id: string;
  current_step: number;
  total_steps: number;
  step_email_connected_done: boolean;
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
  if (!res || !res.ok) {
    throw new Error(String(json?.error || "update_failed"));
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


function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.74 32.657 29.28 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691 12.88 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.355 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.259 0-9.708-3.318-11.292-7.946l-6.523 5.025C9.488 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.758 2.155-2.247 3.987-4.094 5.238l.003-.002 6.19 5.238C36.975 39.013 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}


function IntegrationButton({
  variant,
  title,
  onClick,
  disabled,
}: {
  variant: "gmail" | "outlook";
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = variant === "gmail" ? GoogleLogo : MicrosoftLogo;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full select-none",
        "h-[48px] rounded-[12px]",
        "border bg-white",
        "px-4",
        "flex items-center gap-3",
        "text-[14px] font-semibold",
        "transition",
        "hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
        "active:translate-y-[1px]",
        "focus:outline-none",
        disabled && "opacity-60"
      )}
      style={{
        borderColor: "var(--border, rgba(0,0,0,0.08))",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
      onFocus={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow =
          "0 0 0 3px var(--goldGlow, rgba(201,162,63,0.22)), 0 10px 30px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "rgba(201,162,63,0.55)";
      }}
      onBlur={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "var(--border, rgba(0,0,0,0.08))";
      }}
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px]"
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        aria-hidden="true"
      >
        <Icon />
      </span>

      <span className="flex-1 text-left">{title}</span>
    </button>
  );
}

function InlineAccordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-[12px] border"
      style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[13px] font-semibold">{title}</span>
        <span
          className="text-[12px]"
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div
          className="px-4 pb-4 text-[13px] leading-relaxed"
          style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close"
        style={{ background: "rgba(14,14,17,0.45)" }}
      />
      <div className="relative mx-auto mt-16 w-[min(720px,calc(100%-24px))]">
        <div
          className="rounded-[16px] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          style={{
            background: "var(--card, #FFFFFF)",
            borderColor: "var(--border, rgba(0,0,0,0.08))",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-[12px] font-medium"
                style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
              >
                Details
              </div>
              <h2 className="mt-1 text-[18px] font-semibold">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border px-3 py-2 text-[13px] font-medium"
              style={{
                borderColor: "var(--border, rgba(0,0,0,0.08))",
                background: "transparent",
              }}
            >
              Schließen
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Step2Client() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<OnboardingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<
    "gmail" | "outlook" | null
  >(null);

  const emailConnected = useMemo(() => !!row?.step_email_connected_done, [row]);

  // 👉 passe diese URLs an, falls deine Routes anders heißen:
  const OAUTH_START = useMemo(
    () => ({
      gmail: "/api/auth/gmail/start",
      outlook: "/api/auth/outlook/start",
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      // If we returned from OAuth with an error query param, show it.
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const isGmailError = sp.get("gmail") === "error";
        const isOutlookError = sp.get("outlook") === "error";
        if (isGmailError || isOutlookError) {
          const reason = sp.get("reason") || "connect_failed";
          setOauthError(reason);
        }
      }

      let st = await fetchStatus();

      // Wenn onboarding null => bootstrap versuchen
      if ("ok" in st && st.ok === true && !st.onboarding) {
        const booted = await bootstrap();
        if (booted) st = await fetchStatus();
      }

      if (cancelled) return;

      if ("ok" in st && st.ok === true) {
        setRow(st.onboarding);
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
  }, []);

  async function onContinue() {
    try {
      // Step 2 als done markieren + next step
      await updateOnboarding({
        step_email_connected_done: true,
        current_step: 3,
      });
      router.push("/app/onboarding/step-3");
    } catch (e: any) {
      setError(String(e?.message || "update_failed"));
    }
  }

  function startConnect(provider: "gmail" | "outlook") {
    setPendingProvider(provider);
    setDisclaimerOpen(true);
  }

  function confirmConnect() {
    if (!pendingProvider) return;
    const url = OAUTH_START[pendingProvider];
    // Redirect to OAuth start
    window.location.href = url;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Pill>Postfach verbinden</Pill>
        <div className="text-[22px] font-semibold tracking-tight">
          Verbinde dein Postfach
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Pill>Postfach verbinden</Pill>
        {emailConnected && (
          <span
            className="rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.14)",
              color: "var(--black, #0E0E11)",
            }}
          >
            Verbunden ✓
          </span>
        )}
      </div>

      {!emailConnected ? (
        <>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Verbinde dein Postfach
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Advaic antwortet über deine E-Mail-Adresse — genau so, wie du es
              gewohnt bist.
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
              Verbindung/Status Fehler: {error}
            </div>
          )}

          {oauthError && (
            <div
              className="rounded-[14px] border p-4 text-[13px]"
              style={{
                borderColor: "rgba(220,38,38,0.18)",
                background: "rgba(220,38,38,0.06)",
                color: "rgba(220,38,38,0.90)",
              }}
            >
              Verbindung fehlgeschlagen: {oauthError}
              <div className="mt-1" style={{ opacity: 0.85 }}>
                Bitte versuche es erneut. Wenn das wieder passiert: Support kontaktieren.
              </div>
            </div>
          )}

          <div className="space-y-3">
            <IntegrationButton
              variant="gmail"
              title="Mit Gmail verbinden"
              onClick={() => startConnect("gmail")}
            />
            <IntegrationButton
              variant="outlook"
              title="Mit Outlook verbinden"
              onClick={() => startConnect("outlook")}
            />
          </div>

          <div
            className="text-[13px]"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            Wir fokussieren auf Lead- & Portal-Mails. Newsletter und Werbung
            werden ignoriert.
          </div>

          <InlineAccordion title="Details & Datenschutz">
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Fokus:</span> Lead- &
                Portal-Mails (z. B. ImmoScout)
              </div>
              <div>
                <span className="font-semibold">Ignoriert:</span> Newsletter,
                Werbung, Systemmails
              </div>
              <div>
                <span className="font-semibold">Kontrolle:</span>{" "}
                Kritisches/Unklares wird markiert und nicht automatisch
                beantwortet
              </div>
            </div>
          </InlineAccordion>

          <Modal
            open={disclaimerOpen}
            title="So verbindet Advaic dein Postfach"
            onClose={() => setDisclaimerOpen(false)}
          >
            <div
              className="space-y-3 text-[13px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              <div
                className="rounded-[12px] border p-3"
                style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
              >
                <div
                  className="font-semibold"
                  style={{ color: "var(--text, #0E0E11)" }}
                >
                  3 Zusagen
                </div>
                <ul className="mt-2 space-y-1">
                  <li>• Fokus auf Leads/Portale (z. B. ImmoScout)</li>
                  <li>
                    • Irrelevantes wird ignoriert (Newsletter, Werbung,
                    Systemmails)
                  </li>
                  <li>• Kontrolle bleibt bei dir (Freigabe & Regeln)</li>
                </ul>
              </div>

              <p className="leading-relaxed">
                Advaic blendet alles aus, was offensichtlich kein Lead ist.
                Kritische oder unklare Mails werden markiert und nicht
                automatisch beantwortet.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisclaimerOpen(false)}
                  className="rounded-[12px] border px-4 py-2 text-[13px] font-medium"
                  style={{
                    borderColor: "var(--border, rgba(0,0,0,0.08))",
                    background: "transparent",
                    color: "var(--text, #0E0E11)",
                  }}
                >
                  Abbrechen
                </button>

                <AdvaicCtaButton onClick={confirmConnect}>
                  Verstanden & verbinden
                </AdvaicCtaButton>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Postfach verbunden.
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Filter-Regeln sind aktiv. Relevante E-Mails erscheinen automatisch
              in deiner Inbox.
            </p>
          </div>

          <div
            className="rounded-[14px] border p-4"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.10)",
            }}
          >
            <div
              className="text-[13px] font-semibold"
              style={{ color: "var(--black, #0E0E11)" }}
            >
              Aktiv
            </div>
            <ul
              className="mt-2 space-y-1 text-[13px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              <li>• Portal-Leads erkannt</li>
              <li>• Newsletter ignoriert</li>
              <li>• Rechnungen/Beschwerden markiert</li>
            </ul>
          </div>

          <div className="pt-2">
            <AdvaicCtaButton onClick={onContinue}>Weiter</AdvaicCtaButton>
          </div>
        </>
      )}
    </div>
  );
}
