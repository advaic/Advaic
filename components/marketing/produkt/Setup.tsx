import Link from "next/link";
import Container from "@/components/marketing/Container";
import { STARTER_PUBLIC_PRICE_LABEL } from "@/lib/billing/public-pricing";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import PublicTrustArtifacts from "@/components/marketing/PublicTrustArtifacts";

const setupSteps = [
  {
    title: "Postfach verbinden (OAuth)",
    detail: "Gmail oder Outlook verbinden. Advaic arbeitet direkt in Ihrem bestehenden E-Mail-Prozess.",
  },
  {
    title: "Ton und Regeln festlegen",
    detail: "Sie definieren Stil, Freigabegrenzen und den ersten sicheren Versandkorridor.",
  },
  {
    title: "Safe-Start aktivieren",
    detail: "Sie starten erst mit hoher Freigabequote und erweitern den Autopilot später Schritt für Schritt.",
  },
];

export default function Setup() {
  return (
    <section id="setup" className="py-20 md:py-28">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <div className="max-w-[68ch]">
              <p className="section-kicker">Schritt 5 von 5</p>
              <h2 className="h2 mt-2">So gehen Sie mit Safe-Start live</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Am Ende der Tour bleibt genau die Go-live-Frage: Wie starten Sie sicher? Die Antwort bleibt bewusst konservativ.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {setupSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-[1.15rem] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text)]">
                        {step.title}
                      </h3>
                      <p className="helper mt-2">{step.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary">
                {MARKETING_PRIMARY_CTA_LABEL}
              </Link>
              <Link href="/sicherheit" className="btn-secondary">
                Sicherheitsseite lesen
              </Link>
            </div>
            <p className="helper mt-3">
              Danach läuft Starter für {STARTER_PUBLIC_PRICE_LABEL} weiter. Sie können jederzeit kündigen.
            </p>
          </div>

          <aside
            className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-6"
            data-tour="produkt-trust-block"
          >
            <PublicTrustArtifacts
              compact
              rail
              framed={false}
              title="Vor dem Start öffentlich prüfen"
              description="Vor dem Go-live sollten Produktfluss, Sicherheitslogik, Unterlagen und Preis öffentlich prüfbar sein."
              dataTour="produkt-trust-artifacts"
            />
            <div className="mt-4 rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)]">Safe-Start</p>
              <p className="helper mt-2">
                Erst mit hoher Freigabequote starten, erste echte Antworten prüfen, danach den Autopilot nur dort
                erweitern, wo Versandqualität und Datenlage stabil bleiben.
              </p>
            </div>

            <a href="#faq" className="btn-secondary mt-4 w-full justify-center">
              Häufige Fragen
            </a>
          </aside>
        </div>
      </Container>
    </section>
  );
}
