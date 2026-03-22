import { assessResearchReadiness } from "@/lib/crm/outboundQuality";
import { crawlWebsiteResearch } from "@/lib/crm/websiteResearchCrawler";

export type ProspectRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  city: string | null;
  region: string | null;
  website_url: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  object_focus: string | null;
  active_listings_count: number | null;
  object_types: string[] | null;
  price_band_main: string | null;
  region_focus_micro: string | null;
  owner_led: boolean | null;
  years_in_market: number | null;
  trust_signals: string[] | null;
  brand_tone: string | null;
  automation_readiness: string | null;
  response_promise_public: string | null;
  appointment_flow_public: string | null;
  docs_flow_public: string | null;
  linkedin_url: string | null;
  linkedin_search_url: string | null;
  linkedin_headline: string | null;
  personalization_hook: string | null;
  personalization_evidence: string | null;
  target_group: string | null;
  process_hint: string | null;
  primary_pain_hypothesis: string | null;
  secondary_pain_hypothesis: string | null;
  pain_point_hypothesis: string | null;
  hypothesis_confidence: number | null;
};

export type EnrichmentResult = {
  crawl_url: string | null;
  pages_crawled: string[];
  inferred: {
    object_focus: "miete" | "kauf" | "neubau" | "gemischt";
    brand_tone: "professionell" | "freundlich" | "kurz_direkt" | "gemischt";
    automation_readiness: "niedrig" | "mittel" | "hoch";
  };
  research: {
    status: "ready" | "refresh_research" | "needs_research" | "missing_contact";
    score: number;
    summary: string;
  };
  applied_updates: Record<string, any>;
  note_saved: boolean;
};

function normalizeLine(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 1200) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeLine(match?.[1] || "", 180) || null;
}

function extractMetaDescription(html: string) {
  const direct = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
  );
  if (direct?.[1]) return normalizeLine(direct[1], 300) || null;
  const reverse = html.match(
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i,
  );
  return normalizeLine(reverse?.[1] || "", 300) || null;
}

function extractTextSnippets(html: string, maxItems = 20) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

  return cleaned
    .split(/[.!?]/)
    .map((x) => normalizeLine(x, 200))
    .filter((x) => x.length >= 25)
    .slice(0, maxItems);
}

function extractLinks(html: string, baseUrl: string, maxItems = 40) {
  const out: string[] = [];
  const regex = /<a[^>]+href=["']([^"'#?]+(?:\?[^"']*)?)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html))) {
    const href = normalizeLine(match[1], 400);
    if (!href) continue;
    try {
      const url = new URL(href, baseUrl);
      if (!/^https?:$/i.test(url.protocol)) continue;
      out.push(url.toString());
      if (out.length >= maxItems) break;
    } catch {
      // Ignore malformed links.
    }
  }
  return [...new Set(out)];
}

function scoreKeyword(snippets: string[], keywords: string[]) {
  const haystack = snippets.join(" ").toLowerCase();
  return keywords.reduce((acc, keyword) => {
    return haystack.includes(keyword.toLowerCase()) ? acc + 1 : acc;
  }, 0);
}

function inferObjectFocus(snippets: string[]): "miete" | "kauf" | "neubau" | "gemischt" {
  const miete = scoreKeyword(snippets, [
    "miete",
    "vermietung",
    "mietwohnung",
    "mietobjekt",
  ]);
  const kauf = scoreKeyword(snippets, ["kauf", "verkauf", "eigentumswohnung", "hauskauf"]);
  const neubau = scoreKeyword(snippets, ["neubau", "projektvertrieb", "erstbezug"]);

  if (neubau > miete && neubau > kauf) return "neubau";
  if (miete > kauf && miete >= 2) return "miete";
  if (kauf > miete && kauf >= 2) return "kauf";
  return "gemischt";
}

function inferTone(snippets: string[]): "professionell" | "freundlich" | "kurz_direkt" | "gemischt" {
  const formal = scoreKeyword(snippets, ["diskret", "professionell", "verlässlich", "kompetent"]);
  const friendly = scoreKeyword(snippets, ["persönlich", "nah", "herzlich", "familiengeführt"]);
  const direct = scoreKeyword(snippets, ["schnell", "direkt", "unkompliziert", "in 24h"]);

  if (formal >= friendly && formal >= direct) return "professionell";
  if (friendly > formal && friendly >= direct) return "freundlich";
  if (direct > formal && direct > friendly) return "kurz_direkt";
  return "gemischt";
}

function inferReadiness(
  activeListingsCount: number | null,
  snippets: string[],
): "niedrig" | "mittel" | "hoch" {
  if (typeof activeListingsCount === "number") {
    if (activeListingsCount >= 35) return "hoch";
    if (activeListingsCount >= 12) return "mittel";
  }
  const automationSignals = scoreKeyword(snippets, [
    "digital",
    "automatisiert",
    "prozess",
    "crm",
    "online-anfrage",
  ]);
  if (automationSignals >= 3) return "mittel";
  return "niedrig";
}

function buildLinkedInSearchUrl(companyName: string, contactName: string, city: string) {
  const q = [contactName, companyName, city, "LinkedIn Immobilien"].filter(Boolean).join(" ");
  if (!q.trim()) return null;
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}`;
}

function chooseCandidateUrls(rootUrl: string, html: string) {
  const base = (() => {
    try {
      return new URL(rootUrl);
    } catch {
      return null;
    }
  })();
  if (!base) return [];

  const preferredPatterns = [
    /\/(ueber-uns|über-uns|about|team)(?:\/|$)/i,
    /\/(kontakt|contact)(?:\/|$)/i,
    /\/(leistungen|service|services)(?:\/|$)/i,
    /\/(verkaufen|vermieten|immobilien|objekte|angebote|referenzen)(?:\/|$)/i,
  ];

  const links = extractLinks(html, rootUrl, 60).filter((candidate) => {
    try {
      const url = new URL(candidate);
      return url.hostname === base.hostname;
    } catch {
      return false;
    }
  });

  const selected: string[] = [];
  for (const pattern of preferredPatterns) {
    const found = links.find((candidate) => pattern.test(candidate));
    if (found && !selected.includes(found)) selected.push(found);
    if (selected.length >= 3) break;
  }

  if (selected.length < 3) {
    for (const candidate of links) {
      if (!selected.includes(candidate)) selected.push(candidate);
      if (selected.length >= 3) break;
    }
  }
  return selected;
}

async function fetchWebsiteSignals(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdvaicCRMEnricher/1.0; +https://advaic.com)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const snippets = extractTextSnippets(html, 25);
    return { title, description, snippets, html };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlWebsiteSignals(url: string) {
  const root = await fetchWebsiteSignals(url);
  if (!root) return null;

  const pages: Array<{
    url: string;
    title: string | null;
    description: string | null;
    snippets: string[];
  }> = [
    {
      url,
      title: root.title,
      description: root.description,
      snippets: root.snippets,
    },
  ];

  const candidates = chooseCandidateUrls(url, root.html);
  for (const candidate of candidates) {
    const page = await fetchWebsiteSignals(candidate);
    if (!page) continue;
    pages.push({
      url: candidate,
      title: page.title,
      description: page.description,
      snippets: page.snippets,
    });
  }

  const titles = pages.map((page) => page.title).filter(Boolean) as string[];
  const descriptions = pages.map((page) => page.description).filter(Boolean) as string[];
  const snippets = pages.flatMap((page) => page.snippets).filter(Boolean).slice(0, 60);

  return {
    pages,
    titles,
    descriptions,
    snippets,
  };
}

function pickSignal(snippets: string[], patterns: RegExp[]) {
  return snippets.find((snippet) => patterns.some((pattern) => pattern.test(snippet))) || null;
}

function buildPersonalizationHook(args: {
  companyName: string | null;
  city: string | null;
  responsePromise: string | null;
  appointmentFlow: string | null;
  docsFlow: string | null;
  topSnippet: string | null;
}) {
  const companyName = normalizeLine(args.companyName, 120);
  const city = normalizeLine(args.city, 120);
  const highSignal =
    normalizeLine(args.responsePromise, 160) ||
    normalizeLine(args.appointmentFlow, 160) ||
    normalizeLine(args.docsFlow, 160) ||
    normalizeLine(args.topSnippet, 180);

  if (highSignal) {
    return normalizeLine(
      `${companyName || "Das Team"} kommuniziert oeffentlich, dass ${highSignal.replace(/[.!?]+$/, "")}.`,
      220,
    );
  }
  if (city) {
    return normalizeLine(
      `${companyName || "Das Team"} wirkt in ${city} sichtbar aktiv und betreut mehrere Anfragen parallel.`,
      220,
    );
  }
  return companyName ? `${companyName} betreut sichtbar mehrere Immobilienprozesse parallel.` : null;
}

export async function loadProspectForEnrichment(supabase: any, args: { prospectId: string; agentId: string }) {
  const { data: prospect, error } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, contact_email, contact_role, city, region, website_url, source_url, source_checked_at, object_focus, active_listings_count, object_types, price_band_main, region_focus_micro, owner_led, years_in_market, trust_signals, brand_tone, automation_readiness, response_promise_public, appointment_flow_public, docs_flow_public, linkedin_url, linkedin_search_url, linkedin_headline, personalization_hook, personalization_evidence, target_group, process_hint, primary_pain_hypothesis, secondary_pain_hypothesis, pain_point_hypothesis, hypothesis_confidence",
    )
    .eq("id", args.prospectId)
    .eq("agent_id", args.agentId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: "crm_prospect_lookup_failed", details: error.message };
  }
  if (!prospect) {
    return { ok: false as const, error: "prospect_not_found", details: "Prospect nicht gefunden." };
  }
  return { ok: true as const, prospect: prospect as ProspectRow };
}

export async function enrichProspectSignals(
  supabase: any,
  args: {
    prospectId: string;
    agentId: string;
    prospect: ProspectRow;
    force?: boolean;
  },
): Promise<{ ok: true; result: EnrichmentResult } | { ok: false; error: string; details?: string }> {
  const prospect = args.prospect;
  const crawlUrl =
    normalizeLine(prospect.website_url, 500) || normalizeLine(prospect.source_url, 500) || "";
  const crawl = crawlUrl
    ? await crawlWebsiteResearch({
        url: crawlUrl,
        companyName: prospect.company_name,
        city: prospect.city,
      })
    : null;
  const snippets = crawl?.snippets || [];

  const inferredFocus = inferObjectFocus(snippets);
  const inferredTone = inferTone(snippets);
  const inferredReadiness = inferReadiness(
    typeof prospect.active_listings_count === "number"
      ? prospect.active_listings_count
      : typeof crawl?.active_listings_estimate === "number"
        ? crawl.active_listings_estimate
        : null,
    snippets,
  );

  const topSnippet = snippets[0] || "";
  const title = normalizeLine(crawl?.titles?.[0] || "", 180);
  const description = normalizeLine(crawl?.descriptions?.[0] || "", 260);

  const responsePromise =
    normalizeLine(crawl?.response_promise_public, 180) ||
    pickSignal(snippets, [/24h|24 h|schnell|zeitnah|umgehend|innerhalb/i]);
  const appointmentFlow =
    normalizeLine(crawl?.appointment_flow_public, 180) ||
    pickSignal(snippets, [/besichtigung|termin|kalender|vereinbaren/i]);
  const docsFlow =
    normalizeLine(crawl?.docs_flow_public, 180) ||
    pickSignal(snippets, [/unterlagen|exposé|dokument|bonit/i]);
  const teamSignal =
    normalizeLine(crawl?.team_headline, 180) ||
    pickSignal(snippets, [/team|inhaber|persoenlich|familiengefuehrt|makler/i]);
  const serviceSignal = pickSignal(
    snippets,
    [/verkauf|vermietung|mietobjekte|kaufobjekte|projektvertrieb|neubau/i],
  );

  const autoEvidence = [
    title,
    description,
    normalizeLine(responsePromise, 160),
    normalizeLine(appointmentFlow, 160),
    normalizeLine(serviceSignal, 160),
    normalizeLine(teamSignal, 160),
    ...(crawl?.personalization_evidence || []).map((value) => normalizeLine(value, 160)),
    topSnippet,
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 420);
  const autoHook =
    normalizeLine(crawl?.personalization_hook, 220) ||
    buildPersonalizationHook({
      companyName: prospect.company_name,
      city: prospect.city,
      responsePromise,
      appointmentFlow,
      docsFlow,
      topSnippet,
    });
  const combinedPain =
    normalizeLine(crawl?.primary_pain_hypothesis, 180) ||
    normalizeLine(responsePromise, 150) ||
    normalizeLine(appointmentFlow, 150) ||
    normalizeLine(docsFlow, 150) ||
    normalizeLine(serviceSignal, 150) ||
    "";

  const force = Boolean(args.force);
  const updates: Record<string, any> = {};
  if (force || !prospect.source_checked_at) {
    updates.source_checked_at = new Date().toISOString().slice(0, 10);
  }
  if (
    force ||
    ((!prospect.linkedin_search_url || String(prospect.linkedin_search_url).trim() === "") &&
      !prospect.linkedin_url)
  ) {
    updates.linkedin_search_url =
      buildLinkedInSearchUrl(
        normalizeLine(prospect.company_name, 140),
        normalizeLine(prospect.contact_name, 120),
        normalizeLine(prospect.city, 120),
      ) || null;
  }
  if ((force || !prospect.object_focus || prospect.object_focus === "gemischt") && inferredFocus !== "gemischt") {
    updates.object_focus = inferredFocus;
  }
  if (force || !prospect.brand_tone) {
    updates.brand_tone = inferredTone;
  }
  if (force || !prospect.automation_readiness) {
    updates.automation_readiness = inferredReadiness;
  }
  if (force || !prospect.response_promise_public) {
    if (responsePromise) updates.response_promise_public = normalizeLine(responsePromise, 170);
  }
  if (force || !prospect.appointment_flow_public) {
    if (appointmentFlow) updates.appointment_flow_public = normalizeLine(appointmentFlow, 170);
  }
  if (force || !prospect.docs_flow_public) {
    if (docsFlow) updates.docs_flow_public = normalizeLine(docsFlow, 170);
  }
  if (force || !prospect.personalization_evidence) {
    if (autoEvidence) updates.personalization_evidence = autoEvidence;
  }
  if (force || !prospect.personalization_hook) {
    if (autoHook) updates.personalization_hook = autoHook;
  }
  if (force || !prospect.process_hint) {
    if (crawl?.process_hint) updates.process_hint = normalizeLine(crawl.process_hint, 220);
  }
  if (force || !prospect.target_group) {
    if (crawl?.target_group) updates.target_group = normalizeLine(crawl.target_group, 160);
  }
  if ((force || !prospect.object_types || prospect.object_types.length === 0) && crawl?.object_types?.length) {
    updates.object_types = crawl.object_types.slice(0, 6);
  }
  if (force || !prospect.price_band_main) {
    if (crawl?.price_band_main) updates.price_band_main = normalizeLine(crawl.price_band_main, 120);
  }
  if (force || !prospect.region_focus_micro) {
    if (crawl?.region_focus_micro?.length) {
      updates.region_focus_micro = normalizeLine(crawl.region_focus_micro.join(" · "), 180);
    }
  }
  if ((force || !prospect.trust_signals || prospect.trust_signals.length === 0) && crawl?.trust_signals?.length) {
    updates.trust_signals = crawl.trust_signals.slice(0, 8);
  }
  if ((force || prospect.owner_led === null) && crawl?.owner_led !== null && crawl?.owner_led !== undefined) {
    updates.owner_led = crawl.owner_led;
  }
  if (force || !prospect.years_in_market) {
    if (typeof crawl?.years_in_market === "number") updates.years_in_market = crawl.years_in_market;
  }
  if (force || !prospect.linkedin_headline) {
    if (crawl?.team_headline) updates.linkedin_headline = normalizeLine(crawl.team_headline, 180);
  }
  if (
    force ||
    ((!prospect.linkedin_url || String(prospect.linkedin_url).trim() === "") &&
      normalizeLine(crawl?.inferred_linkedin_url, 320))
  ) {
    if (crawl?.inferred_linkedin_url) updates.linkedin_url = normalizeLine(crawl.inferred_linkedin_url, 320);
  }
  if (
    force ||
    ((!prospect.contact_email || String(prospect.contact_email).trim() === "") &&
      normalizeLine(crawl?.inferred_contact_email, 320))
  ) {
    if (crawl?.inferred_contact_email) {
      updates.contact_email = normalizeLine(crawl.inferred_contact_email, 320).toLowerCase();
    }
  }
  if (force || !prospect.active_listings_count) {
    if (typeof crawl?.active_listings_estimate === "number") {
      updates.active_listings_count = crawl.active_listings_estimate;
    }
  }
  if (force || (!prospect.primary_pain_hypothesis && !prospect.pain_point_hypothesis)) {
    updates.primary_pain_hypothesis =
      combinedPain
        ? normalizeLine(
            `Oeffentliche Signale deuten darauf hin, dass ${combinedPain.replace(/[.!?]+$/, "")} und dadurch wiederkehrende Routinen im Tagesgeschaeft entstehen.`,
            220,
          )
        : normalizeLine(crawl?.primary_pain_hypothesis, 220) ||
          (inferredReadiness === "hoch"
          ? "Hohe Anfragenmenge erzeugt wiederkehrende Routine im Postfach."
          : "Unklare Trennung zwischen Standardanfragen und Sonderfaellen bindet Zeit.");
    if (!prospect.pain_point_hypothesis) {
      updates.pain_point_hypothesis = updates.primary_pain_hypothesis;
    }
  }
  if (force || !prospect.secondary_pain_hypothesis) {
    if (crawl?.secondary_pain_hypothesis) {
      updates.secondary_pain_hypothesis = normalizeLine(crawl.secondary_pain_hypothesis, 220);
    }
  }
  if (force || !prospect.hypothesis_confidence) {
    const confidence =
      crawl?.personalization_evidence && crawl.personalization_evidence.length >= 4
        ? 0.78
        : crawl?.personalization_evidence && crawl.personalization_evidence.length >= 2
          ? 0.66
          : null;
    if (confidence !== null) updates.hypothesis_confidence = confidence;
  }

  const research = assessResearchReadiness({
    preferredChannel: "email",
    contactEmail:
      normalizeLine(updates.contact_email, 320) || normalizeLine(prospect.contact_email, 320) || null,
    personalizationHook:
      normalizeLine(updates.personalization_hook, 260) || normalizeLine(prospect.personalization_hook, 260),
    personalizationEvidence:
      normalizeLine(updates.personalization_evidence, 320) ||
      normalizeLine(prospect.personalization_evidence, 320),
    researchInsights: Array.isArray(crawl?.personalization_evidence)
      ? crawl.personalization_evidence.slice(0, 4).map((value) => normalizeLine(value, 140)).filter(Boolean).join(" | ") || null
      : null,
    sourceCheckedAt:
      normalizeLine(updates.source_checked_at, 40) || normalizeLine(prospect.source_checked_at, 40),
    targetGroup:
      normalizeLine(updates.target_group, 160) || normalizeLine(prospect.target_group, 160),
    processHint:
      normalizeLine(updates.process_hint, 220) || normalizeLine(prospect.process_hint, 220),
    responsePromisePublic:
      normalizeLine(updates.response_promise_public, 180) ||
      normalizeLine(prospect.response_promise_public, 180),
    appointmentFlowPublic:
      normalizeLine(updates.appointment_flow_public, 180) ||
      normalizeLine(prospect.appointment_flow_public, 180),
    docsFlowPublic:
      normalizeLine(updates.docs_flow_public, 180) || normalizeLine(prospect.docs_flow_public, 180),
    activeListingsCount:
      typeof updates.active_listings_count === "number"
        ? updates.active_listings_count
        : typeof prospect.active_listings_count === "number"
          ? prospect.active_listings_count
          : null,
    automationReadiness:
      normalizeLine(updates.automation_readiness, 24) || normalizeLine(prospect.automation_readiness, 24),
    linkedinUrl: normalizeLine(updates.linkedin_url, 320) || prospect.linkedin_url,
    linkedinSearchUrl:
      normalizeLine(updates.linkedin_search_url, 500) || normalizeLine(prospect.linkedin_search_url, 500),
  });

  if (Object.keys(updates).length > 0) {
    const { error: updateErr } = await (supabase.from("crm_prospects") as any)
      .update(updates)
      .eq("id", args.prospectId)
      .eq("agent_id", args.agentId);
    if (updateErr) {
      return { ok: false, error: "crm_enrich_update_failed", details: updateErr.message };
    }
  }

  const noteParts = [
    crawl?.pages?.length ? `Seiten: ${crawl.pages.map((page) => page.url).join(", ")}` : "",
    title ? `Title: ${title}` : "",
    description ? `Meta: ${description}` : "",
    crawl?.inferred_contact_email ? `Kontakt-Mail: ${normalizeLine(crawl.inferred_contact_email, 120)}` : "",
    crawl?.object_types?.length ? `Objekttypen: ${crawl.object_types.join(", ")}` : "",
    crawl?.region_focus_micro?.length ? `Regionen: ${crawl.region_focus_micro.join(", ")}` : "",
    crawl?.trust_signals?.length ? `Trust: ${crawl.trust_signals.join(", ")}` : "",
    responsePromise ? `Reaktionssignal: ${normalizeLine(responsePromise, 120)}` : "",
    appointmentFlow ? `Termin-Signal: ${normalizeLine(appointmentFlow, 120)}` : "",
    docsFlow ? `Unterlagen-Signal: ${normalizeLine(docsFlow, 120)}` : "",
    autoHook ? `Hook: ${normalizeLine(autoHook, 140)}` : "",
  ].filter(Boolean);

  let noteSaved = false;
  if (noteParts.length > 0) {
    const { error: noteErr } = await (supabase.from("crm_research_notes") as any).insert({
      prospect_id: args.prospectId,
      agent_id: args.agentId,
      source_type: "website",
      source_url: crawlUrl || null,
      note: normalizeText(noteParts.join(" | "), 900),
      confidence: 0.62,
      is_key_insight: true,
      metadata: {
        source: "crm_auto_enrichment",
        inferred_focus: inferredFocus,
        inferred_tone: inferredTone,
        inferred_readiness: inferredReadiness,
        research_status: research.status,
        research_score: research.score,
        pages_crawled: crawl?.pages?.map((page) => page.url) || [],
        trust_signals: crawl?.trust_signals || [],
        object_types: crawl?.object_types || [],
        contact_emails: crawl?.contact_emails || [],
        region_focus_micro: crawl?.region_focus_micro || [],
      },
    });
    noteSaved = !noteErr;
  }

  return {
    ok: true,
    result: {
      crawl_url: crawlUrl || null,
      pages_crawled: crawl?.pages?.map((page) => page.url) || [],
      inferred: {
        object_focus: inferredFocus,
        brand_tone: inferredTone,
        automation_readiness: inferredReadiness,
      },
      research: {
        status: research.status,
        score: research.score,
        summary: research.summary,
      },
      applied_updates: updates,
      note_saved: noteSaved,
    },
  };
}
