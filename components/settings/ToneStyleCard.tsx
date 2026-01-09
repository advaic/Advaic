import React from "react";
import { ToneStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { useModal } from "@/components/ui/use-modal"; // we’ll define this

interface Props {
  tone: ToneStyle;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ToneStyleCard = ({ tone, selected, onSelect }: Props) => {
  const { openModal } = useModal();

  return (
    <div
      onClick={() => onSelect(tone.id)}
      className={cn(
        "border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md",
        selected ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-200"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="text-2xl">{tone.emoji}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal({
              title: tone.name,
              content: (
                <>
                  <p className="text-sm mb-2">{tone.description}</p>
                  <p className="text-sm italic text-gray-500">
                    Beispiel: "{tone.example}"
                  </p>
                  <p className="text-sm mt-2">✅ Vorteil: {tone.benefit}</p>
                </>
              ),
            });
          }}
        >
          <Info className="w-4 h-4 text-gray-500 hover:text-gray-800" />
        </button>
      </div>
      <h3 className="font-semibold text-lg mt-2">{tone.name}</h3>
      <p className="text-sm text-gray-600">{tone.description}</p>
    </div>
  );
};
