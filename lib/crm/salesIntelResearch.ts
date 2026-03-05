export type SalesResearchItem = {
  id: string;
  title: string;
  claim: string;
  implication_for_advaic: string;
  source_label: string;
  source_url: string;
};

export type SalesSegmentKey =
  | "solo_miete_volumen"
  | "solo_kauf_beratung"
  | "kleines_team_gemischt"
  | "neubau_vertrieb"
  | "vorsichtig_starter"
  | "unspezifisch";

export type SegmentPlaybook = {
  key: string;
  segment_key: SalesSegmentKey;
  title: string;
  when_to_use: string;
  core_message: string;
  sequence: string[];
  stop_rules: string[];
};

export const SALES_RESEARCH_ITEMS: SalesResearchItem[] = [
  {
    id: "lead_speed_hbr",
    title: "Antwortgeschwindigkeit entscheidet bei Inbound-Leads",
    claim:
      "Die Lead-Qualität verfällt schnell, wenn die erste Antwort spät kommt. Die Chance auf Kontakt und Qualifizierung sinkt stark mit jeder Verzögerung.",
    implication_for_advaic:
      "Im Outreach sollten wir den Nutzen „schnellere Erstreaktion mit Guardrails“ früh und konkret positionieren. Pilot-KPI: Zeit bis erste Antwort.",
    source_label: "Harvard Business Review – The Short Life of Online Sales Leads",
    source_url: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    id: "inside_sales_speed",
    title: "Speed-to-Lead ist messbar konversionsrelevant",
    claim:
      "InsideSales zeigt: Kontaktaufnahme in den ersten Minuten korreliert stark mit höherer Qualifizierungswahrscheinlichkeit.",
    implication_for_advaic:
      "Für Makler mit hohem Anfragevolumen muss Advaic vor allem „Antwortzeit + Verlässlichkeit“ belegen, nicht nur Automationsfeatures.",
    source_label: "InsideSales – Lead Response Management Study",
    source_url: "https://www.insidesales.com/insights/lead-response-management-study/",
  },
  {
    id: "gartner_irrelevant_outreach",
    title: "Irrelevante Ansprache wird aktiv gemieden",
    claim:
      "Gartner berichtet, dass ein großer Teil der B2B-Käufer irrelevante Outreach-Nachrichten vermeidet.",
    implication_for_advaic:
      "Jede Akquise-Nachricht braucht durchgehende Personalisierung (Hook, Pain, Kontext). Deshalb protokollieren wir Personalisierungstiefe pro Aktion.",
    source_label: "Gartner – Ignore Irrelevant B2B Buyer Outreach",
    source_url:
      "https://www.gartner.com/en/sales-service/insights/b2b-buyer-enablement/how-to-overcome-b2b-buyer-desire-for-rep-free-experiences",
  },
  {
    id: "gartner_buying_group_conflict",
    title: "B2B-Entscheidungen sind oft gruppenbasiert und konfliktanfällig",
    claim:
      "Gartner zeigt, dass Buying-Groups häufig in inkonsistenten Präferenzen und internem Konflikt enden.",
    implication_for_advaic:
      "Unsere Ansprache sollte „niedriger Entscheidungsdruck + klarer Test + objektive KPI-Auswertung“ betonen statt harter Sales-Push.",
    source_label: "Gartner – B2B Buying Jobs and Consensus Challenges",
    source_url:
      "https://www.gartner.com/en/articles/the-b2b-buying-jobs",
  },
  {
    id: "forrester_trust",
    title: "Vertrauen in Verkäufer-Informationen ist begrenzt",
    claim:
      "Forrester beschreibt, dass Buyer primär extern validierte Informationen als vertrauenswürdig einstufen.",
    implication_for_advaic:
      "Akquise muss evidenzbasiert sein: konkrete Prozessdiagnose, klare Guardrails, KPI-Benchmarking und saubere Quellen im Pitch.",
    source_label: "Forrester – Buyer Trust and Revenue Process Insights",
    source_url:
      "https://www.forrester.com/blogs/in-b2b-buying-only-41-of-buyer-groups-trust-the-information-they-get-from-sales-reps/",
  },
  {
    id: "nist_ai_rmf",
    title: "KI-Einsatz braucht nachvollziehbares Risikomanagement",
    claim:
      "NIST AI RMF fordert systematisches Messen, Steuern und Dokumentieren von Risiken in KI-gestützten Prozessen.",
    implication_for_advaic:
      "Guardrails, Freigabe-Mechanik, Qualitätschecks und lückenloser Versandverlauf sind nicht nur UX-Features, sondern zentrale Vertrauensargumente.",
    source_label: "NIST – AI Risk Management Framework",
    source_url: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    id: "gdpr_legal_basis",
    title: "DSGVO verlangt klare Rechtsgrundlage und Widerspruchsmöglichkeit",
    claim:
      "Art. 6 DSGVO definiert Rechtsgrundlagen; Art. 21 regelt Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen.",
    implication_for_advaic:
      "Jede Akquise-Sequenz braucht dokumentierte Rechtsgrundlage, klare Opt-out-Option und sofortige Stop-Regel bei Widerspruch.",
    source_label: "EUR-Lex – DSGVO (EU 2016/679)",
    source_url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  },
  {
    id: "uwg_7",
    title: "Deutschland: Unzumutbare Belästigung ist rechtlich klar begrenzt",
    claim:
      "§7 UWG regelt, wann Werbung per elektronischer Kommunikation unzulässig ist.",
    implication_for_advaic:
      "Im CRM müssen wir Opt-out/Bounce/No-Contact strikt protokollieren und Folgekontakt automatisch stoppen.",
    source_label: "Gesetze im Internet – §7 UWG",
    source_url: "https://www.gesetze-im-internet.de/uwg_2004/__7.html",
  },
  {
    id: "gmail_sender_requirements",
    title: "Deliverability ist ein Sales-Faktor",
    claim:
      "Google verlangt für hohe Zustellbarkeit u. a. SPF/DKIM/DMARC sowie klare Absenderhygiene.",
    implication_for_advaic:
      "Akquise-Performance muss mit Deliverability-Daten verknüpft werden, sonst werden schlechte Ergebnisse falsch als Messaging-Problem interpretiert.",
    source_label: "Google – Email sender guidelines",
    source_url: "https://support.google.com/a/answer/81126",
  },
];

export const ADVAIC_SALES_SYSTEM = [
  {
    step: "Schritt 1: Diagnose & Segment",
    detail:
      "Prospect-Signale erfassen: Angebotsmix, Aktivität, Objection, Hook, Prozessreife. Ohne diese Basis keine Outbound-Nachricht.",
  },
  {
    step: "Schritt 2: Personalisierte Multi-Channel-Sequenz",
    detail:
      "Für jeden Prospect Varianten für E-Mail, LinkedIn und Telefonleitfaden erzeugen, dann Tag 0/3/7 mit harten Stop-Regeln planen.",
  },
  {
    step: "Schritt 3: Protokollieren, analysieren, iterieren",
    detail:
      "Jede Aktion mit Hypothese, Variante, CTA, Outcome und Gründen loggen; wöchentlich Gewinner/Verlierer ableiten und Prompt/Template anpassen.",
  },
];

export const SEGMENT_PLAYBOOKS: SegmentPlaybook[] = [
  {
    key: "miete_speed_to_visit_v1",
    segment_key: "solo_miete_volumen",
    title: "Miete-Speed-Playbook",
    when_to_use: "Hoher Mietanteil und viele parallele Anfragen.",
    core_message:
      "Antwortzeit und klare Guardrails reduzieren Liegezeit im Postfach, ohne Qualitätsverlust.",
    sequence: [
      "Tag 0: kurze Diagnose-Mail mit konkreter Beobachtung",
      "Tag 2: Follow-up mit einem KPI-Angebot (Antwortzeit, Freigabequote)",
      "Tag 5: kurzer Call-Vorschlag mit Safe-Start-Konfiguration",
    ],
    stop_rules: [
      "Bei Opt-out oder No-Interest sofort stoppen.",
      "Nach 3 Kontaktversuchen ohne Signal auf Nurture setzen.",
    ],
  },
  {
    key: "kauf_trust_consulting_v1",
    segment_key: "solo_kauf_beratung",
    title: "Kauf-Vertrauen-Playbook",
    when_to_use: "Kaufdominante Büros mit beratungsintensiven Prozessen.",
    core_message:
      "Advaic beschleunigt Standardfälle und lässt heikle Fälle in der Freigabe, damit Beratungstiefe erhalten bleibt.",
    sequence: [
      "Tag 0: personalisierte Mail mit Fokus auf Kontrolle und Nachvollziehbarkeit",
      "Tag 3: kurze Beispielkette 'Eingang → Entscheidung → Versand'",
      "Tag 7: Terminangebot mit Frage nach aktuellen Engpässen",
    ],
    stop_rules: [
      "Bei Risiko-/DSGVO-Einwand nur mit Fakten und Quellen antworten.",
      "Keine aggressive Frequenz nach negativem Signal.",
    ],
  },
  {
    key: "mixed_small_team_safe_start_v1",
    segment_key: "kleines_team_gemischt",
    title: "Kleines-Team-Safe-Start-Playbook",
    when_to_use: "Gemischte Portfolios mit kleiner Teamgröße.",
    core_message:
      "Schrittweiser Start mit mehr Freigaben, dann kontrollierte Autopilot-Ausweitung.",
    sequence: [
      "Tag 0: Diagnose + Safe-Start-Ansatz",
      "Tag 3: Follow-up mit stufenweisem Aktivierungsplan",
      "Tag 6: kurzer CTA für Pilot-Setup",
    ],
    stop_rules: [
      "Wenn Kapazität aktuell zu niedrig ist: Pause statt Druck.",
      "Bei unklarer Verantwortlichkeit erst Entscheider klären.",
    ],
  },
  {
    key: "neubau_multi_stakeholder_v1",
    segment_key: "neubau_vertrieb",
    title: "Neubau-Multi-Stakeholder-Playbook",
    when_to_use: "Neubau- oder Projektvertrieb mit mehreren Beteiligten.",
    core_message:
      "Standardisierung reduziert Abstimmungsaufwand, während Freigabe-Regeln Governance sichern.",
    sequence: [
      "Tag 0: Mail mit Fokus auf Prozesssicherheit und Rollen",
      "Tag 4: Follow-up mit Governance- und Log-Transparenz",
      "Tag 8: Einladung zu kurzer Prozessdurchsicht",
    ],
    stop_rules: [
      "Wenn Entscheiderkreis unklar ist, keine Mehrfachansprache.",
      "Bei Compliance-Risiko nur verifizierte Aussagen nutzen.",
    ],
  },
  {
    key: "conservative_manual_first_v1",
    segment_key: "vorsichtig_starter",
    title: "Vorsichtig-Starter-Playbook",
    when_to_use: "Niedrige Automationsbereitschaft oder hohe Skepsis.",
    core_message:
      "Erst mit Freigabe-First starten, dann anhand von KPI-Daten schrittweise automatisieren.",
    sequence: [
      "Tag 0: empathische Mail ohne Kaufdruck",
      "Tag 3: Beispiel mit klaren Stop-Regeln",
      "Tag 7: unverbindlicher Tester-Call",
    ],
    stop_rules: [
      "Bei expliziter Ablehnung keine weitere Sequenz.",
      "Maximal drei Nachrichten in 14 Tagen.",
    ],
  },
];

export function inferSegmentFromProspect(prospect: {
  object_focus?: string | null;
  share_miete_percent?: number | null;
  share_kauf_percent?: number | null;
  active_listings_count?: number | null;
  automation_readiness?: string | null;
}): SalesSegmentKey {
  const focus = String(prospect.object_focus || "").toLowerCase();
  const miete = Number(prospect.share_miete_percent ?? 0);
  const kauf = Number(prospect.share_kauf_percent ?? 0);
  const listings = Number(prospect.active_listings_count ?? 0);
  const readiness = String(prospect.automation_readiness || "").toLowerCase();

  if (focus === "neubau") return "neubau_vertrieb";
  if (readiness === "niedrig") return "vorsichtig_starter";
  if ((focus === "miete" || miete >= 60) && listings >= 12) return "solo_miete_volumen";
  if (focus === "kauf" || kauf >= 60) return "solo_kauf_beratung";
  if (focus === "gemischt" || (miete > 0 && kauf > 0)) return "kleines_team_gemischt";
  return "unspezifisch";
}

export function getPlaybookForSegment(segmentKey: SalesSegmentKey): SegmentPlaybook | null {
  if (segmentKey === "unspezifisch") return null;
  return SEGMENT_PLAYBOOKS.find((item) => item.segment_key === segmentKey) || null;
}
