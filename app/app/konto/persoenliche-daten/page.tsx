"use client";

import { useEffect, useState } from "react";

type ProfileResponse = {
  ok: boolean;
  profile?: {
    vorname: string;
    nachname: string;
    email: string;
    telefon: string;
    firma: string;
    position: string;
  };
  error?: string;
};

export default function PersoenlicheDatenPage() {
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    firma: "",
    position: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/account/profile", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as ProfileResponse;
      if (!res.ok || !data?.ok || !data.profile) {
        setError(String(data?.error || "Profildaten konnten nicht geladen werden."));
        setLoading(false);
        return;
      }

      setForm({
        vorname: data.profile.vorname || "",
        nachname: data.profile.nachname || "",
        email: data.profile.email || "",
        telefon: data.profile.telefon || "",
        firma: data.profile.firma || "",
        position: data.profile.position || "",
      });
      setLoading(false);
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMessage("");
    setError("");
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vorname: form.vorname,
        nachname: form.nachname,
        telefon: form.telefon,
        firma: form.firma,
        position: form.position,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as ProfileResponse;

    if (!res.ok || !data?.ok || !data.profile) {
      setError(String(data?.error || "Änderungen konnten nicht gespeichert werden."));
      setSaving(false);
      return;
    }

    setForm((prev) => ({
      ...prev,
      vorname: data.profile?.vorname || prev.vorname,
      nachname: data.profile?.nachname || prev.nachname,
      telefon: data.profile?.telefon || "",
      firma: data.profile?.firma || "",
      position: data.profile?.position || "",
      email: data.profile?.email || prev.email,
    }));
    setMessage("Änderungen wurden gespeichert.");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Persönliche Daten</h1>
      <p className="text-muted-foreground mb-6">
        Bearbeiten Sie Ihre Kontoinformationen. Diese werden für Kommunikation
        und Rechnungen verwendet.
      </p>

      {loading ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          Lade Profildaten...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 border border-green-200 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Vorname</label>
            <input
              type="text"
              name="vorname"
              value={form.vorname}
              onChange={handleChange}
              required
              disabled={loading || saving}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Nachname</label>
            <input
              type="text"
              name="nachname"
              value={form.nachname}
              onChange={handleChange}
              required
              disabled={loading || saving}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">
            E-Mail-Adresse
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="w-full border rounded px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">
            Telefonnummer
          </label>
          <input
            type="tel"
            name="telefon"
            value={form.telefon}
            onChange={handleChange}
            placeholder="+49 170 12345678"
            disabled={loading || saving}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Firma</label>
            <input
              type="text"
              name="firma"
              value={form.firma}
              onChange={handleChange}
              disabled={loading || saving}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Position</label>
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              disabled={loading || saving}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || saving}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
