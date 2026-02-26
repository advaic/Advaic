"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browserClient";

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
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [pendingQrCode, setPendingQrCode] = useState<string | null>(null);
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaError, setMfaError] = useState("");

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

  const refreshMfaState = async () => {
    setMfaError("");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMfaError("2FA-Status konnte nicht geladen werden.");
      return;
    }

    const verifiedTotp =
      data?.totp?.find((factor) => factor.status === "verified") || null;
    const unverifiedTotp =
      data?.all?.find(
        (factor) =>
          factor.factor_type === "totp" && String(factor.status) !== "verified",
      ) || null;

    setTwoFAEnabled(Boolean(verifiedTotp));
    setVerifiedFactorId(verifiedTotp?.id || null);
    setPendingFactorId(unverifiedTotp?.id || null);
    if (verifiedTotp) {
      setPendingQrCode(null);
      setPendingSecret(null);
      setVerificationCode("");
    }
  };

  useEffect(() => {
    refreshMfaState();
  }, []);

  const handleUpdatePassword = async () => {
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Bitte gib dein aktuelles Passwort ein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    if (!isPasswordStrongEnough) {
      setPasswordError("Das Passwort ist zu schwach.");
      return;
    }

    setPasswordBusy(true);
    const res = await fetch("/api/account/security/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setPasswordError(
        String(data?.error || "Passwort konnte nicht aktualisiert werden."),
      );
      setPasswordBusy(false);
      return;
    }

    setPasswordMessage("Passwort erfolgreich aktualisiert.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordBusy(false);
  };

  const enableTwoFA = async () => {
    setMfaBusy(true);
    setMfaError("");
    setMfaMessage("");

    if (pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId });
      setPendingFactorId(null);
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Advaic",
      issuer: "Advaic",
    });

    if (error || !data?.id || !data?.totp) {
      setMfaError("2FA konnte nicht gestartet werden.");
      setMfaBusy(false);
      return;
    }

    const rawQr = String(data.totp.qr_code || "");
    const qrDataUrl = rawQr.startsWith("data:image")
      ? rawQr
      : `data:image/svg+xml;utf-8,${encodeURIComponent(rawQr)}`;

    setPendingFactorId(data.id);
    setPendingQrCode(qrDataUrl);
    setPendingSecret(String(data.totp.secret || ""));
    setMfaMessage(
      "QR-Code mit einer Authenticator-App scannen und den 6-stelligen Code bestätigen.",
    );
    setMfaBusy(false);
  };

  const verifyTwoFA = async () => {
    if (!pendingFactorId) {
      setMfaError("Kein offenes 2FA-Setup gefunden.");
      return;
    }
    if (!verificationCode.trim()) {
      setMfaError("Bitte gib den Code aus deiner Authenticator-App ein.");
      return;
    }

    setMfaBusy(true);
    setMfaError("");
    setMfaMessage("");

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingFactorId,
      code: verificationCode.trim(),
    });

    if (error) {
      setMfaError("2FA-Code ungültig. Bitte erneut versuchen.");
      setMfaBusy(false);
      return;
    }

    setMfaMessage("2FA wurde erfolgreich aktiviert.");
    setTwoFAEnabled(true);
    setVerifiedFactorId(pendingFactorId);
    setPendingFactorId(null);
    setPendingQrCode(null);
    setPendingSecret(null);
    setVerificationCode("");
    setMfaBusy(false);
    await refreshMfaState();
  };

  const disableTwoFA = async () => {
    let factorId = verifiedFactorId;
    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      factorId =
        data?.totp?.find((factor) => factor.status === "verified")?.id || null;
    }
    if (!factorId) {
      setMfaError("Kein aktiver 2FA-Faktor gefunden.");
      return;
    }

    setMfaBusy(true);
    setMfaError("");
    setMfaMessage("");

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    if (error) {
      setMfaError("2FA konnte nicht deaktiviert werden.");
      setMfaBusy(false);
      return;
    }

    setTwoFAEnabled(false);
    setVerifiedFactorId(null);
    setPendingFactorId(null);
    setPendingQrCode(null);
    setPendingSecret(null);
    setVerificationCode("");
    setMfaMessage("2FA wurde deaktiviert.");
    setMfaBusy(false);
  };

  const toggleTwoFA = async () => {
    if (mfaBusy) return;
    if (twoFAEnabled) {
      await disableTwoFA();
      return;
    }
    await enableTwoFA();
  };

  return (
    <div className="max-w-xl space-y-6" data-tour="account-link-passwortsicherheit">
      <h1 className="text-2xl font-semibold">Passwort & Sicherheit</h1>
      <p className="text-muted-foreground">
        Aktualisiere dein Passwort oder aktiviere 2-Faktor-Authentifizierung.
      </p>

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
            disabled={passwordBusy}
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
            disabled={passwordBusy}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {newPassword ? (
            <p
              className={`text-sm mt-1 ${
                isPasswordStrongEnough ? "text-green-600" : "text-red-600"
              }`}
            >
              Stärke: {strengthLabel}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={confirmPassword}
            disabled={passwordBusy}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {passwordError ? (
          <div className="text-sm text-red-700 pt-1">{passwordError}</div>
        ) : null}
        {passwordMessage ? (
          <div className="text-sm text-green-700 pt-1">{passwordMessage}</div>
        ) : null}

        <button
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
          onClick={handleUpdatePassword}
          disabled={passwordBusy}
          type="button"
        >
          {passwordBusy ? "Aktualisiere..." : "Passwort aktualisieren"}
        </button>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-medium">2-Faktor-Authentifizierung</h2>
        <p className="text-muted-foreground">
          Schütze dein Konto zusätzlich per TOTP (Authenticator-App).
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTwoFA}
            disabled={mfaBusy}
            type="button"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
          >
            {mfaBusy
              ? "Bitte warten..."
              : twoFAEnabled
                ? "2FA deaktivieren"
                : "2FA aktivieren"}
          </button>
          <span className="text-sm text-muted-foreground">
            Status: {twoFAEnabled ? "Aktiviert" : "Deaktiviert"}
          </span>
        </div>

        {pendingFactorId && !twoFAEnabled ? (
          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <p className="text-sm font-medium">2FA-Einrichtung abschließen</p>
            {pendingQrCode ? (
              <img
                src={pendingQrCode}
                alt="2FA QR Code"
                className="w-44 h-44 border rounded bg-white p-2"
              />
            ) : null}
            {pendingSecret ? (
              <p className="text-xs text-muted-foreground break-all">
                Setup-Key: <span className="font-mono">{pendingSecret}</span>
              </p>
            ) : null}
            <div>
              <label className="block text-sm font-medium mb-1">
                6-stelliger Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={verificationCode}
                disabled={mfaBusy}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                  )
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="123456"
              />
            </div>
            <button
              onClick={verifyTwoFA}
              disabled={mfaBusy}
              type="button"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
            >
              Code bestätigen
            </button>
          </div>
        ) : null}

        {mfaError ? <div className="text-sm text-red-700">{mfaError}</div> : null}
        {mfaMessage ? <div className="text-sm text-green-700">{mfaMessage}</div> : null}

        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={refreshMfaState}
          disabled={mfaBusy}
        >
          Status aktualisieren
        </button>
      </div>
    </div>
  );
}
