"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/browserClient";

const CONFIRM_TEXT = "KONTO LOESCHEN";

export default function KontoLoeschenPage() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const closeDialog = () => {
    if (busy) return;
    setOpen(false);
    setPassword("");
    setConfirmText("");
    setError("");
    setMessage("");
  };

  const handleDelete = async () => {
    setError("");
    setMessage("");

    if (!password) {
      setError("Bitte gib dein aktuelles Passwort ein.");
      return;
    }

    if (confirmText.trim().toUpperCase() !== CONFIRM_TEXT) {
      setError(`Bitte "${CONFIRM_TEXT}" eingeben, um zu bestätigen.`);
      return;
    }

    setBusy(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: password,
        confirm_text: confirmText,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setError(String(data?.error || "Konto konnte nicht gelöscht werden."));
      setBusy(false);
      return;
    }

    setMessage("Konto wurde gelöscht. Du wirst abgemeldet...");
    await supabase.auth.signOut();
    window.location.assign("/");
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

      <Dialog open={open} onClose={closeDialog}>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-10">
          <h2 className="text-lg font-semibold mb-2">
            Konto wirklich löschen?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bist du dir sicher? Diese Aktion kann nicht rückgängig gemacht
            werden.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bestätigungs-Text: {CONFIRM_TEXT}
              </label>
              <input
                type="text"
                value={confirmText}
                disabled={busy}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDialog} disabled={busy}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "Lösche..." : "Ja, löschen"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
