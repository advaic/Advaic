"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/marketing/AuthShell";
import {
  parseSafeStartPresetFromParams,
  saveSafeStartPreset,
  serializeSafeStartPresetToQuery,
} from "@/lib/onboarding/safe-start-preset";

function safeNextPath(rawNext: string | null | undefined): string {
  const fallback = "/app/startseite";
  const value = String(rawNext ?? "").trim();
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  if (value === "/login" || value === "/app/login") return fallback;
  return value;
}

export default function LoginPage() {
  const supabase = useSupabaseClient<Database>();
  const searchParams = useSearchParams();
  const safeStartPreset = useMemo(
    () => parseSafeStartPresetFromParams(searchParams, "login"),
    [searchParams],
  );
  const safeStartQuery = useMemo(() => {
    if (!safeStartPreset) return "";
    return serializeSafeStartPresetToQuery({
      preset: safeStartPreset.preset,
      autoShare: safeStartPreset.autoShare,
      approvalShare: safeStartPreset.approvalShare,
      followupMode: safeStartPreset.followupMode,
    });
  }, [safeStartPreset]);
  const nextRaw = searchParams.get("next");
  const nextUrl = safeStartPreset && !nextRaw ? "/app/onboarding" : safeNextPath(nextRaw);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!safeStartPreset) return;
    saveSafeStartPreset(safeStartPreset);
  }, [safeStartPreset]);

  useEffect(() => {
    let mounted = true;

    const redirectIfSessionExists = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        window.location.replace(nextUrl);
      }
    };

    void redirectIfSessionExists();

    return () => {
      mounted = false;
    };
  }, [nextUrl, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Login fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort.");
      setLoading(false);
      return;
    }

    // Ensure auth cookie is written before middleware runs
    await supabase.auth.getSession();

    window.location.assign(nextUrl);
  };

  return (
    <AuthShell
      title="Login"
      subtitle="Melden Sie sich an und steuern Sie Autopilot, Freigaben und Follow-ups an einem Ort."
      points={[
        "Autopilot kann jederzeit pausiert werden.",
        "Unklare Fälle bleiben in Ihrer Freigabe-Inbox.",
        "Jede Entscheidung bleibt im Verlauf nachvollziehbar.",
      ]}
    >
      <form
        onSubmit={handleLogin}
        className="mx-auto w-full max-w-md"
      >
        <h2 className="h2">Willkommen zurück</h2>
        <p className="helper mt-2">Melden Sie sich mit Ihren Zugangsdaten an.</p>

        {errorMsg && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
        )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 pr-10 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
            autoComplete="current-password"
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-7 w-full"
        >
          {loading ? "Einloggen..." : "Einloggen"}
        </button>

        <p className="mt-4 text-xs text-[var(--muted)] text-center">
          Noch kein Konto?{" "}
          <Link
            href={safeStartQuery ? `/signup?${safeStartQuery}` : "/signup"}
            className="focus-ring underline hover:text-[var(--text)]"
          >
            Jetzt erstellen
          </Link>
        </p>

        <p className="mt-4 text-xs text-[var(--muted)] text-center">
          Probleme beim Login? Schreiben Sie an{" "}
          <a
            className="focus-ring underline hover:text-[var(--text)]"
            href="mailto:support@advaic.com"
          >
            support@advaic.com
          </a>
          .
        </p>
      </form>
    </AuthShell>
  );
}
