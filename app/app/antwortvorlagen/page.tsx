"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  CheckCircle2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  Wand2,
  Lightbulb,
  Loader2,
  Search,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

type Template = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  its_ai_generated?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

const aiSuggestions: Template[] = [
  {
    id: "ai-1",
    title: "Besichtigung vereinbaren",
    content:
      "Vielen Dank für Ihre Nachricht! Gerne schlage ich vor, dass wir einen Besichtigungstermin für nächste Woche vereinbaren. Welche Tage würden Ihnen passen?",
    category: "Besichtigung",
  },
  {
    id: "ai-2",
    title: "Nach Unterlagen fragen",
    content:
      "Vielen Dank für Ihr Interesse. Könnten Sie mir bitte Ihre vollständigen Unterlagen (z. B. Selbstauskunft, Einkommensnachweise, SCHUFA) zusenden? Dann kann ich den nächsten Schritt direkt vorbereiten.",
    category: "Nachfrage",
  },
  {
    id: "ai-3",
    title: "Absage freundlich",
    content:
      "Vielen Dank für Ihre Nachricht. Leider ist die Immobilie inzwischen vergeben. Ich wünsche Ihnen weiterhin viel Erfolg bei der Suche – wenn Sie möchten, können Sie mir gern Ihre Kriterien schicken.",
    category: "Absage",
  },
];

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function normCat(v: unknown): string {
  return safeTrim(v).toLowerCase();
}

function previewText(text: string, maxChars = 220): string {
  const t = safeTrim(text).replace(/\s+$/g, "");
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars).trimEnd() + "…";
}

function logSupabaseError(label: string, err: unknown) {
  const e = err as any;
  // Wichtig: message/code/details/hint sind oft NICHT enumerable -> {} im Overlay
  console.error(label, {
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
    code: e?.code,
    raw: e,
  });
}

export default function AntwortvorlagenPage() {
  const supabase = useSupabaseClient<Database>();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState(aiSuggestions);

  // list controls
  const [listQuery, setListQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOnlyAI, setShowOnlyAI] = useState(false);

  // per-card expand state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // form state (create + edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  // AI generator
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const isEditing = Boolean(editingId);

  const canSave = useMemo(() => {
    return Boolean(safeTrim(title) && safeTrim(content));
  }, [title, content]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      const c = safeTrim(t.category);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = safeTrim(listQuery).toLowerCase();
    const cf = categoryFilter;

    return (templates ?? []).filter((t) => {
      if (showOnlyAI && !t.its_ai_generated) return false;

      if (cf !== "all") {
        if (normCat(t.category) !== normCat(cf)) return false;
      }

      if (!q) return true;
      const hay = [t.title, t.content, t.category].map((x) =>
        safeTrim(x).toLowerCase(),
      );
      return hay.some((x) => x.includes(q));
    });
  }, [templates, listQuery, categoryFilter, showOnlyAI]);

  const toggleExpanded = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  const copyTemplate = async (t: Template) => {
    const text = safeTrim(t.content);
    if (!text) {
      showToast("Kein Text zum Kopieren.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Vorlage kopiert.");
    } catch {
      showToast("Konnte nicht kopieren.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("");
    setExpanded({});
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
    setCategory(t.category ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function requireUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (error || !user?.id) {
      logSupabaseError("[templates] getUser error", error);
      showToast("Nicht eingeloggt. Bitte neu einloggen.");
      return null;
    }
    return user.id;
  }

  const refreshTemplates = useCallback(async () => {
    const userId = await requireUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("response_templates")
      .select(
        "id, title, content, category, its_ai_generated, created_at, updated_at",
      )
      .eq("agent_id", userId) // <- RLS-safe
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("❌ response_templates select error:", error);
      showToast("Konnte Vorlagen nicht laden.");
      return;
    }

    setTemplates((data as any as Template[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setInitialLoading(true);
      try {
        await refreshTemplates();
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTemplates]);

  const handleSubmit = async () => {
    if (!canSave) {
      showToast("Bitte Titel und Antworttext ausfüllen.");
      return;
    }

    const userId = await requireUserId();
    if (!userId) return;

    setSaving(true);
    try {
      const payload = {
        title: safeTrim(title),
        content: safeTrim(content),
        category: safeTrim(category) || null,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("response_templates")
          .update(payload)
          .eq("id", editingId)
          .eq("agent_id", userId) // <- extra safe
          .select(
            "id, title, content, category, its_ai_generated, created_at, updated_at",
          )
          .single();

        if (error || !data) {
          logSupabaseError("❌ response_templates update error:", error);
          showToast("Konnte Vorlage nicht aktualisieren.");
          return;
        }

        setTemplates((prev) => {
          const next = prev.filter((t) => t.id !== editingId);
          return [data as any as Template, ...next];
        });

        showToast("Vorlage aktualisiert.");
        resetForm();
        return;
      }

      const { data, error } = await supabase
        .from("response_templates")
        .insert([
          {
            agent_id: userId,
            ...payload,
            its_ai_generated: false,
          },
        ])
        .select(
          "id, title, content, category, its_ai_generated, created_at, updated_at",
        )
        .single();

      if (error || !data) {
        logSupabaseError("❌ response_templates insert error:", error);
        showToast("Konnte Vorlage nicht speichern.");
        return;
      }

      setTemplates((prev) => [data as any as Template, ...prev]);
      showToast("Vorlage gespeichert.");
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const userId = await requireUserId();
    if (!userId) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("response_templates")
        .delete()
        .eq("id", id)
        .eq("agent_id", userId);

      if (error) {
        logSupabaseError("❌ response_templates delete error:", error);
        showToast("Konnte Vorlage nicht löschen.");
        return;
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setShowConfirmId(null);
      if (editingId === id) resetForm();
      showToast("Vorlage gelöscht.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddFromAISuggestion = async (t: Template) => {
    const userId = await requireUserId();
    if (!userId) return;

    setSaving(true);
    try {
      // Wir holen uns direkt das neue Row zurück -> UI kann sofort updaten.
      const { data, error } = await supabase
        .from("response_templates")
        .insert([
          {
            agent_id: userId,
            title: t.title,
            content: t.content,
            category: t.category ?? null,
            its_ai_generated: true,
          },
        ])
        .select(
          "id, title, content, category, its_ai_generated, created_at, updated_at",
        )
        .single();

      if (error || !data) {
        logSupabaseError(
          "❌ response_templates insert (suggestion) error:",
          error,
        );
        showToast(
          (error as any)?.message || "Konnte KI-Vorschlag nicht übernehmen.",
        );
        return;
      }

      // sofort sichtbar + Vorschlag aus Liste entfernen
      setTemplates((prev) => [data as any as Template, ...prev]);
      setSuggestions((prev) => prev.filter((s) => s.id !== t.id));
      showToast("KI-Vorschlag übernommen.");
    } finally {
      setSaving(false);
    }
  };

  const generateWithAI = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      showToast("Bitte beschreibe kurz, welche Vorlage du willst.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/response-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const errorJson = (await res.json().catch(() => null)) as
        | { error?: string; details?: string }
        | null;

      if (!res.ok) {
        if (res.status === 402) {
          const details = String(errorJson?.details || "").trim();
          showToast(
            details ||
              "Dieses Feature ist in deinem aktuellen Plan nicht enthalten. Sieh dir unter Konto > Abo die Pläne an.",
          );
          return;
        }

        const msg =
          res.status === 404
            ? "KI-Generator ist noch nicht aktiv (API-Route fehlt)."
            : String(errorJson?.details || "KI konnte keine Vorlage erstellen.");
        showToast(msg);
        return;
      }

      const json = errorJson as {
        title?: string;
        content?: string;
        category?: string;
      } | null;

      const nextTitle = String(json?.title ?? "").trim();
      const nextContent = String(json?.content ?? "").trim();
      const nextCategory = String(json?.category ?? "").trim();

      if (!nextTitle || !nextContent) {
        showToast("KI-Antwort war unvollständig.");
        return;
      }

      setEditingId(null);
      setTitle(nextTitle);
      setContent(nextContent);
      setCategory(nextCategory);

      showToast("KI-Vorlage erstellt. Bitte kurz prüfen und speichern.");
    } catch {
      showToast("KI-Generator konnte nicht erreicht werden.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold">
                  Antwortvorlagen
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  {filteredTemplates.length} / {templates.length} Vorlagen
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Erstelle eigene Textbausteine. Advaic kombiniert Vorlagen mit
                Kontext, Ton & Stil – sie werden nie starr 1:1 gesendet.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <Button variant="outline" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" />
                  Abbrechen
                </Button>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={!canSave || saving}
                className="rounded-lg bg-gray-900 text-amber-200 hover:bg-gray-800 gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isEditing ? "Änderungen speichern" : "Speichern"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Form */}
            <Card className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Pencil className="h-4 w-4 text-gray-500" />
                      Vorlage bearbeiten
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-gray-500" />
                      Antwortvorlage erstellen
                    </>
                  )}
                </div>
                {isEditing ? (
                  <Badge variant="outline" className="bg-white">
                    Edit-Modus
                  </Badge>
                ) : null}
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-gray-700"
                    htmlFor="title"
                  >
                    Titel
                  </label>
                  <Input
                    id="title"
                    placeholder="z. B. Rückmeldung zur Besichtigung"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-gray-700"
                    htmlFor="category"
                  >
                    Kategorie (optional)
                  </label>
                  <Input
                    id="category"
                    placeholder="z. B. Besichtigung, Nachfrage, Absage"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-gray-700"
                    htmlFor="content"
                  >
                    Antworttext
                  </label>
                  <Textarea
                    id="content"
                    placeholder="z. B. Vielen Dank für Ihre Nachricht …"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {content.length} Zeichen
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-medium text-amber-900 inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Tipp
                  </div>
                  <div className="text-sm text-amber-800 mt-1">
                    Halte Vorlagen kurz und eindeutig. Advaic passt Ton & Stil
                    automatisch an.
                  </div>
                </div>
              </div>
            </Card>

            {/* Right: Lists */}
            <div className="lg:col-span-2 space-y-4">
              {/* AI Generator */}
              <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-gray-500" />
                    KI-Vorlage erstellen
                  </div>
                  <div className="text-xs text-gray-500">optional</div>
                </div>

                <div className="p-4 md:p-6 space-y-3">
                  <div className="text-sm text-gray-600">
                    Beschreibe kurz, was du sagen willst. Der Generator erstellt
                    eine erste Version – automatisch in deinem Ton & Stil.
                  </div>

                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Beispiel: Freundliche Antwort für Interessenten, die nach Haustieren fragen (kurz, professionell)."
                    rows={3}
                    className="resize-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setAiPrompt("")}
                      disabled={aiLoading || !aiPrompt.trim()}
                    >
                      Zurücksetzen
                    </Button>
                    <Button
                      className="rounded-lg bg-gray-900 text-amber-200 hover:bg-gray-800 gap-2"
                      onClick={generateWithAI}
                      disabled={aiLoading || !aiPrompt.trim()}
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Erstelle…
                        </>
                      ) : (
                        "KI-Vorlage generieren"
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Hinweis: Falls der KI-Generator noch nicht aktiv ist,
                    erscheint eine kurze Meldung.
                  </div>
                </div>
              </Card>

              {/* Your templates */}
              <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-gray-500" />
                    Deine Vorlagen
                  </div>
                  <div className="text-xs text-gray-500">
                    {initialLoading
                      ? "Lade…"
                      : templates.length === 0
                        ? "Noch keine Vorlagen"
                        : `${templates.length} gespeichert`}
                  </div>
                </div>

                {/* List controls */}
                <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={listQuery}
                        onChange={(e) => setListQuery(e.target.value)}
                        placeholder="Suche… (Titel, Kategorie, Inhalt)"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                      />
                    </div>

                    <select
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      title="Kategorie filtern"
                    >
                      <option value="all">Alle Kategorien</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowOnlyAI((v) => !v)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        showOnlyAI
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      title="Nur KI-generierte Vorlagen anzeigen"
                    >
                      <Sparkles className="h-4 w-4 inline-block mr-2" />
                      Nur KI
                    </button>
                  </div>

                  {(safeTrim(listQuery) ||
                    categoryFilter !== "all" ||
                    showOnlyAI) && (
                    <div className="mt-2 text-xs text-gray-500">
                      Filter aktiv:{" "}
                      {safeTrim(listQuery)
                        ? `Suche “${safeTrim(listQuery)}”`
                        : "–"}
                      {categoryFilter !== "all"
                        ? ` · Kategorie: ${categoryFilter}`
                        : ""}
                      {showOnlyAI ? " · Nur KI" : ""}
                      <button
                        type="button"
                        className="ml-2 text-gray-700 hover:underline"
                        onClick={() => {
                          setListQuery("");
                          setCategoryFilter("all");
                          setShowOnlyAI(false);
                        }}
                      >
                        Zurücksetzen
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-6">
                  {initialLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vorlagen werden geladen…
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      {templates.length === 0
                        ? "Noch keine Vorlagen gespeichert. Erstelle links eine neue Vorlage oder nutze den KI-Generator."
                        : "Keine Treffer für deine Filter. Passe Suche/Kategorie an oder setze Filter zurück."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-[#fbfbfc] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {t.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                {t.category ? (
                                  <Badge variant="outline">{t.category}</Badge>
                                ) : null}
                                {t.its_ai_generated ? (
                                  <Badge variant="outline" className="bg-white">
                                    KI
                                  </Badge>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => startEdit(t)}
                                disabled={saving || deletingId === t.id}
                              >
                                <Pencil className="h-4 w-4" />
                                Bearbeiten
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={() => setShowConfirmId(t.id)}
                                disabled={saving || deletingId === t.id}
                              >
                                {deletingId === t.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Löschen
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                            {expanded[t.id]
                              ? safeTrim(t.content)
                              : previewText(t.content)}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] text-gray-500">
                              {t.updated_at
                                ? `Zuletzt geändert: ${new Date(t.updated_at).toLocaleDateString()}`
                                : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => copyTemplate(t)}
                                disabled={saving || deletingId === t.id}
                                title="Vorlage kopieren"
                              >
                                <Copy className="h-4 w-4" />
                                Kopieren
                              </Button>

                              {safeTrim(t.content).length > 220 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => toggleExpanded(t.id)}
                                  disabled={saving || deletingId === t.id}
                                  title={
                                    expanded[t.id]
                                      ? "Weniger anzeigen"
                                      : "Mehr anzeigen"
                                  }
                                >
                                  {expanded[t.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  {expanded[t.id] ? "Weniger" : "Mehr"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* AI suggestions */}
              {suggestions.length > 0 ? (
                <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                    <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gray-500" />
                      KI-Vorschläge
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestions.length} verfügbar
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="space-y-3">
                      {suggestions.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {t.title}
                              </div>
                              {t.category ? (
                                <div className="mt-1">
                                  <Badge variant="outline">{t.category}</Badge>
                                </div>
                              ) : null}
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleAddFromAISuggestion(t)}
                              disabled={saving}
                            >
                              <Plus className="h-4 w-4" />
                              Übernehmen
                            </Button>
                          </div>

                          <div className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                            {t.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>

          <div className="h-8" />
        </div>

        {/* Confirm Dialog */}
        {showConfirmId ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">
                Vorlage wirklich löschen?
              </h2>
              <p className="text-sm text-gray-600 mb-5">
                Dieser Vorgang kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmId(null)}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showConfirmId)}
                  className="gap-2"
                  disabled={deletingId === showConfirmId}
                >
                  {deletingId === showConfirmId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
