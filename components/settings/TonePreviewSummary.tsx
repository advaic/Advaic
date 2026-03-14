import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/app-ui";
import { toneStyleLabel } from "./ToneStyleSelector";

interface TonePreviewSummaryProps {
  selectedStyle: string;
  customTone: string;
  formality: string;
  lengthPref: string;
  emojiLevel: string;
  signOff: string;
  pinnedExamples: string[];
  scenarioExamples: string[];
  noGoExamples: string[];
  dirty: boolean;
}

function splitLines(value: string): string[] {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildPreviewMail(args: {
  selectedStyle: string;
  formality: string;
  lengthPref: string;
  emojiLevel: string;
  signOff: string;
  pinnedExamples: string[];
  scenarioExamples: string[];
}) {
  const friendly = args.selectedStyle === "freundlich";
  const direct = args.selectedStyle === "direkt";
  const formal = String(args.formality || "").toLowerCase().includes("sie");
  const signOff = args.signOff.trim() || (formal ? "Viele Grüße" : "Liebe Grüße");
  const emoji =
    args.emojiLevel === "medium"
      ? " 😊"
      : args.emojiLevel === "low"
        ? " 🙂"
        : "";

  const intro = formal
    ? friendly
      ? `Guten Tag, vielen Dank für Ihre Nachricht${emoji}.`
      : direct
        ? "Guten Tag, danke für Ihre Anfrage."
        : "Guten Tag, vielen Dank für Ihre Nachricht."
    : friendly
      ? `Hallo und danke für Ihre Nachricht${emoji}.`
      : direct
        ? "Hallo, danke für Ihre Anfrage."
        : "Hallo, vielen Dank für Ihre Nachricht.";

  const bodyLines: string[] = [];

  if (args.pinnedExamples[0]) {
    bodyLines.push(args.pinnedExamples[0]);
  } else if (direct) {
    bodyLines.push(
      "Ich sende Ihnen direkt die wichtigsten Informationen und den nächsten sinnvollen Schritt."
    );
  } else if (friendly) {
    bodyLines.push(
      "Gern helfe ich Ihnen weiter und ordne die nächsten Schritte für Sie ein."
    );
  } else {
    bodyLines.push(
      "Gern ordne ich die nächsten Schritte für Sie klar und verlässlich ein."
    );
  }

  if (args.scenarioExamples[0]) {
    bodyLines.push(args.scenarioExamples[0]);
  } else if (args.lengthPref === "kurz") {
    bodyLines.push("Wenn Sie möchten, sende ich Ihnen direkt die passenden Details.");
  } else if (args.lengthPref === "detailliert") {
    bodyLines.push(
      "Wenn es für Sie passt, sende ich Ihnen im nächsten Schritt die relevanten Informationen, mögliche Termine und offene Punkte gesammelt zu."
    );
  } else {
    bodyLines.push(
      "Wenn Sie möchten, gehe ich im nächsten Schritt kurz auf Verfügbarkeit, Unterlagen und Terminoptionen ein."
    );
  }

  return {
    subject: formal
      ? "Re: Ihre Anfrage zur Immobilie"
      : "Re: Anfrage zur Immobilie",
    body: `${intro}\n\n${bodyLines.join("\n\n")}\n\n${signOff}\n{{AGENT_NAME}}`,
  };
}

export default function TonePreviewSummary({
  selectedStyle,
  customTone,
  formality,
  lengthPref,
  emojiLevel,
  signOff,
  pinnedExamples,
  scenarioExamples,
  noGoExamples,
  dirty,
}: TonePreviewSummaryProps) {
  const ruleLines = splitLines(customTone);
  const previewMail = buildPreviewMail({
    selectedStyle,
    formality,
    lengthPref,
    emojiLevel,
    signOff,
    pinnedExamples,
    scenarioExamples,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={dirty ? "warning" : "success"} size="sm">
          {dirty ? "Ungespeicherte Änderungen" : "Alles gespeichert"}
        </StatusBadge>
        <StatusBadge tone="brand" size="sm">
          {toneStyleLabel(selectedStyle)}
        </StatusBadge>
        <StatusBadge tone="neutral" size="sm">
          {formality}
        </StatusBadge>
        <StatusBadge tone="neutral" size="sm">
          Länge: {lengthPref}
        </StatusBadge>
      </div>

      <div className="rounded-2xl border app-surface-panel p-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <div className="app-text-section-title text-gray-900">
            Live-Vorschau
          </div>
        </div>
        <div className="mt-1 app-text-helper">
          So wirkt der aktuelle Stil in einem neuen Entwurf.
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-4">
          <div className="text-[11px] text-gray-500">Betreff</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {previewMail.subject}
          </div>

          <div className="mt-4 text-[11px] text-gray-500">Antwort</div>
          <pre className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {previewMail.body}
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border app-surface-panel p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          <div className="app-text-section-title text-gray-900">
            Guardrails & Sicherheit
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border app-surface-muted px-3 py-3">
            <div className="app-text-meta-label">Aktive Regeln</div>
            {ruleLines.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-800">
                {ruleLines.slice(0, 4).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-1 text-sm text-gray-600">
                Noch keine zusätzlichen Guardrails hinterlegt.
              </div>
            )}
          </div>

          <div className="rounded-xl border app-surface-muted px-3 py-3">
            <div className="app-text-meta-label">Wichtige Stilanker</div>
            {pinnedExamples.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-gray-800">
                {pinnedExamples.slice(0, 3).map((example) => (
                  <li key={example} className="rounded-lg border bg-white px-3 py-2">
                    {example}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1 text-sm text-gray-600">
                Noch keine gepinnten Stilanker gespeichert.
              </div>
            )}
          </div>

          {noGoExamples.length > 0 ? (
            <div className="rounded-xl border app-surface-warning px-3 py-3">
              <div className="app-text-meta-label">No-Go-Formulierungen</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-800">
                {noGoExamples.slice(0, 3).map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border app-surface-brand px-4 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gray-700" />
          <div className="app-text-section-title text-gray-900">
            Änderungssicherheit
          </div>
        </div>
        <div className="mt-2 space-y-2 text-sm text-gray-800">
          <div>Neue Einstellungen wirken auf neue Entwürfe, Follow-ups und Vorschläge.</div>
          <div>Bereits gesendete Nachrichten werden dadurch nicht rückwirkend verändert.</div>
          <div>Ungespeicherte Änderungen bleiben nur in dieser Ansicht sichtbar.</div>
        </div>
      </div>
    </div>
  );
}
