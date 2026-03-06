export type ProspectRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  city: string | null;
  website_url: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  object_focus: string | null;
  active_listings_count: number | null;
  brand_tone: string | null;
  automation_readiness: string | null;
  response_promise_public: string | null;
  appointment_flow_public: string | null;
  docs_flow_public: string | null;
  linkedin_url: string | null;
  linkedin_search_url: string | null;
  personalization_evidence: string | null;
  primary_pain_hypothesis: string | null;
  pain_point_hypothesis: string | null;
};

export type EnrichmentResult = {
  crawl_url: string | null;
  inferred: {
    object_focus: "miete" | "kauf" | "neubau" | "gemischt";
    brand_tone: "professionell" | "freundlich" | "kurz_direkt" | "gemischt";
    automation_readiness: "niedrig" | "mittel" | "hoch";
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
    return { title, description, snippets };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadProspectForEnrichment(supabase: any, args: { prospectId: string; agentId: string }) {
  const { data: prospect, error } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, city, website_url, source_url, source_checked_at, object_focus, active_listings_count, brand_tone, automation_readiness, response_promise_public, appointment_flow_public, docs_flow_public, linkedin_url, linkedin_search_url, personalization_evidence, primary_pain_hypothesis, pain_point_hypothesis",
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
  const signals = crawlUrl ? await fetchWebsiteSignals(crawlUrl) : null;
  const snippets = signals?.snippets || [];

  const inferredFocus = inferObjectFocus(snippets);
  const inferredTone = inferTone(snippets);
  const inferredReadiness = inferReadiness(
    typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    snippets,
  );

  const topSnippet = snippets[0] || "";
  const title = normalizeLine(signals?.title || "", 180);
  const description = normalizeLine(signals?.description || "", 260);

  const responsePromise = snippets.find((snippet) =>
    /24h|24 h|schnell|zeitnah|umgehend|innerhalb/i.test(snippet),
  );
  const appointmentFlow = snippets.find((snippet) =>
    /besichtigung|termin|kalender|vereinbaren/i.test(snippet),
  );
  const docsFlow = snippets.find((snippet) => /unterlagen|exposé|dokument|bonit/i.test(snippet));

  const autoEvidence = [title, description, topSnippet]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 420);

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
  if (force || (!prospect.primary_pain_hypothesis && !prospect.pain_point_hypothesis)) {
    updates.primary_pain_hypothesis =
      inferredReadiness === "hoch"
        ? "Hohe Anfragenmenge erzeugt wiederkehrende Routine im Postfach."
        : "Unklare Trennung zwischen Standardanfragen und Sonderfällen bindet Zeit.";
  }

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
    title ? `Title: ${title}` : "",
    description ? `Meta: ${description}` : "",
    responsePromise ? `Reaktionssignal: ${normalizeLine(responsePromise, 120)}` : "",
    appointmentFlow ? `Termin-Signal: ${normalizeLine(appointmentFlow, 120)}` : "",
    docsFlow ? `Unterlagen-Signal: ${normalizeLine(docsFlow, 120)}` : "",
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
      },
    });
    noteSaved = !noteErr;
  }

  return {
    ok: true,
    result: {
      crawl_url: crawlUrl || null,
      inferred: {
        object_focus: inferredFocus,
        brand_tone: inferredTone,
        automation_readiness: inferredReadiness,
      },
      applied_updates: updates,
      note_saved: noteSaved,
    },
  };
}
