"use client";

import { useState, type KeyboardEvent } from "react";
import Container from "@/components/marketing/Container";

type Tab = {
  title: string;
  example: string;
};

const tabs: Tab[] = [
  {
    title: "Kurz & direkt",
    example:
      "Guten Tag, vielen Dank für Ihre Anfrage. Die Immobilie ist aktuell verfügbar.\nGern schlage ich Ihnen zwei Besichtigungstermine vor: …\nWelche Uhrzeit passt Ihnen besser?",
  },
  {
    title: "Freundlich & warm",
    example:
      "Guten Tag, danke für Ihre Nachricht. Schön, dass Sie sich für die Immobilie interessieren.\nGern können wir eine Besichtigung vereinbaren. Passt Ihnen …?\nWenn Sie möchten, sende ich Ihnen vorab die Unterlagenliste.",
  },
  {
    title: "Sehr professionell",
    example:
      "Guten Tag, vielen Dank für Ihre Anfrage.\nFür eine Besichtigung benötige ich vorab folgende Informationen/Unterlagen: …\nSobald diese vorliegen, schlage ich Ihnen passende Termine vor.",
  },
];

export default function ToneAndStyle() {
  const [activeTab, setActiveTab] = useState(0);
  const panelId = "tone-panel";

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveTab((index + 1) % tabs.length);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveTab((index - 1 + tabs.length) % tabs.length);
    }
  };

  return (
    <section id="stil" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Antworten in Ihrem Stil</h2>
          <p className="body mt-4 text-[var(--muted)]">Sie bestimmen die Tonalität. Advaic hält sich daran.</p>
        </div>

        <div className="mt-8 rounded-[var(--radius)] bg-white p-4 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stilvarianten">
            {tabs.map((tab, index) => {
              const isActive = index === activeTab;
              const tabId = `tone-tab-${index}`;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--black)] text-white shadow-sm ring-1 ring-[var(--gold)]"
                      : "bg-white text-[var(--text)] ring-1 ring-[var(--border)] hover:ring-[rgba(11,15,23,.18)]"
                  }`}
                  role="tab"
                  id={tabId}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>

          <div
            className="mt-6 rounded-xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]"
            role="tabpanel"
            id={panelId}
            aria-labelledby={`tone-tab-${activeTab}`}
          >
            <p className="body whitespace-pre-line text-[var(--text)]">{tabs[activeTab].example}</p>
          </div>

          <p className="helper mt-4">Textbausteine können Sie jederzeit anpassen.</p>
        </div>
      </Container>
    </section>
  );
}
