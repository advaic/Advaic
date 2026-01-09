"use client";

import { useState } from "react";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function PasswortSicherheitPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabel = [
    "Sehr schwach",
    "Schwach",
    "Okay",
    "Gut",
    "Stark",
    "Sehr stark",
  ][passwordStrength];

  const isPasswordStrongEnough = passwordStrength >= 3;

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage("❌ Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    if (!isPasswordStrongEnough) {
      setMessage("❌ Das Passwort ist zu schwach.");
      return;
    }

    // Here you'd call your backend to update the password
    setMessage("✅ Passwort erfolgreich aktualisiert");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const toggleTwoFA = () => {
    // Optional: call backend to actually toggle it
    setTwoFAEnabled((prev) => !prev);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Passwort & Sicherheit</h1>
      <p className="text-muted-foreground">
        Aktualisiere dein Passwort oder aktiviere 2-Faktor-Authentifizierung.
      </p>

      {/* Passwort Update */}
      <div className="space-y-4 border rounded-lg p-4">
        <h2 className="text-lg font-medium">Passwort ändern</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Aktuelles Passwort
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Neues Passwort
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {newPassword && (
            <p
              className={`text-sm mt-1 ${
                isPasswordStrongEnough ? "text-green-600" : "text-red-600"
              }`}
            >
              Stärke: {strengthLabel}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {message && (
          <div className="text-sm text-muted-foreground pt-1">{message}</div>
        )}

        <button
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
          onClick={handleUpdatePassword}
        >
          Passwort aktualisieren
        </button>
      </div>

      {/* 2FA Toggle */}
      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-medium">2-Faktor-Authentifizierung</h2>
        <p className="text-muted-foreground">
          Aktiviere eine zusätzliche Sicherheitsebene durch 2FA.
        </p>
        <label className="flex items-center gap-3 mt-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={twoFAEnabled}
            onChange={toggleTwoFA}
          />
          <span>{twoFAEnabled ? "Aktiviert" : "Deaktiviert"}</span>
        </label>
      </div>
    </div>
  );
}
