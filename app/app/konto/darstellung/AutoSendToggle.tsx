"use client";

import { useEffect, useState } from "react";

type ReplyMode = "approval" | "auto";

export default function AutoSendToggle() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyMode, setReplyMode] = useState<ReplyMode>("approval");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agent/settings", { method: "GET" });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.error || "Failed to load settings");
        if (!cancelled)
          setReplyMode((data.reply_mode as ReplyMode) || "approval");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = async (next: ReplyMode) => {
    setSaving(true);
    setError(null);

    const prev = replyMode;
    setReplyMode(next);

    try {
      const res = await fetch("/api/agent/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_mode: next }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Speichern fehlgeschlagen");
    } catch (e: any) {
      setReplyMode(prev);
      setError(e?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const checked = replyMode === "auto";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Antworten automatisch senden (wenn sicher)
          </div>
          <div className="text-sm text-gray-600 mt-1 max-w-xl">
            Wenn Advaic sehr sicher ist und die Qualitätsprüfung besteht, werden
            Antworten automatisch gesendet. Bei Unsicherheit landet alles
            weiterhin in <span className="font-medium">Zur Freigabe</span>.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Empfehlung: am Anfang auf{" "}
            <span className="font-medium">Freigabe</span> lassen.
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="text-xs text-gray-500">Lade…</div>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => setMode(checked ? "approval" : "auto")}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  checked ? "bg-emerald-500" : "bg-gray-300"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                aria-pressed={checked}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    checked ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <div className="text-xs font-medium text-gray-700 min-w-[80px] text-right">
                {checked ? "Auto" : "Freigabe"}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
