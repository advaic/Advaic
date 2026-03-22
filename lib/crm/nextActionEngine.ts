import { assessResearchReadiness } from "@/lib/crm/outboundQuality";

type ProspectLike = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  object_focus: string | null;
  preferred_channel: string | null;
  priority: string | null;
  fit_score: number | null;
  stage: string | null;
  next_action_at?: string | null;
  updated_at?: string | null;
  source_checked_at?: string | null;
  personalization_hook?: string | null;
  personalization_evidence?: string | null;
  active_listings_count?: number | null;
  automation_readiness?: string | null;
};

type EventLike = {
  prospect_id: string | null;
  event_type: string | null;
  event_at: string | null;
  metadata?: Record<string, any> | null;
};

type MessageLike = {
  prospect_id: string | null;
  status: string | null;
  message_kind: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

export type NextActionBreakdown = {
  label: string;
  impact: number;
  detail: string;
};

export type ComputedNextAction = {
  prospect_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  object_focus: string | null;
  preferred_channel: string | null;
  priority: "A" | "B" | "C";
  fit_score: number;
  stage: string;
  recommended_action: string | null;
  recommended_reason: string | null;
  recommended_code: string | null;
  recommended_primary_label: string | null;
  recommended_at: string | null;
  recommended_score: number;
  readiness_score: number;
  score_breakdown: NextActionBreakdown[];
  guardrails: {
    hard_stop: boolean;
    hard_stop_reason: string | null;
    open_reply: boolean;
    recent_bounce: boolean;
    has_ready_draft: boolean;
  };
  research: {
    status: "ready" | "refresh_research" | "needs_research" | "missing_contact";
    score: number;
    summary: string;
    blockers: string[];
    warnings: string[];
  };
};

const CLOSED_STAGES = new Set(["won", "lost"]);
const ACTIVE_STAGES = new Set([
  "new",
  "researching",
  "contacted",
  "replied",
  "pilot_invited",
  "pilot_active",
  "pilot_finished",
  "nurture",
]);

function toNum(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toTs(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function clean(value: unknown, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizePriority(value: unknown): "A" | "B" | "C" {
  const v = clean(value, 2).toUpperCase();
  if (v === "A" || v === "C") return v;
  return "B";
}

function priorityBoost(priority: "A" | "B" | "C") {
  if (priority === "A") return 12;
  if (priority === "B") return 6;
  return 1;
}

export function computeReadinessScore(input: {
  fit_score?: number | null;
  stage?: string | null;
  next_action_at?: string | null;
  updated_at?: string | null;
  source_checked_at?: string | null;
  preferred_channel?: string | null;
  contact_email?: string | null;
}) {
  let score = Number.isFinite(Number(input.fit_score)) ? Number(input.fit_score) : 50;
  const stage = clean(input.stage || "", 40).toLowerCase();
  if (stage === "new" || stage === "researching" || stage === "contacted") score += 8;
  if (stage === "replied" || stage === "nurture") score += 2;
  if (stage.startsWith("pilot") || stage === "won" || stage === "lost") score -= 20;

  const now = Date.now();
  const nextActionTs = toTs(input.next_action_at);
  if (nextActionTs) {
    if (nextActionTs <= now) score += 7;
    else if (nextActionTs <= now + 2 * 24 * 60 * 60 * 1000) score += 3;
  }

  const updatedTs = toTs(input.updated_at);
  if (updatedTs) {
    if (updatedTs >= now - 14 * 24 * 60 * 60 * 1000) score += 4;
    else score -= 4;
  }

  const sourceTs = toTs(input.source_checked_at);
  if (sourceTs) {
    if (sourceTs >= now - 30 * 24 * 60 * 60 * 1000) score += 4;
    else score -= 3;
  }

  const preferredChannel = clean(input.preferred_channel || "", 30).toLowerCase();
  if (preferredChannel === "email") {
    if (clean(input.contact_email || "", 240)) score += 4;
    else score -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function chooseCadenceCode(sentCount: number) {
  if (sentCount <= 0) return "send_first_touch";
  if (sentCount === 1) return "send_follow_up_1";
  if (sentCount === 2) return "send_follow_up_2";
  if (sentCount === 3) return "send_follow_up_3";
  return "send_breakup_touch";
}

function actionForCode(code: string) {
  if (code === "send_first_touch") return "Erste Nachricht personalisiert senden";
  if (code === "send_follow_up_1") return "Follow-up 1 senden";
  if (code === "send_follow_up_2") return "Follow-up 2 senden";
  if (code === "send_follow_up_3") return "Follow-up 3 senden";
  if (code === "send_breakup_touch") return "Abschluss-Nachricht senden";
  if (code === "enrich_research_before_outreach") return "Prospect zuerst recherchieren";
  if (code === "refresh_research_before_outreach") return "Research vor Outreach aktualisieren";
  if (code === "fill_contact_channel") return "Kontaktkanal ergaenzen";
  if (code === "switch_channel_after_bounce")
    return "Kanal wechseln und Nachricht außerhalb E-Mail senden";
  if (code === "handle_reply_now") return "Auf eingegangene Antwort reagieren";
  if (code === "invite_pilot_after_reply") return "Pilot-Einladung senden";
  if (code === "schedule_pilot_call") return "Pilot-Call terminieren";
  if (code === "review_ready_draft") return "Vorliegenden Entwurf prüfen und senden";
  if (code === "stop_no_followup") return "Kein Follow-up senden (Stop-Regel aktiv)";
  return "Nächsten Schritt prüfen";
}

function primaryLabelForCode(code: string | null) {
  if (!code) return null;
  if (code.startsWith("send_")) return "Sequenz ausführen";
  if (code === "enrich_research_before_outreach" || code === "refresh_research_before_outreach")
    return "Research schärfen";
  if (code === "fill_contact_channel") return "Kontakt ergänzen";
  if (code === "handle_reply_now") return "Reply bearbeiten";
  if (code === "invite_pilot_after_reply") return "Pilot einladen";
  if (code === "schedule_pilot_call") return "Call planen";
  if (code === "switch_channel_after_bounce") return "Kanal wechseln";
  if (code === "review_ready_draft") return "Entwurf prüfen";
  return null;
}

export function computeNextActions(args: {
  prospects: ProspectLike[];
  events: EventLike[];
  messages: MessageLike[];
}) {
  const eventsByProspect = new Map<string, EventLike[]>();
  const messagesByProspect = new Map<string, MessageLike[]>();

  for (const event of args.events || []) {
    const prospectId = clean(event?.prospect_id || "", 64);
    if (!prospectId) continue;
    const list = eventsByProspect.get(prospectId) || [];
    list.push(event);
    eventsByProspect.set(prospectId, list);
  }
  for (const message of args.messages || []) {
    const prospectId = clean(message?.prospect_id || "", 64);
    if (!prospectId) continue;
    const list = messagesByProspect.get(prospectId) || [];
    list.push(message);
    messagesByProspect.set(prospectId, list);
  }

  const now = Date.now();
  const out: ComputedNextAction[] = [];

  for (const row of args.prospects || []) {
    const prospectId = clean(row.id, 64);
    if (!prospectId) continue;
    const stage = clean(row.stage || "new", 40).toLowerCase();
    if (!ACTIVE_STAGES.has(stage) && !CLOSED_STAGES.has(stage)) continue;

    const priority = normalizePriority(row.priority);
    const fitScore = Math.max(0, Math.min(100, Math.round(toNum(row.fit_score, 0))));
    const readinessScore = computeReadinessScore({
      fit_score: fitScore,
      stage,
      next_action_at: row.next_action_at || null,
      updated_at: row.updated_at || null,
      source_checked_at: row.source_checked_at || null,
      preferred_channel: row.preferred_channel || null,
      contact_email: row.contact_email || null,
    });
    const research = assessResearchReadiness({
      preferredChannel: row.preferred_channel || null,
      contactEmail: row.contact_email || null,
      personalizationHook: row.personalization_hook || null,
      personalizationEvidence: row.personalization_evidence || null,
      sourceCheckedAt: row.source_checked_at || null,
      activeListingsCount:
        Number.isFinite(Number(row.active_listings_count)) ? Number(row.active_listings_count) : null,
      automationReadiness: row.automation_readiness || null,
    });

    const prospectEvents = (eventsByProspect.get(prospectId) || []).sort((a, b) => {
      return (toTs(b.event_at) || 0) - (toTs(a.event_at) || 0);
    });
    const prospectMessages = messagesByProspect.get(prospectId) || [];

    let hardStop = false;
    let hardStopReason: string | null = null;
    let lastReplyAt: number | null = null;
    let lastHandledAt: number | null = null;
    let lastBounceAt: number | null = null;
    let sentCount = 0;

    for (const event of prospectEvents) {
      const type = clean(event.event_type || "", 64).toLowerCase();
      const ts = toTs(event.event_at);
      const meta =
        event?.metadata && typeof event.metadata === "object"
          ? (event.metadata as Record<string, any>)
          : {};
      if (!ts) continue;

      if (type === "unsubscribed" || type === "no_interest") {
        hardStop = true;
        hardStopReason = type === "unsubscribed" ? "opt_out" : "kein_interesse";
      }
      if (type === "reply_received" && (!lastReplyAt || ts > lastReplyAt)) lastReplyAt = ts;
      if (
        ["call_booked", "pilot_invited", "pilot_started", "pilot_completed", "deal_won", "deal_lost"].includes(type) &&
        (!lastHandledAt || ts > lastHandledAt)
      ) {
        lastHandledAt = ts;
      }
      if (type === "message_sent") sentCount += 1;
      if (type === "message_failed" && Boolean(meta.bounce_detected)) {
        if (!lastBounceAt || ts > lastBounceAt) lastBounceAt = ts;
      }
    }

    if (sentCount === 0) {
      sentCount = prospectMessages.filter((msg) => Boolean(toTs(msg.sent_at))).length;
    }

    const hasReadyDraft = prospectMessages.some((msg) => {
      const status = clean(msg.status || "", 20).toLowerCase();
      return status === "ready" || status === "draft";
    });

    const openReply = Boolean(lastReplyAt && (!lastHandledAt || lastReplyAt > lastHandledAt));
    const recentBounce = Boolean(lastBounceAt && now - lastBounceAt <= 14 * 24 * 60 * 60 * 1000);
    const overdue = Boolean((toTs(row.next_action_at) || 0) > 0 && (toTs(row.next_action_at) || 0) <= now);
    const noEmailForEmailChannel =
      clean(row.preferred_channel || "", 30).toLowerCase() === "email" &&
      !clean(row.contact_email || "", 240);
    const hasHook = Boolean(clean(row.personalization_hook || "", 280));
    const updatedTs = toTs(row.updated_at);
    const isStale = Boolean(updatedTs && now - updatedTs > 10 * 24 * 60 * 60 * 1000);

    const breakdown: NextActionBreakdown[] = [];
    const addFactor = (label: string, impact: number, detail: string) => {
      if (!impact) return;
      breakdown.push({ label, impact, detail });
    };

    let score = Math.round(readinessScore * 0.55);
    addFactor("Readiness", Math.round(readinessScore * 0.55), `Readiness ${readinessScore}/100`);

    const pBoost = priorityBoost(priority);
    score += pBoost;
    addFactor("Priorität", pBoost, `Priorität ${priority}`);

    if (overdue) {
      score += 14;
      addFactor("Überfällig", 14, "Nächste Aktion ist fällig");
    }
    if (isStale) {
      score += 6;
      addFactor("Stale", 6, "Prospect wurde länger nicht aktualisiert");
    }
    if (noEmailForEmailChannel) {
      score -= 16;
      addFactor("Kontaktlücke", -16, "E-Mail präferiert, aber keine Kontakt-E-Mail vorhanden");
    }
    if (!hasHook) {
      score -= 8;
      addFactor("Personalisierung", -8, "Personalisierungs-Hook fehlt");
    }
    if (research.status === "ready") {
      score += 10;
      addFactor("Research", 10, `Research bereit (${research.score}/100)`);
    } else if (research.status === "refresh_research") {
      score -= 8;
      addFactor("Research", -8, "Research sollte vor neuem Outreach aktualisiert werden");
    } else if (research.status === "needs_research") {
      score -= 18;
      addFactor("Research", -18, "Research ist zu duenn fuer hochwertigen Outreach");
    } else if (research.status === "missing_contact") {
      score -= 24;
      addFactor("Kontakt", -24, "Bevorzugter Kontaktkanal ist nicht sendbar");
    }

    let code: string | null = null;

    if (hardStop || stage === "won" || stage === "lost") {
      code = "stop_no_followup";
      score = 0;
      addFactor("Stop-Regel", -100, hardStopReason || `Stage ${stage} geschlossen`);
    } else if (openReply) {
      code = "handle_reply_now";
      score += 38;
      addFactor("Reply offen", 38, "Es liegt eine unbeantwortete Reply vor");
    } else if (recentBounce) {
      code = "switch_channel_after_bounce";
      score += 30;
      addFactor("Bounce", 30, "Zustellproblem in den letzten 14 Tagen");
    } else if (stage === "replied" || stage === "pilot_invited") {
      code = "invite_pilot_after_reply";
      score += 24;
      addFactor("Reply-Stufe", 24, "Reply ist da, nächster Schritt ist Pilot-Invitation");
    } else if (stage === "pilot_active") {
      code = "schedule_pilot_call";
      score += 20;
      addFactor("Pilot aktiv", 20, "Pilot aktiv: Termin-/Close-Schritt priorisieren");
    } else if (research.status === "missing_contact") {
      code = "fill_contact_channel";
      score += 12;
      addFactor("Kontakt zuerst", 12, "Bevorzugter Kanal muss ergänzt werden");
    } else if (research.status === "needs_research") {
      code = "enrich_research_before_outreach";
      score += 16;
      addFactor("Research zuerst", 16, "Vor Outreach fehlen belastbare Signale");
    } else if (research.status === "refresh_research" && sentCount === 0) {
      code = "refresh_research_before_outreach";
      score += 10;
      addFactor("Research auffrischen", 10, "Quelle/Signale vor erstem Touch aktualisieren");
    } else if (hasReadyDraft) {
      code = "review_ready_draft";
      score += 16;
      addFactor("Draft bereit", 16, "Es liegt bereits ein sendbarer Entwurf vor");
    } else {
      code = chooseCadenceCode(sentCount);
      const cadenceBoost = code === "send_first_touch" ? 26 : code === "send_follow_up_1" ? 20 : 14;
      score += cadenceBoost;
      addFactor("Cadence", cadenceBoost, `Nächster Touch nach ${sentCount} gesendeten Nachrichten`);
    }

    const topFactors = [...breakdown]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 4);
    const reason =
      topFactors.length > 0
        ? topFactors
            .map((item) => `${item.impact >= 0 ? "+" : ""}${item.impact} ${item.label}: ${item.detail}`)
            .join(" · ")
        : "Keine zusätzlichen Faktoren.";

    out.push({
      prospect_id: prospectId,
      company_name: clean(row.company_name || "Unbekannt", 180),
      contact_name: clean(row.contact_name || "", 160) || null,
      contact_email: clean(row.contact_email || "", 240) || null,
      object_focus: clean(row.object_focus || "", 40) || null,
      preferred_channel: clean(row.preferred_channel || "", 40) || null,
      priority,
      fit_score: fitScore,
      stage: stage || "new",
      recommended_action: actionForCode(code || ""),
      recommended_reason: reason,
      recommended_code: code,
      recommended_primary_label: primaryLabelForCode(code),
      recommended_at: new Date().toISOString(),
      recommended_score: Math.max(0, Math.min(100, Math.round(score))),
      readiness_score: readinessScore,
      score_breakdown: [...breakdown].sort((a, b) => b.impact - a.impact),
      guardrails: {
        hard_stop: hardStop || stage === "won" || stage === "lost",
        hard_stop_reason: hardStopReason,
        open_reply: openReply,
        recent_bounce: recentBounce,
        has_ready_draft: hasReadyDraft,
      },
      research: {
        status: research.status,
        score: research.score,
        summary: research.summary,
        blockers: research.blockers,
        warnings: research.warnings,
      },
    });
  }

  return out.sort((a, b) => b.recommended_score - a.recommended_score);
}
