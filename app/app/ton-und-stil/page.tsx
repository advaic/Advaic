"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Pin, PinOff, Tag, Trash2, Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ToneStyleSelector } from "@/components/settings/ToneStyleSelector";
import TonePreviewSummary from "@/components/settings/TonePreviewSummary";

import { supabase } from "@/lib/supabaseClient";

type StyleRow = {
  agent_id: string;
  tone: string;
  formality: string;
  length_pref: string;
  emoji_level: string;
  do_rules: string | null;
  dont_rules: string | null;
  sign_off: string | null;
  example_phrases: string | null;
};

type StyleExampleKind =
  | "greeting"
  | "closing"
  | "style_anchor"
  | "scenario"
  | "no_go";

type StyleExampleRow = {
  id: string;
  agent_id: string;
  label: string | null;
  text: string;
  kind: StyleExampleKind;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type SuggestionPatch = {
  length_pref?: "kurz" | "mittel" | "detailliert";
  add_do_rules?: string[];
  add_dont_rules?: string[];
  add_examples?: Array<{
    text: string;
    label: string;
    kind: "style_anchor" | "scenario" | "no_go";
    is_pinned?: boolean;
  }>;
};

type StyleSuggestion = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  confidence: number;
  already_applied: boolean;
  source?: "heuristic" | "ai";
  patch: SuggestionPatch;
};

type SuggestionMetrics = {
  total_reviews: number;
  edited_reviews: number;
  edited_rate: number;
  short_edit_rate: number;
  large_edit_rate: number;
  avg_diff_chars: number;
  feedback_negative_total?: number;
  feedback_top_reason?: string | null;
  feedback_top_reason_share?: number;
};

type SuggestionAiMeta = {
  enabled: boolean;
  used: boolean;
  error: string | null;
};

const DEFAULT_FORMALITY = "Sie-Form";
const DEFAULT_LENGTH = "mittel";
const DEFAULT_EMOJI = "none";

const KIND_OPTIONS: Array<{ value: StyleExampleKind; label: string; hint: string }> = [
  { value: "style_anchor", label: "Stil-Anker", hint: "Sätze, die deinen Stil definieren" },
  { value: "greeting", label: "Begrüßung", hint: "z.B. erste Zeile / Einstieg" },
  { value: "closing", label: "Abschluss", hint: "z.B. Gruß + nächster Schritt" },
  { value: "scenario", label: "Use-Case", hint: "z.B. Haustiere/Unterlagen/Termin" },
  { value: "no_go", label: "No-Go", hint: "Formulierungen, die NICHT vorkommen sollen" },
];

function kindLabel(kind: StyleExampleKind): string {
  return KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind;
}

function normalizeKind(v: unknown): StyleExampleKind {
  const s = String(v ?? "").trim();
  if (s === "greeting" || s === "closing" || s === "style_anchor" || s === "scenario" || s === "no_go") {
    return s;
  }
  return "style_anchor";
}

function toPct(v: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 1000) / 10}%`;
}

function feedbackReasonLabel(code: string | null | undefined) {
  const key = String(code || "").toLowerCase().trim();
  if (key === "zu_lang") return "Zu lang";
  if (key === "falscher_fokus") return "Falscher Fokus";
  if (key === "fehlende_infos") return "Fehlende Infos";
  if (key === "ton_unpassend") return "Ton unpassend";
  if (key === "sonstiges") return "Sonstiges";
  return "—";
}

function previewFromPatch(patch: SuggestionPatch): string[] {
  const lines: string[] = [];
  if (patch.length_pref) {
    lines.push(`Antwortlänge auf „${patch.length_pref}“ setzen`);
  }
  for (const line of patch.add_do_rules || []) {
    lines.push(`Do: ${line}`);
  }
  for (const line of patch.add_dont_rules || []) {
    lines.push(`Don't: ${line}`);
  }
  for (const ex of patch.add_examples || []) {
    lines.push(`Beispiel hinzufügen (${kindLabel(ex.kind as StyleExampleKind)}): ${ex.text}`);
  }
  return lines;
}

export default function ToneSettingsPage() {
  // Core style
  const [selectedStyle, setSelectedStyle] = useState("freundlich");
  const [customTone, setCustomTone] = useState("");

  // Structured settings
  const [formality, setFormality] = useState<string>(DEFAULT_FORMALITY);
  const [lengthPref, setLengthPref] = useState<string>(DEFAULT_LENGTH);
  const [emojiLevel, setEmojiLevel] = useState<string>(DEFAULT_EMOJI);
  const [signOff, setSignOff] = useState<string>("");

  // "Lieblingsformulierungen" (stored as rows)
  const [formulations, setFormulations] = useState<StyleExampleRow[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [inputKind, setInputKind] = useState<StyleExampleKind>("style_anchor");
  const [inputPinned, setInputPinned] = useState<boolean>(false);

  // Loading / saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StyleSuggestion[]>([]);
  const [suggestionMetrics, setSuggestionMetrics] = useState<SuggestionMetrics | null>(null);
  const [suggestionAiMeta, setSuggestionAiMeta] = useState<SuggestionAiMeta | null>(null);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);

  const formulationStrings = useMemo(() => {
    // Only feed "positive" examples into the denormalized list used for previews/exports.
    // No-Go examples are handled via dont_rules (separately).
    return (formulations || [])
      .filter((f) => normalizeKind((f as any).kind) !== "no_go")
      .sort((a, b) => {
        const ap = !!(a as any).is_pinned;
        const bp = !!(b as any).is_pinned;
        if (ap !== bp) return ap ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .map((f) => f.text);
  }, [formulations]);

  async function getUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user.id;
  }

  async function loadAll() {
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) {
        toast.error("Nicht eingeloggt. Bitte neu einloggen.");
        return;
      }

      const { data: style, error: styleErr } = await supabase
        .from("agent_style")
        .select(
          "agent_id,tone,formality,length_pref,emoji_level,do_rules,dont_rules,sign_off,example_phrases"
        )
        .eq("agent_id", uid)
        .maybeSingle();

      if (styleErr) {
        console.error("❌ agent_style load error:", styleErr);
        // Don’t block UI; user may not have row yet
      }

      if (style) {
        setSelectedStyle(style.tone || "freundlich");
        setFormality(style.formality || DEFAULT_FORMALITY);
        setLengthPref(style.length_pref || DEFAULT_LENGTH);
        setEmojiLevel(style.emoji_level || DEFAULT_EMOJI);
        setCustomTone(style.dont_rules || "");
        setSignOff(style.sign_off || "");
      }

      const { data: ex, error: exErr } = await supabase
        .from("agent_style_examples")
        .select("id,agent_id,label,text,kind,is_pinned,created_at,updated_at")
        .eq("agent_id", uid)
        .order("is_pinned", { ascending: false })
        .order("kind", { ascending: true })
        .order("created_at", { ascending: true });

      if (exErr) {
        console.error("❌ agent_style_examples load error:", exErr);
      } else {
        const cleaned = (ex || []).map((r: any) => ({
          ...r,
          kind: normalizeKind(r.kind),
          is_pinned: Boolean(r.is_pinned),
          updated_at: String(r.updated_at ?? r.created_at ?? new Date().toISOString()),
        })) as StyleExampleRow[];
        setFormulations(cleaned);
      }

      try {
        setSuggestionsLoading(true);
        setSuggestionsError(null);
        const res = await fetch("/api/agent/insights/style-suggestions", {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          throw new Error(String(json?.error || "style_suggestions_failed"));
        }
        setSuggestions(Array.isArray(json?.suggestions) ? (json.suggestions as StyleSuggestion[]) : []);
        setSuggestionMetrics((json?.metrics || null) as SuggestionMetrics | null);
        setSuggestionAiMeta((json?.ai || null) as SuggestionAiMeta | null);
      } catch (e: any) {
        setSuggestions([]);
        setSuggestionMetrics(null);
        setSuggestionAiMeta(null);
        setSuggestionsError(String(e?.message || "style_suggestions_failed"));
      } finally {
        setSuggestionsLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upsertStyle() {
    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    const payload: Partial<StyleRow> = {
      agent_id: uid,
      tone: selectedStyle,
      formality,
      length_pref: lengthPref,
      emoji_level: emojiLevel,
      // Store constraints in dont_rules (matches SQL we created).
      // Also append "No-Go" examples so the model has hard negatives.
      dont_rules: (() => {
        const base = (customTone || "").trim();
        const noGo = (formulations || [])
          .filter((f) => normalizeKind((f as any).kind) === "no_go")
          .map((f) => `- ${String(f.text || "").trim()}`)
          .filter(Boolean);
        const merged = [base, noGo.length ? `No-Go Beispiele:\n${noGo.join("\n")}` : ""]
          .filter((x) => String(x || "").trim())
          .join("\n\n");
        return merged ? merged : null;
      })(),
      // Optional sign-off
      sign_off: signOff || null,
      // Keep a denormalized list too (useful for exports / debugging)
      example_phrases: formulationStrings.length
        ? formulationStrings.join("\n")
        : null,
    };

    const { error } = await supabase
      .from("agent_style")
      .upsert(payload as any, { onConflict: "agent_id" });

    if (error) {
      console.error("❌ agent_style upsert error:", error);
      toast.error("Konnte Einstellungen nicht speichern.");
      return;
    }
  }

  const handleAddFormulation = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const kind = normalizeKind(inputKind);
    const label = inputLabel.trim() || null;
    const isPinned = Boolean(inputPinned);

    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    // Optimistic UI
    setInputValue("");

    const { data, error } = await supabase
      .from("agent_style_examples")
      .insert([{ agent_id: uid, text, kind, label, is_pinned: isPinned }])
      .select("id,agent_id,label,text,kind,is_pinned,created_at,updated_at")
      .single();

    if (error) {
      console.error("❌ insert style example error:", error);
      toast.error("Konnte Formulierung nicht speichern.");
      return;
    }

    setFormulations((prev) => [...prev, data as StyleExampleRow]);
    setInputLabel("");
    setInputKind("style_anchor");
    setInputPinned(false);
  };
  const handleTogglePinned = async (row: StyleExampleRow) => {
    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    const nextPinned = !row.is_pinned;

    // Optimistic UI
    setFormulations((prev) =>
      prev
        .map((x) => (x.id === row.id ? ({ ...x, is_pinned: nextPinned } as any) : x))
        .sort((a, b) => {
          const ap = !!a.is_pinned;
          const bp = !!b.is_pinned;
          if (ap !== bp) return ap ? -1 : 1;
          const ak = kindLabel(a.kind);
          const bk = kindLabel(b.kind);
          if (ak !== bk) return ak.localeCompare(bk);
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
    );

    const { error } = await supabase
      .from("agent_style_examples")
      .update({ is_pinned: nextPinned } as any)
      .eq("id", row.id)
      .eq("agent_id", uid);

    if (error) {
      console.error("❌ update pinned error:", error);
      toast.error("Konnte Pin nicht speichern.");
      // rollback
      setFormulations((prev) => prev.map((x) => (x.id === row.id ? row : x)));
    }
  };

  const handleUpdateExampleMeta = async (
    row: StyleExampleRow,
    patch: Partial<Pick<StyleExampleRow, "label" | "kind">>
  ) => {
    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    const next: StyleExampleRow = {
      ...row,
      ...(patch.kind ? { kind: normalizeKind(patch.kind) } : null),
      ...(patch.label !== undefined ? { label: patch.label } : null),
    } as any;

    // Optimistic UI
    setFormulations((prev) =>
      prev
        .map((x) => (x.id === row.id ? next : x))
        .sort((a, b) => {
          const ap = !!a.is_pinned;
          const bp = !!b.is_pinned;
          if (ap !== bp) return ap ? -1 : 1;
          const ak = kindLabel(a.kind);
          const bk = kindLabel(b.kind);
          if (ak !== bk) return ak.localeCompare(bk);
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
    );

    const dbPatch: any = {};
    if (patch.kind) dbPatch.kind = normalizeKind(patch.kind);
    if (patch.label !== undefined) dbPatch.label = patch.label;

    const { error } = await supabase
      .from("agent_style_examples")
      .update(dbPatch)
      .eq("id", row.id)
      .eq("agent_id", uid);

    if (error) {
      console.error("❌ update meta error:", error);
      toast.error("Konnte Änderung nicht speichern.");
      setFormulations((prev) => prev.map((x) => (x.id === row.id ? row : x)));
    }
  };

  const handleRemoveFormulation = async (id: string) => {
    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    // Optimistic UI
    const prev = formulations;
    setFormulations((list) => list.filter((x) => x.id !== id));

    const { error } = await supabase
      .from("agent_style_examples")
      .delete()
      .eq("id", id)
      .eq("agent_id", uid);

    if (error) {
      console.error("❌ delete style example error:", error);
      toast.error("Konnte Formulierung nicht löschen.");
      setFormulations(prev);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertStyle();
      toast.success("Ton & Stil gespeichert.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    if (!suggestionId) return;
    setApplyingSuggestionId(suggestionId);
    try {
      const res = await fetch("/api/agent/insights/style-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion_id: suggestionId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(String(json?.error || "style_suggestion_apply_failed"));
      }

      if (Array.isArray(json?.suggestions)) {
        setSuggestions(json.suggestions as StyleSuggestion[]);
      }
      if (json?.metrics) {
        setSuggestionMetrics(json.metrics as SuggestionMetrics);
      }
      if (json?.ai) {
        setSuggestionAiMeta(json.ai as SuggestionAiMeta);
      }

      toast.success(json?.applied ? "Vorschlag übernommen." : "Vorschlag war bereits vorhanden.");
      await loadAll();
    } catch (e: any) {
      toast.error(String(e?.message || "Vorschlag konnte nicht übernommen werden."));
    } finally {
      setApplyingSuggestionId(null);
    }
  };

  const handleQuickSaveOnEnter = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleAddFormulation();
    }
  };

  return (
    <main
      className="flex-1 p-6 overflow-y-auto bg-[#f7f7f8]"
      data-tour="tone-style-page"
    >
      <div
        className="mx-auto w-full max-w-6xl flex flex-col lg:flex-row gap-10"
        data-tour="tone-style-layout"
      >
        {/* LEFT: Main Form */}
        <div className="flex-1" data-tour="tone-style-left">
          <div
            className="flex items-start justify-between gap-4"
            data-tour="tone-style-header"
          >
            <div data-tour="tone-style-intro">
              <h1
                className="text-2xl font-bold mb-2"
                data-tour="tone-style-title"
              >
                Ton & Stil anpassen
              </h1>
              <p className="text-muted-foreground mb-6">
                Diese Einstellungen beeinflussen den Stil aller KI-Antworten,
                Vorschläge im Antwortvorlagen-Tool sowie Follow-Ups.
              </p>
            </div>

            <div className="flex items-center gap-2" data-tour="tone-style-actions">
              <Button
                variant="secondary"
                onClick={() => void loadAll()}
                disabled={loading || saving}
                data-tour="tone-style-reload"
              >
                Neu laden
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || saving}
                data-tour="tone-style-save"
              >
                {saving ? "Speichern…" : "Einstellungen speichern"}
              </Button>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4" />
                  Automatische Stil-Verbesserungen aus deinen Freigaben
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wir analysieren deine manuellen Änderungen und schlagen konkrete Regeln für Ton & Stil vor.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => void loadAll()}
                disabled={loading || saving || suggestionsLoading}
              >
                Aktualisieren
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Geprüfte Freigaben</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {suggestionMetrics?.total_reviews ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Mit Änderung</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {suggestionMetrics?.edited_reviews ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Änderungsquote</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {toPct(suggestionMetrics?.edited_rate ?? 0)}
                </div>
              </div>
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Ø Diff-Zeichen</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {suggestionMetrics?.avg_diff_chars ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Negatives Feedback</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {suggestionMetrics?.feedback_negative_total ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-[#fbfbfc] px-3 py-2">
                <div className="text-muted-foreground">Top-Feedbacktreiber</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {feedbackReasonLabel(suggestionMetrics?.feedback_top_reason)}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  Anteil: {toPct(suggestionMetrics?.feedback_top_reason_share ?? 0)}
                </div>
              </div>
            </div>

            {suggestionAiMeta && (
              <div className="mt-2 text-xs text-gray-600">
                {suggestionAiMeta.enabled
                  ? suggestionAiMeta.used
                    ? "KI-gestützte Vorschläge aktiv."
                    : "KI aktiv, aktuell ohne zusätzliche Vorschläge."
                  : "Nur Regel-Engine aktiv (KI nicht konfiguriert)."}
              </div>
            )}
            {suggestionAiMeta?.error ? (
              <div className="mt-2 text-xs text-amber-700">
                KI-Hinweis: {suggestionAiMeta.error}
              </div>
            ) : null}

            {suggestionsLoading ? (
              <div className="mt-4 text-sm text-muted-foreground">Vorschläge werden geladen…</div>
            ) : suggestionsError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Vorschläge konnten nicht geladen werden: {suggestionsError}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="mt-4 text-sm text-muted-foreground">
                Aktuell liegen keine konkreten Vorschläge vor.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {suggestions.map((s) => {
                  const preview = previewFromPatch(s.patch);
                  const applying = applyingSuggestionId === s.id;
                  return (
                    <div key={s.id} className="rounded-xl border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {s.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">{s.reason}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] px-2 py-1 rounded-full border ${
                              s.source === "ai"
                                ? "border-violet-200 bg-violet-50 text-violet-800"
                                : "border-gray-200 bg-[#fbfbfc] text-gray-700"
                            }`}
                          >
                            {s.source === "ai" ? "KI-Vorschlag" : "Regel-Vorschlag"}
                          </span>
                          <span className="text-[11px] px-2 py-1 rounded-full border bg-[#fbfbfc] text-gray-700">
                            Sicherheit {toPct(s.confidence)}
                          </span>
                          {s.already_applied ? (
                            <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                              Bereits aktiv
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-700">{s.impact}</div>

                      {preview.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-gray-700">
                          {preview.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-3">
                        <Button
                          onClick={() => void handleApplySuggestion(s.id)}
                          disabled={s.already_applied || !!applyingSuggestionId}
                        >
                          {applying
                            ? "Übernehme…"
                            : s.already_applied
                              ? "Bereits übernommen"
                              : "Mit 1 Klick übernehmen"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border bg-white p-5 shadow-sm"
            data-tour="tone-style-card"
          >
            {/* Tone Style Selection */}
            <h2
              className="text-lg font-semibold mb-1"
              data-tour="tone-style-tone-title"
            >
              Antwort-Ton wählen
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Wählen Sie einen generellen Stil für Ihre Kommunikation mit
              Interessenten.
            </p>
            <div data-tour="tone-style-selector">
              <ToneStyleSelector
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />
            </div>

            <Separator className="my-6" />

            {/* Structured knobs */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-tour="tone-style-knobs"
            >
              <div data-tour="tone-style-formality">
                <div className="text-sm font-medium mb-1">Anrede</div>
                <select
                  value={formality}
                  onChange={(e) => setFormality(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Sie-Form">Sie-Form</option>
                  <option value="Du-Form">Du-Form</option>
                </select>
                <div className="text-xs text-muted-foreground mt-1">
                  Einheitliche Anrede in allen Antworten.
                </div>
              </div>

              <div data-tour="tone-style-length">
                <div className="text-sm font-medium mb-1">Antwortlänge</div>
                <select
                  value={lengthPref}
                  onChange={(e) => setLengthPref(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="kurz">Kurz</option>
                  <option value="mittel">Mittel</option>
                  <option value="detailliert">Detailliert</option>
                </select>
                <div className="text-xs text-muted-foreground mt-1">
                  Wie ausführlich die KI standardmäßig antwortet.
                </div>
              </div>

              <div data-tour="tone-style-emoji">
                <div className="text-sm font-medium mb-1">Emoji-Level</div>
                <select
                  value={emojiLevel}
                  onChange={(e) => setEmojiLevel(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="none">Keine</option>
                  <option value="low">Wenig</option>
                  <option value="medium">Normal</option>
                </select>
                <div className="text-xs text-muted-foreground mt-1">
                  Optional – passt gut zum gewählten Ton.
                </div>
              </div>

              <div data-tour="tone-style-signoff">
                <div className="text-sm font-medium mb-1">
                  Signatur (optional)
                </div>
                <Input
                  placeholder="z.B. Viele Grüße, Max"
                  value={signOff}
                  onChange={(e) => setSignOff(e.target.value)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Wird am Ende der KI-Antworten bevorzugt verwendet.
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Custom Tone Instructions */}
            <h2
              className="text-lg font-semibold mb-1"
              data-tour="tone-style-rules-title"
            >
              Wünsche oder Einschränkungen
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Teilen Sie uns mit, was die KI vermeiden oder beachten soll –
              z. B. keine Emojis, gendergerechte Sprache, etc.
            </p>
            <Textarea
              placeholder="Z. B. 'Bitte keine Emojis verwenden', 'Gegendert ansprechen', etc."
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              data-tour="tone-style-rules-text"
            />

            <Separator className="my-6" />

            {/* Preferred Formulations */}
            <h2
              className="text-lg font-semibold mb-1"
              data-tour="tone-style-formulations-title"
            >
              Eigene Lieblingsformulierungen
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Diese Beispiele sind echte Stil-Anker für die KI. Nutze <span className="font-medium">Pinned</span> für deine wichtigsten Sätze, und <span className="font-medium">No-Go</span> für Formulierungen, die niemals vorkommen sollen.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3" data-tour="tone-style-formulations-add">
              <div className="md:col-span-4">
                <Input
                  placeholder="Formulierung (Text)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleQuickSaveOnEnter}
                  data-tour="tone-style-formulations-input"
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  placeholder="Label (optional) z.B. Haustiere"
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  data-tour="tone-style-formulations-label"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={inputKind}
                  onChange={(e) => setInputKind(normalizeKind(e.target.value))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  data-tour="tone-style-formulations-kind"
                >
                  {KIND_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setInputPinned((v) => !v)}
                  className={`h-10 px-3 rounded-md border text-sm inline-flex items-center gap-2 transition-colors ${
                    inputPinned
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  title={inputPinned ? "Gepinnt" : "Pin setzen (wird bevorzugt genutzt)"}
                  data-tour="tone-style-formulations-pin"
                >
                  {inputPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                  {inputPinned ? "Pinned" : "Pin"}
                </button>

                <Button
                  onClick={() => void handleAddFormulation()}
                  data-tour="tone-style-formulations-add-btn"
                >
                  Hinzufügen
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              Tipp: <span className="font-medium">Pinned</span> Beispiele werden von der KI bevorzugt genutzt. <span className="font-medium">No-Go</span> Beispiele helfen, unerwünschte Formulierungen zu vermeiden.
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Lade…</div>
            ) : formulations.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Noch keine Formulierungen gespeichert.
              </div>
            ) : (
              <div className="space-y-2" data-tour="tone-style-formulations-list">
                {formulations
                  .slice()
                  .sort((a, b) => {
                    const ap = !!a.is_pinned;
                    const bp = !!b.is_pinned;
                    if (ap !== bp) return ap ? -1 : 1;
                    const ak = kindLabel(a.kind);
                    const bk = kindLabel(b.kind);
                    if (ak !== bk) return ak.localeCompare(bk);
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  })
                  .map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border bg-white px-3 py-2 flex items-start gap-3"
                      data-tour="tone-style-formulation-item"
                    >
                      <button
                        type="button"
                        onClick={() => void handleTogglePinned(f)}
                        className={`mt-0.5 h-9 w-9 rounded-md border inline-flex items-center justify-center transition-colors ${
                          f.is_pinned
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                        title={f.is_pinned ? "Pinned (wird bevorzugt genutzt)" : "Pin setzen"}
                      >
                        {f.is_pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-[#fbfbfc] text-gray-700 inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {kindLabel(f.kind)}
                          </span>

                          {f.label ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white text-gray-700">
                              {f.label}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 text-sm text-gray-800 whitespace-pre-line break-words">
                          {f.text}
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-12 gap-2">
                          <div className="md:col-span-4">
                            <Input
                              value={f.label ?? ""}
                              onChange={(e) =>
                                void handleUpdateExampleMeta(f, {
                                  label: e.target.value.trim() ? e.target.value : null,
                                })
                              }
                              placeholder="Label (optional)"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <select
                              value={f.kind}
                              onChange={(e) =>
                                void handleUpdateExampleMeta(f, {
                                  kind: normalizeKind(e.target.value),
                                })
                              }
                              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              {KIND_OPTIONS.map((k) => (
                                <option key={k.value} value={k.value}>
                                  {k.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-4 flex items-center justify-end">
                            <Button
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => void handleRemoveFormulation(f.id)}
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {f.kind === "no_go" ? (
                          <div className="mt-2 text-xs text-amber-700">
                            Hinweis: <span className="font-medium">No-Go</span> Beispiele werden als „nicht verwenden“ interpretiert.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <Separator className="my-6" />

            <div className="mt-6" data-tour="tone-style-bottom-save">
              <Button
                onClick={handleSave}
                disabled={loading || saving}
                data-tour="tone-style-bottom-save-btn"
              >
                {saving ? "Speichern…" : "Einstellungen speichern"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Alle Angaben helfen uns, Ihren Kommunikationsstil möglichst
                exakt zu treffen.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Sticky Preview */}
        <div className="w-full lg:w-1/3" data-tour="tone-style-right">
          <div className="sticky top-24" data-tour="tone-style-preview-sticky">
            <div
              className="bg-white border rounded-2xl p-4 shadow-sm"
              data-tour="tone-style-preview-card"
            >
              <div data-tour="tone-style-preview-summary">
                <TonePreviewSummary
                  selectedStyle={selectedStyle}
                  customTone={customTone}
                  formulations={formulationStrings}
                />
              </div>
              <div
                className="mt-4 text-xs text-muted-foreground"
                data-tour="tone-style-preview-hint"
              >
                Vorschau berücksichtigt: Ton, Einschränkungen und gespeicherte
                Formulierungen.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
