"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const SpracheDarstellungSection = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevents hydration mismatch

  return (
    <div className="space-y-8">
      {/* Sprache */}
      <div className="border rounded-lg p-6 bg-muted/30 space-y-2">
        <h2 className="font-semibold text-lg">Sprache</h2>
        <p className="text-sm text-muted-foreground">
          Wähle deine bevorzugte Sprache für die Benutzeroberfläche.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant={language === "de" ? "default" : "outline"}
            onClick={() => setLanguage("de")}
          >
            Deutsch
          </Button>
          <Button
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
          >
            Englisch
          </Button>
        </div>
      </div>

      {/* Darstellung */}
      <div className="border rounded-lg p-6 bg-muted/30 space-y-2">
        <h2 className="font-semibold text-lg">Darstellung</h2>
        <p className="text-sm text-muted-foreground">
          Wähle, wie Advaic auf deinem Gerät angezeigt wird.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
          >
            Hell
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
          >
            Dunkel
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => setTheme("system")}
          >
            System
          </Button>
        </div>
      </div>
    </div>
    
  );
};
