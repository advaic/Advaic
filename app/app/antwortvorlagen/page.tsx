"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";

type Template = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  is_ai_generated?: boolean;
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

export default function AntwortvorlagenPage() {
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState(aiSuggestions);

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

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("");
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
    setCategory(t.category ?? "");
    // bring form into view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function requireUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      showToast("Nicht eingeloggt. Bitte neu einloggen.");
      return null;
    }
    return user.id;
  }

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setInitialLoading(true);
      try {
        const userId = await requireUserId();
        if (!userId || cancelled) return;

        const { data, error } = await supabase
          .from("response_templates")
          .select(
            "id, title, content, category, is_ai_generated, created_at, updated_at"
          )
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ response_templates select error:", error);
          showToast("Konnte Vorlagen nicht laden.");
          return;
        }

        if (!cancelled) setTemplates((data as any as Template[]) ?? []);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          .select(
            "id, title, content, category, is_ai_generated, created_at, updated_at"
          )
          .single();

        if (error || !data) {
          console.error("❌ response_templates update error:", error);
          showToast("Konnte Vorlage nicht aktualisieren.");
          return;
        }

        // Move updated template to top
        setTemplates((prev) => {
          const next = prev.filter((t) => t.id !== editingId);
          return [data as any as Template, ...next];
        });

        showToast("Vorlage aktualisiert.");
        resetForm();
        return;
      }

      // Insert
      const { data, error } = await supabase
        .from("response_templates")
        .insert([
          {
            agent_id: userId,
            ...payload,
            is_ai_generated: false,
          },
        ])
        .select(
          "id, title, content, category, is_ai_generated, created_at, updated_at"
        )
        .single();

      if (error || !data) {
        console.error("❌ response_templates insert error:", error);
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
        .eq("id", id);

      if (error) {
        console.error("❌ response_templates delete error:", error);
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
      const { data, error } = await supabase
        .from("response_templates")
        .insert([
          {
            agent_id: userId,
            title: t.title,
            content: t.content,
            category: t.category ?? null,
            is_ai_generated: true,
          },
        ])
        .select(
          "id, title, content, category, is_ai_generated, created_at, updated_at"
        )
        .single();

      if (error || !data) {
        console.error(
          "❌ response_templates insert (suggestion) error:",
          error
        );
        showToast("Konnte KI-Vorschlag nicht übernehmen.");
        return;
      }

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

      if (!res.ok) {
        const msg =
          res.status === 404
            ? "KI-Generator ist noch nicht aktiv (API-Route fehlt)."
            : "KI konnte keine Vorlage erstellen.";
        showToast(msg);
        return;
      }

      const json = (await res.json().catch(() => null)) as {
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

      // Fill form so agent can edit before saving
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
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="templates-page"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
          data-tour="templates-header"
        >
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl md:text-2xl font-semibold"
                  data-tour="templates-title"
                >
                  Antwortvorlagen
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  {templates.length} Vorlagen
                </span>
              </div>
              <div
                className="mt-1 text-sm text-gray-600"
                data-tour="templates-intro"
              >
                Erstelle eigene Textbausteine. Advaic kombiniert Vorlagen mit
                Kontext, Ton & Stil – sie werden nie starr 1:1 gesendet.
              </div>
            </div>

            <div className="flex items-center gap-2" data-tour="templates-actions">
              {isEditing ? (
                <Button variant="outline" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" />
                  Abbrechen
                </Button>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={!canSave || saving}
                title={
                  isEditing
                    ? "Änderungen speichern"
                    : "Vorlage speichern (du kannst sie danach jederzeit bearbeiten)"
                }
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
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            data-tour="templates-layout"
          >
            {/* Left: Form */}
            <Card
              className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white overflow-hidden"
              data-tour="templates-form-card"
            >
              <div
                className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between"
                data-tour="templates-form-header"
              >
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

              <div className="p-4 md:p-6 space-y-4" data-tour="templates-form">
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
                    data-tour="templates-field-title"
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
                    data-tour="templates-field-category"
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
                    data-tour="templates-field-content"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {content.length} Zeichen
                  </div>
                </div>

                <div
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                  data-tour="templates-tip"
                >
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
            <div className="lg:col-span-2 space-y-4" data-tour="templates-right-col">
              {/* AI Generator */}
              <Card
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                data-tour="templates-ai-card"
              >
                <div
                  className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between"
                  data-tour="templates-ai-header"
                >
                  <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-gray-500" />
                    KI-Vorlage erstellen
                  </div>
                  <div className="text-xs text-gray-500">optional</div>
                </div>

                <div className="p-4 md:p-6 space-y-3" data-tour="templates-ai-body">
                  <div className="text-sm text-gray-600">
                    Beschreibe kurz, was du sagen willst. Der Generator erstellt
                    eine erste Version – automatisch in deinem hinterlegten Ton
                    & Stil. Danach kannst du sie anpassen und speichern.
                  </div>

                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Beispiel: Freundliche Antwort für Interessenten, die nach Haustieren fragen (kurz, professionell)."
                    rows={3}
                    className="resize-none"
                    data-tour="templates-ai-prompt"
                  />
                  <div className="text-xs text-gray-500">
                    Hinweis: Die KI nutzt deinen Ton & Stil aus den
                    Einstellungen.
                  </div>

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
                      data-tour="templates-ai-generate"
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
              <Card
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                data-tour="templates-list-card"
              >
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

                <div className="p-4 md:p-6" data-tour="templates-list">
                  {initialLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vorlagen werden geladen…
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      Noch keine Vorlagen gespeichert. Erstelle links eine neue
                      Vorlage oder nutze den KI-Generator.
                    </div>
                  ) : (
                    <div className="space-y-3" data-tour="templates-items">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          data-tour="template-card"
                          className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-[#fbfbfc] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate" data-tour="template-title">
                                {t.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                {t.category ? (
                                  <Badge variant="outline">{t.category}</Badge>
                                ) : null}
                                {t.is_ai_generated ? (
                                  <Badge variant="outline" className="bg-white">
                                    KI
                                  </Badge>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2" data-tour="template-edit">
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
                              data-tour="template-delete"
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
                            {t.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* AI suggestions (optional) */}
              {suggestions.length > 0 ? (
                <Card
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                  data-tour="templates-suggestions-card"
                >
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                    <div className="text-sm text-gray-700 font-medium inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gray-500" />
                      KI-Vorschläge
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestions.length} verfügbar
                    </div>
                  </div>

                  <div className="p-4 md:p-6" data-tour="templates-suggestions">
                    <div className="space-y-3">
                      {suggestions.map((t) => (
                        <div
                          key={t.id}
                          data-tour="template-suggestion-card"
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
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
            data-tour="templates-delete-modal"
          >
            <div
              className="bg-white rounded-2xl p-6 shadow-md w-full max-w-sm border border-gray-200"
              data-tour="templates-delete-modal-card"
            >
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
