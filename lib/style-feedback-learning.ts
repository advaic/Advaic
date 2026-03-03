export type FeedbackRating = "helpful" | "not_helpful";

export type FeedbackReasonCode =
  | "helpful"
  | "zu_lang"
  | "falscher_fokus"
  | "fehlende_infos"
  | "ton_unpassend"
  | "sonstiges";

export type FeedbackRootCause = {
  code: FeedbackReasonCode;
  label: string;
  count: number;
  share: number;
  recommendation: string;
  quick_action: "style_feedback_loop" | "review_context_rules" | "review_length_rules";
};

type FeedbackRow = {
  rating?: string | null;
  reason?: string | null;
};

type StyleRow = {
  agent_id: string;
  length_pref: string | null;
  do_rules: string | null;
  dont_rules: string | null;
};

type ApplyArgs = {
  supa: any;
  agentId: string;
  source?: string;
  triggerMessageId?: string | null;
  force?: boolean;
  windowDays?: number;
};

type LearningSuggestion = {
  code: FeedbackReasonCode;
  recommendation: string;
  length_pref?: "kurz" | "mittel" | "detailliert";
  add_do_rules?: string[];
  add_dont_rules?: string[];
};

function normalize(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsLine(haystack: string | null | undefined, line: string) {
  const h = normalize(String(haystack || ""));
  const l = normalize(line);
  return !!l && h.includes(l);
}

function appendUniqueBullets(base: string | null | undefined, lines: string[]) {
  const original = String(base || "").trim();
  const cleanLines = lines.map((line) => String(line || "").trim()).filter(Boolean);
  if (cleanLines.length === 0) return original || null;

  const add = cleanLines.filter((line) => !containsLine(original, line));
  if (add.length === 0) return original || null;

  const bulletBlock = add.map((line) => `- ${line}`).join("\n");
  if (!original) return bulletBlock;
  return `${original}\n${bulletBlock}`;
}

function share(count: number, total: number) {
  if (!total) return 0;
  return count / total;
}

export function normalizeFeedbackReason(
  rawReason: unknown,
  rating: FeedbackRating,
): FeedbackReasonCode {
  const input = normalize(String(rawReason || ""));
  if (rating === "helpful") return "helpful";

  if (!input) return "sonstiges";
  if (
    input === "zu_lang" ||
    input === "too_long" ||
    input.includes("zu lang") ||
    input.includes("zu-lang")
  ) {
    return "zu_lang";
  }
  if (
    input === "falscher_fokus" ||
    input === "wrong_focus" ||
    input.includes("falscher fokus") ||
    input.includes("fokus falsch")
  ) {
    return "falscher_fokus";
  }
  if (
    input === "fehlende_infos" ||
    input === "missing_info" ||
    input.includes("fehlende info") ||
    input.includes("unklar")
  ) {
    return "fehlende_infos";
  }
  if (
    input === "ton_unpassend" ||
    input.includes("ton") ||
    input.includes("unpassend")
  ) {
    return "ton_unpassend";
  }
  return "sonstiges";
}

export function reasonLabel(code: FeedbackReasonCode) {
  if (code === "helpful") return "Hilfreich";
  if (code === "zu_lang") return "Zu lang";
  if (code === "falscher_fokus") return "Falscher Fokus";
  if (code === "fehlende_infos") return "Fehlende Infos";
  if (code === "ton_unpassend") return "Ton unpassend";
  return "Sonstiges";
}

function reasonRecommendation(code: FeedbackReasonCode) {
  if (code === "zu_lang") {
    return "Antwortlänge reduzieren, klare Struktur erzwingen, kurze nächste Schritte.";
  }
  if (code === "falscher_fokus") {
    return "Frage der anfragenden Person zuerst spiegeln, dann nur direkt relevante Inhalte senden.";
  }
  if (code === "fehlende_infos") {
    return "Rückfrage-Regel stärken und keine Annahmen ohne Objektbezug.";
  }
  if (code === "ton_unpassend") {
    return "Tonalität mit Do-/Don't-Regeln und Stilankern nachschärfen.";
  }
  return "Negative Fälle prüfen und Regelwerk gezielt nachschärfen.";
}

export function summarizeFeedbackRootCauses(rows: FeedbackRow[]): {
  total_negative: number;
  by_reason: FeedbackRootCause[];
} {
  const counts: Record<FeedbackReasonCode, number> = {
    helpful: 0,
    zu_lang: 0,
    falscher_fokus: 0,
    fehlende_infos: 0,
    ton_unpassend: 0,
    sonstiges: 0,
  };

  for (const row of rows || []) {
    const rating = normalize(String(row?.rating || "")) === "helpful" ? "helpful" : "not_helpful";
    const code = normalizeFeedbackReason(row?.reason, rating);
    counts[code] += 1;
  }

  const negativeTotal =
    counts.zu_lang + counts.falscher_fokus + counts.fehlende_infos + counts.ton_unpassend + counts.sonstiges;

  const byReason: FeedbackRootCause[] = (
    [
      "zu_lang",
      "falscher_fokus",
      "fehlende_infos",
      "ton_unpassend",
      "sonstiges",
    ] as FeedbackReasonCode[]
  )
    .map((code) => {
      const quickAction: FeedbackRootCause["quick_action"] =
        code === "zu_lang"
          ? "review_length_rules"
          : code === "falscher_fokus" || code === "fehlende_infos"
            ? "review_context_rules"
            : "style_feedback_loop";
      return {
        code,
        label: reasonLabel(code),
        count: counts[code],
        share: share(counts[code], negativeTotal),
        recommendation: reasonRecommendation(code),
        quick_action: quickAction,
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    total_negative: negativeTotal,
    by_reason: byReason,
  };
}

function buildSuggestionsFromSummary(summary: ReturnType<typeof summarizeFeedbackRootCauses>) {
  const negativeTotal = summary.total_negative;
  const reasonMap = new Map(summary.by_reason.map((row) => [row.code, row]));
  const suggestions: LearningSuggestion[] = [];

  const tooLong = reasonMap.get("zu_lang");
  if (tooLong && tooLong.count >= 2 && tooLong.share >= 0.28) {
    suggestions.push({
      code: "zu_lang",
      recommendation: "Antworten standardmäßig kürzen und klar strukturieren.",
      length_pref: "kurz",
      add_do_rules: [
        "Antworten in maximal drei kurzen Absätzen formulieren.",
        "Am Ende immer einen konkreten nächsten Schritt nennen.",
      ],
      add_dont_rules: [
        "Keine langen Fließtexte ohne klare Struktur.",
      ],
    });
  }

  const wrongFocus = reasonMap.get("falscher_fokus");
  if (wrongFocus && wrongFocus.count >= 2 && wrongFocus.share >= 0.24) {
    suggestions.push({
      code: "falscher_fokus",
      recommendation: "Fragefokus vor Antwortinhalt priorisieren.",
      add_do_rules: [
        "Zu Beginn die konkrete Frage des Interessenten in einem Satz spiegeln.",
        "Nur Informationen senden, die direkt zur Frage passen.",
      ],
      add_dont_rules: [
        "Keine allgemeinen Erklärungen ohne direkten Bezug zur Anfrage.",
      ],
    });
  }

  const missingInfo = reasonMap.get("fehlende_infos");
  if (missingInfo && missingInfo.count >= 2 && missingInfo.share >= 0.2) {
    suggestions.push({
      code: "fehlende_infos",
      recommendation: "Rückfragen bei fehlendem Kontext verpflichtend machen.",
      add_do_rules: [
        "Bei unklarem Objektbezug zuerst eine kurze Rückfrage stellen.",
      ],
      add_dont_rules: [
        "Keine Annahmen zu Verfügbarkeit oder Unterlagen ohne eindeutige Daten.",
      ],
    });
  }

  const tone = reasonMap.get("ton_unpassend");
  if (tone && tone.count >= 2 && tone.share >= 0.2) {
    suggestions.push({
      code: "ton_unpassend",
      recommendation: "Tonalität stärker auf professionell-freundliche Standards ausrichten.",
      add_do_rules: [
        "Kurz, freundlich und professionell formulieren.",
      ],
      add_dont_rules: [
        "Keine saloppen oder unklaren Formulierungen verwenden.",
      ],
    });
  }

  if (negativeTotal >= 3 && suggestions.length === 0) {
    suggestions.push({
      code: "sonstiges",
      recommendation: "Konservative Qualitätsbasis ergänzen.",
      add_do_rules: [
        "Bei Unsicherheit zuerst Rückfrage, dann konkrete nächste Schritte.",
      ],
      add_dont_rules: [
        "Keine Aussagen ohne belastbaren Kontext.",
      ],
    });
  }

  return suggestions;
}

export async function applyStyleFeedbackLearning(args: ApplyArgs) {
  const supa = args.supa;
  const agentId = String(args.agentId || "").trim();
  if (!agentId) {
    return { ok: false as const, error: "missing_agent_id" };
  }

  const nowIso = new Date().toISOString();
  const windowDays = Math.max(7, Math.min(90, Number(args.windowDays || 30)));
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: settings } = await (supa.from("agent_settings") as any)
    .select("agent_id, style_feedback_autotune_enabled, style_feedback_last_run_at")
    .eq("agent_id", agentId)
    .maybeSingle();

  const autotuneEnabled = settings?.style_feedback_autotune_enabled !== false;
  const lastRunAt = settings?.style_feedback_last_run_at
    ? new Date(String(settings.style_feedback_last_run_at)).getTime()
    : 0;
  const minsSinceRun = Number.isFinite(lastRunAt) && lastRunAt > 0
    ? Math.floor((Date.now() - lastRunAt) / 60000)
    : null;

  if (!autotuneEnabled) {
    return {
      ok: true as const,
      applied: false,
      changed: false,
      skipped: "autotune_disabled",
      window_days: windowDays,
    };
  }

  if (!args.force && minsSinceRun !== null && minsSinceRun < 20) {
    return {
      ok: true as const,
      applied: false,
      changed: false,
      skipped: "cooldown_active",
      cooldown_minutes: minsSinceRun,
      window_days: windowDays,
    };
  }

  const { data: feedbackRows, error: feedbackErr } = await (supa.from("message_feedback") as any)
    .select("rating, reason, updated_at")
    .eq("agent_id", agentId)
    .gte("updated_at", sinceIso)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (feedbackErr) {
    return { ok: false as const, error: `feedback_fetch_failed:${feedbackErr.message}` };
  }

  const summary = summarizeFeedbackRootCauses(Array.isArray(feedbackRows) ? feedbackRows : []);
  const suggestions = buildSuggestionsFromSummary(summary);
  const hasSignal = summary.total_negative >= 3 && suggestions.length > 0;

  const settingsSummaryBase = {
    source: String(args.source || "feedback_post"),
    window_days: windowDays,
    negative_total: summary.total_negative,
    top_reason: summary.by_reason[0]?.code || null,
    generated_at: nowIso,
  };

  if (!hasSignal) {
    await (supa.from("agent_settings") as any).upsert(
      {
        agent_id: agentId,
        style_feedback_last_run_at: nowIso,
        style_feedback_last_summary: {
          ...settingsSummaryBase,
          applied: false,
          changed: false,
          reason: "insufficient_signal",
        },
      },
      { onConflict: "agent_id" },
    );

    return {
      ok: true as const,
      applied: false,
      changed: false,
      window_days: windowDays,
      summary,
      skipped: "insufficient_signal",
    };
  }

  const { data: currentStyle } = await (supa.from("agent_style") as any)
    .select("agent_id, length_pref, do_rules, dont_rules")
    .eq("agent_id", agentId)
    .maybeSingle();
  const style = (currentStyle || null) as StyleRow | null;

  let nextLength = String(style?.length_pref || "").trim().toLowerCase();
  let nextDo = String(style?.do_rules || "");
  let nextDont = String(style?.dont_rules || "");

  const appliedReasonCodes: FeedbackReasonCode[] = [];
  const appliedRecommendations: string[] = [];

  for (const suggestion of suggestions) {
    if (suggestion.length_pref) {
      if (nextLength !== suggestion.length_pref) {
        nextLength = suggestion.length_pref;
      }
    }
    const prevDo = nextDo;
    const prevDont = nextDont;
    nextDo = appendUniqueBullets(nextDo, suggestion.add_do_rules || []) || "";
    nextDont = appendUniqueBullets(nextDont, suggestion.add_dont_rules || []) || "";

    const changed =
      prevDo !== nextDo ||
      prevDont !== nextDont ||
      (suggestion.length_pref ? nextLength === suggestion.length_pref : false);

    if (changed) {
      appliedReasonCodes.push(suggestion.code);
      appliedRecommendations.push(suggestion.recommendation);
    }
  }

  const changed =
    nextLength !== String(style?.length_pref || "").trim().toLowerCase() ||
    nextDo !== String(style?.do_rules || "") ||
    nextDont !== String(style?.dont_rules || "");

  if (changed) {
    const patch: Record<string, any> = {
      agent_id: agentId,
      do_rules: nextDo || null,
      dont_rules: nextDont || null,
    };
    if (nextLength === "kurz" || nextLength === "mittel" || nextLength === "detailliert") {
      patch.length_pref = nextLength;
    }

    const { error: styleErr } = await (supa.from("agent_style") as any).upsert(patch, {
      onConflict: "agent_id",
    });
    if (styleErr) {
      return { ok: false as const, error: `style_upsert_failed:${styleErr.message}` };
    }
  }

  const learningPayload = {
    ...settingsSummaryBase,
    applied: true,
    changed,
    reason_codes: appliedReasonCodes,
    recommendations: appliedRecommendations,
    trigger_message_id: args.triggerMessageId || null,
    feedback_summary: summary,
  };

  await (supa.from("agent_settings") as any).upsert(
    {
      agent_id: agentId,
      style_feedback_last_run_at: nowIso,
      style_feedback_last_summary: learningPayload,
    },
    { onConflict: "agent_id" },
  );

  await (supa.from("notification_events") as any).insert({
    agent_id: agentId,
    type: "style_feedback_autotune",
    entity_type: "agent",
    entity_id: agentId,
    payload: learningPayload,
  });

  return {
    ok: true as const,
    applied: true,
    changed,
    window_days: windowDays,
    summary,
    reason_codes: appliedReasonCodes,
    recommendations: appliedRecommendations,
  };
}
