"use client";

import { useState } from "react";

export default function ContactForm() {
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // You can replace this with Supabase / Make.com logic
    console.log({ message, location, type });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-6"
    >
      <h2 className="text-2xl font-semibold text-center">Kontaktformular</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ihre Nachricht
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standort
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-black"
        >
          <option value="">Bitte wählen</option>
          <option value="Hamburg">Hamburg</option>
          <option value="München">München</option>
          <option value="Köln">Köln</option>
          <option value="Berlin">Berlin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anliegen
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          className="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-black"
        >
          <option value="">Bitte wählen</option>
          <option value="Kaufen">Kaufen</option>
          <option value="Mieten">Mieten</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        Anfrage absenden
      </button>
    </form>
  );
}
