"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ToneStyleSelector } from "@/components/settings/ToneStyleSelector";
import TonePreviewSummary from "@/components/settings/TonePreviewSummary";

export default function ToneSettingsPage() {
  const [selectedStyle, setSelectedStyle] = useState("freundlich");
  const [customTone, setCustomTone] = useState("");
  const [formulations, setFormulations] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleAddFormulation = () => {
    if (inputValue.trim() !== "") {
      setFormulations([...formulations, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveFormulation = (index: number) => {
    setFormulations(formulations.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl flex flex-col lg:flex-row gap-10">
        {/* LEFT: Main Form */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">Ton & Stil anpassen</h1>
          <p className="text-muted-foreground mb-6">
            Diese Einstellungen beeinflussen den Stil aller KI-Antworten,
            Vorschläge im Antwortvorlagen-Tool sowie Follow-Ups.
          </p>

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

          {/* Custom Tone Instructions */}
          <h2 className="text-lg font-semibold mb-1">
            Wünsche oder Einschränkungen
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Teilen Sie uns mit, was die KI vermeiden oder beachten soll – z. B.
            keine Emojis, gendergerechte Sprache, etc.
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
              onKeyDown={(e) => e.key === "Enter" && handleAddFormulation()}
            />
            <Button onClick={handleAddFormulation}>Hinzufügen</Button>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
            {formulations.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{f}</span>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                  onClick={() => handleRemoveFormulation(i)}
                >
                  Entfernen
                </Button>
              </li>
            ))}
          </ul>

          <Separator className="my-6" />

          {/* File Upload */}
          <h2 className="text-lg font-semibold mb-1">
            Ton-Beispiele hochladen (optional)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Laden Sie PDF-, TXT-, PNG- oder Word-Dateien mit Gesprächsbeispielen
            hoch, die den gewünschten Stil zeigen.
          </p>
          <Input type="file" multiple onChange={handleFileChange} />

          <Button className="mt-6">Einstellungen speichern</Button>
          <p className="text-xs text-muted-foreground mt-2">
            Alle Angaben helfen uns, Ihren Kommunikationsstil möglichst exakt zu
            treffen.
          </p>
        </div>

        {/* RIGHT: Sticky Preview */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24">
            <div className="bg-muted/40 border rounded-xl p-4 shadow-md">
              <TonePreviewSummary
                selectedStyle={selectedStyle}
                customTone={customTone}
                formulations={formulations}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
