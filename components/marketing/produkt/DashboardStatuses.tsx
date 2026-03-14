import Container from "@/components/marketing/Container";
import ProductStillFrame from "./ProductStillFrame";

const statuses = [
  {
    name: "Auto gesendet",
    detail: "Klare Anfrage, sicher beantwortet.",
    toneClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    name: "Zur Freigabe",
    detail: "Wichtige Informationen fehlen oder der Fall verlangt bewusst Prüfung.",
    toneClass: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    name: "Ignoriert",
    detail: "Newsletter, Spam oder Systemmails.",
    toneClass: "border-slate-200 bg-slate-100 text-slate-800",
  },
  {
    name: "Fehlgeschlagen",
    detail: "Nicht gesendet. Sie können prüfen und erneut senden.",
    toneClass: "border-rose-200 bg-rose-50 text-rose-900",
  },
];

export default function DashboardStatuses() {
  return (
    <section id="dashboard" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Was Sie im Dashboard sehen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Sie sollen jederzeit nachvollziehen können, was passiert ist — ohne zu suchen.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" data-tour="produkt-dashboard-visual">
          <ProductStillFrame
            label="Systemstatus"
            src="/marketing-screenshots/core/raw/dashboard-systemstatus.png"
            alt="Dashboard-Systemstatus mit Versand, Deliverability und Lernkurve"
            caption="Versand, Deliverability und Lernkurve werden als ein gemeinsamer Betriebszustand sichtbar."
            frameTour="produkt-dashboard-main-frame"
            stageTour="produkt-dashboard-main-shot"
          />

          <div className="space-y-4">
            <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
              <h3 className="h3">Statusfarben mit fester Bedeutung</h3>
              <div className="mt-4 grid gap-3">
                {statuses.map((status) => (
                  <div
                    key={status.name}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4"
                  >
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.toneClass}`}
                    >
                      {status.name}
                    </span>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{status.detail}</p>
                  </div>
                ))}
              </div>
            </article>

            <ProductStillFrame
              label="Automationssteuerung"
              src="/marketing-screenshots/core/raw/dashboard-automation.png"
              alt="Dashboard-Automationssteuerung mit Guardrails und Sandbox"
              caption="Guardrails, Sandbox und Rollout bleiben im selben Steuerungsbereich sichtbar."
              aspectClassName="aspect-[16/11]"
              frameTour="produkt-dashboard-secondary-frame"
              stageTour="produkt-dashboard-secondary-shot"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
