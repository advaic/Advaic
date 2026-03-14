"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

type VolumeBand = "niedrig" | "mittel" | "hoch";
type SpecialCases = "niedrig" | "mittel" | "hoch";
type RiskMode = "konservativ" | "ausgewogen" | "progressiv";
type FollowUpMode = "aus" | "vorsichtig" | "aktiv";
type TeamSetup = "solo" | "team";

type SafeStartConfiguratorProps = {
  id?: string;
};

function presetFromChoice<T extends string>(value: T, map: Record<T, number>) {
  return map[value];
}

export default function SafeStartConfigurator({ id = "safe-start-konfiguration" }: SafeStartConfiguratorProps) {
  const pathname = usePathname() || "/";
  const [volume, setVolume] = useState<VolumeBand>("mittel");
  const [specialCases, setSpecialCases] = useState<SpecialCases>("mittel");
  const [riskMode, setRiskMode] = useState<RiskMode>("konservativ");
  const [followUpMode, setFollowUpMode] = useState<FollowUpMode>("vorsichtig");
  const [teamSetup, setTeamSetup] = useState<TeamSetup>("solo");

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_safe_start_impression",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { component: "SafeStartConfigurator" },
    });
  }, [pathname]);

  const recommendation = useMemo(() => {
    const weeklyRequests = presetFromChoice(volume, { niedrig: 24, mittel: 58, hoch: 110 });
    const specialRate = presetFromChoice(specialCases, { niedrig: 15, mittel: 28, hoch: 45 });
    const riskFactor = presetFromChoice(riskMode, { konservativ: 0.24, ausgewogen: 0.38, progressiv: 0.52 });

    const standardRate = Math.max(20, 100 - specialRate);
    const autoShare = Math.round(Math.min(48, Math.max(8, standardRate * riskFactor)));

    const ignoreShareBase = Math.round(Math.min(24, Math.max(8, 10 + (100 - standardRate) * 0.08)));
    const approvalShare = Math.max(30, 100 - autoShare - ignoreShareBase);
    const ignoreShare = 100 - autoShare - approvalShare;

    const followUpFirstHours = followUpMode === "aus" ? null : followUpMode === "vorsichtig" ? 48 : 24;
    const followUpSecondHours = followUpMode === "aus" ? null : followUpMode === "vorsichtig" ? 96 : 48;

    const dailyAutoCap =
      teamSetup === "solo"
        ? volume === "hoch"
          ? 18
          : volume === "mittel"
            ? 12
            : 7
        : volume === "hoch"
          ? 30
          : volume === "mittel"
            ? 18
            : 10;

    const modeLabel =
      autoShare <= 15 ? "Assist-Start (sehr kontrolliert)" : autoShare <= 30 ? "Balancierter Start" : "Aktiver Start";

    const fitScore = Math.max(
      25,
      Math.min(
        95,
        Math.round(
          45 +
            (volume === "hoch" ? 16 : volume === "mittel" ? 10 : 4) +
            (specialCases === "niedrig" ? 18 : specialCases === "mittel" ? 10 : 2) +
            (teamSetup === "team" ? 8 : 4) +
            (followUpMode === "aus" ? 2 : followUpMode === "vorsichtig" ? 8 : 12),
        ),
      ),
    );

    const fitLevel =
      fitScore >= 75
        ? "Sehr guter Fit"
        : fitScore >= 58
          ? "Guter Fit mit konservativem Start"
          : "Selektiver Fit (Assist-Start empfohlen)";

    const fitReason =
      fitScore >= 75
        ? "Ihr Profil hat genügend Volumen und genügend wiederkehrende Erstantworten, damit kontrollierte Automatisierung schnell Wirkung zeigt."
        : fitScore >= 58
          ? "Advaic passt, wenn Sie mit enger Freigabelogik starten und den Auto-Anteil schrittweise erhöhen."
          : "Automatisierung sollte zunächst nur Anfragen mit sauberem Objektbezug, vollständigen Kerndaten und unkritischem Inhalt abdecken. Freigabe bleibt der Hauptpfad.";

    const nextActions =
      fitScore >= 75
        ? [
            "Woche 1: Erstantworten mit klarem Objektbezug, vollständigen Kerndaten und freigegebenem Versandkorridor auf Auto aktivieren.",
            "Woche 2: Freigabegründe clustern und Regeln präzisieren.",
            "Ab Woche 3: Follow-up Stufe 1 auf 48h prüfen.",
          ]
        : fitScore >= 58
          ? [
              "Woche 1: Hoher Freigabeanteil, nur eng definierte Auto-Fälle.",
              "Woche 2: Ton- und Vollständigkeitsregeln nachschärfen.",
              "Ab Woche 3: Auto-Anteil nur bei stabiler QA erhöhen.",
            ]
          : [
              "Start: Autopilot auf minimalen Kernkorridor begrenzen.",
              "Fokus: Freigabe-Inbox und Qualitätschecks stabilisieren.",
              "Erweiterung erst nach zwei stabilen Wochen ohne kritische Korrekturen.",
            ];

    return {
      weeklyRequests,
      specialRate,
      standardRate,
      autoShare,
      approvalShare,
      ignoreShare,
      dailyAutoCap,
      followUpFirstHours,
      followUpSecondHours,
      modeLabel,
      fitScore,
      fitLevel,
      fitReason,
      nextActions,
    };
  }, [followUpMode, riskMode, specialCases, teamSetup, volume]);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_safe_start_fit_updated",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "safe-start-configurator",
        fit_score: recommendation.fitScore,
        fit_level: recommendation.fitLevel,
        auto_share: recommendation.autoShare,
        approval_share: recommendation.approvalShare,
      },
    });
  }, [pathname, recommendation.approvalShare, recommendation.autoShare, recommendation.fitLevel, recommendation.fitScore]);

  const signupHref = `/signup?preset=safe-start&auto=${recommendation.autoShare}&approval=${recommendation.approvalShare}&followup=${followUpMode}`;

  const onPrimaryClick = () =>
    trackPublicEvent({
      event: "marketing_safe_start_signup_click",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "safe-start-configurator",
        volume,
        special_cases: specialCases,
        risk_mode: riskMode,
        followup_mode: followUpMode,
        team_setup: teamSetup,
        auto_share: recommendation.autoShare,
      },
    });

  return (
    <section id={id} className="marketing-soft-cool py-20 md:py-28">
      <Container>
        <div className="max-w-[76ch]">
          <h2 className="h2">Interaktive Safe-Start-Konfiguration</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Beantworten Sie fünf kurze Punkte und erhalten Sie eine konkrete Startempfehlung für Auto, Freigabe,
            Ignorieren und Follow-ups. Ziel ist ein kontrollierter Start ohne Qualitätsrisiko.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <h3 className="h3">Mini-Wizard</h3>
            <p className="helper mt-2">Wählen Sie die Optionen, die Ihren aktuellen Betrieb am besten treffen.</p>

            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold text-[var(--text)]">Anfragevolumen pro Woche</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "niedrig", label: "Bis 30" },
                    { value: "mittel", label: "30 bis 80" },
                    { value: "hoch", label: "Über 80" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVolume(option.value as VolumeBand)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        volume === option.value
                          ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                          : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-[var(--text)]">Anteil Fälle mit Freigabebedarf</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "niedrig", label: "Niedrig" },
                    { value: "mittel", label: "Mittel" },
                    { value: "hoch", label: "Hoch" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSpecialCases(option.value as SpecialCases)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        specialCases === option.value
                          ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                          : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-[var(--text)]">Risikoprofil beim Start</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "konservativ", label: "Konservativ" },
                    { value: "ausgewogen", label: "Ausgewogen" },
                    { value: "progressiv", label: "Progressiv" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRiskMode(option.value as RiskMode)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        riskMode === option.value
                          ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                          : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-[var(--text)]">Follow-ups</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "aus", label: "Aus" },
                    { value: "vorsichtig", label: "Vorsichtig" },
                    { value: "aktiv", label: "Aktiv" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFollowUpMode(option.value as FollowUpMode)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        followUpMode === option.value
                          ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                          : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-[var(--text)]">Teamgröße</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "solo", label: "Solo-Makler" },
                    { value: "team", label: "Kleines Team" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTeamSetup(option.value as TeamSetup)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                        teamSetup === option.value
                          ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                          : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </article>

          <article className="card-base overflow-hidden p-0 lg:col-span-5">
            <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
            <div className="p-6 md:p-7">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Empfohlene Startkonfiguration</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">
                {recommendation.modeLabel}
              </h3>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-[var(--muted)]">
                  Erwartetes Wochenvolumen:{" "}
                  <span className="font-semibold text-[var(--text)]">ca. {recommendation.weeklyRequests} Anfragen</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Auto senden (klar):{" "}
                  <span className="font-semibold text-[var(--text)]">{recommendation.autoShare} %</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Zur Freigabe:{" "}
                  <span className="font-semibold text-[var(--text)]">{recommendation.approvalShare} %</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Ignorieren: <span className="font-semibold text-[var(--text)]">{recommendation.ignoreShare} %</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Max. Auto-Versand pro Tag:{" "}
                  <span className="font-semibold text-[var(--text)]">{recommendation.dailyAutoCap}</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Follow-up Stufe 1:{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {recommendation.followUpFirstHours ? `${recommendation.followUpFirstHours} h` : "deaktiviert"}
                  </span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Follow-up Stufe 2:{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {recommendation.followUpSecondHours ? `${recommendation.followUpSecondHours} h` : "deaktiviert"}
                  </span>
                </p>
              </div>

              <article className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Warum diese Empfehlung?</p>
                <p className="helper mt-2">
                  Ziel ist ein kontrollierter Start: Erstantworten mit sauberem Objektbezug automatisieren, Fälle mit
                  fehlenden Angaben oder Risikosignalen bewusst in Ihrer Freigabe halten und Follow-ups nur in
                  sinnvollen Stufen aktivieren.
                </p>
              </article>

              <article className="mt-4 rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Fit-Diagnose (5 Fragen)</p>
                <p className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {recommendation.fitLevel} · {recommendation.fitScore}/100
                </p>
                <p className="helper mt-2">{recommendation.fitReason}</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {recommendation.nextActions.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href={signupHref} className="btn-primary" onClick={() => void onPrimaryClick()}>
                  {MARKETING_PRIMARY_CTA_LABEL}
                </Link>
                <Link href="/manuell-vs-advaic#vergleich" className="btn-secondary">
                  Mit manuell vergleichen
                </Link>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
