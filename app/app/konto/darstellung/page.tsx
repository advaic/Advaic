"use client";

import { SpracheDarstellungSection } from "@/components/settings/SpracheDarstellungSection";

export default function DarstellungPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Sprache & Darstellung</h1>
      <p className="text-muted-foreground text-sm">
        Passe die Sprache und das Aussehen deiner Oberfläche an.
      </p>

      <SpracheDarstellungSection />
    </div>
  );
}
