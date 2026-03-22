import type { SecondarySourceResearchResult } from "@/lib/crm/secondarySourceResearch";
import type { WebsiteResearchResult } from "@/lib/crm/websiteResearchCrawler";

type SubjectRef = {
  agentId: string;
  prospectId?: string | null;
  candidateId?: string | null;
};

export type EvidenceRow = {
  field_name: string;
  field_value: string;
  source_type?: string;
  source_url?: string | null;
  confidence?: number | null;
  metadata?: Record<string, any>;
};

export type ContactRow = {
  contact_name?: string | null;
  contact_role?: string | null;
  channel_type: string;
  channel_value: string;
  confidence?: number | null;
  validation_status?: string;
  is_primary?: boolean;
  source_type?: string;
  source_url?: string | null;
  metadata?: Record<string, any>;
};

function clean(value: unknown, max = 280) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function uniq(values: Array<string | null | undefined>, max = 20) {
  return [...new Set(values.map((value) => clean(value, 220)).filter(Boolean))].slice(0, max);
}

function withSubject<T extends Record<string, any>>(subject: SubjectRef, row: T) {
  return {
    ...row,
    agent_id: subject.agentId,
    prospect_id: subject.prospectId || null,
    candidate_id: subject.candidateId || null,
  };
}

export function buildResearchArtifactsFromCrawl(args: {
  crawl: WebsiteResearchResult | null;
  sourceUrl?: string | null;
  contactRole?: string | null;
}) {
  const crawl = args.crawl;
  if (!crawl) {
    return {
      evidence: [] as EvidenceRow[],
      contacts: [] as ContactRow[],
    };
  }

  const sourceUrl = clean(args.sourceUrl || crawl.start_url, 500) || crawl.start_url;
  const evidence: EvidenceRow[] = [];
  const contacts: ContactRow[] = [];

  const pushEvidence = (
    fieldName: string,
    values: Array<string | number | boolean | null | undefined>,
    confidence: number,
  ) => {
    for (const value of values) {
      const fieldValue = clean(value, 260);
      if (!fieldValue) continue;
      evidence.push({
        field_name: fieldName,
        field_value: fieldValue,
        source_type: "website",
        source_url: sourceUrl,
        confidence,
      });
    }
  };

  pushEvidence("target_group", [crawl.target_group], 0.68);
  pushEvidence("process_hint", [crawl.process_hint], 0.72);
  pushEvidence("price_band_main", [crawl.price_band_main], 0.6);
  pushEvidence("response_promise_public", [crawl.response_promise_public], 0.69);
  pushEvidence("appointment_flow_public", [crawl.appointment_flow_public], 0.67);
  pushEvidence("docs_flow_public", [crawl.docs_flow_public], 0.64);
  pushEvidence("owner_led", [crawl.owner_led === null ? null : crawl.owner_led ? "true" : "false"], 0.58);
  pushEvidence("years_in_market", [crawl.years_in_market], 0.66);
  pushEvidence("active_listings_estimate", [crawl.active_listings_estimate], 0.7);
  pushEvidence("personalization_hook", [crawl.personalization_hook], 0.76);
  pushEvidence("primary_pain_hypothesis", [crawl.primary_pain_hypothesis], 0.63);
  pushEvidence("secondary_pain_hypothesis", [crawl.secondary_pain_hypothesis], 0.58);
  pushEvidence("object_type", crawl.object_types || [], 0.74);
  pushEvidence("region_focus_micro", crawl.region_focus_micro || [], 0.63);
  pushEvidence("trust_signal", crawl.trust_signals || [], 0.71);
  pushEvidence("personalization_evidence", crawl.personalization_evidence || [], 0.77);
  pushEvidence(
    "named_contact",
    (crawl.named_contacts || []).map((contact) =>
      [contact.full_name, contact.role, contact.decision_maker ? "Entscheider" : null].filter(Boolean).join(" · "),
    ),
    0.76,
  );
  for (const source of crawl.secondary_sources || []) {
    evidence.push({
      field_name: "secondary_source",
      field_value: clean(`${source.label}: ${source.url}`, 260),
      source_type: clean(source.source_type, 24) || "sonstiges",
      source_url: clean(source.url, 500) || null,
      confidence:
        source.confidence === null || source.confidence === undefined
          ? 0.62
          : Math.max(0, Math.min(1, Number(source.confidence))),
    });
  }

  const pushContact = (row: ContactRow) => {
    const channelType = clean(row.channel_type, 24);
    const channelValue = clean(row.channel_value, 320);
    if (!channelType || !channelValue) return;
    const key = `${channelType}:${channelValue.toLowerCase()}`;
    if (
      contacts.some(
        (existing) =>
          clean(existing.channel_type, 24).toLowerCase() === channelType.toLowerCase() &&
          clean(existing.channel_value, 320).toLowerCase() === channelValue.toLowerCase(),
      )
    ) {
      return;
    }
    contacts.push(row);
  };

  for (const [index, contact] of (crawl.named_contacts || []).entries()) {
    const isPrimaryNamed = index === 0;
    const metadata = {
      decision_maker: Boolean(contact.decision_maker),
      page_kind: clean(contact.page_kind, 40),
      source_contact_name: clean(contact.full_name, 160),
      source_contact_role: clean(contact.role, 120) || null,
    };

    if (contact.email) {
      pushContact({
        contact_name: clean(contact.full_name, 160) || null,
        contact_role: clean(contact.role, 120) || clean(args.contactRole, 120) || null,
        channel_type: "email",
        channel_value: contact.email.toLowerCase(),
        confidence: Math.max(0.82, Number(contact.confidence || 0)),
        validation_status: "new",
        is_primary: isPrimaryNamed,
        source_type: contact.source_type === "linkedin" ? "linkedin" : "website",
        source_url: clean(contact.linkedin_url || contact.page_url, 500) || sourceUrl,
        metadata,
      });
    }

    if (contact.linkedin_url) {
      pushContact({
        contact_name: clean(contact.full_name, 160) || null,
        contact_role: clean(contact.role, 120) || clean(args.contactRole, 120) || null,
        channel_type: "linkedin",
        channel_value: contact.linkedin_url,
        confidence: Math.max(0.74, Number(contact.confidence || 0) - 0.04),
        validation_status: "new",
        is_primary: isPrimaryNamed && !contact.email,
        source_type: "linkedin",
        source_url: contact.linkedin_url,
        metadata,
      });
    }

    if (contact.phone) {
      pushContact({
        contact_name: clean(contact.full_name, 160) || null,
        contact_role: clean(contact.role, 120) || clean(args.contactRole, 120) || null,
        channel_type: "telefon",
        channel_value: contact.phone,
        confidence: Math.max(0.7, Number(contact.confidence || 0) - 0.06),
        validation_status: "new",
        is_primary: false,
        source_type: "website",
        source_url: clean(contact.page_url, 500) || sourceUrl,
        metadata,
      });
    }
  }

  const emailValues = uniq([crawl.inferred_contact_email, ...(crawl.contact_emails || [])], 4);
  for (const [index, email] of emailValues.entries()) {
    pushContact({
      contact_role: clean(args.contactRole, 120) || null,
      channel_type: "email",
      channel_value: email.toLowerCase(),
      confidence: index === 0 ? 0.9 : 0.78,
      validation_status: "new",
      is_primary: index === 0 && !contacts.some((existing) => existing.is_primary),
      source_type: "website",
      source_url: sourceUrl,
    });
  }

  const linkedinValues = uniq([crawl.inferred_linkedin_url, ...(crawl.linkedin_urls || [])], 3);
  for (const [index, linkedin] of linkedinValues.entries()) {
    pushContact({
      contact_role: clean(args.contactRole, 120) || null,
      channel_type: "linkedin",
      channel_value: linkedin,
      confidence: /\/in\//i.test(linkedin) ? (index === 0 ? 0.79 : 0.68) : index === 0 ? 0.73 : 0.62,
      validation_status: "new",
      is_primary: index === 0 && emailValues.length === 0 && !contacts.some((existing) => existing.is_primary),
      source_type: "linkedin",
      source_url: linkedin,
    });
  }

  for (const [index, phone] of uniq(crawl.phone_numbers || [], 4).entries()) {
    pushContact({
      channel_type: "telefon",
      channel_value: phone,
      confidence: index === 0 ? 0.7 : 0.58,
      validation_status: "new",
      is_primary: false,
      source_type: "website",
      source_url: sourceUrl,
    });
  }

  for (const whatsapp of uniq(crawl.whatsapp_urls || [], 2)) {
    pushContact({
      channel_type: "whatsapp",
      channel_value: whatsapp,
      confidence: 0.66,
      validation_status: "new",
      is_primary: false,
      source_type: "website",
      source_url: sourceUrl,
    });
  }

  const contactPage = (crawl.pages || []).find((page) => page.page_kind === "contact")?.url;
  if (contactPage) {
    pushContact({
      channel_type: "kontaktformular",
      channel_value: contactPage,
      confidence: 0.55,
      validation_status: "new",
      is_primary:
        emailValues.length === 0 &&
        linkedinValues.length === 0 &&
        !contacts.some((existing) => existing.is_primary),
      source_type: "website",
      source_url: contactPage,
    });
  }

  return {
    evidence,
    contacts,
  };
}

export function buildResearchArtifactsFromSecondarySources(args: {
  research: SecondarySourceResearchResult | null;
  contactRole?: string | null;
}) {
  const research = args.research;
  if (!research) {
    return {
      evidence: [] as EvidenceRow[],
      contacts: [] as ContactRow[],
    };
  }

  const evidence: EvidenceRow[] = [];
  const contacts: ContactRow[] = [];
  const sourceCount = new Set((research.pages || []).map((page) => clean(page.url, 500))).size || 1;

  const pushEvidence = (
    fieldName: string,
    values: Array<string | number | boolean | null | undefined>,
    sourceType: string,
    sourceUrl: string | null,
    confidence: number,
    metadata?: Record<string, any>,
  ) => {
    for (const value of values) {
      const fieldValue = clean(value, 260);
      if (!fieldValue) continue;
      evidence.push({
        field_name: fieldName,
        field_value: fieldValue,
        source_type: clean(sourceType, 24) || "sonstiges",
        source_url: clean(sourceUrl, 500) || null,
        confidence,
        metadata: metadata && typeof metadata === "object" ? metadata : {},
      });
    }
  };

  for (const page of research.pages || []) {
    const sourceUrl = clean(page.url, 500) || null;
    const sourceType = clean(page.source_type, 24) || "sonstiges";
    pushEvidence("secondary_page", [`${page.label}: ${page.url}`], sourceType, sourceUrl, 0.6, {
      label: clean(page.label, 120) || null,
      source_kind: clean(page.source_kind, 40) || null,
      verification_score: Number(page.verification_score || 0),
      verification_signals: page.verification_signals || [],
      verification_summary: clean(page.verification_summary, 180) || null,
      contact_surface: clean(page.contact_surface, 40) || null,
    });
    pushEvidence("personalization_evidence", page.snippets.slice(0, 3), sourceType, sourceUrl, 0.64);
    pushEvidence("verification_signal", page.verification_signals || [], sourceType, sourceUrl, 0.66, {
      source_kind: clean(page.source_kind, 40) || null,
      corroborated_by_secondary: true,
    });
    pushEvidence("review_count_public", [page.review_count], sourceType, sourceUrl, 0.68, {
      source_kind: clean(page.source_kind, 40) || null,
      corroborated_by_secondary: true,
    });
    pushEvidence("rating_value_public", [page.rating_value], sourceType, sourceUrl, 0.66, {
      source_kind: clean(page.source_kind, 40) || null,
      corroborated_by_secondary: true,
    });
    pushEvidence("listing_count_public", [page.listing_count_estimate], sourceType, sourceUrl, 0.67, {
      source_kind: clean(page.source_kind, 40) || null,
      corroborated_by_secondary: true,
    });
  }

  for (const signal of research.trust_signals || []) {
    const page = (research.pages || []).find((row) => row.snippets.some((snippet) => snippet.includes(signal)));
    pushEvidence(
      "trust_signal",
      [signal],
      page?.source_type || "sonstiges",
      page?.url || null,
      0.68,
      { corroborated_by_secondary: true },
    );
  }

  pushEvidence(
    "target_group",
    [research.target_group],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.62,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "process_hint",
    [research.process_hint],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.66,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "response_promise_public",
    [research.response_promise_public],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.66,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "owner_led",
    [research.owner_led === null ? null : research.owner_led ? "true" : "false"],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.58,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "years_in_market",
    [research.years_in_market],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.62,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "object_type",
    research.object_types || [],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.67,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "region_focus_micro",
    research.region_focus_micro || [],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.6,
    { corroborated_by_secondary: true },
  );
  pushEvidence(
    "personalization_hook",
    [research.corroborated_hook],
    research.pages[0]?.source_type || "sonstiges",
    research.pages[0]?.url || null,
    0.7,
    { corroborated_by_secondary: true },
  );

  const pushContact = (row: ContactRow) => {
    const channelType = clean(row.channel_type, 24);
    const channelValue = clean(row.channel_value, 320);
    if (!channelType || !channelValue) return;
    if (
      contacts.some(
        (existing) =>
          clean(existing.channel_type, 24).toLowerCase() === channelType.toLowerCase() &&
          clean(existing.channel_value, 320).toLowerCase() === channelValue.toLowerCase(),
      )
    ) {
      return;
    }
    contacts.push(row);
  };

  const findSupportingPage = (url: string | null | undefined) => {
    const safeUrl = clean(url, 500);
    if (!safeUrl) return null;
    return (
      (research.pages || []).find((page) => clean(page.url, 500) === safeUrl) ||
      null
    );
  };

  const contactMetadataForPage = (page: SecondarySourceResearchResult["pages"][number] | null) => {
    return {
      source_kind: clean(page?.source_kind, 40) || null,
      verification_score: page ? Number(page.verification_score || 0) : null,
      verification_signals: page?.verification_signals || [],
      verification_summary: clean(page?.verification_summary, 180) || null,
      verified_contact_surface: clean(page?.contact_surface, 40) || null,
      review_count: page?.review_count ?? null,
      rating_value: page?.rating_value ?? null,
      listing_count_estimate: page?.listing_count_estimate ?? null,
      corroborated_by_secondary: true,
      external_source_count: sourceCount,
    };
  };

  const liftConfidence = (base: number, page: SecondarySourceResearchResult["pages"][number] | null) => {
    const verificationScore = Number(page?.verification_score || 0);
    if (!verificationScore) return base;
    return Math.max(base, Math.min(0.94, base + Math.max(0, verificationScore - 0.6) * 0.25));
  };

  for (const [index, contact] of (research.named_contacts || []).entries()) {
    const supportingPage = findSupportingPage(contact.linkedin_url || contact.page_url);
    const contactSourceType =
      clean(supportingPage?.source_type, 24) || (contact.source_type === "linkedin" ? "linkedin" : "website");
    const metadata = {
      decision_maker: Boolean(contact.decision_maker),
      page_kind: clean(contact.page_kind, 40),
      source_contact_name: clean(contact.full_name, 160),
      source_contact_role: clean(contact.role, 120) || null,
      ...contactMetadataForPage(supportingPage),
    };

    if (contact.email) {
      pushContact({
        contact_name: clean(contact.full_name, 160) || null,
        contact_role: clean(contact.role, 120) || clean(args.contactRole, 120) || null,
        channel_type: "email",
        channel_value: contact.email.toLowerCase(),
        confidence: liftConfidence(Math.max(0.72, Number(contact.confidence || 0)), supportingPage),
        validation_status: "new",
        is_primary: index === 0,
        source_type: contactSourceType,
        source_url: clean(contact.page_url, 500) || null,
        metadata,
      });
    }

    if (contact.linkedin_url) {
      pushContact({
        contact_name: clean(contact.full_name, 160) || null,
        contact_role: clean(contact.role, 120) || clean(args.contactRole, 120) || null,
        channel_type: "linkedin",
        channel_value: contact.linkedin_url,
        confidence: liftConfidence(Math.max(0.74, Number(contact.confidence || 0)), supportingPage),
        validation_status: "new",
        is_primary: index === 0 && !contact.email,
        source_type: "linkedin",
        source_url: contact.linkedin_url,
        metadata,
      });
    }
  }

  for (const [index, email] of (research.contact_emails || []).entries()) {
    const supportingPage = research.pages[0] || null;
    pushContact({
      contact_role: clean(args.contactRole, 120) || null,
      channel_type: "email",
      channel_value: clean(email, 320).toLowerCase(),
      confidence: liftConfidence(index === 0 ? 0.74 : 0.66, supportingPage),
      validation_status: "new",
      is_primary: index === 0 && contacts.length === 0,
      source_type: clean(supportingPage?.source_type, 24) || "website",
      source_url: supportingPage?.url || research.pages[0]?.url || null,
      metadata: contactMetadataForPage(supportingPage),
    });
  }

  for (const [index, linkedin] of (research.linkedin_urls || []).entries()) {
    const supportingPage = findSupportingPage(linkedin) || research.pages.find((page) => page.source_kind.startsWith("linkedin")) || null;
    pushContact({
      contact_role: clean(args.contactRole, 120) || null,
      channel_type: "linkedin",
      channel_value: linkedin,
      confidence: liftConfidence(
        /\/in\//i.test(linkedin) ? (index === 0 ? 0.78 : 0.7) : index === 0 ? 0.71 : 0.64,
        supportingPage,
      ),
      validation_status: "new",
      is_primary: index === 0 && !contacts.some((existing) => existing.is_primary),
      source_type: "linkedin",
      source_url: linkedin,
      metadata: contactMetadataForPage(supportingPage),
    });
  }

  for (const [index, phone] of (research.phone_numbers || []).entries()) {
    const supportingPage = research.pages[0] || null;
    pushContact({
      contact_role: clean(args.contactRole, 120) || null,
      channel_type: "telefon",
      channel_value: phone,
      confidence: liftConfidence(index === 0 ? 0.68 : 0.6, supportingPage),
      validation_status: "new",
      is_primary: false,
      source_type: clean(supportingPage?.source_type, 24) || "website",
      source_url: supportingPage?.url || research.pages[0]?.url || null,
      metadata: contactMetadataForPage(supportingPage),
    });
  }

  return {
    evidence,
    contacts,
  };
}

export async function replaceResearchArtifacts(
  supabase: any,
  args: SubjectRef & {
    evidence?: EvidenceRow[];
    contacts?: ContactRow[];
  },
) {
  if (!args.prospectId && !args.candidateId) return;

  let evidenceDelete = (supabase.from("crm_research_evidence") as any)
    .delete()
    .eq("agent_id", args.agentId);
  let contactDelete = (supabase.from("crm_contact_candidates") as any)
    .delete()
    .eq("agent_id", args.agentId);

  if (args.prospectId) {
    evidenceDelete = evidenceDelete.eq("prospect_id", args.prospectId);
    contactDelete = contactDelete.eq("prospect_id", args.prospectId);
  } else {
    evidenceDelete = evidenceDelete.eq("candidate_id", args.candidateId);
    contactDelete = contactDelete.eq("candidate_id", args.candidateId);
  }

  await evidenceDelete;
  await contactDelete;

  const evidenceRows = (args.evidence || []).map((row) =>
    withSubject(args, {
      field_name: clean(row.field_name, 80),
      field_value: clean(row.field_value, 260),
      source_type: clean(row.source_type || "website", 24),
      source_url: clean(row.source_url, 500) || null,
      confidence:
        row.confidence === null || row.confidence === undefined
          ? null
          : Math.max(0, Math.min(1, Number(row.confidence))),
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    }),
  );

  const contactRows = (args.contacts || []).map((row) =>
    withSubject(args, {
      contact_name: clean(row.contact_name, 160) || null,
      contact_role: clean(row.contact_role, 120) || null,
      channel_type: clean(row.channel_type, 24),
      channel_value: clean(row.channel_value, 320),
      confidence:
        row.confidence === null || row.confidence === undefined
          ? null
          : Math.max(0, Math.min(1, Number(row.confidence))),
      validation_status: clean(row.validation_status || "new", 24),
      is_primary: Boolean(row.is_primary),
      source_type: clean(row.source_type || "website", 24),
      source_url: clean(row.source_url, 500) || null,
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    }),
  );

  if (evidenceRows.length > 0) {
    await (supabase.from("crm_research_evidence") as any).insert(evidenceRows);
  }
  if (contactRows.length > 0) {
    await (supabase.from("crm_contact_candidates") as any).insert(contactRows);
  }
}

export async function copyCandidateArtifactsToProspect(supabase: any, args: {
  agentId: string;
  candidateId: string;
  prospectId: string;
}) {
  const [evidenceRes, contactRes] = await Promise.all([
    (supabase.from("crm_research_evidence") as any)
      .select("field_name, field_value, source_type, source_url, confidence, metadata")
      .eq("agent_id", args.agentId)
      .eq("candidate_id", args.candidateId),
    (supabase.from("crm_contact_candidates") as any)
      .select("contact_name, contact_role, channel_type, channel_value, confidence, validation_status, is_primary, source_type, source_url, metadata")
      .eq("agent_id", args.agentId)
      .eq("candidate_id", args.candidateId),
  ]);

  if (evidenceRes.data?.length) {
    await (supabase.from("crm_research_evidence") as any).insert(
      evidenceRes.data.map((row: any) =>
        withSubject(
          {
            agentId: args.agentId,
            prospectId: args.prospectId,
          },
          row,
        ),
      ),
    );
  }

  if (contactRes.data?.length) {
    await (supabase.from("crm_contact_candidates") as any).insert(
      contactRes.data.map((row: any) =>
        withSubject(
          {
            agentId: args.agentId,
            prospectId: args.prospectId,
          },
          row,
        ),
      ),
    );
  }
}
