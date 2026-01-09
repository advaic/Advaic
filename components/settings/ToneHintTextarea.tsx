// components/settings/ToneHintTextarea.tsx
"use client";

interface ToneHintTextareaProps {
  value: string;
  onChange: (val: string) => void;
}

export const ToneHintTextarea = ({
  value,
  onChange,
}: ToneHintTextareaProps) => (
  <textarea
    className="w-full mt-2 p-3 border border-gray-300 rounded-md"
    placeholder="Z. B. 'Bitte keine Emojis verwenden', 'Gegendert ansprechen', etc."
    rows={4}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);
