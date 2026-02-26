"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/marketing/AuthShell";
import { useSearchParams } from "next/navigation";
import {
  parseSafeStartPresetFromParams,
  saveSafeStartPreset,
  serializeSafeStartPresetToQuery,
} from "@/lib/onboarding/safe-start-preset";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [allowNewsletter, setAllowNewsletter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const consentVersion = "2026-02-26";
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 8) {
      setErrorMsg("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!acceptTerms) {
      setErrorMsg("Bitte akzeptieren Sie die Nutzungsbedingungen.");
      return;
    }

    if (!acceptPrivacy) {
      setErrorMsg("Bitte bestätigen Sie die Datenschutzhinweise.");
      return;
    }

    setLoading(true);
    const nowIso = new Date().toISOString();
    const cleanedFirst = firstName.trim();
    const cleanedLast = lastName.trim();
    const fullName = `${cleanedFirst} ${cleanedLast}`.trim();
    const cleanedCompany = company.trim();
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login${safeStartQuery ? `?${safeStartQuery}` : ""}`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name: cleanedFirst || null,
          last_name: cleanedLast || null,
          full_name: fullName || null,
          name: fullName || null,
          company: cleanedCompany || null,
          terms_accepted: true,
          terms_accepted_at: nowIso,
          terms_version: consentVersion,
          privacy_accepted: true,
          privacy_accepted_at: nowIso,
          privacy_version: consentVersion,
          marketing_email_opt_in: allowNewsletter,
          marketing_email_opt_in_at: allowNewsletter ? nowIso : null,
          marketing_email_opt_out_at: allowNewsletter ? null : nowIso,
          signup_source: signupEntry ? `website:${signupEntry}` : "website:signup",
          signup_path: "/signup",
          consent_locale: "de-DE",
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setErrorMsg("Für diese E-Mail existiert bereits ein Konto. Bitte nutzen Sie den Login.");
      } else {
        setErrorMsg("Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Angaben.");
      }
      setLoading(false);
      return;
    }

    const hasSession = !!data?.session;
    if (hasSession) {
      window.location.assign("/app/onboarding");
      return;
    }

    setSuccessMsg(
      allowNewsletter
        ? "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail-Adresse und loggen Sie sich danach ein. Falls Sie den Newsletter gewählt haben, erhalten Sie nur relevante Updates und können ihn jederzeit abbestellen."
        : "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail-Adresse und loggen Sie sich danach ein.",
    );
    setLoading(false);
  };

  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="Starten Sie mit klaren Regeln, sicherem Autopilot und vollständiger Nachvollziehbarkeit."
      points={[
        "Schneller Start mit konservativen Standardeinstellungen.",
        "Freigabe-Workflow für unklare oder heikle Fälle.",
        "Follow-ups sind optional und stufenweise steuerbar.",
      ]}
    >
      <form
        onSubmit={handleSignup}
        className="mx-auto w-full max-w-md"
      >
        <h1 className="h2">Konto erstellen</h1>
        <p className="helper mt-2">
          Starten Sie mit Advaic und richten Sie Ihr Konto in wenigen Schritten ein.
        </p>

        {errorMsg ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
        ) : null}
        {successMsg ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMsg}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Vorname</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
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
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
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
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
          autoComplete="organization"
        />

        <label className="mt-6 block mb-2 text-sm font-medium text-[var(--text)]">
          E-Mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
          autoComplete="email"
        />

        <label className="mt-4 block mb-2 text-sm font-medium text-[var(--text)]">
          Passwort
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 pr-10 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="focus-ring absolute inset-y-0 right-2 inline-flex items-center rounded-lg px-2 text-[var(--muted)] hover:text-[var(--text)]"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Mindestens 8 Zeichen.</p>

        <label className="mt-4 block mb-2 text-sm font-medium text-[var(--text)]">
          Passwort wiederholen
        </label>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
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
            />
            <span>
              Ich möchte Produkt-Updates, Praxis-Tipps und gelegentliche Angebote per E-Mail erhalten. Diese
              Einwilligung kann ich jederzeit widerrufen.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-7 w-full"
        >
          {loading ? "Erstelle Konto..." : "Konto erstellen"}
        </button>

        <p className="mt-4 text-xs text-[var(--muted)] text-center">
          Mit dem Klick auf „Konto erstellen“ starten Sie die 14-Tage-Testphase.
        </p>

        <p className="mt-3 text-xs text-[var(--muted)] text-center">
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
