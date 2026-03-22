import type {
  WebsiteResearchNamedContact,
  WebsiteResearchSecondarySource,
} from "@/lib/crm/websiteResearchCrawler";

export type SecondarySourceKind =
  | "linkedin_profile"
  | "linkedin_company"
  | "google_reviews"
  | "provenexpert"
  | "immoscout_portal"
  | "immowelt_portal"
  | "immonet_portal"
  | "bellevue_directory"
  | "other_portal"
  | "other";

export type SecondarySourceContactSurface =
  | "named_person"
  | "company_profile"
  | "review_profile"
  | "listing_profile"
  | "other"
  | null;

export type SecondarySourceResearchPage = {
  source_type: WebsiteResearchSecondarySource["source_type"];
  source_kind: SecondarySourceKind;
  label: string;
  url: string;
  title: string | null;
  description: string | null;
  snippets: string[];
  verification_score: number;
  verification_signals: string[];
  verification_summary: string | null;
  review_count: number | null;
  rating_value: number | null;
  listing_count_estimate: number | null;
  contact_surface: SecondarySourceContactSurface;
};

export type SecondarySourceResearchResult = {
  pages: SecondarySourceResearchPage[];
  trust_signals: string[];
  contact_emails: string[];
  phone_numbers: string[];
  linkedin_urls: string[];
  named_contacts: WebsiteResearchNamedContact[];
  object_types: string[];
  region_focus_micro: string[];
  target_group: string | null;
  owner_led: boolean | null;
  years_in_market: number | null;
  process_hint: string | null;
  response_promise_public: string | null;
  personalization_evidence: string[];
  corroborated_hook: string | null;
  verification_strength: number;
  verified_source_kinds: string[];
  verified_review_sources: string[];
  verified_listing_sources: string[];
  verified_contact_surfaces: string[];
};

function cleanLine(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function unique(values: Array<string | null | undefined>, max = 20) {
  return [...new Set(values.map((value) => cleanLine(value, 220)).filter(Boolean))].slice(0, max);
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function parseLooseCount(value: string | null) {
  const safe = cleanLine(value, 40);
  if (!safe) return null;
  const digits = safe.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeIdentity(value: unknown) {
  return cleanLine(value, 220)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanLine(match?.[1] || "", 180) || null;
}

function extractMetaDescription(html: string) {
  const direct = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
  );
  if (direct?.[1]) return cleanLine(direct[1], 320) || null;
  const reverse = html.match(
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i,
  );
  return cleanLine(reverse?.[1] || "", 320) || null;
}

function extractSnippets(text: string, maxItems = 18) {
  return text
    .split(/[.!?]/)
    .map((part) => cleanLine(part, 220))
    .filter((part) => part.length >= 28)
    .slice(0, maxItems);
}

function extractEmails(html: string, text: string) {
  const found = new Set<string>();
  for (const match of `${html} ${text}`.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = cleanLine(match[0], 220).toLowerCase();
    if (email) found.add(email);
  }
  return [...found];
}

function extractPhones(html: string, text: string) {
  const found = new Set<string>();
  for (const match of `${html} ${text}`.matchAll(/(?:\+?\d[\d\s()/.-]{7,}\d)/g)) {
    const phone = cleanLine(match[0], 64);
    if (phone && phone.replace(/\D/g, "").length >= 7) found.add(phone);
  }
  return [...found];
}

function extractLinkedInUrls(html: string, baseUrl: string) {
  const urls: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html))) {
    const href = cleanLine(match[1], 500);
    if (!href) continue;
    try {
      const url = new URL(href, baseUrl);
      if (/linkedin\.com/i.test(url.hostname)) urls.push(url.toString());
    } catch {
      // Ignore malformed URLs.
    }
  }
  return unique(urls, 8);
}

function hostnameFor(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function classifySourceKind(source: WebsiteResearchSecondarySource) {
  const url = cleanLine(source.url, 500).toLowerCase();
  if (source.source_type === "linkedin" && /\/in\//i.test(url)) return "linkedin_profile" as const;
  if (source.source_type === "linkedin") return "linkedin_company" as const;
  if (/google\.[^/]+\/maps|g\.page/i.test(url)) return "google_reviews" as const;
  if (/provenexpert/i.test(url)) return "provenexpert" as const;
  if (/immoscout/i.test(url)) return "immoscout_portal" as const;
  if (/immowelt/i.test(url)) return "immowelt_portal" as const;
  if (/immonet/i.test(url)) return "immonet_portal" as const;
  if (/bellevue/i.test(url)) return "bellevue_directory" as const;
  if (source.source_type === "portal") return "other_portal" as const;
  return "other" as const;
}

function sourceKindLabel(kind: SecondarySourceKind) {
  switch (kind) {
    case "linkedin_profile":
      return "LinkedIn-Profil";
    case "linkedin_company":
      return "LinkedIn-Unternehmensseite";
    case "google_reviews":
      return "Google-Bewertungen";
    case "provenexpert":
      return "ProvenExpert-Profil";
    case "immoscout_portal":
      return "ImmoScout-Profil";
    case "immowelt_portal":
      return "Immowelt-Profil";
    case "immonet_portal":
      return "Immonet-Profil";
    case "bellevue_directory":
      return "Bellevue-Eintrag";
    case "other_portal":
      return "Portal-Profil";
    default:
      return "Externe Quelle";
  }
}

function sourcePriority(source: WebsiteResearchSecondarySource) {
  const sourceKind = classifySourceKind(source);
  if (sourceKind === "linkedin_profile") return 120;
  if (sourceKind === "linkedin_company") return 110;
  if (sourceKind === "provenexpert" || sourceKind === "google_reviews") return 102;
  if (
    sourceKind === "immoscout_portal" ||
    sourceKind === "immowelt_portal" ||
    sourceKind === "immonet_portal" ||
    sourceKind === "bellevue_directory"
  ) {
    return 94;
  }
  if (sourceKind === "other_portal") return 88;
  return 55;
}

function pickSources(args: {
  sources: WebsiteResearchSecondarySource[];
  companyName?: string | null;
  extraLinkedInUrl?: string | null;
  maxSources: number;
}) {
  const merged = [...(args.sources || [])];
  const extraLinkedInUrl = cleanLine(args.extraLinkedInUrl, 500);
  if (extraLinkedInUrl && !merged.some((row) => cleanLine(row.url, 500) === extraLinkedInUrl)) {
    merged.push({
      source_type: "linkedin",
      label: /\/in\//i.test(extraLinkedInUrl) ? "LinkedIn-Profil" : "LinkedIn-Seite",
      url: extraLinkedInUrl,
      confidence: /\/in\//i.test(extraLinkedInUrl) ? 0.82 : 0.74,
    });
  }

  const blockedPatterns = [/facebook\.com/i, /instagram\.com/i, /youtube\.com/i];
  const seenHosts = new Set<string>();

  return merged
    .filter((source) => {
      const url = cleanLine(source.url, 500);
      if (!url) return false;
      if (blockedPatterns.some((pattern) => pattern.test(url))) return false;
      if (/linkedin\.com\/search\//i.test(url)) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityDiff = sourcePriority(b) - sourcePriority(a);
      if (priorityDiff) return priorityDiff;
      return Number(b.confidence || 0) - Number(a.confidence || 0);
    })
    .filter((source) => {
      const host = hostnameFor(source.url);
      if (!host) return false;
      const key = `${host}:${source.source_type}`;
      if (seenHosts.has(key)) return false;
      seenHosts.add(key);
      return true;
    })
    .slice(0, Math.max(1, Math.min(5, args.maxSources)));
}

async function fetchHtml(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdvaicCRMSecondarySourceCrawler/1.0; +https://advaic.com)",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) return null;
    const html = await res.text();
    if (!html || html.length < 120) return null;
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function roleSignalScore(value: string | null) {
  const safe = cleanLine(value, 120).toLowerCase();
  if (!safe) return 0;
  if (/(inhaber|owner|gruender|grunder|geschaeftsfuehrer|geschaftsfuhrer|geschäftsführer)/i.test(safe)) {
    return 12;
  }
  if (/(leitung|head|manager|berater|makler|sales|vermarktung)/i.test(safe)) return 6;
  return 0;
}

function extractReviewCount(text: string) {
  const patterns = [
    /(\d{1,4}(?:[.,]\d{3})?)\s+(?:bewertungen|reviews|rezensionen)\b/i,
    /\b(?:bewertungen|reviews|rezensionen)\s*[:(]?\s*(\d{1,4}(?:[.,]\d{3})?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseLooseCount(match?.[1] || null);
    if (parsed) return parsed;
  }
  return null;
}

function extractRatingValue(text: string) {
  const patterns = [
    /(\d(?:[.,]\d)?)\s*(?:\/\s*5|von 5|sterne|stars)\b/i,
    /"ratingValue"\s*:\s*"(\d(?:[.,]\d)?)"/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const raw = String(match?.[1] || "").replace(",", ".");
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 5) {
      return Math.round(parsed * 10) / 10;
    }
  }
  return null;
}

function extractListingCount(text: string) {
  const patterns = [
    /(\d{1,4}(?:[.,]\d{3})?)\s+(?:immobilien|objekte|angebote|anzeigen|inserate)\b/i,
    /\b(?:immobilien|objekte|angebote|anzeigen)\s*[:(]?\s*(\d{1,4}(?:[.,]\d{3})?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseLooseCount(match?.[1] || null);
    if (parsed) return parsed;
  }
  return null;
}

function inferRole(texts: string[]) {
  const joined = texts.join(" ");
  const rolePatterns = [
    /(?:inhaber|inhaberin|owner|gruender|gründer|geschaeftsfuehrer|geschäftsführer|geschaeftsleitung|geschäftsleitung)/i,
    /(?:leiter|leitung|head|manager|berater|makler|vermarktung)/i,
  ];
  for (const pattern of rolePatterns) {
    const match = joined.match(pattern);
    if (match?.[0]) return cleanLine(match[0], 120);
  }
  return null;
}

function slugToName(slug: string) {
  const cleaned = slug
    .replace(/\/+/g, " ")
    .replace(/-/g, " ")
    .replace(/\b[a-z]{1,2}\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  const parts = cleaned.split(" ").filter(Boolean).slice(0, 4);
  if (parts.length === 0) return null;
  return cleanLine(
    parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    160,
  );
}

function buildNamedContacts(page: SecondarySourceResearchPage): WebsiteResearchNamedContact[] {
  const contacts: WebsiteResearchNamedContact[] = [];
  const title = cleanLine(page.title, 180);
  const titleParts = title
    ? title.split(/\s+[|·-]\s+/).map((part) => cleanLine(part, 120)).filter(Boolean)
    : [];
  const textPool = [title, page.description, ...page.snippets].filter(Boolean) as string[];
  const inferredRole = inferRole(textPool);

  if (page.source_kind === "linkedin_profile") {
    try {
      const url = new URL(page.url);
      const personMatch = url.pathname.match(/\/in\/([^/?#]+)/i);
      if (personMatch?.[1]) {
        const fullName = slugToName(personMatch[1]);
        if (fullName) {
          contacts.push({
            full_name: fullName,
            role: inferredRole,
            email: null,
            phone: null,
            linkedin_url: page.url,
            page_url: page.url,
            page_kind: "team",
            source_type: "linkedin",
            decision_maker: roleSignalScore(inferredRole) >= 10,
            confidence: inferredRole ? 0.86 : 0.78,
          });
        }
      }
    } catch {
      // Ignore malformed LinkedIn URLs.
    }
  }

  if (contacts.length === 0 && titleParts.length >= 2) {
    const first = titleParts[0];
    if (/^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+){1,2}$/.test(first)) {
      contacts.push({
        full_name: first,
        role: inferredRole || titleParts[1] || null,
        email: null,
        phone: null,
        linkedin_url: /linkedin\.com/i.test(page.url) ? page.url : null,
        page_url: page.url,
        page_kind: /linkedin\.com/i.test(page.url) ? "team" : "about",
        source_type: /linkedin\.com/i.test(page.url) ? "linkedin" : "website",
        decision_maker:
          page.source_kind === "linkedin_profile" ||
          roleSignalScore(inferredRole || titleParts[1] || null) >= 10,
        confidence: page.source_kind === "linkedin_profile" ? 0.8 : inferredRole ? 0.7 : 0.62,
      });
    }
  }

  return contacts.slice(0, 2);
}

function collectObjectTypes(snippets: string[]) {
  const catalog = [
    { label: "Wohnung", pattern: /\bwohnung(en)?\b/i },
    { label: "Haus", pattern: /\bhaus|haeuser|häuser\b/i },
    { label: "Einfamilienhaus", pattern: /\beinfamilienhaus\b/i },
    { label: "Mehrfamilienhaus", pattern: /\bmehrfamilienhaus\b/i },
    { label: "Neubau", pattern: /\bneubau|erstbezug\b/i },
    { label: "Gewerbe", pattern: /\bgewerbe|büro|buero|ladenfläche|ladenflaeche\b/i },
    { label: "Grundstück", pattern: /\bgrundstück|grundstueck\b/i },
  ];
  return unique(
    catalog
      .filter((entry) => snippets.some((snippet) => entry.pattern.test(snippet)))
      .map((entry) => entry.label),
    6,
  );
}

function inferTargetGroup(snippets: string[]) {
  const groups = [
    { label: "Eigentuemer und Verkaeufer", patterns: [/\beigentuemer|eigentümer|verkaeufer|verkäufer\b/i] },
    { label: "Mieter und Vermieter", patterns: [/\bmieter|vermieter\b/i] },
    { label: "Kaeufer und Familien", patterns: [/\bkaeufer|käufer|familien|selbstnutzer\b/i] },
    { label: "Kapitalanleger", patterns: [/\bkapitalanleger|investor|anlage\b/i] },
    { label: "Bautraeger und Neubau", patterns: [/\bbautraeger|bauträger|projektvertrieb|neubau\b/i] },
  ];
  let best: { label: string; score: number } | null = null;
  for (const group of groups) {
    const score = group.patterns.reduce((sum, pattern) => {
      return sum + snippets.filter((snippet) => pattern.test(snippet)).length;
    }, 0);
    if (score > 0 && (!best || score > best.score)) best = { label: group.label, score };
  }
  return best?.label || null;
}

function collectMicroRegions(texts: string[]) {
  const found = new Map<string, number>();
  for (const text of texts) {
    for (const match of text.matchAll(
      /\b(?:in|im|raum|rund um|fokus auf)\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{2,}(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{2,}){0,2})/g,
    )) {
      const value = cleanLine(match[1], 80);
      if (!value || /Deutschland|Europa|Immobilien|Kontakt|Makler/i.test(value)) continue;
      found.set(value, (found.get(value) || 0) + 1);
    }
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value)
    .slice(0, 4);
}

function inferOwnerLed(snippets: string[]) {
  if (snippets.some((snippet) => /\binhabergefuehrt|inhabergeführt|familiengefuehrt|familiengeführt\b/i.test(snippet))) {
    return true;
  }
  if (snippets.some((snippet) => /\bgeschaeftsfuehrer|geschäftsführer|gruender|gründer|inhaber(in)?\b/i.test(snippet))) {
    return true;
  }
  return null;
}

function inferYearsInMarket(texts: string[]) {
  const joined = texts.join(" ");
  const currentYear = new Date().getFullYear();
  for (const match of joined.matchAll(/\bseit\s+(19\d{2}|20\d{2})\b/gi)) {
    const year = Number(match[1]);
    if (year >= 1950 && year <= currentYear) return currentYear - year;
  }
  for (const match of joined.matchAll(/\b(ueber|über|mehr als)\s+(\d{1,2})\s+jahre\b/gi)) {
    const years = Number(match[2]);
    if (years >= 2 && years <= 80) return years;
  }
  return null;
}

function collectTrustSignals(pages: SecondarySourceResearchPage[]) {
  const snippets = pages.flatMap((page) => page.snippets);
  const signals: string[] = [];
  if (pages.some((page) => page.source_kind === "linkedin_profile" || page.source_kind === "linkedin_company")) {
    signals.push("LinkedIn-Praesenz");
  }
  if (pages.some((page) => page.source_kind === "google_reviews")) signals.push("Google-Bewertungen");
  if (pages.some((page) => page.source_kind === "provenexpert")) signals.push("ProvenExpert");
  if (
    pages.some(
      (page) =>
        page.source_kind === "immoscout_portal" ||
        page.source_kind === "immowelt_portal" ||
        page.source_kind === "immonet_portal" ||
        page.source_kind === "bellevue_directory" ||
        page.source_kind === "other_portal",
    )
  ) {
    signals.push("Portal-Praesenz");
  }
  if (snippets.some((snippet) => /\bbewertungen|reviews|sterne|rezensionen\b/i.test(snippet))) {
    signals.push("Oeffentliche Bewertungen");
  }
  if (snippets.some((snippet) => /\bivd\b/i.test(snippet))) signals.push("IVD");
  if (snippets.some((snippet) => /\bimmoscout\b/i.test(snippet))) signals.push("ImmoScout Partner");
  if (snippets.some((snippet) => /\bbellevue\b/i.test(snippet))) {
    signals.push("Bellevue Best Property Agent");
  }
  return unique(signals, 8);
}

function pickSignal(snippets: string[], patterns: RegExp[]) {
  return snippets.find((snippet) => patterns.some((pattern) => pattern.test(snippet))) || null;
}

function buildProcessHint(snippets: string[]) {
  return (
    pickSignal(snippets, [/online-anfrage|formular|kontaktaufnahme|rueckruf|rückruf|digital/i]) ||
    pickSignal(snippets, [/besichtigung|termin|kalender|vereinbaren/i]) ||
    pickSignal(snippets, [/unterlagen|exposé|expose|dokument|bonitaet|bonität/i]) ||
    null
  );
}

function buildCorroboratedHook(args: {
  companyName?: string | null;
  city?: string | null;
  evidence: string[];
}) {
  const companyName = cleanLine(args.companyName, 120) || "Das Team";
  const topEvidence = cleanLine(args.evidence[0], 180);
  if (topEvidence) {
    return cleanLine(
      `${companyName} wird auch ausserhalb der Website mit ${topEvidence.replace(/[.!?]+$/, "")} sichtbar.`,
      220,
    );
  }
  if (cleanLine(args.city, 120)) {
    return cleanLine(`${companyName} ist auch auf Zweitquellen in ${cleanLine(args.city, 120)} sichtbar aktiv.`, 220);
  }
  return null;
}

function buildSourceVerification(args: {
  source: WebsiteResearchSecondarySource;
  text: string;
  title: string | null;
  description: string | null;
  snippets: string[];
  companyName?: string | null;
}) {
  const sourceKind = classifySourceKind(args.source);
  const joined = [args.title, args.description, args.text, ...args.snippets].filter(Boolean).join(" ");
  const reviewCount = extractReviewCount(joined);
  const ratingValue = extractRatingValue(joined);
  const listingCountEstimate = extractListingCount(joined);
  const signals: string[] = [sourceKindLabel(sourceKind)];
  let contactSurface: SecondarySourceContactSurface = null;
  let score =
    sourceKind === "linkedin_profile"
      ? 0.82
      : sourceKind === "linkedin_company"
        ? 0.72
        : sourceKind === "provenexpert" || sourceKind === "google_reviews"
          ? 0.74
          : sourceKind === "immoscout_portal" ||
              sourceKind === "immowelt_portal" ||
              sourceKind === "immonet_portal" ||
              sourceKind === "bellevue_directory"
            ? 0.71
            : sourceKind === "other_portal"
              ? 0.64
              : 0.56;

  if (sourceKind === "linkedin_profile") contactSurface = "named_person";
  else if (sourceKind === "linkedin_company") contactSurface = "company_profile";
  else if (sourceKind === "provenexpert" || sourceKind === "google_reviews") {
    contactSurface = "review_profile";
  } else if (
    sourceKind === "immoscout_portal" ||
    sourceKind === "immowelt_portal" ||
    sourceKind === "immonet_portal" ||
    sourceKind === "bellevue_directory" ||
    sourceKind === "other_portal"
  ) {
    contactSurface = "listing_profile";
  }

  const companyTokens = normalizeIdentity(args.companyName)
    .split(" ")
    .filter((token) => token.length >= 3);
  const joinedIdentity = normalizeIdentity(joined);
  const companyMatches = companyTokens.filter((token) => joinedIdentity.includes(token)).length;
  if (companyMatches >= Math.min(2, companyTokens.length || 1)) {
    signals.push("Firmenname bestaetigt");
    score += 0.08;
  } else if (companyMatches === 1) {
    signals.push("Firmenbezug sichtbar");
    score += 0.04;
  }

  if (reviewCount) {
    signals.push(`${reviewCount} Bewertungen sichtbar`);
    score += Math.min(0.08, reviewCount >= 25 ? 0.08 : reviewCount >= 10 ? 0.06 : 0.04);
  }
  if (typeof ratingValue === "number") {
    signals.push(`Bewertung ${ratingValue.toFixed(1)}/5`);
    score += ratingValue >= 4.5 ? 0.06 : ratingValue >= 4 ? 0.04 : 0.02;
  }
  if (listingCountEstimate) {
    signals.push(`${listingCountEstimate} Objekte sichtbar`);
    score += Math.min(0.08, listingCountEstimate >= 20 ? 0.08 : listingCountEstimate >= 8 ? 0.05 : 0.03);
  }
  if (args.snippets.some((snippet) => /\bgeschaeftsfuehrer|geschäftsführer|inhaber|berater|makler\b/i.test(snippet))) {
    signals.push("Rollenhinweis sichtbar");
    score += 0.04;
  }
  if (args.snippets.some((snippet) => /\bkontakt|anfrage|telefon|e-mail|email\b/i.test(snippet))) {
    signals.push("Kontaktflaeche sichtbar");
    score += 0.03;
  }

  const verificationSignals = unique(signals, 5);
  const verificationSummary =
    verificationSignals.length > 0 ? cleanLine(verificationSignals.slice(0, 3).join(" · "), 180) : null;

  return {
    source_kind: sourceKind,
    verification_score: clamp01(score),
    verification_signals: verificationSignals,
    verification_summary: verificationSummary,
    review_count: reviewCount,
    rating_value: ratingValue,
    listing_count_estimate: listingCountEstimate,
    contact_surface: contactSurface,
  };
}

export async function crawlSecondarySourceResearch(args: {
  sources: WebsiteResearchSecondarySource[];
  companyName?: string | null;
  city?: string | null;
  extraLinkedInUrl?: string | null;
  maxSources?: number;
  timeoutMs?: number;
}) {
  const selectedSources = pickSources({
    sources: args.sources || [],
    companyName: args.companyName,
    extraLinkedInUrl: args.extraLinkedInUrl || null,
    maxSources: Math.max(1, Math.min(5, Number(args.maxSources || 3))),
  });
  if (selectedSources.length === 0) return null;

  const timeoutMs = Math.max(3000, Math.min(12000, Number(args.timeoutMs || 6500)));
  const pages: SecondarySourceResearchPage[] = [];
  const allEmails: string[] = [];
  const allPhones: string[] = [];
  const allLinkedInUrls: string[] = [];
  const allNamedContacts: WebsiteResearchNamedContact[] = [];
  const allSnippets: string[] = [];
  const allTexts: string[] = [];

  for (const source of selectedSources) {
    const html = await fetchHtml(source.url, timeoutMs);
    if (!html) continue;
    const text = stripHtml(html);
    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const snippets = extractSnippets(text, 14);
    if (snippets.length === 0 && !title && !description) continue;
    const verification = buildSourceVerification({
      source,
      text,
      title,
      description,
      snippets,
      companyName: args.companyName,
    });

    const page: SecondarySourceResearchPage = {
      source_type: source.source_type,
      source_kind: verification.source_kind,
      label: cleanLine(source.label, 120) || source.source_type,
      url: cleanLine(source.url, 500),
      title,
      description,
      snippets,
      verification_score: verification.verification_score,
      verification_signals: verification.verification_signals,
      verification_summary: verification.verification_summary,
      review_count: verification.review_count,
      rating_value: verification.rating_value,
      listing_count_estimate: verification.listing_count_estimate,
      contact_surface: verification.contact_surface,
    };
    pages.push(page);
    allSnippets.push(...snippets);
    allTexts.push(text, title || "", description || "");
    allEmails.push(...extractEmails(html, text));
    allPhones.push(...extractPhones(html, text));
    allLinkedInUrls.push(...extractLinkedInUrls(html, source.url));
    if (/linkedin\.com/i.test(source.url)) allLinkedInUrls.push(source.url);
    allNamedContacts.push(...buildNamedContacts(page));
  }

  if (pages.length === 0) return null;

  const uniqueLinkedInUrls = unique(allLinkedInUrls, 8);
  const namedContacts = [...allNamedContacts]
    .sort((a, b) => {
      const decisionDiff = Number(b.decision_maker) - Number(a.decision_maker);
      if (decisionDiff) return decisionDiff;
      const roleDiff = roleSignalScore(b.role) - roleSignalScore(a.role);
      if (roleDiff) return roleDiff;
      return Number(b.confidence || 0) - Number(a.confidence || 0);
    })
    .slice(0, 5);

  const trustSignals = collectTrustSignals(pages);
  const objectTypes = collectObjectTypes(allSnippets);
  const regionFocusMicro = collectMicroRegions(allTexts);
  const targetGroup = inferTargetGroup(allSnippets);
  const ownerLed = inferOwnerLed(allSnippets);
  const yearsInMarket = inferYearsInMarket(allTexts);
  const processHint = buildProcessHint(allSnippets);
  const responsePromise =
    pickSignal(allSnippets, [/24h|24 h|schnell|zeitnah|umgehend|innerhalb/i]) || null;
  const verificationStrength =
    pages.length > 0
      ? Math.round(
          (pages.reduce((sum, page) => sum + Number(page.verification_score || 0), 0) / pages.length) * 1000,
        ) / 1000
      : 0;
  const verifiedSourceKinds = unique(pages.map((page) => sourceKindLabel(page.source_kind)), 8);
  const verifiedReviewSources = unique(
    pages
      .filter((page) => page.contact_surface === "review_profile")
      .map((page) => page.verification_summary || sourceKindLabel(page.source_kind)),
    4,
  );
  const verifiedListingSources = unique(
    pages
      .filter((page) => page.contact_surface === "listing_profile")
      .map((page) => page.verification_summary || sourceKindLabel(page.source_kind)),
    4,
  );
  const verifiedContactSurfaces = unique(
    pages
      .map((page) => {
        if (page.contact_surface === "named_person") return "Personenprofil";
        if (page.contact_surface === "company_profile") return "Unternehmensprofil";
        if (page.contact_surface === "review_profile") return "Bewertungsprofil";
        if (page.contact_surface === "listing_profile") return "Portalprofil";
        return null;
      })
      .filter(Boolean),
    4,
  );
  const personalizationEvidence = unique(
    [
      responsePromise,
      processHint,
      trustSignals[0] || null,
      pages[0]?.verification_summary || null,
      pages[0]?.title || null,
      allSnippets.find((snippet) => /\bbewertungen|linkedin|portal|team|anfrage|kontakt/i.test(snippet)) || null,
      allSnippets[0] || null,
    ],
    6,
  );

  return {
    pages,
    trust_signals: trustSignals,
    contact_emails: unique(allEmails, 8).map((value) => value.toLowerCase()),
    phone_numbers: unique(allPhones, 6),
    linkedin_urls: uniqueLinkedInUrls,
    named_contacts: namedContacts,
    object_types: objectTypes,
    region_focus_micro: regionFocusMicro,
    target_group: targetGroup,
    owner_led: ownerLed,
    years_in_market: yearsInMarket,
    process_hint: processHint,
    response_promise_public: cleanLine(responsePromise, 180) || null,
    personalization_evidence: personalizationEvidence,
    corroborated_hook: buildCorroboratedHook({
      companyName: args.companyName,
      city: args.city,
      evidence: personalizationEvidence,
    }),
    verification_strength: verificationStrength,
    verified_source_kinds: verifiedSourceKinds,
    verified_review_sources: verifiedReviewSources,
    verified_listing_sources: verifiedListingSources,
    verified_contact_surfaces: verifiedContactSurfaces,
  } satisfies SecondarySourceResearchResult;
}
