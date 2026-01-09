"use client";

import { useState } from "react";

interface Props {
  phrases: string[];
  setPhrases: (newValues: string[]) => void;
}

export const CustomPhrasesInput = ({ phrases, setPhrases }: Props) => {
  const [input, setInput] = useState("");

  const addPhrase = () => {
    const trimmed = input.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      setPhrases([...phrases, trimmed]);
      setInput("");
    }
  };

  const remove = (val: string) => {
    setPhrases(phrases.filter((v) => v !== val));
  };

  return (
    <div className="mt-2">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPhrase()}
          placeholder="Formulierung eingeben & Enter drücken"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          type="button"
          onClick={addPhrase}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md"
        >
          Hinzufügen
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {phrases.map((val) => (
          <div
            key={val}
            className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center"
          >
            {val}
            <button
              onClick={() => remove(val)}
              className="ml-2 text-gray-600 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
