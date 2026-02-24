"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    const redirectIfSessionExists = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        const next = new URLSearchParams(window.location.search).get("next");
        const target = safeNextPath(next);
        window.location.replace(target);
      }
    };

    void redirectIfSessionExists();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Full reload so middleware + server components see the new auth cookie
    const next = new URLSearchParams(window.location.search).get("next");
    const target = safeNextPath(next);
    window.location.href = target;
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-6 bg-white rounded shadow-md"
      >
        <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>

        {errorMsg && (
          <p className="mb-4 text-sm text-red-600 text-center">{errorMsg}</p>
        )}

        <label className="block mb-2 text-sm font-medium text-gray-700">
          E-Mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Passwort
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-6 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-black rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Einloggen..." : "Einloggen"}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Noch kein Konto?{" "}
          <Link href="/signup" className="underline hover:text-gray-700">
            Jetzt registrieren
          </Link>
        </p>
      </form>
    </div>
  );
}
