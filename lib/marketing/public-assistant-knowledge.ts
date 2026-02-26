import { getDashboardCapabilityKnowledgeDocs } from "@/lib/marketing/public-assistant-capabilities";

export type PublicKnowledgeDoc = {
  id: string;
  kind: "public_page" | "dashboard_capability";
  title: string;
  href: string;
  dashboardPath?: string;
  tags: string[];
  content: string;
};

export type PublicKnowledgeSource = {
  id: string;
  title: string;
  href: string;
  snippet: string;
  score: number;
};

const STOPWORDS = new Set<string>([
  "und",
  "oder",
  "aber",
  "auch",
  "dass",
  "wenn",
  "dann",
  "eine",
  "einer",
  "eines",
  "einem",
  "einen",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ist",
  "sind",
  "mit",
  "für",
  "von",
  "auf",
  "im",
  "in",
  "zu",
  "zum",
  "zur",
  "wie",
  "was",
  "warum",
  "wieso",
  "weshalb",
  "ich",
  "du",
  "sie",
  "wir",
  "ihr",
  "bei",
  "aus",
  "nur",
  "noch",
  "schon",
  "eine",
  "kein",
  "keine",
  "nicht",
  "mehr",
  "sehr",
  "über",
  "unter",
  "durch",
  "damit",
  "dazu",
  "dabei",
  "dies",
  "diese",
  "dieser",
  "heute",
  "jetzt",
  "bitte",
  "kann",
  "können",
  "soll",
  "sollen",
  "möchte",
  "möchten",
]);

const PUBLIC_DOCS: PublicKnowledgeDoc[] = [
  {
    id: "home_overview",
    kind: "public_page",
    title: "Startseite: Nutzen und Sicherheitslogik",
    href: "/",
    tags: ["nutzen", "autopilot", "freigabe", "qualitätschecks", "makler"],
    content:
      "Advaic beantwortet Interessenten-Anfragen per E-Mail in definierten Guardrails. Klare Standardfälle können automatisch versendet werden. Unklare oder riskante Fälle gehen zur Freigabe. Vor dem Versand laufen Qualitätschecks auf Relevanz, Kontext, Vollständigkeit, Ton und Risiko. Ziel ist weniger Postfacharbeit bei gleichzeitig nachvollziehbarer Kontrolle.",
  },
  {
    id: "produkt_detail",
    kind: "public_page",
    title: "Produktseite: Erkennen, Schreiben, Senden",
    href: "/produkt",
    tags: ["produkt", "ablauf", "dashboard", "freigabe inbox", "status"],
    content:
      "Die Produktlogik ist mechanisch aufgebaut: Eingang erkennen, Fallentscheidung treffen, Entwurf erstellen, Qualitätschecks ausführen, dann Versand oder Freigabe. Im Dashboard sind Status und Zeitstempel nachvollziehbar. Die Freigabe-Inbox ist der Pflichtpfad für Unsicherheit und Sonderfälle.",
  },
  {
    id: "produkt_capability_matrix",
    kind: "public_page",
    title: "Capability Matrix: Dashboard-Funktionen im Detail",
    href: "/produkt/capabilities",
    tags: ["capability matrix", "dashboard funktionen", "app bereiche", "guardrails", "grenzen"],
    content:
      "Die Capability Matrix beschreibt pro Dashboard-Bereich, was operativ möglich ist, welche Sicherheitsgrenzen gelten und wie der sichere Rollout empfohlen wird. Sie ist die Referenz für Fragen wie: Wo finde ich welche Funktion im Dashboard und was darf der jeweilige Bereich bewusst nicht automatisch entscheiden.",
  },
  {
    id: "how_it_works",
    kind: "public_page",
    title: "So funktioniert's: Operativer Ablauf",
    href: "/so-funktionierts",
    tags: ["prozess", "operativ", "entscheidungslogik", "follow-ups"],
    content:
      "Der Ablauf beschreibt klar, was automatisch passiert und wo der Mensch entscheidet. Erst wird klassifiziert, dann per Regelpfad entschieden, danach werden Qualitätsprüfungen angewendet. Follow-ups laufen nur innerhalb definierter Regeln und stoppen bei Antwort oder Stop-Kriterium.",
  },
  {
    id: "autopilot_rules",
    kind: "public_page",
    title: "Autopilot-Regeln: Wann automatisch versendet wird",
    href: "/autopilot-regeln",
    tags: ["regeln", "auto senden", "freigabe", "ignorieren", "fail-safe"],
    content:
      "Auto-Versand gilt nur für klare Interessenten-Anfragen in Standardsituationen ohne kritische Lücken. Unsicherheit führt verpflichtend zur Freigabe. Nicht-Anfragen wie Newsletter, no-reply, Systemmails oder Spam werden ignoriert. Fail-Safe bedeutet: im Zweifel stoppen statt falsch senden.",
  },
  {
    id: "autopilot_explained",
    kind: "public_page",
    title: "Autopilot: Praktische Steuerung",
    href: "/autopilot",
    tags: ["autopilot", "steuerung", "pausieren", "sicher starten"],
    content:
      "Autopilot ist steuerbar und pausierbar. Ein konservativer Start setzt mehr Fälle auf Freigabe, bis Ton, Regeln und Objektdaten sauber sind. Danach kann die Automatisierung schrittweise erhöht werden.",
  },
  {
    id: "quality_checks",
    kind: "public_page",
    title: "Qualitätschecks: Prüfpunkte vor Versand",
    href: "/qualitaetschecks",
    tags: ["qualität", "relevanz", "kontext", "vollständigkeit", "risiko"],
    content:
      "Vor automatischem Versand laufen mehrstufige Checks. Relevanz filtert Nicht-Anfragen, Kontext verhindert Antworten ohne belastbare Daten, Vollständigkeit verhindert Behauptungen mit Lücken, Tonprüfung hält Stilregeln ein, Risiko-Checks leiten unsichere Fälle in die Freigabe.",
  },
  {
    id: "approval_inbox",
    kind: "public_page",
    title: "Freigabe-Inbox: Kontrolle bei Unsicherheit",
    href: "/freigabe-inbox",
    tags: ["freigabe", "review", "senden", "ablehnen", "sonderfall"],
    content:
      "In der Freigabe-Inbox prüfst du nicht eindeutige Entwürfe vor dem Versand. Du kannst freigeben, bearbeiten oder ablehnen. Das schützt bei Beschwerden, Konflikten, unklarem Objektbezug und fehlenden Informationen.",
  },
  {
    id: "followup_logic",
    kind: "public_page",
    title: "Follow-up-Logik: Nachfassen mit Regeln",
    href: "/follow-up-logik",
    tags: ["follow-up", "zeitabstand", "stop-kriterien", "nachfassen"],
    content:
      "Follow-ups laufen in definierten Stufen mit festen Abständen. Sie stoppen bei Antwort, Eskalation oder anderen Stop-Kriterien. Ziel ist kontrolliertes Nachfassen statt aufdringlicher Serienmails.",
  },
  {
    id: "security",
    kind: "public_page",
    title: "Sicherheit: Guardrails und Grenzen",
    href: "/sicherheit",
    tags: ["sicherheit", "guardrails", "grenzen", "transparenz"],
    content:
      "Sicherheitslogik bedeutet klare Trennung zwischen Auto, Freigabe und Ignorieren. Entscheidungen sind dokumentiert und im Verlauf nachvollziehbar. Unsichere Fälle werden nicht automatisch versendet.",
  },
  {
    id: "dsgvo",
    kind: "public_page",
    title: "DSGVO-orientierter Betrieb",
    href: "/dsgvo-email-autopilot",
    tags: ["dsgvo", "datenschutz", "datenminimierung", "zugriffskontrolle"],
    content:
      "Der Produktansatz ist DSGVO-orientiert mit Zweckbindung, rollenbasiertem Zugriff und nachvollziehbaren Prozessen. Bei rechtlich sensiblen Einzelfällen ist fachliche Prüfung notwendig; der Assistent ersetzt keine Rechtsberatung.",
  },
  {
    id: "privacy_page",
    kind: "public_page",
    title: "Datenschutzseite",
    href: "/datenschutz",
    tags: ["datenschutz", "verarbeitung", "rechte", "auskunft", "löschung"],
    content:
      "Die Datenschutzseite beschreibt Zwecke, Rechtsgrundlagen und Betroffenenrechte. Für Auskunfts- oder Löschanfragen gibt es klare Kontaktwege und dokumentierte Prozesse.",
  },
  {
    id: "terms_page",
    kind: "public_page",
    title: "Nutzungsbedingungen",
    href: "/nutzungsbedingungen",
    tags: ["bedingungen", "vertrag", "testphase", "kündigung", "pflichten"],
    content:
      "Die Nutzungsbedingungen regeln Leistungsumfang, Testphase, Pflichten des Nutzers und Grundsätze für die Nutzung des Produkts.",
  },
  {
    id: "trust_center",
    kind: "public_page",
    title: "Trust Center",
    href: "/trust",
    tags: ["trust", "betrieb", "kontrollen", "transparenz", "verlässlichkeit"],
    content:
      "Das Trust Center bündelt Sicherheits- und Betriebsprinzipien: klare Regeln, dokumentierte Entscheidungen, kontrollierte Eskalation und nachvollziehbare Abläufe.",
  },
  {
    id: "pricing",
    kind: "public_page",
    title: "Preise und Testphase",
    href: "/preise",
    tags: ["preise", "trial", "14 tage", "starter", "kündbar"],
    content:
      "Es gibt eine 14-tägige Testphase und danach den Starter-Tarif. Der Einstieg ist auf kontrollierten Betrieb ausgerichtet, mit Option auf konservative Konfiguration zu Beginn.",
  },
  {
    id: "faq",
    kind: "public_page",
    title: "FAQ: Häufige Fragen",
    href: "/faq",
    tags: ["faq", "autopilot", "freigabe", "qualität", "pausieren"],
    content:
      "Häufige Fragen behandeln Auto-Versand, Freigabe-Logik, Qualitätskontrollen, Pausieren des Autopiloten und Nachvollziehbarkeit im Verlauf.",
  },
  {
    id: "comparison_manual_vs_advaic",
    kind: "public_page",
    title: "Manuell vs. Advaic",
    href: "/manuell-vs-advaic",
    tags: ["vergleich", "zeitverlust", "risiko", "transparenz"],
    content:
      "Der Vergleich zeigt, wo manuelle Abläufe Zeit und Qualität verlieren: lange Reaktionszeiten, Inkonsistenz und geringe Transparenz. Advaic setzt auf standardisierte Entscheidungslogik mit Sicherheitsnetz.",
  },
  {
    id: "use_cases",
    kind: "public_page",
    title: "Use Cases für Makler",
    href: "/use-cases",
    tags: ["use cases", "vermietung", "kleine teams", "mittelpreisige objekte"],
    content:
      "Use Cases zeigen, wann das System besonders gut passt: hohe Anfragevolumina, wiederkehrende Standardfragen, kleine Teams mit knappen Kapazitäten und strukturierte Freigabepfade für Sonderfälle.",
  },
  {
    id: "branchen",
    kind: "public_page",
    title: "Branchenübersicht",
    href: "/branchen",
    tags: ["branchen", "maklerbüro", "vertrieb", "prozess"],
    content:
      "Branchen-Landingpages erklären, wie Advaic in unterschiedlichen Immobilien-Setups eingesetzt wird, inklusive Startprofilen und Grenzen der Automatisierung.",
  },
  {
    id: "mail_automation_article",
    kind: "public_page",
    title: "E-Mail-Automatisierung für Immobilienmakler",
    href: "/email-automatisierung-immobilienmakler",
    tags: ["artikel", "email", "automation", "makler", "best practices"],
    content:
      "Der Artikel erklärt, wie sichere E-Mail-Automatisierung im Maklerwesen funktioniert: klare Standardfälle automatisieren, Sonderfälle freigeben, Qualität vor Versand prüfen und Follow-ups kontrolliert steuern.",
  },
  {
    id: "makler_freigabe_workflow",
    kind: "public_page",
    title: "Makler-Freigabe-Workflow",
    href: "/makler-freigabe-workflow",
    tags: ["workflow", "freigabe", "entscheidungen", "dokumentation"],
    content:
      "Der Freigabe-Workflow beschreibt strukturierte Entscheidungsschritte für unklare Fälle inklusive Bearbeitung, Versandfreigabe oder Ablehnung mit nachvollziehbarer Dokumentation.",
  },
];

const DOCS: PublicKnowledgeDoc[] = [
  ...PUBLIC_DOCS,
  ...getDashboardCapabilityKnowledgeDocs(),
];

function normalizeText(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string) {
  const normalized = normalizeText(input);
  if (!normalized) return [] as string[];
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function countMatches(haystack: string, token: string) {
  if (!haystack || !token) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const found = haystack.indexOf(token, idx);
    if (found === -1) break;
    count += 1;
    idx = found + token.length;
  }
  return count;
}

function isDashboardIntent(queryNormalized: string) {
  const probes = [
    "dashboard",
    "im dashboard",
    "in der app",
    "wo finde",
    "wo kann",
    "welche seite",
    "/app/",
    "feature",
    "funktion im dashboard",
  ];
  return probes.some((probe) => queryNormalized.includes(probe));
}

function scoreDoc(
  doc: PublicKnowledgeDoc,
  queryTokens: string[],
  pathname: string,
  queryNormalized: string,
) {
  const title = normalizeText(doc.title);
  const tags = normalizeText(doc.tags.join(" "));
  const body = normalizeText(doc.content);
  const path = normalizeText(doc.href);
  const currentPath = normalizeText(pathname);
  const dashboardPath = normalizeText(doc.dashboardPath || "");
  const dashboardIntent = isDashboardIntent(queryNormalized);

  let score = 0;

  for (const token of queryTokens) {
    score += countMatches(title, token) * 4;
    score += countMatches(tags, token) * 3;
    score += countMatches(body, token) * 1.5;
    if (token.length > 5 && path.includes(token)) score += 1;
    if (dashboardPath && token.length > 3) {
      score += countMatches(dashboardPath, token) * 2;
    }
  }

  if (doc.href !== "/" && currentPath.startsWith(path)) {
    score += 5;
  }
  if (doc.href === "/" && currentPath === "/") {
    score += 4;
  }

  if (dashboardIntent && doc.kind === "dashboard_capability") {
    score += 10;
  }
  if (!dashboardIntent && doc.kind === "public_page") {
    score += 2;
  }
  if (dashboardIntent && doc.kind === "public_page" && title.includes("produktseite")) {
    score += 1;
  }

  return score;
}

function buildSnippet(content: string, maxLen = 220) {
  const clean = String(content || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

export function retrievePublicKnowledge(args: {
  question: string;
  path?: string | null;
  limit?: number;
}) {
  const pathname = String(args.path || "/");
  const queryTokens = tokenize(args.question);
  const queryNormalized = normalizeText(args.question);
  const limit = Math.max(1, Math.min(8, Number(args.limit || 4)));

  const scored = DOCS.map((doc) => ({
    doc,
    score: scoreDoc(doc, queryTokens, pathname, queryNormalized),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit * 2, 6));

  const top = scored.filter((item) => item.score > 0).slice(0, limit);
  const fallback = top.length ? top : scored.slice(0, limit);

  return fallback.map((entry): PublicKnowledgeSource => ({
    id: entry.doc.id,
    title: entry.doc.title,
    href: entry.doc.href,
    snippet: buildSnippet(entry.doc.content),
    score: entry.score,
  }));
}

export function buildPublicKnowledgePromptContext(sources: PublicKnowledgeSource[]) {
  if (!sources.length) return "Keine passenden internen Quellen gefunden.";

  return sources
    .map(
      (source, index) =>
        `${index + 1}. ${source.title} (${source.href})\nInhalt: ${source.snippet}`,
    )
    .join("\n\n");
}
