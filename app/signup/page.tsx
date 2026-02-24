"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/marketing/AuthShell";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

    setLoading(true);
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (error) {
      setErrorMsg("Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Angaben.");
      setLoading(false);
      return;
    }

    const hasSession = !!data?.session;
    if (hasSession) {
      window.location.assign("/app/onboarding");
      return;
    }

    setSuccessMsg(
      "Konto erstellt. Bitte bestätigen Sie Ihre E-Mail-Adresse und loggen Sie sich danach ein.",
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-7 w-full"
        >
          {loading ? "Erstelle Konto..." : "Konto erstellen"}
        </button>

        <p className="mt-4 text-xs text-[var(--muted)] text-center">
          Bereits registriert?{" "}
          <Link href="/login" className="focus-ring underline hover:text-[var(--text)]">
            Zum Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
