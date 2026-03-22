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

export type WebsiteResearchNamedContact = {
  full_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  page_url: string;
  page_kind: PageKind;
  source_type: "website" | "linkedin";
  decision_maker: boolean;
  confidence: number;
};

export type WebsiteResearchSecondarySource = {
  source_type: "linkedin" | "portal" | "sonstiges";
  label: string;
  url: string;
  confidence: number;
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
  inferred_contact_name: string | null;
  inferred_contact_role: string | null;
  team_headline: string | null;
  named_contacts: WebsiteResearchNamedContact[];
  secondary_sources: WebsiteResearchSecondarySource[];
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

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&uuml;/gi, "ue")
    .replace(/&ouml;/gi, "oe")
    .replace(/&auml;/gi, "ae")
    .replace(/&Uuml;/g, "Ue")
    .replace(/&Ouml;/g, "Oe")
    .replace(/&Auml;/g, "Ae")
    .replace(/&szlig;/gi, "ss");
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

type AnchorRecord = {
  text: string;
  href: string;
  type: "http" | "mailto" | "tel";
  url: string | null;
};

function extractAnchors(html: string, baseUrl: string, maxItems = 160) {
  const anchors: AnchorRecord[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html))) {
    const href = cleanLine(decodeHtmlEntities(match[1] || ""), 500);
    const text = cleanLine(stripHtml(decodeHtmlEntities(match[2] || "")), 180);
    if (!href) continue;

    if (/^mailto:/i.test(href)) {
      anchors.push({
        text,
        href,
        type: "mailto",
        url: null,
      });
    } else if (/^tel:/i.test(href)) {
      anchors.push({
        text,
        href,
        type: "tel",
        url: null,
      });
    } else {
      try {
        const url = new URL(href, baseUrl);
        if (!/^https?:$/i.test(url.protocol)) continue;
        anchors.push({
          text,
          href,
          type: "http",
          url: url.toString(),
        });
      } catch {
        // Ignore malformed links.
      }
    }

    if (anchors.length >= maxItems) break;
  }
  return anchors;
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

function canonicalizeRole(role: string | null | undefined) {
  const safe = cleanLine(role, 140);
  if (!safe) return null;
  if (/inhaber|owner|gruender|gründer/i.test(safe)) return "Inhaber";
  if (/geschaeftsfuehrer|geschäftsführer|geschaeftsleitung|geschäftsleitung/i.test(safe)) {
    return "Geschaeftsfuehrer";
  }
  if (/vertrieb/i.test(safe)) return "Vertriebsleitung";
  if (/vermiet/i.test(safe)) return "Vermietung";
  if (/verkauf/i.test(safe)) return "Verkauf";
  if (/makler|berater|agent/i.test(safe)) return "Makler";
  if (/assistenz|bueroleitung|büroleitung|office/i.test(safe)) return "Assistenz";
  return safe;
}

function roleSignalScore(role: string | null | undefined) {
  const safe = cleanLine(role, 140).toLowerCase();
  if (!safe) return 0;
  if (/inhaber|owner|gruender|gründer|geschaeftsfuehrer|geschäftsführer|geschaeftsleitung|geschäftsleitung/i.test(safe)) {
    return 10;
  }
  if (/leitung|head|vertrieb|makler|berater|agent/i.test(safe)) return 6;
  if (/assistenz|bueroleitung|büroleitung|office/i.test(safe)) return 3;
  return 0;
}

function isDecisionMakerRole(role: string | null | undefined) {
  return roleSignalScore(role) >= 10;
}

function isLikelyPersonName(value: string | null | undefined) {
  const safe = cleanLine(value, 120);
  if (!safe) return false;
  if (safe.length < 6 || safe.length > 60) return false;
  if (/\d/.test(safe)) return false;
  if (/(immobilien|makler|gmbh|kg|team|kontakt|impressum|büro|buero|verkauf|vermietung|service|office|anfrage)/i.test(safe)) {
    return false;
  }
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return false;
  const blockedParts = new Set([
    "best",
    "property",
    "agent",
    "group",
    "realty",
    "estate",
    "partner",
    "service",
    "beratung",
    "management",
  ]);
  if (parts.some((part) => blockedParts.has(part.toLowerCase()))) return false;
  return parts.every((part) => /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,24}$/.test(part));
}

function inferNameFromEmail(email: string | null | undefined) {
  const safe = cleanLine(email, 200).toLowerCase();
  if (!safe || !safe.includes("@")) return null;
  const local = safe.split("@")[0] || "";
  if (!local || /^(info|kontakt|office|team|hello|mail|post|service|verwaltung)$/.test(local)) return null;
  const parts = local
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter((part) => /^[a-z]{2,24}$/.test(part));
  if (parts.length < 2 || parts.length > 3) return null;
  const name = parts.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
  return isLikelyPersonName(name) ? name : null;
}

function inferNameFromLinkedInUrl(url: string | null | undefined) {
  const safe = cleanLine(url, 500);
  if (!safe || !/linkedin\.com\/in\//i.test(safe)) return null;
  try {
    const parsed = new URL(safe);
    const slug = parsed.pathname.split("/").filter(Boolean).slice(-1)[0] || "";
    const parts = slug
      .split(/[-_]+/)
      .map((part) => part.trim())
      .filter((part) => /^[a-z]{2,24}$/i.test(part));
    if (parts.length < 2 || parts.length > 3) return null;
    const name = parts.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
    return isLikelyPersonName(name) ? name : null;
  } catch {
    return null;
  }
}

function tokensForName(value: string | null | undefined) {
  return cleanLine(value, 120)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function scoreEmailForName(email: string, name: string | null | undefined) {
  const local = cleanLine(email, 200).toLowerCase().split("@")[0] || "";
  if (!local) return 0;
  const nameTokens = tokensForName(name);
  if (nameTokens.length === 0) return 0;
  let score = 0;
  for (const token of nameTokens) {
    if (local.includes(token)) score += 1;
  }
  return score;
}

function findBestEmailForName(emails: string[], name: string | null | undefined) {
  const ranked = emails
    .map((email) => ({
      email,
      score: scoreEmailForName(email, name),
    }))
    .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email));
  return ranked[0]?.score > 0 ? ranked[0].email : null;
}

function findBestLinkedInForName(urls: string[], name: string | null | undefined) {
  const targetName = cleanLine(name, 120).toLowerCase();
  const ranked = urls
    .map((url) => {
      const inferred = cleanLine(inferNameFromLinkedInUrl(url), 120).toLowerCase();
      const score = targetName && inferred === targetName ? 2 : targetName && inferred.includes(targetName.split(" ")[0] || "") ? 1 : 0;
      return { url, score };
    })
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
  return ranked[0]?.score > 0 ? ranked[0].url : null;
}

function findRoleForName(name: string, snippets: string[]) {
  const safeName = cleanLine(name, 120);
  if (!safeName) return null;
  for (const snippet of snippets) {
    if (!snippet.includes(safeName)) continue;
    const roleMatch = snippet.match(
      /\b(Inhaber(?:in)?|Owner|Gruender(?:in)?|Gründer(?:in)?|Geschaeftsfuehrer(?:in)?|Geschäftsführer(?:in)?|Geschaeftsleitung|Geschäftsleitung|Leitung Vertrieb|Vertriebsleitung|Verkauf|Vermietung|Immobilienmakler(?:in)?|Makler(?:in)?|Immobilienberater(?:in)?|Berater(?:in)?|Assistenz|Teamassistenz|Bueroleitung|Büroleitung|Office Manager(?:in)?)\b/i,
    );
    if (roleMatch?.[1]) return canonicalizeRole(roleMatch[1]);
  }
  return null;
}

function buildNamedContactConfidence(args: {
  role: string | null;
  pageKind: PageKind;
  email: string | null;
  linkedinUrl: string | null;
  decisionMaker: boolean;
}) {
  let score = 0.55;
  if (args.pageKind === "team") score += 0.12;
  else if (args.pageKind === "about" || args.pageKind === "contact" || args.pageKind === "imprint") score += 0.07;
  if (args.role) score += 0.07;
  if (args.decisionMaker) score += 0.08;
  if (args.email) score += 0.08;
  if (args.linkedinUrl) score += 0.05;
  return Math.max(0.45, Math.min(0.97, Math.round(score * 1000) / 1000));
}

type InternalNamedContact = WebsiteResearchNamedContact;

function extractNamedContactsFromPages(args: {
  pages: Array<{
    url: string;
    page_kind: PageKind;
    snippets: string[];
    emails: string[];
    phones: string[];
    anchors: AnchorRecord[];
  }>;
  linkedinUrls: string[];
}) {
  const map = new Map<string, InternalNamedContact>();
  const push = (row: InternalNamedContact) => {
    const key = cleanLine(row.full_name, 120).toLowerCase();
    const current = map.get(key);
    if (!current) {
      map.set(key, row);
      return;
    }
    map.set(key, {
      ...current,
      role:
        roleSignalScore(row.role) > roleSignalScore(current.role)
          ? row.role
          : current.role || row.role,
      email: current.email || row.email,
      phone: current.phone || row.phone,
      linkedin_url: current.linkedin_url || row.linkedin_url,
      decision_maker: current.decision_maker || row.decision_maker,
      confidence: Math.max(current.confidence, row.confidence),
      page_url: current.confidence >= row.confidence ? current.page_url : row.page_url,
      page_kind: current.confidence >= row.confidence ? current.page_kind : row.page_kind,
      source_type:
        current.source_type === "linkedin" || row.source_type === "linkedin" ? "linkedin" : "website",
    });
  };

  for (const page of args.pages) {
    if (!["team", "about", "contact", "imprint"].includes(page.page_kind)) continue;

    for (const anchor of page.anchors) {
      const anchorName =
        isLikelyPersonName(anchor.text)
          ? cleanLine(anchor.text, 120)
          : anchor.type === "mailto"
            ? inferNameFromEmail(anchor.href.replace(/^mailto:/i, "").split("?")[0] || "")
            : anchor.type === "http"
              ? inferNameFromLinkedInUrl(anchor.url)
              : null;
      if (!anchorName || !isLikelyPersonName(anchorName)) continue;

      const role = findRoleForName(anchorName, page.snippets);
      const linkedinUrl =
        anchor.type === "http" && anchor.url && /linkedin\.com/i.test(anchor.url)
          ? anchor.url
          : findBestLinkedInForName(args.linkedinUrls, anchorName);
      const email =
        anchor.type === "mailto"
          ? cleanLine((anchor.href.replace(/^mailto:/i, "").split("?")[0] || ""), 200).toLowerCase()
          : findBestEmailForName(page.emails, anchorName);
      const phone = page.phones[0] || null;
      const decisionMaker = isDecisionMakerRole(role);
      push({
        full_name: anchorName,
        role,
        email,
        phone,
        linkedin_url: linkedinUrl,
        page_url: page.url,
        page_kind: page.page_kind,
        source_type: linkedinUrl && /linkedin\.com/i.test(linkedinUrl) ? "linkedin" : "website",
        decision_maker: decisionMaker,
        confidence: buildNamedContactConfidence({
          role,
          pageKind: page.page_kind,
          email,
          linkedinUrl,
          decisionMaker,
        }),
      });
    }

    for (const snippet of page.snippets) {
      for (const match of snippet.matchAll(
        /\b([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,24}(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,24}){1,2})\s*(?:[–—\-|,·]|\s+)\s*(Inhaber(?:in)?|Owner|Gruender(?:in)?|Gründer(?:in)?|Geschaeftsfuehrer(?:in)?|Geschäftsführer(?:in)?|Geschaeftsleitung|Geschäftsleitung|Leitung Vertrieb|Vertriebsleitung|Verkauf|Vermietung|Immobilienmakler(?:in)?|Makler(?:in)?|Immobilienberater(?:in)?|Berater(?:in)?|Assistenz|Teamassistenz|Bueroleitung|Büroleitung|Office Manager(?:in)?)\b/g,
      )) {
        const fullName = cleanLine(match[1], 120);
        const role = canonicalizeRole(match[2]);
        if (!isLikelyPersonName(fullName)) continue;
        const email = findBestEmailForName(page.emails, fullName);
        const linkedinUrl = findBestLinkedInForName(args.linkedinUrls, fullName);
        const phone = page.phones[0] || null;
        const decisionMaker = isDecisionMakerRole(role);
        push({
          full_name: fullName,
          role,
          email,
          phone,
          linkedin_url: linkedinUrl,
          page_url: page.url,
          page_kind: page.page_kind,
          source_type: linkedinUrl ? "linkedin" : "website",
          decision_maker: decisionMaker,
          confidence: buildNamedContactConfidence({
            role,
            pageKind: page.page_kind,
            email,
            linkedinUrl,
            decisionMaker,
          }),
        });
      }

      for (const match of snippet.matchAll(
        /\b(Inhaber(?:in)?|Owner|Gruender(?:in)?|Gründer(?:in)?|Geschaeftsfuehrer(?:in)?|Geschäftsführer(?:in)?|Geschaeftsleitung|Geschäftsleitung|Leitung Vertrieb|Vertriebsleitung|Verkauf|Vermietung|Immobilienmakler(?:in)?|Makler(?:in)?|Immobilienberater(?:in)?|Berater(?:in)?|Assistenz|Teamassistenz|Bueroleitung|Büroleitung|Office Manager(?:in)?)\s*[:,-]?\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,24}(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,24}){1,2})\b/g,
      )) {
        const role = canonicalizeRole(match[1]);
        const fullName = cleanLine(match[2], 120);
        if (!isLikelyPersonName(fullName)) continue;
        const email = findBestEmailForName(page.emails, fullName);
        const linkedinUrl = findBestLinkedInForName(args.linkedinUrls, fullName);
        const phone = page.phones[0] || null;
        const decisionMaker = isDecisionMakerRole(role);
        push({
          full_name: fullName,
          role,
          email,
          phone,
          linkedin_url: linkedinUrl,
          page_url: page.url,
          page_kind: page.page_kind,
          source_type: linkedinUrl ? "linkedin" : "website",
          decision_maker: decisionMaker,
          confidence: buildNamedContactConfidence({
            role,
            pageKind: page.page_kind,
            email,
            linkedinUrl,
            decisionMaker,
          }),
        });
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => {
      const decisionDiff = Number(b.decision_maker) - Number(a.decision_maker);
      if (decisionDiff) return decisionDiff;
      const roleDiff = roleSignalScore(b.role) - roleSignalScore(a.role);
      if (roleDiff) return roleDiff;
      return b.confidence - a.confidence || a.full_name.localeCompare(b.full_name);
    })
    .slice(0, 8);
}

function collectSecondarySources(links: string[]) {
  const sources: WebsiteResearchSecondarySource[] = [];
  const push = (
    sourceType: WebsiteResearchSecondarySource["source_type"],
    label: string,
    url: string,
    confidence: number,
  ) => {
    const safeUrl = cleanLine(url, 500);
    if (!safeUrl) return;
    if (sources.some((item) => item.url === safeUrl)) return;
    sources.push({
      source_type: sourceType,
      label: cleanLine(label, 120) || sourceType,
      url: safeUrl,
      confidence: Math.max(0, Math.min(1, Math.round(confidence * 1000) / 1000)),
    });
  };

  for (const link of links) {
    const safe = cleanLine(link, 500);
    if (!safe) continue;
    if (/linkedin\.com/i.test(safe)) {
      push("linkedin", /\/in\//i.test(safe) ? "LinkedIn-Profil" : "LinkedIn-Seite", safe, /\/in\//i.test(safe) ? 0.84 : 0.74);
    } else if (/immobilienscout24|immoscout24|immowelt|immonet/i.test(safe)) {
      push("portal", "Immobilienportal", safe, 0.71);
    } else if (/facebook\.com|instagram\.com|google\.[^/]+\/maps|provenexpert/i.test(safe)) {
      push("sonstiges", "Oeffentliche Zweitquelle", safe, 0.58);
    }
    if (sources.length >= 10) break;
  }

  return sources;
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
    const anchors = extractAnchors(page.html, page.url);
    return {
      url: page.url,
      page_kind: pageKindFor(page.url, title),
      title,
      description,
      text,
      snippets: extractSnippets(text, 24),
      emails: extractEmails(page.html, text, start.hostname),
      phones: extractPhones(page.html, text),
      anchors,
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
  const namedContacts = extractNamedContactsFromPages({
    pages: pages.map((page) => ({
      url: page.url,
      page_kind: page.page_kind,
      snippets: page.snippets,
      emails: page.emails,
      phones: page.phones,
      anchors: page.anchors,
    })),
    linkedinUrls,
  });
  const secondarySources = collectSecondarySources(allLinks);
  const bestNamedContact = namedContacts[0] || null;
  const inferredContactEmail =
    bestNamedContact?.email ||
    contactEmails.find((email) => scoreEmailForName(email, bestNamedContact?.full_name) > 0) ||
    contactEmails[0] ||
    null;
  const inferredLinkedInUrl =
    bestNamedContact?.linkedin_url ||
    linkedinUrls.find((url) => /\/in\//i.test(url)) ||
    linkedinUrls[0] ||
    null;

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
    inferred_contact_email: inferredContactEmail,
    inferred_linkedin_url: inferredLinkedInUrl,
    inferred_contact_name: bestNamedContact?.full_name || null,
    inferred_contact_role: bestNamedContact?.role || null,
    team_headline: cleanLine(teamHeadline, 180) || null,
    named_contacts: namedContacts,
    secondary_sources: secondarySources,
  } satisfies WebsiteResearchResult;
}
