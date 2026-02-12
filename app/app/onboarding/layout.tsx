// app/app/onboarding/layout.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type OnboardingRow = {
  agent_id: string;
  current_step: number;
  total_steps: number;

  step_welcome_done: boolean;
  step_email_connected_done: boolean;
  step_autosend_done: boolean;
  step_tone_style_done: boolean;
  step_listings_sync_done: boolean;
  step_finish_done: boolean;

  completed_at: string | null;
  tour_completed_at: string | null;
};

type StatusResponse =
  | { ok: true; onboarding: OnboardingRow }
  | { error: string; details?: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stepHref(step: number) {
  // Keep in sync with the actual file/folder structure under /app/onboarding
  // Current structure:
  // /step-1, /step-2, /step-3, /step-4, /step-5, /step-6
  switch (step) {
    case 1:
      return "/app/onboarding/step-1";
    case 2:
      return "/app/onboarding/step-2";
    case 3:
      return "/app/onboarding/step-3";
    case 4:
      return "/app/onboarding/step-4";
    case 5:
      return "/app/onboarding/step-5";
    case 6:
      return "/app/onboarding/step-6";
    default:
      return "/app/onboarding/step-1";
  }
}

function stepLabel(step: number) {
  switch (step) {
    case 1:
      return "Willkommen";
    case 2:
      return "Postfach verbinden";
    case 3:
      return "Auto-Send";
    case 4:
      return "Ton & Stil";
    case 5:
      return "Objektdaten";
    case 6:
      return "Fertig";
    default:
      return "Onboarding";
  }
}

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

async function bootstrapIfMissing(): Promise<boolean> {
  const res = await fetch("/api/onboarding/bootstrap", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(() => null);

  return !!res?.ok;
}

function formatConnBadge(connected: boolean) {
  return connected ? "Verbunden" : "Nicht verbunden";
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
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
                Transparenz
              </div>
              <h2
                className="mt-1 text-[18px] font-semibold"
                style={{ color: "var(--text, #0E0E11)" }}
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border px-3 py-2 text-[13px] font-medium"
              style={{
                borderColor: "var(--border, rgba(0,0,0,0.08))",
                color: "var(--text, #0E0E11)",
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

function safeDecodeURIComponent(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function isSafeInternalPath(p: string) {
  // only allow internal absolute paths
  if (!p || typeof p !== "string") return false;
  if (!p.startsWith("/")) return false;
  // block protocol-relative or full URLs
  if (p.startsWith("//")) return false;
  if (p.startsWith("/\\")) return false;
  // very defensive: block obvious external schemes encoded as path
  const lower = p.toLowerCase();
  if (lower.startsWith("http:") || lower.startsWith("https:") || lower.startsWith("javascript:")) {
    return false;
  }
  return true;
}

function isAllowedNextPath(p: string) {
  // Allow a small whitelist of “side quest” pages that onboarding can jump to.
  // Keep this list tight.
  const path = p.split("?")[0];
  return (
    path === "/app/konto/verknuepfungen" ||
    path === "/app/konto/verknuepfungen/gmail" ||
    path === "/app/konto/verknuepfungen/outlook" ||
    path === "/app/immobilien/hinzufuegen"
  );
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get("next") || "";

  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  // These are optional, but make the modal feel “real” and trust-building.
  const [emailConnected, setEmailConnected] = useState<boolean | null>(null);
  const [listingsConnected, setListingsConnected] = useState<boolean | null>(
    null
  );

  const totalSteps = useMemo(() => onboarding?.total_steps ?? 6, [onboarding]);
  const currentStep = useMemo(
    () => onboarding?.current_step ?? 1,
    [onboarding]
  );

  const progressPct = useMemo(() => {
    const total = Math.max(1, Number(totalSteps) || 6);
    const step = clamp(Number(currentStep) || 1, 1, total);
    return Math.round((step / total) * 100);
  }, [currentStep, totalSteps]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // 1) status
      let st = await fetchStatus();

      // 2) if row missing, try bootstrap once, then re-fetch
      if (!("ok" in st) || st.ok !== true) {
        const err = (st as any)?.error || "";
        if (String(err).toLowerCase().includes("not_found")) {
          const booted = await bootstrapIfMissing();
          if (booted) st = await fetchStatus();
        }
      }

      if (cancelled) return;

      if ("ok" in st && st.ok === true && st.onboarding) {
        const row = st.onboarding;
        setOnboarding(row);

        // Heuristic: use step flags to reflect “connected” status in the transparency modal
        setEmailConnected(Boolean(row.step_email_connected_done));
        setListingsConnected(Boolean(row.step_listings_sync_done));

        // If completed → send to app home
        if (row.completed_at) {
          router.replace("/app");
          return;
        }

        // If user is on /app/onboarding (index) -> redirect either to a safe "next" page
        // (used for OAuth/connect flows & allowed side-actions) or to the correct step.
        if (pathname === "/app/onboarding") {
          const rawNext = nextParam || "";
          const decodedNext = safeDecodeURIComponent(rawNext);

          if (isSafeInternalPath(decodedNext) && isAllowedNextPath(decodedNext)) {
            router.replace(decodedNext);
            return;
          }

          router.replace(stepHref(row.current_step || 1));
          return;
        }

        setLoading(false);
        return;
      }

      setOnboarding(null);
      setError((st as any)?.error || "unknown_error");
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const safeTotal = Math.max(1, Number(totalSteps) || 6);
  const safeStep = clamp(Number(currentStep) || 1, 1, safeTotal);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg, #F7F7F4)", color: "var(--text, #0E0E11)" }}
    >
      {/* Top shell */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <div className="text-[16px] font-semibold tracking-tight">
              Advaic
            </div>
            <div
              className="text-[13px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Onboarding
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTransparencyOpen(true)}
            className="rounded-[12px] border px-3 py-2 text-[13px] font-medium transition"
            style={{
              borderColor: "var(--border, rgba(0,0,0,0.08))",
              color: "var(--text, #0E0E11)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--gold, #C9A23F)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 0 3px var(--goldGlow, rgba(201,162,63,0.22))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border, rgba(0,0,0,0.08))";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            Transparenz
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div
                className="text-[12px] font-medium"
                style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
              >
                Schritt {safeStep} von {safeTotal}
              </div>
              <div className="mt-1 text-[22px] font-semibold tracking-tight">
                {stepLabel(safeStep)}
              </div>
            </div>

            <div
              className="text-[13px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              {loading ? "lädt…" : error ? `Fehler: ${error}` : `${progressPct}%`}
            </div>
          </div>

          <div className="mt-4">
            <div
              className="h-[3px] w-full overflow-hidden rounded-full"
              style={{ background: "rgba(14,14,17,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background:
                    "linear-gradient(90deg, var(--gold, #C9A23F), var(--goldHover, #D8B24A))",
                }}
              />
            </div>
          </div>
        </div>

        {/* Two-column premium layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(560px,620px)_minmax(380px,420px)]">
          {/* Left: Step Card */}
          <div
            className="rounded-[14px] border p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]"
            style={{
              background: "var(--card, #FFFFFF)",
              borderColor: "var(--border, rgba(0,0,0,0.08))",
            }}
          >
            {loading ? (
              <div className="space-y-3">
                <div
                  className="h-4 w-2/3 rounded"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                />
                <div
                  className="h-4 w-1/2 rounded"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                />
                <div
                  className="h-4 w-3/4 rounded"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                />
                <div
                  className="mt-6 h-10 w-40 rounded"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                />
              </div>
            ) : error ? (
              <div
                className="rounded-[14px] border p-4"
                style={{
                  borderColor: "rgba(220,38,38,0.18)",
                  background: "rgba(220,38,38,0.06)",
                }}
              >
                <div className="text-[14px] font-semibold">
                  Onboarding konnte nicht geladen werden.
                </div>
                <div
                  className="mt-1 text-[13px]"
                  style={{ color: "rgba(220,38,38,0.85)" }}
                >
                  Bitte Seite neu laden. Wenn es bleibt: {String(error)}.
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-[12px] border px-4 py-2 text-[13px] font-medium transition"
                    style={{
                      borderColor: "var(--gold, #C9A23F)",
                      background: "var(--black, #0E0E11)",
                      color: "#fff",
                    }}
                    onMouseEnter={(e) => {
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
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "none";
                    }}
                  >
                    Neu laden
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </div>

          {/* Right: Reassurance / what happens next */}
          <div className="lg:pt-1">
            <div
              className="rounded-[14px] border p-5"
              style={{
                background: "var(--card, #FFFFFF)",
                borderColor: "var(--border, rgba(0,0,0,0.08))",
              }}
            >
              <div
                className="text-[12px] font-medium"
                style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
              >
                Was passiert als nächstes?
              </div>
              <div className="mt-2 text-[14px] font-medium">
                Ruhig. Klar. Transparent.
              </div>
              <div
                className="mt-1 text-[13px] leading-relaxed"
                style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
              >
                Pro Schritt triffst du nur eine Entscheidung. Gold erscheint nur
                bei Fortschritt und Erfolg.
              </div>

              <div className="mt-4 space-y-3">
                <div
                  className="rounded-[12px] border p-3"
                  style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium">E-Mail</div>
                      <div
                        className="text-[12px]"
                        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
                      >
                        Fokus auf Lead- & Portal-Mails
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-2 py-1 text-[12px] font-medium",
                        emailConnected === true && "",
                        emailConnected === false && ""
                      )}
                      style={{
                        background:
                          emailConnected === true
                            ? "rgba(201,162,63,0.14)"
                            : "rgba(0,0,0,0.05)",
                        color:
                          emailConnected === true
                            ? "var(--black, #0E0E11)"
                            : "var(--textMuted, rgba(14,14,17,0.65))",
                        border: `1px solid ${
                          emailConnected === true
                            ? "rgba(201,162,63,0.35)"
                            : "rgba(0,0,0,0.06)"
                        }`,
                      }}
                    >
                      {formatConnBadge(Boolean(emailConnected))}
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[12px] border p-3"
                  style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium">Objektdaten</div>
                      <div
                        className="text-[12px]"
                        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
                      >
                        Für korrekte Antworten
                      </div>
                    </div>
                    <div
                      className="rounded-full px-2 py-1 text-[12px] font-medium"
                      style={{
                        background:
                          listingsConnected === true
                            ? "rgba(201,162,63,0.14)"
                            : "rgba(0,0,0,0.05)",
                        color:
                          listingsConnected === true
                            ? "var(--black, #0E0E11)"
                            : "var(--textMuted, rgba(14,14,17,0.65))",
                        border: `1px solid ${
                          listingsConnected === true
                            ? "rgba(201,162,63,0.35)"
                            : "rgba(0,0,0,0.06)"
                        }`,
                      }}
                    >
                      {formatConnBadge(Boolean(listingsConnected))}
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[12px] border p-3"
                  style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
                >
                  <div className="text-[13px] font-medium">Kontrolle</div>
                  <div
                    className="mt-1 text-[12px] leading-relaxed"
                    style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
                  >
                    Kritisches wird markiert und nie automatisch beantwortet.
                    Freigabe ist jederzeit möglich.
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: collapsible feel without building an accordion component yet */}
            <div
              className="mt-4 text-[12px]"
              style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
            >
              Tipp: Du kannst alle Regeln später im Dashboard anpassen.
            </div>
          </div>
        </div>

        <Modal
          open={transparencyOpen}
          onClose={() => setTransparencyOpen(false)}
          title="Wie Advaic mit deinem Postfach umgeht"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="rounded-[14px] border p-4"
              style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
            >
              <div className="text-[13px] font-semibold">Verbindungen</div>
              <div className="mt-2 space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}>
                    E-Mail
                  </span>
                  <span className="font-medium">
                    {emailConnected === null
                      ? "—"
                      : formatConnBadge(Boolean(emailConnected))}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}>
                    ImmoScout / Objekte
                  </span>
                  <span className="font-medium">
                    {listingsConnected === null
                      ? "—"
                      : formatConnBadge(Boolean(listingsConnected))}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-[14px] border p-4"
              style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
            >
              <div className="text-[13px] font-semibold">Aktive Regeln</div>
              <ul
                className="mt-2 space-y-2 text-[13px]"
                style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
              >
                <li>• Newsletter & Werbung werden ignoriert</li>
                <li>• Kritisches wird markiert (Rechnung, Beschwerde, Rechtliches)</li>
                <li>• Unklares geht zur Freigabe</li>
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[13px] font-semibold">Kurz erklärt</div>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Advaic fokussiert auf Lead- & Portal-Mails. Irrelevantes wird
              automatisch ausgeblendet. Kritische oder unklare Nachrichten werden
              markiert und nicht automatisch beantwortet.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setTransparencyOpen(false);
                router.push("/app/settings");
              }}
              className="rounded-[12px] border px-4 py-2 text-[13px] font-medium transition"
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
              Einstellungen öffnen
            </button>

            <button
              type="button"
              onClick={() => setTransparencyOpen(false)}
              className="rounded-[12px] border px-4 py-2 text-[13px] font-medium transition"
              style={{
                borderColor: "var(--gold, #C9A23F)",
                background: "var(--black, #0E0E11)",
                color: "#fff",
              }}
              onMouseEnter={(e) => {
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
              Verstanden
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}