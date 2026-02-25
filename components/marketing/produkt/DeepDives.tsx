import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/marketing/Container";

const items = [
  {
    title: "Autopilot-Regeln",
    text: "Signal-zu-Aktion Matrix mit konkreten Auto-, Freigabe- und Ignorieren-Fällen.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks",
    text: "Alle Prüfungen mit Zweck, Beispiel und klarer Fail-Safe-Logik.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox",
    text: "Operativer Ablauf für unklare Fälle inklusive Entscheidungsoptionen.",
    href: "/freigabe-inbox",
  },
  {
    title: "Follow-up-Logik",
    text: "Stufenmodell mit Guardrails und automatischen Stop-Kriterien.",
    href: "/follow-up-logik",
  },
  {
    title: "Anwendungsfälle",
    text: "Praxisnahe Einsatzszenarien mit klaren Vorteilen, Grenzen und Startkonfiguration.",
    href: "/use-cases",
  },
];

export default function DeepDives() {
  return (
    <section className="py-8 md:py-12">
      <Container>
        <div className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[72ch]">
              <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
                Deep Dives
              </span>
              <h2 className="h3 mt-3">Vertiefende Detailseiten für Prüfung, Freigabe und Follow-ups</h2>
              <p className="helper mt-2">
                Wenn Sie einzelne Themen genauer prüfen möchten, finden Sie hier die operative Logik mit konkreten
                Beispielen, Guardrails und klaren Grenzen.
              </p>
            </div>
            <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted)] ring-1 ring-[var(--border)]">
              5 Detailseiten · direkt aus dem Produktfluss verlinkt
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <article key={item.title} className="card-base card-hover relative overflow-hidden p-5">
                <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                    {index + 1}
                  </span>
                </div>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  Öffnen
                  <ArrowRight className="h-4 w-4 text-[var(--gold)]" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
