"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

type StyleExampleRow = {
  id: string;
  agent_id: string;
  label: string | null;
  text: string;
  created_at: string;
};

const DEFAULT_FORMALITY = "Sie-Form";
const DEFAULT_LENGTH = "mittel";
const DEFAULT_EMOJI = "none";

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

  // Loading / saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // File upload placeholder (not wired yet)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const formulationStrings = useMemo(
    () => formulations.map((f) => f.text),
    [formulations]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

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
        .select("id,agent_id,label,text,created_at")
        .eq("agent_id", uid)
        .order("created_at", { ascending: true });

      if (exErr) {
        console.error("❌ agent_style_examples load error:", exErr);
      } else {
        setFormulations(ex || []);
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
      // Store constraints in dont_rules (matches SQL we created)
      dont_rules: customTone || null,
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

    const uid = await getUserId();
    if (!uid) {
      toast.error("Nicht eingeloggt. Bitte neu einloggen.");
      return;
    }

    // Optimistic UI
    setInputValue("");

    const { data, error } = await supabase
      .from("agent_style_examples")
      .insert([{ agent_id: uid, text }])
      .select("id,agent_id,label,text,created_at")
      .single();

    if (error) {
      console.error("❌ insert style example error:", error);
      toast.error("Konnte Formulierung nicht speichern.");
      return;
    }

    setFormulations((prev) => [...prev, data as StyleExampleRow]);
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

  const handleQuickSaveOnEnter = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleAddFormulation();
    }
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-[#f7f7f8]">
      <div className="mx-auto w-full max-w-6xl flex flex-col lg:flex-row gap-10">
        {/* LEFT: Main Form */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Ton & Stil anpassen</h1>
              <p className="text-muted-foreground mb-6">
                Diese Einstellungen beeinflussen den Stil aller KI-Antworten,
                Vorschläge im Antwortvorlagen-Tool sowie Follow-Ups.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => void loadAll()}
                disabled={loading || saving}
              >
                Neu laden
              </Button>
              <Button onClick={handleSave} disabled={loading || saving}>
                {saving ? "Speichern…" : "Einstellungen speichern"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            {/* Tone Style Selection */}
            <h2 className="text-lg font-semibold mb-1">Antwort-Ton wählen</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Wählen Sie einen generellen Stil für Ihre Kommunikation mit
              Interessenten.
            </p>
            <ToneStyleSelector
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
            />

            <Separator className="my-6" />

            {/* Structured knobs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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

              <div>
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

              <div>
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

              <div>
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
            <h2 className="text-lg font-semibold mb-1">
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
            />

            <Separator className="my-6" />

            {/* Preferred Formulations */}
            <h2 className="text-lg font-semibold mb-1">
              Eigene Lieblingsformulierungen
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Diese Phrasen werden von der KI bevorzugt verwendet – ideal für
              Begrüßungen, Abschlüsse etc.
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Formulierung eingeben & Enter drücken"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleQuickSaveOnEnter}
              />
              <Button onClick={() => void handleAddFormulation()}>
                Hinzufügen
              </Button>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Lade…</div>
            ) : formulations.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Noch keine Formulierungen gespeichert.
              </div>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-2">
                {formulations.map((f) => (
                  <li key={f.id} className="flex items-center justify-between">
                    <span>{f.text}</span>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                      onClick={() => void handleRemoveFormulation(f.id)}
                    >
                      Entfernen
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Separator className="my-6" />

            {/* File Upload */}
            <h2 className="text-lg font-semibold mb-1">
              Ton-Beispiele hochladen (optional)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Laden Sie PDF-, TXT-, PNG- oder Word-Dateien mit
              Gesprächsbeispielen hoch, die den gewünschten Stil zeigen.
            </p>
            <Input type="file" multiple onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground mt-2">
              Hinweis: Upload/Parsing ist noch nicht angebunden – wir speichern
              zunächst nur die Ton-Einstellungen & Formulierungen.
              {selectedFiles?.length
                ? ` (${selectedFiles.length} Datei(en) ausgewählt)`
                : ""}
            </p>

            <div className="mt-6">
              <Button onClick={handleSave} disabled={loading || saving}>
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
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <TonePreviewSummary
                selectedStyle={selectedStyle}
                customTone={customTone}
                formulations={formulationStrings}
              />
              <div className="mt-4 text-xs text-muted-foreground">
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
