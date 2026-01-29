"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ToneFormality = "locker" | "neutral" | "formal";

type ToneSettings = {
  agent_id: string;
  tone_language: string; // "de"
  tone_formality: ToneFormality;
  tone_personality: string;
  tone_do: string;
  tone_dont: string;
  tone_signature: string;
  tone_example_reply: string;
};

type ToneGetResponse =
  | { ok: true; settings: Partial<ToneSettings> }
  | { error: string; details?: string };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildToneDo(args: {
  conciseLevel: number; // 0..100
  askMoreQuestions: boolean;
  moreWarmth: boolean;
  formality: ToneFormality;
}) {
  const lines: string[] = [];

  // length rule
  const c = clamp(args.conciseLevel, 0, 100);
  if (c >= 75) lines.push("Antworte sehr kurz (max. 3–4 Sätze).");
  else if (c >= 45) lines.push("Antworte kurz und klar (max. 5–7 Sätze).");
  else lines.push("Antworte ausführlicher, aber ohne Füllwörter.");

  // structure
  lines.push("Nutze kurze Absätze und klare Aussagen.");
  lines.push(
    "Wenn ein Objekt passt: nenne nächste Schritte (Besichtigung / Unterlagen / Fragen)."
  );

  // questions
  if (args.askMoreQuestions) {
    lines.push(
      "Stelle 1–2 kurze Qualifizierungsfragen (z.B. Einzugstermin, Budget, Haustiere)."
    );
  } else {
    lines.push("Stelle nur dann Rückfragen, wenn wichtige Infos fehlen.");
  }

  // warmth
  if (args.moreWarmth) {
    lines.push("Klingt menschlich und zugewandt, ohne übertrieben zu wirken.");
  }

  // formality nuance
  if (args.formality === "formal") {
    lines.push("Formulierungen eher formal, aber nicht steif.");
  } else if (args.formality === "locker") {
    lines.push("Locker und freundlich, ohne Slang.");
  } else {
    lines.push("Neutral-professionell und souverän.");
  }

  return lines.join("\n");
}

function buildToneDont(args: {
  conciseLevel: number;
  formality: ToneFormality;
}) {
  const lines: string[] = [
    "Keine erfundenen Details.",
    "Keine unklaren Versprechen (z.B. Zusagen ohne Verfügbarkeit).",
    "Keine langen Schachtelsätze.",
  ];

  if (args.conciseLevel >= 75)
    lines.push("Keine Zusatzinfos, die nicht gefragt sind.");
  if (args.formality === "locker")
    lines.push("Kein Slang, keine Emojis in E-Mails.");
  return lines.join("\n");
}

function presetLabel(p: "professional" | "friendly" | "concise") {
  if (p === "professional") return "Sachlich & professionell";
  if (p === "friendly") return "Freundlich & persönlich";
  return "Kurz & effizient";
}

function buildPersonality(p: "professional" | "friendly" | "concise") {
  if (p === "professional") return "professional";
  if (p === "friendly") return "friendly_personal";
  return "concise";
}

function buildPreview(args: {
  preset: "professional" | "friendly" | "concise";
  conciseLevel: number;
  askMoreQuestions: boolean;
  moreWarmth: boolean;
  signature: string;
}) {
  const subject = "Re: Anfrage zur Wohnung in {{STADT}}";
  const intro =
    args.preset === "friendly"
      ? "Danke für Ihre Nachricht – gerne helfe ich weiter."
      : args.preset === "concise"
      ? "Danke für Ihre Anfrage."
      : "Vielen Dank für Ihre Anfrage.";

  const bodyBase: string[] = [];

  if (args.preset === "concise") {
    bodyBase.push(
      "Die Wohnung ist grundsätzlich verfügbar. Ich sende Ihnen gern die Details und mögliche Termine."
    );
  } else if (args.preset === "friendly") {
    bodyBase.push(
      "Die Wohnung ist grundsätzlich verfügbar. Ich kann Ihnen gern die Details schicken und passende Termine vorschlagen."
    );
  } else {
    bodyBase.push(
      "Die Wohnung ist grundsätzlich verfügbar. Gern sende ich Ihnen die Details und mögliche Besichtigungstermine."
    );
  }

  if (args.askMoreQuestions) {
    const q =
      args.preset === "friendly"
        ? "Darf ich kurz fragen: Wann möchten Sie einziehen und haben Sie Haustiere?"
        : args.preset === "concise"
        ? "Kurze Rückfrage: Einzugstermin und Haustiere?"
        : "Kurze Rückfrage: Wann ist Ihr gewünschter Einzugstermin und sind Haustiere geplant?";
    bodyBase.push(q);
  }

  if (args.moreWarmth && args.preset !== "friendly") {
    bodyBase.push(
      "Wenn Sie möchten, können wir das schnell und unkompliziert abstimmen."
    );
  }

  // apply concise shaping
  const c = clamp(args.conciseLevel, 0, 100);
  let lines = bodyBase;

  if (c >= 75) {
    lines = bodyBase.slice(0, 2);
  } else if (c >= 45) {
    lines = bodyBase.slice(0, 3);
  }

  const sign = (args.signature || "").trim();
  const signatureLine = sign ? `\n\n${sign}` : "\n\n{{AGENT_NAME}}";

  const text = `${intro}\n\n${lines.join("\n\n")}${signatureLine}`;

  return { subject, text };
}

async function fetchTone(): Promise<ToneGetResponse> {
  const res = await fetch("/api/agent/settings/tone-style", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  }).catch(() => null);

  if (!res) return { error: "network_error" };
  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok)
    return {
      error: String(json?.error || "load_failed"),
      details: json?.details,
    };
  return json as ToneGetResponse;
}

async function saveTone(payload: Partial<ToneSettings>) {
  const res = await fetch("/api/agent/settings/tone-style", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!res) return { ok: false, error: "network_error" as const };
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok)
    return {
      ok: false,
      error: String(json?.error || "save_failed"),
      details: json?.details,
    };
  return { ok: true as const, data: json };
}

async function markOnboardingDone() {
  const res = await fetch("/api/onboarding/update", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step_tone_style_done: true,
      // best-effort: move forward
      current_step: 5,
    }),
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

function CardPill({ text }: { text: string }) {
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

function Chip({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[12px] border p-3 text-left transition"
      style={{
        borderColor: active
          ? "rgba(201,162,63,0.55)"
          : "var(--divider, rgba(0,0,0,0.06))",
        background: active ? "rgba(201,162,63,0.08)" : "transparent",
        boxShadow: active ? "0 0 0 3px rgba(201,162,63,0.10)" : "none",
      }}
    >
      <div
        className="text-[13px] font-semibold"
        style={{ color: "var(--text, #0E0E11)" }}
      >
        {title}
      </div>
      <div
        className="mt-1 text-[12px]"
        style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
      >
        {subtitle}
      </div>
    </button>
  );
}

export default function Step4Client() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [preset, setPreset] = useState<"professional" | "friendly" | "concise">(
    "professional"
  );
  const [conciseLevel, setConciseLevel] = useState(55); // 0..100
  const [askMoreQuestions, setAskMoreQuestions] = useState(false);
  const [moreWarmth, setMoreWarmth] = useState(false);
  const [signature, setSignature] = useState("");

  // derived mapping to storage fields
  const formality: ToneFormality = useMemo(() => {
    if (preset === "friendly") return "locker";
    if (preset === "professional") return "neutral";
    // concise should NOT become formal automatically; keep neutral and let brevity do the job
    return "neutral";
  }, [preset]);

  const personality = useMemo(() => buildPersonality(preset), [preset]);

  const toneDo = useMemo(
    () =>
      buildToneDo({ conciseLevel, askMoreQuestions, moreWarmth, formality }),
    [conciseLevel, askMoreQuestions, moreWarmth, formality]
  );

  const toneDont = useMemo(
    () => buildToneDont({ conciseLevel, formality }),
    [conciseLevel, formality]
  );

  const preview = useMemo(
    () =>
      buildPreview({
        preset,
        conciseLevel,
        askMoreQuestions,
        moreWarmth,
        signature,
      }),
    [preset, conciseLevel, askMoreQuestions, moreWarmth, signature]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const res = await fetchTone();

      if (cancelled) return;

      if ("ok" in res && res.ok) {
        const s = res.settings || {};

        // best-effort hydrate
        const existingFormality =
          (s.tone_formality as ToneFormality) || "neutral";
        const existingPersonality = String(s.tone_personality || "").trim();
        const existingSignature = String(s.tone_signature || "").trim();

        // infer preset from saved personality/formality (fallback to neutral)
        if (existingPersonality.includes("friendly")) setPreset("friendly");
        else if (existingPersonality.includes("concise")) setPreset("concise");
        else if (existingFormality === "formal") setPreset("professional");
        else setPreset("professional");

        // infer concise from tone_do text (soft)
        const td = String(s.tone_do || "");
        if (td.includes("max. 3–4") || td.includes("max. 3-4"))
          setConciseLevel(85);
        else if (td.includes("max. 5–7") || td.includes("max. 5-7"))
          setConciseLevel(60);

        setAskMoreQuestions(td.toLowerCase().includes("qualifizierungsfragen"));
        setMoreWarmth(td.toLowerCase().includes("zugewandt"));
        setSignature(existingSignature);

        setLoading(false);
        return;
      }

      setError((res as any)?.error || "load_failed");
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveAndContinue() {
    setSaving(true);
    setError(null);

    const payload: Partial<ToneSettings> = {
      tone_language: "de",
      tone_formality: formality,
      tone_personality: personality,
      tone_do: toneDo,
      tone_dont: toneDont,
      tone_signature: signature.trim(),
      // store preview as example (helps later, no hallucinations)
      tone_example_reply: preview.text,
    };

    const saved = await saveTone(payload);
    if (!saved.ok) {
      setSaving(false);
      setError(saved.error);
      return;
    }

    const updated = await markOnboardingDone();
    if (!updated.ok) {
      setSaving(false);
      setError(updated.error);
      return;
    }

    setSaving(false);
    router.push("/app/onboarding/step-5-listings");
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardPill text="Ton & Stil" />
          <h1
            className="mt-3 text-[28px] font-semibold tracking-tight"
            style={{ color: "var(--text, #0E0E11)" }}
          >
            Dein Stil
          </h1>
          <p
            className="mt-2 text-[14px] leading-relaxed"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            Wähle den Ton, der zu dir passt. Du kannst alles später ändern.
          </p>
        </div>
      </div>

      {error ? (
        <div
          className="mt-5 rounded-[14px] border p-4"
          style={{
            borderColor: "rgba(220,38,38,0.18)",
            background: "rgba(220,38,38,0.06)",
          }}
        >
          <div className="text-[13px] font-semibold">
            Konnte Einstellungen nicht laden / speichern
          </div>
          <div
            className="mt-1 text-[13px]"
            style={{ color: "rgba(220,38,38,0.85)" }}
          >
            {String(error)}
          </div>
        </div>
      ) : null}

      {/* Tone chips */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Chip
          active={preset === "professional"}
          title={presetLabel("professional")}
          subtitle="Souverän, klar, ruhig."
          onClick={() => setPreset("professional")}
        />
        <Chip
          active={preset === "friendly"}
          title={presetLabel("friendly")}
          subtitle="Menschlich, warm, direkt."
          onClick={() => setPreset("friendly")}
        />
        <Chip
          active={preset === "concise"}
          title={presetLabel("concise")}
          subtitle="Kurz, effizient, fokussiert."
          onClick={() => setPreset("concise")}
        />
      </div>

      {/* Feintuning */}
      <div
        className="mt-6 rounded-[14px] border p-4"
        style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold">Feintuning</div>
            <div
              className="mt-1 text-[12px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              Optional – wenn du es noch genauer willst.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[13px] font-medium">Kürze</div>
            <div
              className="text-[12px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              {conciseLevel >= 75
                ? "Sehr kurz"
                : conciseLevel >= 45
                ? "Kurz"
                : "Ausführlicher"}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={conciseLevel}
            onChange={(e) => setConciseLevel(Number(e.target.value))}
            className="mt-3 w-full"
            aria-label="Kürze"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label
            className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border p-3"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            <div>
              <div className="text-[13px] font-medium">
                Mehr Qualifizierungsfragen
              </div>
              <div
                className="mt-1 text-[12px]"
                style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
              >
                Stellt 1–2 kurze Rückfragen, wenn sinnvoll.
              </div>
            </div>
            <input
              type="checkbox"
              checked={askMoreQuestions}
              onChange={(e) => setAskMoreQuestions(e.target.checked)}
              className="h-4 w-4"
              aria-label="Mehr Qualifizierungsfragen"
            />
          </label>

          <label
            className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border p-3"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            <div>
              <div className="text-[13px] font-medium">Mehr Wärme</div>
              <div
                className="mt-1 text-[12px]"
                style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
              >
                Klingt zugewandter, ohne kitschig zu werden.
              </div>
            </div>
            <input
              type="checkbox"
              checked={moreWarmth}
              onChange={(e) => setMoreWarmth(e.target.checked)}
              className="h-4 w-4"
              aria-label="Mehr Wärme"
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-[13px] font-medium">Signatur (optional)</div>
          <div
            className="mt-1 text-[12px]"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            Wird am Ende eingefügt. Wenn leer, nutzt Advaic später deinen Namen.
          </div>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="z.B. Kilian Ziemann"
            className="mt-2 w-full rounded-[12px] border px-3 py-2 text-[13px]"
            style={{
              borderColor: "var(--divider, rgba(0,0,0,0.06))",
              background: "transparent",
              color: "var(--text, #0E0E11)",
            }}
          />
        </div>
      </div>

      {/* Live preview */}
      <div
        className="mt-6 rounded-[14px] border p-5"
        style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold">Live Preview</div>
            <div
              className="mt-1 text-[12px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              So klingt eine typische Antwort als Entwurf.
            </div>
          </div>
          <div
            className="rounded-full border px-2 py-1 text-[12px] font-medium"
            style={{
              borderColor: "rgba(201,162,63,0.35)",
              background: "rgba(201,162,63,0.10)",
              color: "var(--black, #0E0E11)",
            }}
          >
            Entwurf
          </div>
        </div>

        <div
          className="mt-4 rounded-[12px] border p-4"
          style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
        >
          <div
            className="text-[12px]"
            style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
          >
            Betreff
          </div>
          <div className="mt-1 text-[13px] font-medium">{preview.subject}</div>

          <div
            className="mt-4 text-[12px]"
            style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
          >
            Nachricht
          </div>
          <div
            className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed"
            style={{ color: "var(--text, #0E0E11)" }}
          >
            {preview.text}
          </div>

          <div
            className="mt-4 text-[12px]"
            style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
          >
            Gesendet über: deine E-Mail-Adresse
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div
            className="rounded-[12px] border p-3"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            <div
              className="text-[12px]"
              style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
            >
              Was Advaic aktiv macht
            </div>
            <div
              className="mt-2 whitespace-pre-wrap text-[12px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              {toneDo}
            </div>
          </div>
          <div
            className="rounded-[12px] border p-3"
            style={{ borderColor: "var(--divider, rgba(0,0,0,0.06))" }}
          >
            <div
              className="text-[12px]"
              style={{ color: "var(--textFaint, rgba(14,14,17,0.45))" }}
            >
              Was Advaic vermeidet
            </div>
            <div
              className="mt-2 whitespace-pre-wrap text-[12px]"
              style={{ color: "var(--textMuted, rgba(14,14,17,0.65))" }}
            >
              {toneDont}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/app/onboarding/step-3-autosend")}
          className="rounded-[12px] border px-4 py-2 text-[13px] font-medium transition"
          style={{
            borderColor: "var(--border, rgba(0,0,0,0.08))",
            background: "transparent",
            color: "var(--text, #0E0E11)",
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
          Zurück
        </button>

        <PrimaryButton
          onClick={onSaveAndContinue}
          disabled={loading}
          loading={saving}
        >
          Weiter
        </PrimaryButton>
      </div>
    </div>
  );
}
