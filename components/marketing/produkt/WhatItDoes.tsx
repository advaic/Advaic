import Container from "@/components/marketing/Container";

export default function WhatItDoes() {
  return (
    <section id="was" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Was Advaic für Sie übernimmt</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Advaic ist kein Chatbot. Es ist ein Arbeitsablauf für Ihr Postfach: erkennen, entscheiden, antworten,
            dokumentieren.
          </p>
          <p className="body mt-4 text-[var(--muted)]">
            Wenn nach der Antwort keine Rückmeldung kommt, kann Advaic zusätzlich Follow-ups nach klaren Regeln
            steuern.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <article className="rounded-[var(--radius)] bg-white p-7 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-8">
            <h3 className="h3">1) Erkennen: Advaic trennt Anfragen von Nicht-Anfragen</h3>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Advaic prüft eingehende E-Mails und bewertet: Ist das eine echte Interessenten-Anfrage oder eine
              nicht relevante E-Mail? Ziel ist, dass Sie nicht mehr jede Rundmail und jede Systemnachricht manuell
              prüfen müssen.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
                Wird ignoriert oder zur Freigabe markiert (Beispiele): Newsletter/Rundmails, Systemmails
                (Mailer-Daemon), offensichtliche Werbung/Spam, no-reply ohne nutzbares Reply-To.
              </p>
              <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
                Wird als Anfrage erkannt (Beispiele): Portal-Anfrage, Website-Kontaktformular, direkte E-Mail eines
                Interessenten.
              </p>
            </div>
          </article>

          <article className="rounded-[var(--radius)] bg-white p-7 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-8">
            <h3 className="h3">2) Schreiben: Antworten in Ihrem Stil</h3>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Sie legen Ton und Regeln fest (kurz, freundlich, professionell). Advaic erstellt Antworten, die so
              klingen, als hätten Sie sie selbst geschrieben.
            </p>
            <p className="body mt-4 max-w-[68ch]">
              Warum das wichtig ist: Makler gewinnen Vertrauen über Ton und Klarheit. Advaic soll genau das
              unterstützen.
            </p>
          </article>

          <article className="rounded-[var(--radius)] bg-white p-7 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-8">
            <h3 className="h3">3) Senden: Autopilot mit Sicherheitsnetz</h3>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Wenn der Fall eindeutig ist, kann Advaic automatisch antworten. Wenn der Fall unklar oder heikel ist,
              geht er zur Freigabe. Advaic ist so gebaut, dass es im Zweifel lieber stoppt als falsch sendet.
            </p>
            <p className="body mt-4 max-w-[68ch] text-[var(--muted)]">
              Ein typischer Freigabegrund ist ein technischer Absender (z. B. no-reply) ohne sicheren Rückkanal.
              Dann entscheiden Sie bewusst selbst.
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
}
