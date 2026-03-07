"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/marketing/AuthShell";
import { useSearchParams } from "next/navigation";
import {
  parseSafeStartPresetFromParams,
  saveSafeStartPreset,
  serializeSafeStartPresetToQuery,
} from "@/lib/onboarding/safe-start-preset";

type SignupStage = "collect" | "verify" | "done";

function normalizePhoneClient(raw: string) {
  const input = String(raw || "").trim();
  const hasPlus = input.startsWith("+");
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return `${hasPlus ? "+" : ""}${digits}`;
}

export default function SignupPage() {
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<SignupStage>("collect");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [allowNewsletter, setAllowNewsletter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [resendCooldownSec, setResendCooldownSec] = useState(0);

  const safeStartPreset = useMemo(
    () => parseSafeStartPresetFromParams(searchParams, "signup"),
    [searchParams],
  );
  const signupEntry = useMemo(() => {
    const raw = String(searchParams.get("entry") || "")
      .trim()
      .slice(0, 80);
    return raw.replace(/[^\w-]/g, "");
  }, [searchParams]);
  const safeStartQuery = useMemo(() => {
    if (!safeStartPreset) return "";
    return serializeSafeStartPresetToQuery({
      preset: safeStartPreset.preset,
      autoShare: safeStartPreset.autoShare,
      approvalShare: safeStartPreset.approvalShare,
      followupMode: safeStartPreset.followupMode,
    });
  }, [safeStartPreset]);

  useEffect(() => {
    if (!safeStartPreset) return;
    saveSafeStartPreset(safeStartPreset);
  }, [safeStartPreset]);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldownSec]);

  const validateCollectStep = () => {
    if (!firstName.trim() || !lastName.trim()) return "Bitte geben Sie Vor- und Nachnamen an.";
    if (!email.trim()) return "Bitte geben Sie Ihre E-Mail-Adresse an.";
    if (!normalizePhoneClient(phone)) return "Bitte geben Sie eine gültige Handynummer an.";
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    if (password !== confirmPassword) return "Die Passwörter stimmen nicht überein.";
    if (!acceptTerms) return "Bitte akzeptieren Sie die Nutzungsbedingungen.";
    if (!acceptPrivacy) return "Bitte bestätigen Sie die Datenschutzhinweise.";
    return "";
  };

  const requestVerificationCode = async (isResend = false) => {
    const validationError = validateCollectStep();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetch("/api/auth/signup/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        acceptTerms,
        acceptPrivacy,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      method?: "sms_verify" | "email_code";
      maskedTarget?: string;
    };

    if (!response.ok || !data?.ok) {
      if (data?.error === "rate_limited") {
        setErrorMsg("Zu viele Code-Anfragen. Bitte warten Sie kurz und versuchen Sie es erneut.");
      } else if (data?.error === "verification_rate_limited") {
        setErrorMsg("Zu viele Verifizierungsversuche. Bitte warten Sie kurz und versuchen Sie es erneut.");
      } else if (data?.error === "invalid_phone_e164") {
        setErrorMsg("Bitte geben Sie Ihre Handynummer im Format +49... an.");
      } else if (data?.error === "twilio_verify_misconfigured") {
        setErrorMsg("Die SMS-Verifizierung ist aktuell nicht korrekt eingerichtet. Bitte kontaktieren Sie den Support.");
      } else if (data?.error === "signup_server_misconfigured") {
        setErrorMsg("Die Registrierung ist serverseitig noch nicht vollständig konfiguriert. Bitte kontaktieren Sie den Support.");
      } else {
        setErrorMsg("Verifizierungscode konnte nicht gesendet werden. Bitte prüfen Sie Ihre Angaben.");
      }
      setLoading(false);
      return;
    }

    setMaskedTarget(String(data.maskedTarget || ""));
    setStage("verify");
    setResendCooldownSec(30);
    setSuccessMsg(
      isResend
        ? data.method === "sms_verify"
          ? "Ein neuer Verifizierungscode wurde per SMS gesendet."
          : "Ein neuer Verifizierungscode wurde per E-Mail gesendet."
        : data.method === "sms_verify"
          ? "Wir haben Ihnen den Verifizierungscode per SMS gesendet. Ohne Code wird kein Konto erstellt."
          : "Wir haben Ihnen den Verifizierungscode per E-Mail gesendet. Ohne Code wird kein Konto erstellt.",
    );
    setLoading(false);
  };

  const verifyCodeAndCreateAccount = async () => {
    const normalizedCode = String(verificationCode || "").replace(/[^\d]/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMsg("Bitte geben Sie einen gültigen 6-stelligen Verifizierungscode ein.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetch("/api/auth/signup/verify-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        code: normalizedCode,
        allowNewsletter,
        acceptTerms,
        acceptPrivacy,
        signupEntry: signupEntry || null,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      details?: string;
      created?: boolean;
      existing?: boolean;
      profileSeeded?: boolean;
      warning?: string;
    };

    if (!response.ok || !data?.ok) {
      if (data?.error === "verification_expired") {
        setErrorMsg("Der Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.");
      } else if (data?.error === "verification_invalid") {
        setErrorMsg(
          "Der Code ist ungültig. Bitte geben Sie den neuesten Code ein oder senden Sie einen neuen Code an.",
        );
      } else if (data?.error === "invalid_phone_e164") {
        setErrorMsg("Bitte geben Sie Ihre Handynummer im Format +49... an.");
      } else if (data?.error === "twilio_verify_misconfigured") {
        setErrorMsg("Die SMS-Verifizierung ist aktuell nicht korrekt eingerichtet. Bitte kontaktieren Sie den Support.");
      } else if (data?.error === "verification_locked") {
        setErrorMsg("Zu viele falsche Versuche. Bitte fordern Sie einen neuen Code an.");
      } else if (data?.error === "verification_provider_failed") {
        setErrorMsg("Die Verifizierung konnte gerade nicht geprüft werden. Bitte senden Sie einen neuen Code an.");
      } else if (data?.error === "signup_server_misconfigured") {
        setErrorMsg("Die Registrierung ist serverseitig noch nicht vollständig konfiguriert. Bitte kontaktieren Sie den Support.");
      } else if (data?.error === "signup_create_failed" || data?.error === "agent_upsert_failed") {
        setErrorMsg("Der Account konnte serverseitig nicht angelegt werden. Bitte versuchen Sie es erneut.");
      } else if (data?.error === "agent_upsert_failed_rolled_back") {
        setErrorMsg(
          "Die Kontoanlage wurde aus Sicherheitsgründen zurückgerollt. Bitte senden Sie einen neuen Code an und versuchen Sie es erneut.",
        );
      } else if (data?.error === "agent_upsert_failed_user_cleanup_failed") {
        setErrorMsg(
          "Die Kontoanlage ist in einen inkonsistenten Zustand gelaufen. Bitte kontaktieren Sie den Support, damit wir den Account bereinigen.",
        );
      } else if (data?.error === "auth_user_lookup_failed") {
        setErrorMsg("Der bestehende Account konnte nicht geladen werden. Bitte versuchen Sie es in wenigen Minuten erneut.");
      } else if (data?.error === "email_already_registered") {
        setErrorMsg(
          "Für diese E-Mail existiert bereits ein Konto. Wenn ein früherer Signup fehlgeschlagen ist, nutzen Sie bitte den Login mit demselben Passwort.",
        );
      } else {
        const code = String(data?.error || "").trim();
        setErrorMsg(
          code
            ? `Konto konnte nicht erstellt werden. Fehlercode: ${code}.`
            : "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        );
      }
      setLoading(false);
      return;
    }

    setStage("done");
    if (data?.profileSeeded === false || data?.warning === "agent_profile_seed_failed") {
      setSuccessMsg(
        data?.existing
          ? "Konto war bereits vorhanden und wurde verifiziert. Login ist möglich; Profil wird beim ersten App-Start vervollständigt."
          : "Konto wurde erstellt und verifiziert. Login ist möglich; Profil wird beim ersten App-Start vervollständigt.",
      );
    } else {
      setSuccessMsg(
        data?.existing
          ? "Konto war bereits vorhanden und wurde vervollständigt. Sie können sich jetzt einloggen."
          : "Konto erfolgreich erstellt und verifiziert. Sie können sich jetzt einloggen.",
      );
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === "collect") {
      await requestVerificationCode(false);
      return;
    }
    if (stage === "verify") {
      await verifyCodeAndCreateAccount();
    }
  };

  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="Starten Sie mit klaren Regeln, sicherem Autopilot und vollständiger Nachvollziehbarkeit."
      points={[
        "Pflicht-Verifizierung per SMS-Code vor Kontoerstellung.",
        "Handynummer als Pflichtfeld für zuverlässige Kontakt- und Sicherheitsprozesse.",
        "Freigabe-Workflow und Follow-ups bleiben stufenweise steuerbar.",
      ]}
    >
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md">
        <h1 className="h2">Konto erstellen</h1>
        <p className="helper mt-2">
          Ohne Verifizierungscode wird kein Konto erstellt.
        </p>

        {errorMsg ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
        ) : null}
        {successMsg ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMsg}
          </p>
        ) : null}

        {stage !== "done" ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Vorname</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={stage === "verify"}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Nachname</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={stage === "verify"}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <label className="mt-4 mb-2 block text-sm font-medium text-[var(--text)]">
              Firma (optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={stage === "verify"}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
              autoComplete="organization"
            />

            <label className="mt-4 mb-2 block text-sm font-medium text-[var(--text)]">
              Handynummer
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={stage === "verify"}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
              autoComplete="tel"
              placeholder="+49 170 1234567"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              Für die SMS-Verifizierung bitte im Format <strong>+49...</strong> angeben.
            </p>

            <label className="mt-4 mb-2 block text-sm font-medium text-[var(--text)]">
              E-Mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={stage === "verify"}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
              autoComplete="email"
            />

            <label className="mt-4 mb-2 block text-sm font-medium text-[var(--text)]">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={stage === "verify"}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 pr-10 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="focus-ring absolute inset-y-0 right-2 inline-flex items-center rounded-lg px-2 text-[var(--muted)] hover:text-[var(--text)] disabled:cursor-not-allowed"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                disabled={stage === "verify"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Mindestens 8 Zeichen.</p>

            <label className="mt-4 mb-2 block text-sm font-medium text-[var(--text)]">
              Passwort wiederholen
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={stage === "verify"}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)] disabled:bg-[var(--surface)]"
              autoComplete="new-password"
            />

            <div className="mt-5 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <label className="flex items-start gap-3 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--black)]"
                  required
                  disabled={stage === "verify"}
                />
                <span>
                  Ich akzeptiere die{" "}
                  <Link href="/nutzungsbedingungen" className="underline underline-offset-4 hover:text-[var(--muted)]">
                    Nutzungsbedingungen
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--black)]"
                  required
                  disabled={stage === "verify"}
                />
                <span>
                  Ich habe die{" "}
                  <Link href="/datenschutz" className="underline underline-offset-4 hover:text-[var(--muted)]">
                    Datenschutzhinweise
                  </Link>{" "}
                  gelesen und stimme der Verarbeitung meiner Daten zur Kontoerstellung zu.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={allowNewsletter}
                  onChange={(e) => setAllowNewsletter(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--black)]"
                  disabled={stage === "verify"}
                />
                <span>
                  Ich möchte Produkt-Updates, Praxis-Tipps und gelegentliche Angebote per E-Mail erhalten. Diese
                  Einwilligung kann ich jederzeit widerrufen.
                </span>
              </label>

              <p className="text-xs leading-5 text-[var(--muted)]">
                Hinweis: Advaic ist ein Assistenzsystem. Die Verantwortung für Aktivierung, Konfiguration und
                versendete Inhalte liegt beim Konto-Inhaber.
              </p>
            </div>
          </>
        ) : null}

        {stage === "verify" ? (
          <div className="mt-6 rounded-xl border border-[var(--gold-soft)] bg-[rgba(201,162,39,0.08)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">Verifizierungscode eingeben</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Code gesendet an <strong>{maskedTarget || phone || email}</strong>.
            </p>
            <label className="mt-3 mb-2 block text-sm font-medium text-[var(--text)]">
              6-stelliger Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, ""))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-center text-lg tracking-[0.28em] shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
              placeholder="123456"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStage("collect")}
                disabled={loading}
              >
                Daten ändern
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void requestVerificationCode(true)}
                disabled={loading || resendCooldownSec > 0}
              >
                {resendCooldownSec > 0 ? `Code erneut senden (${resendCooldownSec}s)` : "Code erneut senden"}
              </button>
            </div>
          </div>
        ) : null}

        {stage !== "done" ? (
          <button type="submit" disabled={loading} className="btn-primary mt-7 w-full">
            {stage === "collect"
              ? loading
                ? "Sende Code..."
                : "Verifizierungscode senden"
              : loading
                ? "Verifiziere..."
                : "Konto verifizieren & erstellen"}
          </button>
        ) : (
          <Link href={safeStartQuery ? `/login?${safeStartQuery}` : "/login"} className="btn-primary mt-7 w-full">
            Zum Login
          </Link>
        )}

        <p className="mt-4 text-xs text-[var(--muted)] text-center">
          Bereits registriert?{" "}
          <Link
            href={safeStartQuery ? `/login?${safeStartQuery}` : "/login"}
            className="focus-ring underline hover:text-[var(--text)]"
          >
            Zum Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
