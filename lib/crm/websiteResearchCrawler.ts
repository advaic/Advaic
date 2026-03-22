type PageKind =
  | "home"
  | "about"
  | "team"
  | "contact"
  | "imprint"
  | "services"
  | "listings"
  | "references"
  | "other";

export type WebsiteResearchPage = {
  url: string;
  page_kind: PageKind;
  title: string | null;
  description: string | null;
  snippets: string[];
};

export type WebsiteResearchResult = {
  start_url: string;
  pages: WebsiteResearchPage[];
  titles: string[];
  descriptions: string[];
  snippets: string[];
  contact_emails: string[];
  phone_numbers: string[];
  linkedin_urls: string[];
  whatsapp_urls: string[];
  trust_signals: string[];
  object_types: string[];
  region_focus_micro: string[];
  target_group: string | null;
  price_band_main: string | null;
  owner_led: boolean | null;
  years_in_market: number | null;
  response_promise_public: string | null;
  appointment_flow_public: string | null;
  docs_flow_public: string | null;
  process_hint: string | null;
  personalization_evidence: string[];
  personalization_hook: string | null;
  primary_pain_hypothesis: string | null;
  secondary_pain_hypothesis: string | null;
  active_listings_estimate: number | null;
  inferred_contact_email: string | null;
  inferred_linkedin_url: string | null;
  team_headline: string | null;
};

function cleanLine(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanText(value: unknown, max = 6000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function unique(values: Array<string | null | undefined>, max = 20) {
  return [...new Set(values.map((value) => cleanLine(value, 220)).filter(Boolean))].slice(0, max);
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

function extractSnippets(text: string, maxItems = 24) {
  return text
    .split(/[.!?]/)
    .map((part) => cleanLine(part, 220))
    .filter((part) => part.length >= 28)
    .slice(0, maxItems);
}

function isProbablyHtml(url: URL) {
  return !/\.(jpg|jpeg|png|gif|svg|webp|pdf|mp4|mp3|zip|ics|vcf|xml)$/i.test(url.pathname);
}

function pageKindFor(url: string, title: string | null): PageKind {
  const haystack = `${url} ${title || ""}`.toLowerCase();
  if (/\/(ueber-uns|über-uns|about)(?:\/|$)|\büber uns\b|\babout\b/.test(haystack)) return "about";
  if (/\/(team|ansprechpartner|mitarbeiter)(?:\/|$)|\bteam\b|\bansprechpartner\b/.test(haystack))
    return "team";
  if (/\/(kontakt|contact)(?:\/|$)|\bkontakt\b/.test(haystack)) return "contact";
  if (/\/(impressum|imprint)(?:\/|$)|\bimpressum\b/.test(haystack)) return "imprint";
  if (/\/(leistungen|service|services)(?:\/|$)|\bleistungen\b|\bservice\b/.test(haystack))
    return "services";
  if (
    /\/(immobilien|objekte|angebote|kaufen|verkaufen|mieten|vermieten|referenzen|neubau)(?:\/|$)|\bimmobilien\b|\bobjekte\b|\bangebote\b/.test(
      haystack,
    )
  ) {
    return "listings";
  }
  if (/\/(referenzen|referenzobjekte)(?:\/|$)|\breferenzen\b/.test(haystack)) return "references";
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") return "home";
  } catch {
    // Ignore.
  }
  return "other";
}

function extractLinks(html: string, baseUrl: string, maxItems = 120) {
  const links: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html))) {
    const href = cleanLine(match[1], 500);
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const url = new URL(href, baseUrl);
      if (!/^https?:$/i.test(url.protocol)) continue;
      if (!isProbablyHtml(url)) continue;
      links.push(url.toString());
      if (links.length >= maxItems) break;
    } catch {
      // Ignore malformed links.
    }
  }
  return unique(links, maxItems);
}

function scoreLink(url: string) {
  const value = url.toLowerCase();
  if (/\/(ueber-uns|über-uns|about|team|ansprechpartner)(?:\/|$)/.test(value)) return 120;
  if (/\/(kontakt|contact|impressum|imprint)(?:\/|$)/.test(value)) return 110;
  if (/\/(leistungen|service|services)(?:\/|$)/.test(value)) return 90;
  if (/\/(immobilien|objekte|angebote|kaufen|verkaufen|mieten|vermieten|neubau)(?:\/|$)/.test(value))
    return 100;
  if (/\/(referenzen|referenzobjekte)(?:\/|$)/.test(value)) return 80;
  return 10;
}

function chooseLinksToCrawl(startUrl: string, pages: Array<{ url: string; html: string }>, maxPages: number) {
  const start = new URL(startUrl);
  const candidates = new Map<string, number>();
  for (const page of pages) {
    for (const candidate of extractLinks(page.html, page.url)) {
      try {
        const url = new URL(candidate);
        if (url.hostname !== start.hostname) continue;
        if (url.pathname === start.pathname && url.search === start.search) continue;
        candidates.set(candidate, Math.max(candidates.get(candidate) || 0, scoreLink(candidate)));
      } catch {
        // Ignore malformed.
      }
    }
  }
  return [...candidates.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(0, maxPages - 1))
    .map(([url]) => url);
}

async function fetchHtml(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdvaicCRMResearchCrawler/1.0; +https://advaic.com)",
      },
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

function extractEmails(html: string, text: string, domain: string) {
  const found = new Set<string>();
  for (const match of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = cleanLine(match[0], 200).toLowerCase();
    if (!email) continue;
    if (email.endsWith(`@${domain}`) || /info@|kontakt@|office@|mail@|hello@|service@/i.test(email)) {
      found.add(email);
    }
  }
  for (const match of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = cleanLine(match[0], 200).toLowerCase();
    if (email) found.add(email);
  }
  return [...found];
}

function extractPhones(html: string, text: string) {
  const found = new Set<string>();
  const source = `${html} ${text}`;
  for (const match of source.matchAll(/(?:\+?\d[\d\s()/.-]{7,}\d)/g)) {
    const digits = String(match[0] || "").replace(/[^\d+]/g, "");
    if (digits.length >= 8 && digits.length <= 18) {
      found.add(cleanLine(match[0], 60));
    }
  }
  return [...found].slice(0, 8);
}

function extractSpecialLinks(links: string[]) {
  const linkedinUrls = unique(links.filter((link) => /linkedin\.com/i.test(link)), 6);
  const whatsappUrls = unique(links.filter((link) => /wa\.me|whatsapp/i.test(link)), 4);
  return { linkedinUrls, whatsappUrls };
}

function pickSignal(snippets: string[], patterns: RegExp[]) {
  return snippets.find((snippet) => patterns.some((pattern) => pattern.test(snippet))) || null;
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
    { label: "Kapitalanlage", pattern: /\bkapitalanlage|anlageobjekt\b/i },
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
    { label: "Eigentümer und Verkäufer", patterns: [/\beigentümer|eigentuemer|verkäufer|verkaeufer\b/i] },
    { label: "Mieter und Vermieter", patterns: [/\bmieter|vermieter\b/i] },
    { label: "Käufer und Familien", patterns: [/\bkäufer|kaeufer|familien|selbstnutzer\b/i] },
    { label: "Kapitalanleger", patterns: [/\bkapitalanleger|investor|anlage\b/i] },
    { label: "Bauträger und Neubauvertrieb", patterns: [/\bbauträger|bautraeger|projektvertrieb|neubau\b/i] },
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

function inferPriceBand(snippets: string[]) {
  if (snippets.some((snippet) => /\bluxus|premium|exklusiv|villen|high-end\b/i.test(snippet))) {
    return "Premium / Luxus";
  }
  if (snippets.some((snippet) => /\bkapitalanlage|investment|rendite\b/i.test(snippet))) {
    return "Kapitalanlage / Investment";
  }
  return null;
}

function inferOwnerLed(snippets: string[]) {
  if (snippets.some((snippet) => /\binhabergeführt|inhabergefuehrt|familiengeführt|familiengefuehrt\b/i.test(snippet))) {
    return true;
  }
  if (snippets.some((snippet) => /\bgeschäftsführer|geschaeftsfuehrer|gründer|gruender|inhaber(in)?\b/i.test(snippet))) {
    return true;
  }
  return null;
}

function inferYearsInMarket(texts: string[]) {
  const joined = texts.join(" ");
  const currentYear = new Date().getFullYear();
  for (const match of joined.matchAll(/\bseit\s+(19\d{2}|20\d{2})\b/gi)) {
    const year = Number(match[1]);
    if (year >= 1950 && year <= currentYear) {
      return currentYear - year;
    }
  }
  for (const match of joined.matchAll(/\b(über|ueber|mehr als)\s+(\d{1,2})\s+jahre\b/gi)) {
    const years = Number(match[2]);
    if (years >= 2 && years <= 80) return years;
  }
  return null;
}

function collectTrustSignals(snippets: string[]) {
  const catalog = [
    { label: "IVD", pattern: /\bivd\b/i },
    { label: "Bellevue Best Property Agent", pattern: /\bbellevue\b/i },
    { label: "ImmoScout Partner", pattern: /\bimmoscout\b/i },
    { label: "ProvenExpert", pattern: /\bprovenexpert\b/i },
    { label: "Google-Bewertungen", pattern: /\bgoogle\b.*\bbewert|bewertungen\b/i },
    { label: "Auszeichnungen", pattern: /\bausgezeichnet|award|prämiert|praemiert|top makler\b/i },
    { label: "Langjährige Erfahrung", pattern: /\bseit\s+(19\d{2}|20\d{2})\b|\b\d+\s+jahre erfahrung\b/i },
  ];
  return unique(
    catalog
      .filter((entry) => snippets.some((snippet) => entry.pattern.test(snippet)))
      .map((entry) => entry.label),
    8,
  );
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

function inferActiveListingsEstimate(texts: string[], listingLinksCount: number) {
  let best: number | null = null;
  for (const text of texts) {
    for (const match of text.matchAll(
      /\b(\d{1,3})\s+(?:aktuelle\s+)?(?:immobilien|objekte|angebote|anzeigen|referenzobjekte)\b/gi,
    )) {
      const value = Number(match[1]);
      if (value >= 1 && value <= 300) {
        best = best === null ? value : Math.max(best, value);
      }
    }
  }
  if (best !== null) return best;
  if (listingLinksCount >= 6) return listingLinksCount;
  return null;
}

function buildProcessHint(args: {
  responsePromise: string | null;
  appointmentFlow: string | null;
  docsFlow: string | null;
  snippets: string[];
}) {
  const parts = [
    cleanLine(args.responsePromise, 150),
    cleanLine(args.appointmentFlow, 150),
    cleanLine(args.docsFlow, 150),
  ].filter(Boolean);
  if (parts.length > 0) return cleanLine(parts.join(" | "), 220);
  const digital = pickSignal(args.snippets, [/online-anfrage|formular|rückruf|rueckruf|crm|digital/i]);
  return cleanLine(digital, 220) || null;
}

function buildPainHypotheses(args: {
  responsePromise: string | null;
  appointmentFlow: string | null;
  docsFlow: string | null;
  activeListingsEstimate: number | null;
  objectTypes: string[];
}) {
  const primary =
    cleanLine(args.responsePromise, 180) ||
    cleanLine(args.appointmentFlow, 180) ||
    (typeof args.activeListingsEstimate === "number" && args.activeListingsEstimate >= 12
      ? "Mehrere laufende Objekte deuten auf viele wiederkehrende Interessentenanfragen parallel hin."
      : null) ||
    (args.objectTypes.length > 0
      ? `Die Vermarktung von ${args.objectTypes.join(", ")} erzeugt vermutlich viele Standardrueckfragen.`
      : null) ||
    "Wiederkehrende Interessentenanfragen und Rueckfragen duerften im Tagesgeschaeft Zeit binden.";
  const secondary =
    cleanLine(args.docsFlow, 180) ||
    cleanLine(args.appointmentFlow, 180) ||
    "Besichtigungen, Unterlagen und Rueckfragen muessen wahrscheinlich parallel manuell koordiniert werden.";
  return {
    primary: cleanLine(primary, 220) || null,
    secondary: cleanLine(secondary, 220) || null,
  };
}

function buildPersonalizationHook(args: {
  companyName: string;
  topEvidence: string | null;
  city: string | null;
  responsePromise: string | null;
  appointmentFlow: string | null;
  listingEstimate: number | null;
}) {
  const evidence =
    cleanLine(args.topEvidence, 160) ||
    cleanLine(args.responsePromise, 160) ||
    cleanLine(args.appointmentFlow, 160);
  if (evidence) {
    return cleanLine(
      `${args.companyName} zeigt oeffentlich, dass ${evidence.replace(/[.!?]+$/, "")}.`,
      220,
    );
  }
  if (typeof args.listingEstimate === "number" && args.listingEstimate >= 10) {
    return cleanLine(
      `${args.companyName} hat sichtbar mehrere laufende Immobilienangebote parallel in der Vermarktung.`,
      220,
    );
  }
  if (args.city) {
    return cleanLine(
      `${args.companyName} wirkt in ${args.city} operativ sehr aktiv und betreut parallel viele Interessentenprozesse.`,
      220,
    );
  }
  return cleanLine(`${args.companyName} betreut sichtbar mehrere Immobilienprozesse parallel.`, 220) || null;
}

function inferTeamHeadline(snippets: string[]) {
  return (
    pickSignal(snippets, [/\bgeschäftsführer|geschaeftsfuehrer|inhaber(in)?|gruender|gründer\b/i]) ||
    pickSignal(snippets, [/\bteam\b.{0,40}\bimmobilien\b/i])
  );
}

export async function crawlWebsiteResearch(args: {
  url: string;
  companyName?: string | null;
  city?: string | null;
  maxPages?: number;
  timeoutMs?: number;
}) {
  const start = new URL(args.url);
  const maxPages = Math.max(2, Math.min(10, Number(args.maxPages || 7)));
  const timeoutMs = Math.max(3000, Math.min(15000, Number(args.timeoutMs || 9000)));

  const visited: Array<{ url: string; html: string }> = [];
  const firstHtml = await fetchHtml(start.toString(), timeoutMs);
  if (!firstHtml) return null;
  visited.push({ url: start.toString(), html: firstHtml });

  const queue = chooseLinksToCrawl(start.toString(), visited, maxPages);
  for (const candidate of queue) {
    const html = await fetchHtml(candidate, timeoutMs);
    if (!html) continue;
    visited.push({ url: candidate, html });
  }

  const allLinks = unique(
    visited.flatMap((page) => extractLinks(page.html, page.url)),
    200,
  );
  const { linkedinUrls, whatsappUrls } = extractSpecialLinks(allLinks);
  const pages = visited.map((page) => {
    const text = stripHtml(page.html);
    const title = extractTitle(page.html);
    const description = extractMetaDescription(page.html);
    return {
      url: page.url,
      page_kind: pageKindFor(page.url, title),
      title,
      description,
      text,
      snippets: extractSnippets(text, 24),
      emails: extractEmails(page.html, text, start.hostname),
      phones: extractPhones(page.html, text),
    };
  });

  const titles = pages.map((page) => page.title).filter(Boolean) as string[];
  const descriptions = pages.map((page) => page.description).filter(Boolean) as string[];
  const texts = pages.map((page) => page.text);
  const snippets = pages.flatMap((page) => page.snippets).filter(Boolean).slice(0, 80);
  const contactEmails = unique(pages.flatMap((page) => page.emails), 8);
  const phoneNumbers = unique(pages.flatMap((page) => page.phones), 8);
  const trustSignals = collectTrustSignals(snippets);
  const objectTypes = collectObjectTypes(snippets);
  const targetGroup = inferTargetGroup(snippets);
  const priceBandMain = inferPriceBand(snippets);
  const ownerLed = inferOwnerLed(snippets);
  const yearsInMarket = inferYearsInMarket([...texts, ...titles, ...descriptions]);
  const responsePromise = pickSignal(snippets, [/24h|24 h|schnell|zeitnah|umgehend|innerhalb/i]);
  const appointmentFlow = pickSignal(snippets, [/besichtigung|termin|kalender|vereinbaren/i]);
  const docsFlow = pickSignal(snippets, [/unterlagen|exposé|expose|dokument|bonit/i]);
  const listingLinks = allLinks.filter((link) =>
    /\/(immobilien|objekte|angebote|referenzen|neubau|expose|exposé|kaufen|mieten)/i.test(link),
  );
  const activeListingsEstimate = inferActiveListingsEstimate(
    [...texts, ...titles, ...descriptions],
    listingLinks.length,
  );
  const regionFocusMicro = collectMicroRegions([...texts, ...titles]).slice(0, 4);
  const processHint = buildProcessHint({
    responsePromise,
    appointmentFlow,
    docsFlow,
    snippets,
  });
  const pains = buildPainHypotheses({
    responsePromise,
    appointmentFlow,
    docsFlow,
    activeListingsEstimate,
    objectTypes,
  });
  const topEvidence = unique(
    [
      responsePromise,
      appointmentFlow,
      docsFlow,
      trustSignals[0] || null,
      snippets.find((snippet) => /\bvermietung|verkauf|projektvertrieb|neubau\b/i.test(snippet)) || null,
      snippets[0] || null,
    ],
    6,
  );
  const personalizationHook = buildPersonalizationHook({
    companyName: cleanLine(args.companyName || start.hostname.replace(/^www\./, ""), 120),
    topEvidence: topEvidence[0] || null,
    city: cleanLine(args.city, 120) || null,
    responsePromise,
    appointmentFlow,
    listingEstimate: activeListingsEstimate,
  });
  const teamHeadline = inferTeamHeadline(snippets);

  return {
    start_url: start.toString(),
    pages: pages.map((page) => ({
      url: page.url,
      page_kind: page.page_kind,
      title: page.title,
      description: page.description,
      snippets: page.snippets,
    })),
    titles,
    descriptions,
    snippets,
    contact_emails: contactEmails,
    phone_numbers: phoneNumbers,
    linkedin_urls: linkedinUrls,
    whatsapp_urls: whatsappUrls,
    trust_signals: trustSignals,
    object_types: objectTypes,
    region_focus_micro: regionFocusMicro,
    target_group: targetGroup,
    price_band_main: priceBandMain,
    owner_led: ownerLed,
    years_in_market: yearsInMarket,
    response_promise_public: cleanLine(responsePromise, 180) || null,
    appointment_flow_public: cleanLine(appointmentFlow, 180) || null,
    docs_flow_public: cleanLine(docsFlow, 180) || null,
    process_hint: processHint,
    personalization_evidence: topEvidence,
    personalization_hook: personalizationHook,
    primary_pain_hypothesis: pains.primary,
    secondary_pain_hypothesis: pains.secondary,
    active_listings_estimate: activeListingsEstimate,
    inferred_contact_email: contactEmails[0] || null,
    inferred_linkedin_url: linkedinUrls[0] || null,
    team_headline: cleanLine(teamHeadline, 180) || null,
  } satisfies WebsiteResearchResult;
}
