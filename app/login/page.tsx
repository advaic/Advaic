"use client";

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const supabase = useSupabaseClient<Database>();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/app/startseite";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

    // Ensure auth cookie is written before middleware runs
    await supabase.auth.getSession();

    window.location.assign(nextUrl);
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

        {/* Secondary button */}
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Zurück zur Startseite
        </button>
      </form>
    </div>
  );
}
