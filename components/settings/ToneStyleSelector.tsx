import { Check, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/app-ui";
import { cn } from "@/lib/utils";

export type ToneStyle = {
  id: string;
  label: string;
  description: string;
  example: string;
  bestFor: string;
  icon: typeof MessagesSquare;
};

type Props = {
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
};

const toneStyles: ToneStyle[] = [
  {
    id: "freundlich",
    label: "Freundlich",
    description: "Menschlich, zugewandt und nahbar, ohne ins Informelle zu kippen.",
    example: "Hallo! Schön, dass Sie sich melden. Ich helfe Ihnen gern weiter.",
    bestFor: "Passt gut für beratende Makler-Kommunikation mit Wärme.",
    icon: Sparkles,
  },
  {
    id: "professionell",
    label: "Professionell",
    description: "Klar, ruhig und souverän mit sauberer Distanz.",
    example: "Guten Tag, vielen Dank für Ihre Nachricht. Gern sende ich Ihnen die nächsten Informationen.",
    bestFor: "Passt gut für hochwertige, verlässliche Kommunikation.",
    icon: ShieldCheck,
  },
  {
    id: "direkt",
    label: "Direkt",
    description: "Kurz, klar und ohne unnötige Schleifen.",
    example: "Danke für Ihre Anfrage. Ich sende Ihnen direkt die passenden nächsten Schritte.",
    bestFor: "Passt gut für schnelle Triage und hohe Antwortgeschwindigkeit.",
    icon: MessagesSquare,
  },
];

export const TONE_STYLE_OPTIONS = toneStyles;

export function toneStyleLabel(styleId: string): string {
  return toneStyles.find((style) => style.id === styleId)?.label ?? "Individuell";
}

export function ToneStyleSelector({
  selectedStyle,
  setSelectedStyle,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      {toneStyles.map((style) => {
        const Icon = style.icon;
        const active = selectedStyle === style.id;

        return (
          <button
            key={style.id}
            type="button"
            onClick={() => setSelectedStyle(style.id)}
            className={cn(
              "app-focusable rounded-2xl border p-4 text-left transition-all duration-150",
              active
                ? "border-amber-300 bg-amber-50/60 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-[var(--app-surface-muted)]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700">
                <Icon className="h-4 w-4" />
              </div>
              {active ? (
                <StatusBadge tone="brand" size="sm">
                  <Check className="h-3.5 w-3.5" />
                  Aktiv
                </StatusBadge>
              ) : (
                <StatusBadge tone="neutral" size="sm">
                  Vorlage
                </StatusBadge>
              )}
            </div>

            <div className="mt-4 text-base font-semibold text-gray-900">
              {style.label}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {style.description}
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white px-3 py-3">
              <div className="app-text-meta-label text-gray-700">Beispiel</div>
              <div className="mt-1 text-sm text-gray-800">
                {style.example}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              {style.bestFor}
            </div>
          </button>
        );
      })}
    </div>
  );
}
