"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  category?: string;
};

const aiSuggestions: Template[] = [
  {
    id: "ai-1",
    title: "Besichtigung vereinbaren",
    content:
      "vielen Dank für Ihre Nachricht! Ich schlage vor, dass wir einen Besichtigungstermin für nächste Woche vereinbaren.",
    category: "Besichtigung",
  },
  {
    id: "ai-2",
    title: "Nach Unterlagen fragen",
    content:
      "Vielen Dank für Ihr Interesse. Könnten Sie mir bitte Ihre vollständigen Unterlagen für die Bewerbung zukommen lassen?",
    category: "Nachfrage",
  },
  {
    id: "ai-3",
    title: "Absage freundlich",
    content:
      "Vielen Dank für Ihre Nachricht. Leider ist die Immobilie inzwischen vergeben. Ich wünsche Ihnen weiterhin viel Erfolg bei der Suche.",
    category: "Absage",
  },
];

export default function AntwortvorlagenPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState(aiSuggestions);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAddTemplate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const newTemplate: Template = {
      id: uuidv4(),
      title: newTitle,
      content: newContent,
    };
    setTemplates([newTemplate, ...templates]);
    setNewTitle("");
    setNewContent("");
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    setShowConfirmId(null);
    showToast("Vorlage gelöscht.");
  };

  const handleEdit = (id: string, updated: Template) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleAddFromAISuggestion = (template: Template) => {
    setTemplates([{ ...template, id: uuidv4() }, ...templates]);
    setSuggestions(suggestions.filter((s) => s.id !== template.id));
    showToast("KI-Vorschlag übernommen.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Antwortvorlagen</h1>
      <p className="text-gray-700 mb-6">
        Erstelle eigene Textvorlagen oder wähle einen KI-Vorschlag.
        <br />
        <span className="text-sm italic">
          Hinweis: Die Vorlage wird stilistisch angepasst – sie wird nicht 1:1
          verwendet.
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formular */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Neue Vorlage erstellen</h2>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="title"
            >
              Titel
            </label>
            <Input
              id="title"
              placeholder="z. B. Rückmeldung zur Besichtigung"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="content"
            >
              Antworttext
            </label>
            <Textarea
              id="content"
              placeholder="z. B. Vielen Dank für Ihre Nachricht..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
            />
            <div className="text-sm text-gray-500 text-right">
              {newContent.length} Zeichen
            </div>
          </div>

          <Button onClick={handleAddTemplate} className="w-full mt-2">
            Vorlage hinzufügen
          </Button>
        </Card>

        {/* Rechte Seite: Deine Vorlagen + KI-Vorschläge */}
        <div className="space-y-10">
          {/* Eigene Vorlagen */}
          <div>
            <h3 className="text-md font-semibold mb-3 border-b pb-1">
              Deine Vorlagen
            </h3>
            {templates.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Noch keine Vorlagen gespeichert.
              </p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="group relative">
                    <Card className="p-4">
                      <div className="font-semibold mb-1 flex justify-between items-start">
                        <span>{template.title}</span>
                        {template.category && (
                          <Badge variant="outline" className="ml-2">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line mb-2">
                        {template.content}
                      </p>
                      <div className="absolute top-2 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowConfirmId(template.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Löschen
                        </button>
                        <button
                          onClick={() => {
                            setNewTitle(template.title);
                            setNewContent(template.content);
                            handleDelete(template.id);
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Bearbeiten
                        </button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KI-Vorschläge */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3 border-t pt-4">
                KI-Vorschläge
              </h3>
              <div className="space-y-4">
                {suggestions.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="font-semibold mb-1 flex justify-between items-start">
                      <span>{template.title}</span>
                      {template.category && (
                        <Badge variant="outline">{template.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line mb-2">
                      {template.content}
                    </p>
                    <Button
                      onClick={() => handleAddFromAISuggestion(template)}
                      className="text-sm px-3 py-1"
                    >
                      Zur Vorlage hinzufügen
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              Vorlage wirklich löschen?
            </h2>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirmId(null)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showConfirmId)}
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
