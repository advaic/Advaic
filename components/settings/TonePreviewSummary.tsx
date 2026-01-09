// components/settings/TonePreviewSummary.tsx
import { Card } from "@/components/ui/card";

interface TonePreviewSummaryProps {
  selectedStyle: string;
  customTone: string;
  formulations: string[];
}

export default function TonePreviewSummary({
  selectedStyle,
  customTone,
  formulations,
}: TonePreviewSummaryProps) {
  const styleLabelMap: Record<string, string> = {
    freundlich: "Freundlich",
    professionell: "Professionell",
    direkt: "Direkt",
  };

  return (
    <Card className="p-4 bg-muted/50">
      <h3 className="font-semibold text-base mb-2">Ihre Stil-Vorgaben</h3>
      <ul className="text-sm text-muted-foreground space-y-2">
        <li>
          <strong>💬 Antwort-Ton:</strong> {styleLabelMap[selectedStyle]}
        </li>
        {customTone && (
          <li>
            <strong>⚠️ Einschränkungen:</strong> {customTone}
          </li>
        )}
        {formulations.length > 0 && (
          <li>
            <strong>🪄 Lieblingsformulierungen:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              {formulations.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </Card>
  );
}
