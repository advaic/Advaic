import Container from "@/components/marketing/Container";
import ProductStillFrame from "./ProductStillFrame";

export default function ToneAndStyle() {
  return (
    <section id="stil" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Antworten in Ihrem Stil</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Ton, Guardrails und Lieblingsformulierungen werden im Produkt gepflegt und direkt an einer Vorschau geprüft.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]" data-tour="produkt-tone-visual">
          <ProductStillFrame
            label="Setup"
            src="/marketing-screenshots/core/raw/tone-style-setup.png"
            alt="Ton-und-Stil-Seite mit Reglern, Guardrails und Stilbeispielen"
            caption="Stil, Wünsche und Grenzen werden als Setup gepflegt und nicht als loses Formular."
            frameTour="produkt-tone-main-frame"
            stageTour="produkt-tone-main-shot"
          />

          <div className="space-y-4">
            <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
              <h3 className="h3">Was hier steuerbar bleibt</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">Tonalität & Länge</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Formell, knapp oder wärmer formuliert wird nicht im Prompt versteckt, sondern über klare Stellschrauben gepflegt.
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">Guardrails & No-Gos</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Unerwünschte Formulierungen und feste Vorgaben bleiben zusammen mit dem Stil an einer Stelle sichtbar.
                  </p>
                </div>
              </div>
            </article>

            <ProductStillFrame
              label="Vorschau"
              src="/marketing-screenshots/core/raw/tone-style-preview.png"
              alt="Ton-und-Stil-Vorschau mit Zusammenfassung und Beispielantwort"
              caption="Änderungen werden direkt an einer realen Antwortvorschau sichtbar."
              aspectClassName="aspect-[16/11]"
              frameTour="produkt-tone-secondary-frame"
              stageTour="produkt-tone-secondary-shot"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
