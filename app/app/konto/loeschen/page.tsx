"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog"; // Only Dialog is available

export default function KontoLoeschenPage() {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setOpen(false);
    alert("Konto gelöscht (placeholder)");
    // TODO: Add API call here
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Konto löschen</h1>
      <p className="text-sm text-muted-foreground">
        Wenn du dein Konto löschst, werden alle deine Daten dauerhaft entfernt.
      </p>

      <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md text-sm">
        Achtung: Das Löschen deines Kontos ist endgültig.
      </div>

      <Button variant="destructive" onClick={() => setOpen(true)}>
        Konto unwiderruflich löschen
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-10">
          <h2 className="text-lg font-semibold mb-2">
            Konto wirklich löschen?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bist du dir sicher? Diese Aktion kann nicht rückgängig gemacht
            werden.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Ja, löschen
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
