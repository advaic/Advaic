"use client";

import { useState } from "react";

export default function PersoenlicheDatenPage() {
  const [form, setForm] = useState({
    vorname: "Max",
    nachname: "Mustermann",
    email: "max@beispiel.de",
    telefon: "",
    firma: "",
    position: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send update to backend
    console.log("Updated data:", form);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Persönliche Daten</h1>
      <p className="text-muted-foreground mb-6">
        Bearbeiten Sie Ihre Kontoinformationen. Diese werden für Kommunikation
        und Rechnungen verwendet.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Vorname</label>
            <input
              type="text"
              name="vorname"
              value={form.vorname}
              onChange={handleChange}
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
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Änderungen speichern
          </button>
        </div>
      </form>
    </div>
  );
}
