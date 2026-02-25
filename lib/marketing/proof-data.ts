export const PROOF_LAST_CHECKED = "25. Februar 2026";

export const PROOF_SOURCES = [
  {
    id: "SRC-01",
    label: "Harvard Business Review (2011)",
    detail: "Schnelle Erstreaktion erhöht die Chance auf qualifizierte Leads deutlich.",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    id: "SRC-02",
    label: "NIST AI RMF",
    detail: "Risikobewusste KI braucht klare Guardrails, Monitoring und dokumentierte Entscheidungen.",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    id: "SRC-03",
    label: "McKinsey Social Economy",
    detail: "Ein großer Anteil der Wissensarbeit entfällt auf E-Mail und digitale Kommunikation.",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
] as const;

export const PROOF_METRICS = [
  {
    label: "Lead-Reaktionszeit wirkt direkt auf Abschlusschancen",
    value: "5 Minuten vs. 30+ Minuten",
    explanation:
      "Schnelle Erstreaktion erhöht die Chance, mit dem Interessenten in einen qualifizierten Dialog zu kommen.",
    sourceId: "SRC-01",
  },
  {
    label: "Guardrails sind Standard für vertrauenswürdige KI",
    value: "Governance + Monitoring + Fail-Safe",
    explanation:
      "Systeme mit klaren Risiken brauchen dokumentierte Grenzen, Überwachung und bewusste Eingriffe.",
    sourceId: "SRC-02",
  },
  {
    label: "Kommunikationsarbeit blockiert produktive Zeit",
    value: "hoher Anteil der Wissensarbeit",
    explanation:
      "E-Mail- und Kommunikationsaufwand ist ein relevanter Produktivitätsblocker im Tagesgeschäft.",
    sourceId: "SRC-03",
  },
] as const;

export const PROOF_METHOD_NOTE =
  "Die Zahlen dienen der Einordnung öffentlicher Forschung. Ihre konkreten Effekte hängen von Anfragevolumen, Teamgröße, Objektmix und Startkonfiguration ab.";
