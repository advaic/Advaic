"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Pin, PinOff, Tag, Trash2, Sparkles } from "lucide-react";

import { PageHeader, SectionCard, StatCard, StatusBadge } from "@/components/app-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

function splitRuleLines(value: string): string[] {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);
}

function buildCoreFingerprint(input: {
  selectedStyle: string;
  customTone: string;
  formality: string;
  lengthPref: string;
  emojiLevel: string;
  signOff: string;
}) {
  return JSON.stringify({
    selectedStyle: String(input.selectedStyle || "").trim(),
    customTone: String(input.customTone || "").trim(),
    formality: String(input.formality || "").trim(),
    lengthPref: String(input.lengthPref || "").trim(),
    emojiLevel: String(input.emojiLevel || "").trim(),
    signOff: String(input.signOff || "").trim(),
  });
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
  const [lastSavedCoreFingerprint, setLastSavedCoreFingerprint] = useState<string>(
    buildCoreFingerprint({
      selectedStyle: "freundlich",
      customTone: "",
      formality: DEFAULT_FORMALITY,
      lengthPref: DEFAULT_LENGTH,
      emojiLevel: DEFAULT_EMOJI,
      signOff: "",
    }),
  );

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

  const groupedFormulations = useMemo(() => {
    const pinnedExamples = formulations
      .filter((row) => row.is_pinned && row.kind !== "no_go")
      .map((row) => row.text);
    const scenarioExamples = formulations
      .filter((row) => row.kind === "scenario")
      .map((row) => row.text);
    const noGoExamples = formulations
      .filter((row) => row.kind === "no_go")
      .map((row) => row.text);

    return {
      pinnedExamples,
      scenarioExamples,
      noGoExamples,
    };
  }, [formulations]);

  const styleStats = useMemo(
    () => ({
      total: formulations.length,
      pinned: groupedFormulations.pinnedExamples.length,
      noGos: groupedFormulations.noGoExamples.length,
      activeRules: splitRuleLines(customTone).length,
      openSuggestions: suggestions.filter((suggestion) => !suggestion.already_applied)
        .length,
    }),
    [customTone, formulations.length, groupedFormulations, suggestions],
  );

  const coreFingerprint = useMemo(
    () =>
      buildCoreFingerprint({
        selectedStyle,
        customTone,
        formality,
        lengthPref,
        emojiLevel,
        signOff,
      }),
    [customTone, emojiLevel, formality, lengthPref, selectedStyle, signOff],
  );

  const isDirty = coreFingerprint !== lastSavedCoreFingerprint;

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

      const nextSelectedStyle = style?.tone || "freundlich";
      const nextFormality = style?.formality || DEFAULT_FORMALITY;
      const nextLengthPref = style?.length_pref || DEFAULT_LENGTH;
      const nextEmojiLevel = style?.emoji_level || DEFAULT_EMOJI;
      const nextCustomTone = style?.dont_rules || "";
      const nextSignOff = style?.sign_off || "";

      setSelectedStyle(nextSelectedStyle);
      setFormality(nextFormality);
      setLengthPref(nextLengthPref);
      setEmojiLevel(nextEmojiLevel);
      setCustomTone(nextCustomTone);
      setSignOff(nextSignOff);
      setLastSavedCoreFingerprint(
        buildCoreFingerprint({
          selectedStyle: nextSelectedStyle,
          customTone: nextCustomTone,
          formality: nextFormality,
          lengthPref: nextLengthPref,
          emojiLevel: nextEmojiLevel,
          signOff: nextSignOff,
        }),
      );

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
      setLastSavedCoreFingerprint(coreFingerprint);
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
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="tone-style-page"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 app-page-section">
        <PageHeader
          sticky={false}
          dataTour="tone-style-header"
          title={
            <div data-tour="tone-style-intro">
              <h1 className="app-text-page-title" data-tour="tone-style-title">
                Ton & Stil anpassen
              </h1>
            </div>
          }
          meta={
            <>
              <StatusBadge tone={isDirty ? "warning" : "success"}>
                {isDirty ? "Änderungen offen" : "Gespeichert"}
              </StatusBadge>
              <StatusBadge tone="brand">{styleStats.pinned} Stilanker</StatusBadge>
            </>
          }
          description="Lege fest, wie Advaic in neuen Antworten, Vorschlägen und Follow-ups klingt. Änderungen wirken sicher nur auf neue Entwürfe."
          actions={
            <div
              className="w-full lg:w-auto flex flex-wrap items-center gap-2"
              data-tour="tone-style-actions"
            >
              <Button
                variant="secondary"
                onClick={() => void loadAll()}
                disabled={loading || saving}
                className="w-full sm:w-auto"
                data-tour="tone-style-reload"
              >
                Neu laden
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || saving}
                className="w-full sm:w-auto"
                data-tour="tone-style-save"
              >
                {saving ? "Speichern…" : "Einstellungen speichern"}
              </Button>
            </div>
          }
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Status"
            value={isDirty ? "Entwurf offen" : "Stabil gespeichert"}
            hint={
              isDirty
                ? "Neue Regeln sind sichtbar, aber noch nicht auf neue Entwürfe übernommen."
                : "Neue Entwürfe folgen bereits deinem gespeicherten Stil."
            }
            icon={<Sparkles className="h-4 w-4" />}
          />
          <StatCard
            title="Stilanker"
            value={styleStats.pinned}
            hint="Gepinnte Beispiele werden bevorzugt als Stilanker genutzt."
            icon={<Pin className="h-4 w-4" />}
          />
          <StatCard
            title="No-Go-Regeln"
            value={styleStats.noGos}
            hint="Diese Formulierungen sollen bewusst vermieden werden."
            icon={<PinOff className="h-4 w-4" />}
          />
          <StatCard
            title="Aktive Guardrails"
            value={styleStats.activeRules}
            hint="Freie Regeln und Einschränkungen aus deinem Guardrail-Text."
            icon={<Tag className="h-4 w-4" />}
          />
          <StatCard
            title="Offene Lernhinweise"
            value={styleStats.openSuggestions}
            hint="Advaic erkennt wiederkehrende Änderungen aus deinen Freigaben."
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>

        <div
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
          data-tour="tone-style-layout"
        >
          <div className="min-w-0 space-y-6" data-tour="tone-style-left">
            <div data-tour="tone-style-card">
              <SectionCard
                className="shadow-sm"
                title={
                  <div data-tour="tone-style-tone-title">
                    1. Grundstil festlegen
                  </div>
                }
                description="Wähle zuerst die Grundrichtung. Danach schärfst du Anrede, Länge, Emoji-Niveau und Signatur nach."
              >
                <div data-tour="tone-style-selector">
                  <ToneStyleSelector
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                  />
                </div>

                <div
                  className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
                  data-tour="tone-style-knobs"
                >
                  <div className="rounded-xl border app-surface-muted px-4 py-4" data-tour="tone-style-formality">
                    <div className="text-sm font-medium text-gray-900">Anrede</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Einheitlich für neue Antworten und Vorschläge.
                    </div>
                    <select
                      value={formality}
                      onChange={(e) => setFormality(e.target.value)}
                      className="app-field mt-3 h-11 w-full rounded-xl border px-3 text-sm"
                    >
                      <option value="Sie-Form">Sie-Form</option>
                      <option value="Du-Form">Du-Form</option>
                    </select>
                  </div>

                  <div className="rounded-xl border app-surface-muted px-4 py-4" data-tour="tone-style-length">
                    <div className="text-sm font-medium text-gray-900">Antwortlänge</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Steuert die Grundtiefe neuer Antworten.
                    </div>
                    <select
                      value={lengthPref}
                      onChange={(e) => setLengthPref(e.target.value)}
                      className="app-field mt-3 h-11 w-full rounded-xl border px-3 text-sm"
                    >
                      <option value="kurz">Kurz</option>
                      <option value="mittel">Mittel</option>
                      <option value="detailliert">Detailliert</option>
                    </select>
                  </div>

                  <div className="rounded-xl border app-surface-muted px-4 py-4" data-tour="tone-style-emoji">
                    <div className="text-sm font-medium text-gray-900">Emoji-Level</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Optional und nur sinnvoll, wenn es wirklich zu deinem Stil passt.
                    </div>
                    <select
                      value={emojiLevel}
                      onChange={(e) => setEmojiLevel(e.target.value)}
                      className="app-field mt-3 h-11 w-full rounded-xl border px-3 text-sm"
                    >
                      <option value="none">Keine</option>
                      <option value="low">Wenig</option>
                      <option value="medium">Normal</option>
                    </select>
                  </div>

                  <div className="rounded-xl border app-surface-muted px-4 py-4" data-tour="tone-style-signoff">
                    <div className="text-sm font-medium text-gray-900">
                      Signatur
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Wird am Ende neuer KI-Antworten bevorzugt verwendet.
                    </div>
                    <Input
                      className="mt-3"
                      placeholder="z. B. Viele Grüße, Max"
                      value={signOff}
                      onChange={(e) => setSignOff(e.target.value)}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              className="shadow-sm"
              title={<div data-tour="tone-style-rules-title">2. Guardrails & Wünsche</div>}
              description="Formuliere hier, was Advaic beachten oder bewusst vermeiden soll. Das sind deine stabilen Leitplanken für neue Entwürfe."
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <Textarea
                    placeholder="z. B. keine Emojis verwenden, keine künstlich lockeren Formulierungen, klarer nächster Schritt am Ende."
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    className="min-h-[180px]"
                    data-tour="tone-style-rules-text"
                  />
                </div>
                <div className="rounded-xl border app-surface-muted px-4 py-4">
                  <div className="app-text-meta-label">So funktionieren Guardrails</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
                    <li>Gelten für neue Entwürfe und Follow-up-Vorschläge.</li>
                    <li>Ergänzen deinen Grundstil, statt ihn zu ersetzen.</li>
                    <li>Können Ton, Tabus und gewünschte Struktur festlegen.</li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {splitRuleLines(customTone).slice(0, 3).map((rule) => (
                      <StatusBadge key={rule} tone="neutral" size="sm">
                        {rule}
                      </StatusBadge>
                    ))}
                    {splitRuleLines(customTone).length === 0 ? (
                      <StatusBadge tone="neutral" size="sm">
                        Noch keine Zusatzregel
                      </StatusBadge>
                    ) : null}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              className="shadow-sm"
              title={<div data-tour="tone-style-formulations-title">3. Stilbeispiele & Lieblingsformulierungen</div>}
              description="Nutze gepinnte Beispiele für deinen bevorzugten Wortlaut, Use-Cases für wiederkehrende Antworten und No-Go-Beispiele für unerwünschte Formulierungen."
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusBadge tone="brand" size="sm">
                  {styleStats.pinned} gepinnt
                </StatusBadge>
                <StatusBadge tone="neutral" size="sm">
                  {formulations.length} Beispiele
                </StatusBadge>
                <StatusBadge tone="warning" size="sm">
                  {styleStats.noGos} No-Go
                </StatusBadge>
              </div>

              <div
                className="grid grid-cols-1 gap-2 md:grid-cols-12"
                data-tour="tone-style-formulations-add"
              >
                <div className="md:col-span-4">
                  <Input
                    placeholder="Formulierung"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleQuickSaveOnEnter}
                    data-tour="tone-style-formulations-input"
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    placeholder="Label, z. B. Haustiere"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    data-tour="tone-style-formulations-label"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={inputKind}
                    onChange={(e) => setInputKind(normalizeKind(e.target.value))}
                    className="app-field h-10 w-full rounded-lg border px-3 text-sm"
                    data-tour="tone-style-formulations-kind"
                  >
                    {KIND_OPTIONS.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setInputPinned((v) => !v)}
                    className={`h-10 px-3 rounded-lg border text-sm inline-flex items-center gap-2 transition-colors ${
                      inputPinned
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                    title={inputPinned ? "Gepinnt" : "Pin setzen"}
                    data-tour="tone-style-formulations-pin"
                  >
                    {inputPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                    {inputPinned ? "Gepinnt" : "Pinnen"}
                  </button>

                  <Button
                    onClick={() => void handleAddFormulation()}
                    data-tour="tone-style-formulations-add-btn"
                  >
                    Hinzufügen
                  </Button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Gepinnte Beispiele priorisieren den Stil. No-Go-Beispiele markieren Formulierungen, die nie auftauchen sollen.
              </div>

              {loading ? (
                <div className="mt-4 text-sm text-gray-500">Lade Beispiele…</div>
              ) : formulations.length === 0 ? (
                <div className="mt-4 rounded-xl border app-surface-muted px-4 py-4 text-sm text-gray-600">
                  Noch keine Stilbeispiele gespeichert. Lege zuerst 2–3 echte Lieblingsformulierungen an.
                </div>
              ) : (
                <div className="mt-4 space-y-3" data-tour="tone-style-formulations-list">
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
                    .map((formulation) => (
                      <div
                        key={formulation.id}
                        className="rounded-xl border app-surface-panel px-3 py-3"
                        data-tour="tone-style-formulation-item"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => void handleTogglePinned(formulation)}
                            className={`mt-0.5 h-9 w-9 rounded-md border inline-flex items-center justify-center transition-colors ${
                              formulation.is_pinned
                                ? "bg-amber-50 border-amber-200 text-amber-900"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                            title={formulation.is_pinned ? "Gepinnt" : "Pin setzen"}
                          >
                            {formulation.is_pinned ? (
                              <Pin className="h-4 w-4" />
                            ) : (
                              <PinOff className="h-4 w-4" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge tone="neutral" size="sm">
                                <Tag className="h-3 w-3" />
                                {kindLabel(formulation.kind)}
                              </StatusBadge>
                              {formulation.label ? (
                                <StatusBadge tone="brand" size="sm">
                                  {formulation.label}
                                </StatusBadge>
                              ) : null}
                            </div>

                            <div className="mt-2 whitespace-pre-line break-words text-sm text-gray-800">
                              {formulation.text}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
                              <div className="md:col-span-4">
                                <Input
                                  value={formulation.label ?? ""}
                                  onChange={(e) =>
                                    void handleUpdateExampleMeta(formulation, {
                                      label: e.target.value.trim()
                                        ? e.target.value
                                        : null,
                                    })
                                  }
                                  placeholder="Label (optional)"
                                />
                              </div>

                              <div className="md:col-span-4">
                                <select
                                  value={formulation.kind}
                                  onChange={(e) =>
                                    void handleUpdateExampleMeta(formulation, {
                                      kind: normalizeKind(e.target.value),
                                    })
                                  }
                                  className="app-field h-10 w-full rounded-lg border px-3 text-sm"
                                >
                                  {KIND_OPTIONS.map((kind) => (
                                    <option key={kind.value} value={kind.value}>
                                      {kind.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="md:col-span-4 flex items-center justify-end">
                                <Button
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => void handleRemoveFormulation(formulation.id)}
                                  title="Löschen"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {formulation.kind === "no_go" ? (
                              <div className="mt-2 text-xs text-amber-700">
                                Hinweis: No-Go-Beispiele markieren Formulierungen, die aktiv vermieden werden.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              className="shadow-sm"
              title="4. Advaic lernt aus deinen Freigaben"
              description="Wir analysieren deine manuellen Änderungen und schlagen konkrete Anpassungen für Ton, Guardrails und Beispiele vor."
              meta={
                suggestionAiMeta ? (
                  <StatusBadge tone={suggestionAiMeta.used ? "brand" : "neutral"} size="sm">
                    {suggestionAiMeta.used
                      ? "KI-Vorschläge aktiv"
                      : suggestionAiMeta.enabled
                        ? "Regeln + KI bereit"
                        : "Nur Regel-Engine"}
                  </StatusBadge>
                ) : undefined
              }
              actions={
                <Button
                  variant="secondary"
                  onClick={() => void loadAll()}
                  disabled={loading || saving || suggestionsLoading}
                >
                  Aktualisieren
                </Button>
              }
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  title="Geprüfte Freigaben"
                  value={suggestionMetrics?.total_reviews ?? 0}
                  hint="Grundlage für automatische Stilhinweise."
                />
                <StatCard
                  title="Änderungsquote"
                  value={toPct(suggestionMetrics?.edited_rate ?? 0)}
                  hint={`${suggestionMetrics?.edited_reviews ?? 0} Freigaben wurden sichtbar angepasst.`}
                />
                <StatCard
                  title="Top-Feedbacktreiber"
                  value={feedbackReasonLabel(suggestionMetrics?.feedback_top_reason)}
                  hint={`Anteil ${toPct(suggestionMetrics?.feedback_top_reason_share ?? 0)}`}
                />
              </div>

              {suggestionAiMeta?.error ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  KI-Hinweis: {suggestionAiMeta.error}
                </div>
              ) : null}

              {suggestionsLoading ? (
                <div className="mt-4 text-sm text-gray-500">Lernhinweise werden geladen…</div>
              ) : suggestionsError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  Vorschläge konnten nicht geladen werden: {suggestionsError}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="mt-4 rounded-xl border app-surface-muted px-4 py-4 text-sm text-gray-600">
                  Aktuell liegen keine konkreten Verbesserungsvorschläge vor.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {suggestions.map((suggestion) => {
                    const preview = previewFromPatch(suggestion.patch);
                    const applying = applyingSuggestionId === suggestion.id;

                    return (
                      <div
                        key={suggestion.id}
                        className="rounded-xl border app-surface-panel px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">
                              {suggestion.title}
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {suggestion.reason}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              tone={suggestion.source === "ai" ? "brand" : "neutral"}
                              size="sm"
                            >
                              {suggestion.source === "ai"
                                ? "KI-Vorschlag"
                                : "Regel-Vorschlag"}
                            </StatusBadge>
                            <StatusBadge tone="neutral" size="sm">
                              Sicherheit {toPct(suggestion.confidence)}
                            </StatusBadge>
                            {suggestion.already_applied ? (
                              <StatusBadge tone="success" size="sm">
                                Bereits aktiv
                              </StatusBadge>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl border app-surface-muted px-3 py-3 text-sm text-gray-700">
                          {suggestion.impact}
                        </div>

                        {preview.length > 0 ? (
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                            {preview.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : null}

                        <div className="mt-4">
                          <Button
                            onClick={() => void handleApplySuggestion(suggestion.id)}
                            disabled={suggestion.already_applied || !!applyingSuggestionId}
                          >
                            {applying
                              ? "Übernehme…"
                              : suggestion.already_applied
                                ? "Bereits übernommen"
                                : "Mit 1 Klick übernehmen"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <div
              className="rounded-2xl border app-surface-panel app-panel-padding"
              data-tour="tone-style-bottom-save"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="app-text-section-title text-gray-900">
                    Setup abschließen
                  </div>
                  <div className="app-text-helper mt-1">
                    Speichere deinen Stil, sobald Vorschau, Guardrails und Beispiele konsistent wirken.
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                  data-tour="tone-style-bottom-save-btn"
                >
                  {saving ? "Speichern…" : "Einstellungen speichern"}
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full" data-tour="tone-style-right">
            <div className="sticky top-24 space-y-4" data-tour="tone-style-preview-sticky">
              <SectionCard
                className="shadow-sm"
                bodyClassName="space-y-4"
                title="Live-Vorschau & Sicherheit"
                description="Änderungen erst prüfen, dann speichern. So bleibt Ton konsistent und kontrolliert."
              >
                <div data-tour="tone-style-preview-card">
                  <div data-tour="tone-style-preview-summary">
                    <TonePreviewSummary
                      selectedStyle={selectedStyle}
                      customTone={customTone}
                      formality={formality}
                      lengthPref={lengthPref}
                      emojiLevel={emojiLevel}
                      signOff={signOff}
                      pinnedExamples={groupedFormulations.pinnedExamples}
                      scenarioExamples={groupedFormulations.scenarioExamples}
                      noGoExamples={groupedFormulations.noGoExamples}
                      dirty={isDirty}
                    />
                  </div>
                  <div
                    className="text-xs text-gray-500"
                    data-tour="tone-style-preview-hint"
                  >
                    Vorschau berücksichtigt Grundstil, Guardrails, Stilanker und No-Go-Beispiele.
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
