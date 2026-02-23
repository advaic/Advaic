"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const hasSession = !!data?.session;
    if (hasSession) {
      window.location.assign("/app/onboarding");
      return;
    }

    setSuccessMsg(
      "Konto erstellt. Bitte bestätige deine E-Mail-Adresse und logge dich danach ein.",
    );
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm p-6 bg-white rounded shadow-md"
      >
        <h1 className="mb-2 text-2xl font-bold text-center">Konto erstellen</h1>
        <p className="mb-6 text-xs text-center text-gray-500">
          Starte mit Advaic und richte dein Konto in wenigen Schritten ein.
        </p>

        {errorMsg ? (
          <p className="mb-4 text-sm text-red-600 text-center">{errorMsg}</p>
        ) : null}
        {successMsg ? (
          <p className="mb-4 text-sm text-green-700 text-center">{successMsg}</p>
        ) : null}

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Passwort wiederholen
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 mb-6 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-black rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Erstelle Konto..." : "Konto erstellen"}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Bereits registriert?{" "}
          <Link href="/login" className="underline hover:text-gray-700">
            Zum Login
          </Link>
        </p>
      </form>
    </div>
  );
}
