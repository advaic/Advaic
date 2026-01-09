// components/settings/ToneStyleSelector.tsx

import React from "react";

export type ToneStyle = {
  id: string;
  label: string;
  description: string;
  example: string;
};

type Props = {
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
};

export const ToneStyleSelector: React.FC<Props> = ({
  selectedStyle,
  setSelectedStyle,
}) => {
  const toneStyles: ToneStyle[] = [
    {
      id: "freundlich",
      label: "Freundlich",
      description: "Ein netter, zugänglicher Ton.",
      example: "Hallo! Schön, dass Sie sich melden 😊",
    },
    {
      id: "professionell",
      label: "Professionell",
      description: "Förmlich und klar.",
      example: "Guten Tag, vielen Dank für Ihre Nachricht.",
    },
    {
      id: "direkt",
      label: "Direkt",
      description: "Klar, schnell, ohne Umschweife.",
      example: "Wollen Sie das Objekt besichtigen oder nicht?",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {toneStyles.map((style) => (
        <div
          key={style.id}
          onClick={() => setSelectedStyle(style.id)}
          className={`border rounded-lg p-4 cursor-pointer hover:shadow ${
            selectedStyle === style.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300"
          }`}
        >
          <div className="text-lg font-semibold">{style.label}</div>
          <div className="text-sm text-gray-600">{style.description}</div>
          <div className="text-xs mt-2 text-gray-500">
            Beispiel: {style.example}
          </div>
        </div>
      ))}
    </div>
  );
};
