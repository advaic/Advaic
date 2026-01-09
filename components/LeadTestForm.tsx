"use client";

import { useState } from "react";

export default function LeadTestForm() {
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [intent, setIntent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Trigger Make webhook here
    console.log({ message, location, intent });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-2xl mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Testformular</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nachricht */}
        <div>
          <label className="block mb-2 text-lg font-bold text-gray-800">
            Ihre Nachricht
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Ich interessiere mich für die Wohnung in der Musterstraße 5, Berlin. Ist sie noch verfügbar?"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Standort */}
        <div>
          <label className="block mb-2 text-lg font-bold text-gray-800">
            Standort
          </label>
          <select
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>
              Bitte Standort wählen
            </option>
            <option value="Hamburg">Hamburg</option>
            <option value="München">München</option>
            <option value="Köln">Köln</option>
            <option value="Berlin">Berlin</option>
          </select>
        </div>

        {/* Anliegen */}
        <div>
          <label className="block mb-2 text-lg font-bold text-gray-800">
            Anliegen
          </label>
          <select
            required
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>
              Bitte Anliegen wählen
            </option>
            <option value="Kaufen">Kaufen</option>
            <option value="Mieten">Mieten</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          <span className="inline-block mr-2">📨</span> Anfrage absenden
        </button>
      </form>
    </div>
  );
}
