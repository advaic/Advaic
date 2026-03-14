"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";

type Focus = "sicherheit" | "tempo" | "kontrolle" | "dsgvo";

const focusPaths: Record<
  Focus,
  {
    label: string;
    prompt: string;
    summary: string;
    firstSteps: string[];
    links: { label: string; href: string }[];
  }
> = {
  sicherheit: {
    label: "Sicherheit",
    prompt: "Sie möchten vor allem falsche Antworten vermeiden.",
    summary:
      "Dann ist entscheidend, dass Nachrichten mit fehlenden Angaben, Konfliktpotenzial oder Risikosignalen nicht automatisch gesendet werden und vor Auto-Versand Qualitätschecks greifen.",
    firstSteps: [
      "Autopilot-Regeln prüfen und den Auto-Korridor über Objektbezug, Empfänger und Versandfreigabe klar begrenzen.",
      "Mit konservativer Freigabequote starten.",
      "Qualitätschecks und Verlauf im Dashboard regelmäßig prüfen.",
    ],
    links: [
      { label: "Autopilot-Regeln", href: "/autopilot-regeln" },
      { label: "Qualitätschecks", href: "/qualitaetschecks" },
      { label: "Sicherheitsseite", href: "/sicherheit" },
    ],
  },
  tempo: {
    label: "Tempo",
    prompt: "Sie möchten deutlich schneller reagieren.",
    summary:
      "Dann sollten wiederkehrende Erstantworten mit sauberem Objektbezug automatisiert laufen und Follow-ups nach festen Wartezeiten greifen, damit Erstreaktion und Nachfassen zuverlässig werden.",
    firstSteps: [
      "Erstantworten mit klarem Objektbezug, vollständigen Kerndaten und freigegebenem Versandkorridor definieren.",
      "Follow-up Stufe 1 mit 24-48 Stunden starten und Stop-Gründe festlegen.",
      "Antwortzeiten, Freigabequote und häufige Rückfragen wöchentlich nachschärfen.",
    ],
    links: [
      { label: "So funktioniert's", href: "/so-funktionierts" },
      { label: "Follow-up-Logik", href: "/follow-up-logik" },
      { label: "Manuell vs. Advaic", href: "/manuell-vs-advaic" },
    ],
  },
  kontrolle: {
    label: "Kontrolle",
    prompt: "Sie möchten Automatisierung, aber ohne Kontrollverlust.",
    summary:
      "Dann ist ein Safe-Start sinnvoll: mehr Freigaben am Anfang, klare Stopp-Regeln und stufenweise Erhöhung des Auto-Anteils.",
    firstSteps: [
      "Safe-Start-Konfiguration nutzen und konservativen Modus wählen.",
      "Freigabe-Inbox täglich prüfen und Muster dokumentieren.",
      "Autopilot nur für eng definierte Nachrichtengruppen schrittweise ausweiten.",
    ],
    links: [
      { label: "Freigabe-Inbox", href: "/freigabe-inbox" },
      { label: "Produktseite", href: "/produkt#setup" },
      { label: "Anwendungsfälle", href: "/use-cases" },
    ],
  },
  dsgvo: {
    label: "DSGVO",
    prompt: "Sie möchten Datenschutz und Dokumentation klar prüfen.",
    summary:
      "Dann sollten Sie Verarbeitung, Zugriffskreise und Exportmöglichkeiten strukturiert durchgehen und den Betrieb dokumentiert starten.",
    firstSteps: [
      "DSGVO-Seite und Datenschutzhinweise vollständig prüfen.",
      "Verarbeitungsübersicht im Onboarding anfordern und ablegen.",
      "Interne Verantwortlichkeiten für Freigabe und Audit definieren.",
    ],
    links: [
      { label: "DSGVO & Autopilot", href: "/dsgvo-email-autopilot" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "Sicherheit", href: "/sicherheit" },
    ],
  },
};

export default function FAQDecisionTree() {
  const pathname = usePathname() || "/";
  const [focus, setFocus] = useState<Focus>("sicherheit");
  const selected = useMemo(() => focusPaths[focus], [focus]);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_faq_tree_impression",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { component: "FAQDecisionTree" },
    });
  }, [pathname]);

  const onSelect = (next: Focus) => {
    setFocus(next);
    void trackPublicEvent({
      event: "marketing_faq_tree_select",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { focus: next },
    });
  };

  return (
    <section
      id="faq-tree"
      className="marketing-section-clear py-16 md:py-20"
      data-tour="marketing-faq-tree"
    >
      <Container>
        <div className="max-w-[74ch]">
          <p className="section-kicker">Wenn danach noch etwas offen ist</p>
          <h2 className="h2 mt-2">Der sinnvollste Vertiefungspfad nach den Kernantworten</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Wenn nach den wichtigsten Antworten noch ein Thema offen ist, finden Sie hier den sinnvollsten Vertiefungspfad statt einer langen Linkliste.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-4 md:p-7">
            <h3 className="h3">Wählen Sie Ihr offenes Thema</h3>
            <div className="mt-4 grid gap-2">
              {(Object.keys(focusPaths) as Focus[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  className={`rounded-xl px-3 py-2 text-left text-sm font-medium ring-1 transition ${
                    focus === key
                      ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                      : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                  }`}
                >
                  {focusPaths[key].label}
                </button>
              ))}
            </div>
          </article>

          <article className="card-base p-6 lg:col-span-8 md:p-7">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Nächster Pfad: {selected.label}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{selected.prompt}</p>
            <p className="helper mt-3">{selected.summary}</p>

            <h3 className="mt-5 text-sm font-semibold text-[var(--text)]">Am sinnvollsten als Nächstes</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
              {selected.firstSteps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {selected.links.map((linkItem) => (
                <Link
                  key={linkItem.href}
                  href={linkItem.href}
                  className="btn-secondary"
                  onClick={() =>
                    void trackPublicEvent({
                      event: "marketing_faq_tree_link_click",
                      source: "website",
                      path: pathname,
                      pageGroup: "marketing",
                      meta: { focus, href: linkItem.href },
                    })
                  }
                >
                  {linkItem.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
