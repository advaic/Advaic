import Link from "next/link";
import Container from "@/components/marketing/Container";

const setupSteps = [
  {
    title: "Postfach verbinden (OAuth)",
    detail: "Gmail oder Outlook verbinden. Advaic arbeitet direkt in Ihrem bestehenden E-Mail-Prozess.",
  },
  {
    title: "Ton wählen",
    detail: "Sie legen fest, wie Antworten klingen sollen: kurz, freundlich oder sehr professionell.",
  },
  {
    title: "Regeln aktivieren (Auto/Freigabe/Ignorieren)",
    detail: "Sie definieren, welche Fälle automatisch laufen und welche bewusst in die Freigabe gehen.",
  },
  {
    title: "Autopilot starten oder zuerst vorsichtig nutzen",
    detail: "Sie können konservativ starten und den Automatisierungsgrad stufenweise erhöhen.",
  },
];

export default function Setup() {
  return (
    <section id="setup" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[68ch]">
          <h2 className="h2">In wenigen Minuten startklar</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Der Einstieg folgt einem klaren Ablauf. Sie starten konservativ und erhöhen die Automatisierung erst,
            wenn Regeln, Ton und Freigabelogik zu Ihrem Alltag passen.
          </p>
        </div>

        <div className="mt-10 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
          <div className="relative hidden xl:block">
            <div className="absolute left-[8%] right-[8%] top-[14px] h-px bg-[var(--border)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {setupSteps.map((step, index) => (
              <article
                key={step.title}
                className="card-hover rounded-xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[1.2rem] font-semibold leading-[1.25] tracking-[-0.01em] text-[var(--text)]">
                  {step.title}
                </h3>
                <p className="helper mt-3">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <p className="helper mt-6">
          Sie können Advaic zunächst vorsichtig nutzen: mehr Freigaben, weniger Autopilot.
        </p>
        <p className="helper mt-2">
          Dasselbe gilt für Follow-ups: zuerst konservativ starten, dann schrittweise erweitern.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary">
            Kostenlos testen
          </Link>
          <a href="#faq" className="btn-secondary">
            Fragen stellen
          </a>
        </div>
      </Container>
    </section>
  );
}
