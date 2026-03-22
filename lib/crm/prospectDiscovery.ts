import {
  buildResearchArtifactsFromCrawl,
  replaceResearchArtifacts,
} from "@/lib/crm/researchArtifacts";
import {
  getDiscoveryLearningAdjustment,
  loadCurrentLearningSnapshot,
} from "@/lib/crm/learningLoop";
import { crawlWebsiteResearch, type WebsiteResearchResult } from "@/lib/crm/websiteResearchCrawler";

const BLOCKED_HOST_PATTERNS = [
  /(^|\.)duckduckgo\.com$/i,
  /(^|\.)google\./i,
  /(^|\.)bing\.com$/i,
  /(^|\.)linkedin\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)youtube\.com$/i,
  /(^|\.)immobilienscout24\.de$/i,
  /(^|\.)immowelt\.de$/i,
  /(^|\.)immonet\.de$/i,
  /(^|\.)meinestadt\.de$/i,
  /(^|\.)gelbeseiten\.de$/i,
  /(^|\.)11880\.com$/i,
  /(^|\.)werkenntdenbesten\.de$/i,
  /(^|\.)ivd24immobilien\.de$/i,
  /(^|\.)meinimmoportal\.de$/i,
];

const TOP_DISCOVERY_CITIES = [
  "Berlin",
  "Hamburg",
  "Muenchen",
  "Koeln",
  "Frankfurt am Main",
  "Duesseldorf",
];

type SearchResult = {
  title: string;
  url: string;
  query: string;
  source: "duckduckgo";
};

type ScoredSearchResult = SearchResult & {
  domain_key: string | null;
  base_search_score: number;
  search_score: number;
  discovery_learning_score: number;
  discovery_learning_reason: string | null;
};

type ExistingProspect = {
  company_name: string | null;
  website_url: string | null;
  source_url: string | null;
};

type CreatedProspectSummary = {
  id: string;
  company_name: string;
  city: string | null;
  website_url: string | null;
  source_url: string | null;
  fit_score: number;
};

type DiscoveryCitySummary = {
  city: string;
  created: number;
  skipped_existing: number;
  skipped_irrelevant: number;
  failed: number;
};

export type ProspectDiscoveryRunResult = {
  cities: string[];
  selected: number;
  created: number;
  skipped_existing: number;
  skipped_irrelevant: number;
  failed: number;
  candidates: CreatedProspectSummary[];
  by_city: DiscoveryCitySummary[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cleanLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&uuml;/g, "ue")
    .replace(/&Uuml;/g, "Ue")
    .replace(/&ouml;/g, "oe")
    .replace(/&Ouml;/g, "Oe")
    .replace(/&auml;/g, "ae")
    .replace(/&Auml;/g, "Ae")
    .replace(/&szlig;/g, "ss");
}

function stripHtml(value: string) {
  return cleanLine(
    decodeHtml(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
    220,
  );
}

function extractAttr(attrs: string, name: string) {
  const match =
    attrs.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i")) ||
    attrs.match(new RegExp(`\\b${name}=([^\\s>]+)`, "i"));
  return cleanLine(match?.[1] || "", 1200) || null;
}

function normalizeUrl(value: string | null | undefined) {
  const raw = cleanLine(value, 1200);
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
    if (!/^https?:$/i.test(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function canonicalWebsiteUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}/`;
  } catch {
    return value;
  }
}

function hostnameFor(value: string | null | undefined) {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function domainKeyFor(value: string | null | undefined) {
  const host = hostnameFor(value);
  if (!host) return null;
  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

function normalizeCompanyKey(value: string | null | undefined) {
  return cleanLine(value, 180)
    .toLowerCase()
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(gmbh|mbh|kg|ag|ug|ohg|e k|ek|immobilienmakler|maklerbuero|maklerbüro)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForLookup(value: string) {
  return cleanLine(value, 240)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cityVariants(city: string) {
  const base = cleanLine(city, 80);
  const lookup = normalizeForLookup(base);
  const variants: string[] = [base];
  if (lookup === "muenchen" || lookup === "munchen") {
    variants.push("München", "Muenchen", "Munchen");
  }
  if (lookup === "koeln" || lookup === "koln") {
    variants.push("Köln", "Koeln", "Koln");
  }
  if (lookup === "duesseldorf" || lookup === "dusseldorf") {
    variants.push("Düsseldorf", "Duesseldorf", "Dusseldorf");
  }
  const seen = new Set<string>();
  return variants.filter((value) => {
    const key = normalizeForLookup(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeDuckDuckGoTarget(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!/duckduckgo\.com$/i.test(url.hostname)) return normalized;
    const target = url.searchParams.get("uddg");
    return normalizeUrl(target);
  } catch {
    return normalized;
  }
}

function parseDuckDuckGoResults(html: string, query: string, maxResults: number) {
  const results: SearchResult[] = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = anchorRegex.exec(html))) {
    const attrs = match[1] || "";
    if (!/\bresult__a\b/i.test(attrs)) continue;
    const href = decodeDuckDuckGoTarget(extractAttr(attrs, "href"));
    if (!href) continue;
    const title = stripHtml(match[2] || "");
    if (!title) continue;
    results.push({
      title,
      url: href,
      query,
      source: "duckduckgo",
    });
    if (results.length >= maxResults) break;
  }
  return results;
}

async function searchDuckDuckGo(query: string, maxResults: number, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=de-de`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdvaicCRMProspectDiscovery/1.0; +https://advaic.com)",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.7",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const html = await res.text();
    if (!html) return [];
    return parseDuckDuckGoResults(html, query, maxResults);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function scoreSearchResult(result: SearchResult, city: string) {
  const url = normalizeUrl(result.url);
  const host = hostnameFor(url);
  if (!url || isBlockedHost(host)) return -100;

  let score = 0;
  const title = normalizeForLookup(result.title);
  const query = normalizeForLookup(result.query);
  const cityNeedles = cityVariants(city).map((value) => normalizeForLookup(value));
  const urlText = normalizeForLookup(url);

  const positiveTerms = [
    { pattern: /\bimmobil/gi, weight: 7 },
    { pattern: /\bmakler\b/gi, weight: 7 },
    { pattern: /\bverkauf|vermiet|objekt|wohnung|haus|neubau|besichtigung\b/gi, weight: 4 },
    { pattern: /\bivd\b|bellevue|provenexpert\b/gi, weight: 2 },
  ];
  const negativeTerms = [
    /\bblog\b/gi,
    /\bnews\b/gi,
    /\bkarriere\b/gi,
    /\bjobs?\b/gi,
    /\bwiki\b/gi,
    /\bsoftware\b/gi,
    /\bcrm\b/gi,
    /\bvergleich\b/gi,
    /\bbewertung\b/gi,
  ];

  for (const term of positiveTerms) {
    const matches = (title.match(term.pattern) || []).length + (urlText.match(term.pattern) || []).length;
    score += matches * term.weight;
  }
  for (const term of negativeTerms) {
    const matches = (title.match(term) || []).length + (urlText.match(term) || []).length;
    score -= matches * 6;
  }

  if (title.includes(query)) score += 3;
  if (host && /\.(de|com|net|immobilien)$/i.test(host)) score += 2;

  for (const cityNeedle of cityNeedles) {
    if (!cityNeedle) continue;
    if (title.includes(cityNeedle)) score += 5;
    if (urlText.includes(cityNeedle)) score += 4;
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    const depth = path ? path.split("/").filter(Boolean).length : 0;
    if (depth === 0) score += 5;
    else if (depth === 1) score += 2;
    else if (depth >= 3) score -= 3;
  } catch {
    // Ignore malformed paths here.
  }

  if (/immobilienmakler|maklerbuero|maklerbüro|immobilien\b.+\bmakler/i.test(result.title)) {
    score += 5;
  }

  return score;
}

function isBlockedHost(hostname: string | null) {
  if (!hostname) return true;
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function looksLikeRealEstateAgency(input: {
  title: string;
  hostname: string;
  crawl: WebsiteResearchResult;
}) {
  const corpus = cleanLine(
    [
      input.title,
      input.hostname,
      ...input.crawl.titles,
      ...input.crawl.descriptions,
      ...input.crawl.snippets,
    ].join(" "),
    5000,
  ).toLowerCase();
  const positives = [
    /immobil/i,
    /makler|verkauf|vermiet/i,
    /objekt|wohnung|haus|neubau|expose|besichtigung/i,
  ].filter((pattern) => pattern.test(corpus)).length;
  if (positives < 2) return false;
  if (/(hotel|restaurant|zahnarzt|arztpraxis|autohaus|steuerberater|friseur|ferienwohnung)/i.test(corpus)) {
    return false;
  }
  return true;
}

function inferCompanyName(args: {
  searchTitle: string;
  crawl: WebsiteResearchResult;
  hostname: string;
  city: string;
}) {
  const candidates = [args.searchTitle, ...args.crawl.titles]
    .map((value) => cleanLine(value, 180))
    .filter(Boolean);

  for (const candidate of candidates) {
    const parts = candidate
      .split(/\s+[|·-]\s+/)
      .map((part) => cleanLine(part, 120))
      .filter(Boolean);
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === args.city.toLowerCase()) continue;
      if (/^(home|startseite|kontakt|impressum)$/i.test(part)) continue;
      if (/^immobilienmakler\b/i.test(part) && !/\bimmobilien\b/i.test(part.replace(/^immobilienmakler\b/i, ""))) {
        continue;
      }
      if (part.length >= 4) return part;
    }
  }

  return cleanLine(
    args.hostname
      .replace(/^www\./i, "")
      .split(".")[0]
      .replace(/[-_]+/g, " "),
    120,
  );
}

function inferObjectFocus(crawl: WebsiteResearchResult): "miete" | "kauf" | "neubau" | "gemischt" {
  const corpus = cleanLine(
    [...crawl.object_types, ...crawl.snippets, ...crawl.titles, ...crawl.descriptions].join(" "),
    5000,
  ).toLowerCase();
  const mieteScore = (corpus.match(/\bmiete|miet|vermiet/gi) || []).length;
  const kaufScore = (corpus.match(/\bkauf|verkauf|eigentum/gi) || []).length;
  const neubauScore = (corpus.match(/\bneubau|projektvertrieb|erstbezug/gi) || []).length;
  if (neubauScore >= Math.max(mieteScore, kaufScore) && neubauScore >= 2) return "neubau";
  if (mieteScore >= kaufScore + 2) return "miete";
  if (kaufScore >= mieteScore + 2) return "kauf";
  return "gemischt";
}

function inferPreferredChannel(crawl: WebsiteResearchResult) {
  if (crawl.inferred_contact_email) return "email" as const;
  if (crawl.inferred_linkedin_url) return "linkedin" as const;
  if (crawl.whatsapp_urls[0]) return "whatsapp" as const;
  if (crawl.pages.some((page) => page.page_kind === "contact")) return "kontaktformular" as const;
  return "email" as const;
}

function inferFitScore(crawl: WebsiteResearchResult) {
  let score = 48;
  if (typeof crawl.active_listings_estimate === "number") {
    if (crawl.active_listings_estimate >= 25) score += 18;
    else if (crawl.active_listings_estimate >= 10) score += 12;
    else if (crawl.active_listings_estimate >= 4) score += 6;
  }
  if (crawl.trust_signals.length >= 2) score += 7;
  if (crawl.object_types.length >= 2) score += 5;
  if (crawl.process_hint) score += 7;
  if (crawl.owner_led) score += 6;
  if (crawl.inferred_contact_email) score += 7;
  if (crawl.inferred_contact_name) score += 6;
  if (crawl.named_contacts.length >= 2) score += 4;
  if (crawl.secondary_sources.length >= 1) score += 3;
  if (crawl.personalization_evidence.length >= 2) score += 4;
  return clamp(Math.round(score), 35, 88);
}

function inferPriority(fitScore: number): "A" | "B" | "C" {
  if (fitScore >= 72) return "A";
  if (fitScore >= 56) return "B";
  return "C";
}

function inferContactRole(crawl: WebsiteResearchResult) {
  if (crawl.inferred_contact_role) return cleanLine(crawl.inferred_contact_role, 120) || null;
  const headline = cleanLine(crawl.team_headline, 180).toLowerCase();
  if (!headline) return null;
  if (/inhaber|inhaberin|gruender|gründer/i.test(headline)) return "Inhaber";
  if (/geschaeftsfuehrer|geschäftsführer/i.test(headline)) return "Geschaeftsfuehrer";
  return null;
}

function buildLinkedInSearchUrl(companyName: string, city: string) {
  const q = [companyName, city, "LinkedIn Immobilien"].filter(Boolean).join(" ");
  if (!q.trim()) return null;
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}`;
}

function buildResearchNote(args: {
  companyName: string;
  city: string;
  searchTitle: string;
  searchUrl: string;
  crawl: WebsiteResearchResult;
}) {
  const lines = [
    `Discovery fuer ${args.city}: ${args.searchTitle}.`,
    args.crawl.personalization_hook ? `Hook: ${args.crawl.personalization_hook}` : "",
    args.crawl.inferred_contact_name
      ? `Ansprechpartner: ${cleanLine(args.crawl.inferred_contact_name, 120)}${args.crawl.inferred_contact_role ? ` (${cleanLine(args.crawl.inferred_contact_role, 80)})` : ""}.`
      : "",
    args.crawl.process_hint ? `Prozess: ${args.crawl.process_hint}` : "",
    args.crawl.trust_signals.length ? `Trust: ${args.crawl.trust_signals.join(", ")}` : "",
    args.crawl.secondary_sources.length
      ? `Zweitquellen: ${args.crawl.secondary_sources
          .slice(0, 3)
          .map((source) => cleanLine(source.label, 60))
          .join(", ")}.`
      : "",
    typeof args.crawl.active_listings_estimate === "number"
      ? `Aktive Angebote geschaetzt: ${args.crawl.active_listings_estimate}.`
      : "",
    `Quelle: ${args.searchUrl}`,
  ].filter(Boolean);
  return cleanLine(lines.join(" "), 900);
}

function normalizeCityList(input: unknown) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((value) => cleanLine(value, 80)).filter(Boolean))].slice(0, 10);
}

export function getTopDiscoveryCities() {
  return [...TOP_DISCOVERY_CITIES];
}

export async function runProspectDiscovery(args: {
  supabase: any;
  agentId: string;
  discoveryRunId?: string | null;
  cities?: string[];
  perCityLimit?: number;
  timeoutMs?: number;
}) {
  const cities = normalizeCityList(args.cities?.length ? args.cities : TOP_DISCOVERY_CITIES);
  const perCityLimit = clamp(Number(args.perCityLimit || 3), 1, 5);
  const timeoutMs = clamp(Number(args.timeoutMs || 9000), 4000, 15000);

  const [learningSnapshot, existingProspectsRes, existingCandidatesRes] = await Promise.all([
    loadCurrentLearningSnapshot(args.supabase, args.agentId).catch(() => null),
    (args.supabase.from("crm_prospects") as any)
      .select("company_name, website_url, source_url")
      .eq("agent_id", args.agentId)
      .limit(5000),
    (args.supabase.from("crm_prospect_candidates") as any)
      .select("company_name, website_url, source_url")
      .eq("agent_id", args.agentId)
      .limit(5000),
  ]);

  const seenHosts = new Set<string>();
  const seenNames = new Set<string>();
  const existingRows = [
    ...((existingProspectsRes.data || []) as ExistingProspect[]),
    ...((existingCandidatesRes.data || []) as ExistingProspect[]),
  ];
  for (const row of existingRows) {
    const host = domainKeyFor(row.website_url || row.source_url || null);
    if (host) seenHosts.add(host);
    const key = normalizeCompanyKey(row.company_name);
    if (key) seenNames.add(key);
  }

  const byCity: DiscoveryCitySummary[] = [];
  const createdCandidates: CreatedProspectSummary[] = [];
  let selected = 0;
  let created = 0;
  let skippedExisting = 0;
  let skippedIrrelevant = 0;
  let failed = 0;

  for (const city of cities) {
    const citySummary: DiscoveryCitySummary = {
      city,
      created: 0,
      skipped_existing: 0,
      skipped_irrelevant: 0,
      failed: 0,
    };

    const queries = [
      ...cityVariants(city).flatMap((cityVariant) => [
        `immobilienmakler ${cityVariant}`,
        `makler ${cityVariant} immobilien`,
      ]),
    ];
    const resultPool: ScoredSearchResult[] = [];
    const seenSearchDomains = new Set<string>();

    const queryResults = await Promise.all(
      [...new Set(queries)].map((query) => searchDuckDuckGo(query, perCityLimit * 6, timeoutMs)),
    );
    for (const results of queryResults) {
      for (const result of results) {
        const domainKey = domainKeyFor(result.url);
        if (domainKey && seenSearchDomains.has(domainKey)) continue;
        const baseSearchScore = scoreSearchResult(result, city);
        const discoveryLearning = getDiscoveryLearningAdjustment(learningSnapshot, {
          city,
          discoverySource: result.source,
          query: result.query,
        });
        const searchScore = baseSearchScore + Number(discoveryLearning.score_adjustment || 0);
        if (searchScore < 2) continue;
        if (domainKey) seenSearchDomains.add(domainKey);
        resultPool.push({
          ...result,
          domain_key: domainKey,
          base_search_score: baseSearchScore,
          search_score: searchScore,
          discovery_learning_score: Number(discoveryLearning.score_adjustment || 0),
          discovery_learning_reason: discoveryLearning.reason,
        });
      }
    }

    resultPool.sort((a, b) => b.search_score - a.search_score || a.title.localeCompare(b.title));

    for (const result of resultPool.slice(0, Math.max(perCityLimit * 4, 8))) {
      const candidateUrl = normalizeUrl(result.url);
      const candidateHost = domainKeyFor(candidateUrl);
      if (!candidateUrl || isBlockedHost(candidateHost)) {
        citySummary.skipped_irrelevant += 1;
        skippedIrrelevant += 1;
        continue;
      }
      if (candidateHost && seenHosts.has(candidateHost)) {
        citySummary.skipped_existing += 1;
        skippedExisting += 1;
        continue;
      }

      selected += 1;
      try {
        const crawl = await crawlWebsiteResearch({
          url: candidateUrl,
          city,
          maxPages: 5,
          timeoutMs,
        });
        if (!crawl || !looksLikeRealEstateAgency({ title: result.title, hostname: candidateHost || "", crawl })) {
          citySummary.skipped_irrelevant += 1;
          skippedIrrelevant += 1;
          continue;
        }

        const companyName = inferCompanyName({
          searchTitle: result.title,
          crawl,
          hostname: candidateHost || "",
          city,
        });
        const companyKey = normalizeCompanyKey(companyName);
        if ((candidateHost && seenHosts.has(candidateHost)) || (companyKey && seenNames.has(companyKey))) {
          citySummary.skipped_existing += 1;
          skippedExisting += 1;
          continue;
        }

        const fitScore = inferFitScore(crawl);
        const learnedFitScore = clamp(fitScore + Number(result.discovery_learning_score || 0), 0, 100);
        const preferredChannel = inferPreferredChannel(crawl);
        const payload = {
          discovery_run_id: args.discoveryRunId || null,
          agent_id: args.agentId,
          company_name: companyName,
          contact_name: cleanLine(crawl.inferred_contact_name, 160) || null,
          contact_email: cleanLine(crawl.inferred_contact_email, 320).toLowerCase() || null,
          contact_role: inferContactRole(crawl),
          city,
          region: cleanLine(crawl.region_focus_micro[0] || "", 120) || null,
          website_url: canonicalWebsiteUrl(candidateUrl),
          source_url: candidateUrl,
          source_checked_at: new Date().toISOString().slice(0, 10),
          linkedin_url: cleanLine(crawl.inferred_linkedin_url, 400) || null,
          linkedin_search_url: buildLinkedInSearchUrl(companyName, city),
          linkedin_headline: cleanLine(crawl.team_headline, 220) || null,
          object_focus: inferObjectFocus(crawl),
          active_listings_count:
            typeof crawl.active_listings_estimate === "number" ? crawl.active_listings_estimate : null,
          object_types: crawl.object_types.slice(0, 6),
          price_band_main: cleanLine(crawl.price_band_main, 140) || null,
          region_focus_micro: cleanLine(crawl.region_focus_micro.join(" · "), 180) || null,
          response_promise_public: cleanLine(crawl.response_promise_public, 180) || null,
          appointment_flow_public: cleanLine(crawl.appointment_flow_public, 180) || null,
          docs_flow_public: cleanLine(crawl.docs_flow_public, 180) || null,
          owner_led: crawl.owner_led,
          years_in_market: typeof crawl.years_in_market === "number" ? crawl.years_in_market : null,
          trust_signals: crawl.trust_signals.slice(0, 8),
          primary_pain_hypothesis: cleanLine(crawl.primary_pain_hypothesis, 280) || null,
          secondary_pain_hypothesis: cleanLine(crawl.secondary_pain_hypothesis, 280) || null,
          automation_readiness:
            typeof crawl.active_listings_estimate === "number" && crawl.active_listings_estimate >= 15
              ? "hoch"
              : typeof crawl.active_listings_estimate === "number" && crawl.active_listings_estimate >= 6
                ? "mittel"
                : null,
          personalization_evidence:
            crawl.personalization_evidence.map((value) => cleanLine(value, 140)).filter(Boolean).join(" | ") ||
            null,
          hypothesis_confidence:
            crawl.personalization_evidence.length >= 3 ? 0.74 : crawl.personalization_evidence.length >= 1 ? 0.58 : 0.42,
          target_group: cleanLine(crawl.target_group, 160) || null,
          process_hint: cleanLine(crawl.process_hint, 220) || null,
          personalization_hook: cleanLine(crawl.personalization_hook, 220) || null,
          pain_point_hypothesis: cleanLine(crawl.primary_pain_hypothesis, 280) || null,
          fit_score: fitScore,
          priority: inferPriority(fitScore),
          preferred_channel: preferredChannel,
          review_status: "new",
          review_reason: null,
          reviewed_at: null,
          metadata: {
            source: "crm_discovery",
            discovery_source: result.source,
            discovery_query: result.query,
            discovery_city: city,
            search_score: result.search_score,
            raw_search_score: result.base_search_score,
            discovery_learning_score: result.discovery_learning_score,
            discovery_learning_reason: result.discovery_learning_reason,
            learned_fit_score: learnedFitScore,
            search_title: result.title,
            pages_crawled: crawl.pages.map((page) => page.url),
          },
        };

        const { data: inserted, error: insertErr } = await (args.supabase.from("crm_prospect_candidates") as any)
          .insert(payload)
          .select("id, company_name, city, website_url, source_url, fit_score")
          .single();

        if (insertErr || !inserted?.id) {
          citySummary.failed += 1;
          failed += 1;
          continue;
        }

        await replaceResearchArtifacts(args.supabase, {
          agentId: args.agentId,
          candidateId: inserted.id,
          ...buildResearchArtifactsFromCrawl({
            crawl,
            sourceUrl: candidateUrl,
            contactRole: inferContactRole(crawl),
          }),
        });

        if (candidateHost) seenHosts.add(candidateHost);
        if (companyKey) seenNames.add(companyKey);
        citySummary.created += 1;
        created += 1;
        createdCandidates.push({
          id: String(inserted.id),
          company_name: cleanLine(inserted.company_name, 160),
          city: cleanLine(inserted.city, 120) || null,
          website_url: cleanLine(inserted.website_url, 400) || null,
          source_url: cleanLine(inserted.source_url, 400) || null,
          fit_score: Number(inserted.fit_score || 0),
        });

        if (citySummary.created >= perCityLimit) break;
      } catch {
        citySummary.failed += 1;
        failed += 1;
      }
    }

    byCity.push(citySummary);
  }

  return {
    cities,
    selected,
    created,
    skipped_existing: skippedExisting,
    skipped_irrelevant: skippedIrrelevant,
    failed,
    candidates: createdCandidates,
    by_city: byCity,
  } satisfies ProspectDiscoveryRunResult;
}
