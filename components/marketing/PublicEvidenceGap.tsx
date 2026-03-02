"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";

const sources = [
  {
    stat: "7x",
    title: "höhere Lead-Qualifizierung bei Antwort innerhalb von 1 Stunde",
    detail:
      "HBR (2011) zeigt: Wer innerhalb einer Stunde reagiert, qualifiziert Leads deutlich häufiger als bei späterer Reaktion.",
    sourceLabel: "Harvard Business Review (März 2011)",
    sourceUrl: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    stat: "43 %",
    title: "starten den Immobilienprozess online (US-Referenz, 2024)",
    detail:
      "NAR-Highlights 2024: Der Erstkontakt beginnt häufig digital; gleichzeitig arbeiten 86 % mit Maklern zusammen.",
    sourceLabel: "NAR Profile Highlights 2024",
    sourceUrl:
      "https://www.nar.realtor/sites/default/files/2024-11/2024-profile-of-home-buyers-and-sellers-highlights-11-04-2024_2.pdf",
  },
  {
    stat: "28 %",
    title: "der Arbeitswoche entfallen in Wissensarbeit auf E-Mail",
    detail:
      "McKinsey beschreibt E-Mail als großen Zeitblock in wissensintensiver Arbeit. Genau dort setzt Advaic bei Maklern an.",
    sourceLabel: "McKinsey The social economy",
    sourceUrl:
      "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

function scoreResponseHours(hours: number) {
  if (hours <= 1) return 100;
  if (hours <= 4) return 70;
  if (hours <= 12) return 45;
  if (hours <= 24) return 25;
  return 10;
}

function scoreInboxHours(hoursPerDay: number) {
  // 28 % von 8h sind rund 2,24h. Darüber steigt Effizienzdruck deutlich.
  if (hoursPerDay <= 1.5) return 100;
  if (hoursPerDay <= 2.3) return 75;
  if (hoursPerDay <= 3.5) return 50;
  if (hoursPerDay <= 5) return 30;
  return 15;
}

function scoreStandardAutomation(share: number) {
  if (share >= 60) return 100;
  if (share >= 45) return 75;
  if (share >= 30) return 50;
  if (share >= 15) return 30;
  return 10;
}

function scoreFollowUpHours(hours: number) {
  if (hours <= 24) return 100;
  if (hours <= 48) return 70;
  if (hours <= 72) return 45;
  if (hours <= 120) return 25;
  return 10;
}

export default function PublicEvidenceGap() {
  const pathname = usePathname();
  const [responseHours, setResponseHours] = useState(8);
  const [inboxHoursPerDay, setInboxHoursPerDay] = useState(3);
  const [followUpHours, setFollowUpHours] = useState(36);
  const [autoShare, setAutoShare] = useState(25);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_public_benchmark_impression",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      meta: { component: "PublicEvidenceGap" },
    });
  }, [pathname]);

  const diagnostic = useMemo(() => {
    const responseScore = scoreResponseHours(responseHours);
    const inboxScore = scoreInboxHours(inboxHoursPerDay);
    const automationScore = scoreStandardAutomation(autoShare);
    const followUpScore = scoreFollowUpHours(followUpHours);
    const total = Math.round((responseScore + inboxScore + automationScore + followUpScore) / 4);

    const gaps = [
      {
        key: "reaktion",
        label: "Erstreaktion",
        valueLabel: `${responseHours} h`,
        targetLabel: "≤ 1 h",
        score: responseScore,
        issue:
          "Anfragen bleiben zu lange ohne Erstreaktion. Dadurch sinkt die Chance auf qualifizierte Gespräche deutlich.",
        fix: "Advaic sendet bei klaren Standardfällen direkt und stoppt bei Unsicherheit.",
      },
      {
        key: "postfach",
        label: "Postfach-Last",
        valueLabel: `${inboxHoursPerDay.toFixed(1).replace(".", ",")} h/Tag`,
        targetLabel: "≈ 2,2 h/Tag",
        score: inboxScore,
        issue:
          "Zu viel Zeit geht in manuelles Sortieren und wiederkehrende Antworten statt in aktive Vermarktung.",
        fix: "Advaic filtert Nicht-Anfragen, priorisiert echte Leads und reduziert Routinearbeit.",
      },
      {
        key: "followup",
        label: "Follow-up-Verzug",
        valueLabel: `${followUpHours} h`,
        targetLabel: "≤ 24 h (Betriebsziel)",
        score: followUpScore,
        issue: "Nachfassen passiert unregelmäßig. Interessenten springen ab oder antworten deutlich später.",
        fix: "Advaic steuert Follow-ups regelbasiert mit Stop-Logik und klarer Freigabe bei Risiko.",
      },
      {
        key: "auto",
        label: "Auto-Anteil Standardfälle",
        valueLabel: `${autoShare} %`,
        targetLabel: "≥ 45 %",
        score: automationScore,
        issue: "Zu viele Standardfälle bleiben manuell und erzeugen unnötigen Durchsatzdruck im Team.",
        fix: "Advaic erhöht den sicheren Auto-Anteil schrittweise über klare Regeln und Qualitätschecks.",
      },
    ].sort((a, b) => a.score - b.score);

    let level = "hoch";
    let title = "Größte Lücke: Reaktionsgeschwindigkeit und Follow-up-Stabilität";
    let reason =
      "Ihr aktueller Ablauf verliert voraussichtlich Zeit zwischen Eingang, Erstreaktion und Nachfassen. Genau dort setzt Advaic mit Auto/Freigabe-Logik an.";

    if (total >= 75) {
      level = "niedrig";
      title = "Größte Lücke: Skalierung ohne Qualitätsverlust";
      reason =
        "Ihr Prozess ist bereits gut. Der Hebel liegt jetzt vor allem in konsistenter Qualität, Nachvollziehbarkeit und kontrollierten Follow-ups.";
    } else if (total >= 50) {
      level = "mittel";
      title = "Größte Lücke: Zu viel manuelle Standardarbeit";
      reason =
        "Sie haben solides Fundament, aber zu viele Standardfälle laufen noch manuell. Advaic kann diese Fälle sicher aus dem Postfach ziehen.";
    }

    return {
      gaps,
      responseScore,
      inboxScore,
      followUpScore,
      automationScore,
      total,
      level,
      title,
      reason,
    };
  }, [autoShare, followUpHours, inboxHoursPerDay, responseHours]);

  const badgeTone =
    diagnostic.level === "niedrig"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : diagnostic.level === "mittel"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-800";

  return (
    <section id="oeffentliche-benchmarks" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[74ch]">
          <h2 className="h2">Öffentliche Benchmarks statt erfundener Pilotzahlen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Weil wir noch keine veröffentlichten Pilot-Referenzen zeigen, arbeiten wir mit transparenten öffentlichen
            Kennzahlen. So sehen Sie klar, wo im aktuellen Ablauf Zeit, Qualität und Antwortgeschwindigkeit verloren
            gehen.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sources.map((item) => (
            <article key={item.title} className="card-base card-hover p-6">
              <p className="text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">{item.stat}</p>
              <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="helper mt-2">{item.detail}</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-[var(--text)] underline underline-offset-4"
              >
                Quelle: {item.sourceLabel}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <h3 className="h3">Diagnose: Wo verliert Ihr Prozess heute Wirkung?</h3>
            <p className="helper mt-2">
              Tragen Sie realistische Ist-Werte ein. Die Diagnose zeigt die größte operative Lücke und die passende
              Advaic-Lösung.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Ø Erstreaktion in Stunden</span>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={responseHours}
                  onChange={(e) => setResponseHours(clamp(Number(e.target.value || 0), 0, 72))}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Stunden pro Tag im Postfach</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={inboxHoursPerDay}
                  onChange={(e) => setInboxHoursPerDay(clamp(Number(e.target.value || 0), 0, 10))}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Ø Follow-up nach letzter Lead-Nachricht</span>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={followUpHours}
                  onChange={(e) => setFollowUpHours(clamp(Number(e.target.value || 1), 1, 168))}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Anteil Standardfälle, die heute bereits automatisch laufen: {autoShare} %
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={autoShare}
                  onChange={(e) => setAutoShare(clamp(Number(e.target.value || 0), 0, 100))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              {diagnostic.gaps.map((gap) => (
                <article key={gap.key} className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{gap.label}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Ist: {gap.valueLabel} · Ziel: {gap.targetLabel}
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white ring-1 ring-[var(--border)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]"
                      style={{ width: `${gap.score}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="card-base overflow-hidden lg:col-span-5 p-0">
            <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text)]">Ihr Prozess-Fit-Score</p>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeTone}`}>
                  Risiko: {diagnostic.level}
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">
                {diagnostic.total}/100
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { label: "Reaktionsgeschwindigkeit", value: diagnostic.responseScore },
                  { label: "Postfach-Last", value: diagnostic.inboxScore },
                  { label: "Follow-up-Stabilität", value: diagnostic.followUpScore },
                  { label: "Automatisierungsgrad", value: diagnostic.automationScore },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <article className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">{diagnostic.title}</p>
                <p className="helper mt-2">{diagnostic.reason}</p>
              </article>

              <div className="mt-5 space-y-3">
                {diagnostic.gaps.slice(0, 2).map((gap) => (
                  <article key={gap.key} className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Hauptproblem
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">{gap.issue}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Warum Advaic passt
                    </p>
                    <p className="mt-1 helper">{gap.fix}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/produkt#simulator"
                  className="btn-secondary"
                  onClick={() =>
                    trackPublicEvent({
                      event: "marketing_public_benchmark_simulator_click",
                      source: "website",
                      path: pathname || "/",
                      pageGroup: "marketing",
                      meta: { score: diagnostic.total },
                    })
                  }
                >
                  Regel-Simulator
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary"
                  onClick={() =>
                    trackPublicEvent({
                      event: "marketing_public_benchmark_signup_click",
                      source: "website",
                      path: pathname || "/",
                      pageGroup: "marketing",
                      meta: {
                        score: diagnostic.total,
                        response_hours: responseHours,
                        inbox_hours_per_day: inboxHoursPerDay,
                        followup_hours: followUpHours,
                        auto_share: autoShare,
                      },
                    })
                  }
                >
                  14 Tage testen
                </Link>
              </div>

              <p className="helper mt-4">
                Hinweis: Benchmarks sind öffentlich und dienen zur Einordnung. Ihre tatsächlichen Ergebnisse hängen von
                Bestand, Prozessdisziplin, Antwortstil und Objektmix ab.
              </p>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
