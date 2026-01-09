// components/settings/SaveButtonWithToast.tsx
"use client";

import { useToast } from "@/components/ui/use-toast";

export const SaveButtonWithToast = ({ onSave }: { onSave: () => void }) => {
  const { showToast } = useToast();

  const handleClick = () => {
    onSave(); // Trigger the save logic passed from the parent
    showToast("Einstellungen gespeichert"); // Show toast message
  };

  return (
    <button
      onClick={handleClick}
      className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
    >
      Einstellungen speichern
    </button>
  );
};
