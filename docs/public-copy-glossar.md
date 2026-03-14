# Public-Copy-Glossar (Advaic)

Dieser Leitfaden gilt für alle öffentlichen Seiten (`app/*` außerhalb von `app/app`, `app/api`, `app/actions`) sowie `components/marketing/*`.

## 1) Tonalität

- Ansprache immer in **Sie-Form**.
- Klar, sachlich, präzise.
- Keine Buzzwords ohne Erklärung.
- Kurze Sätze bevorzugen.

## 2) Bevorzugte Begriffe

- `Interessenten-Anfrage` statt `Lead`.
- `Interessenten-Prozess` statt `Leadprozess` oder `Lead-Prozess`.
- `Interessenten-Signal` oder präzise Prozessformulierung statt `Lead-Signal`.
- `Datenschutzhinweise` statt `Datenschutzerklärung` (auf Public-Seiten).
- `ImmoScout24` (korrekte Schreibweise).
- `nächste Prozessschritte` statt `Prozessnächste-Schritte`.

## 3) Produktlogik-Begriffe (konsistent verwenden)

- `Auto senden` (Status-/Regelbegriff)
- `Zur Freigabe`
- `Ignorieren`
- `Qualitätschecks`
- `Guardrails`
- `Verlauf` oder `Statusverlauf`

## 4) Qualitätsschwellen für Public-Copy

- Jede zentrale Aussage ist ohne internes Vorwissen verständlich.
- Jede Seite hat einen klaren Nutzwert für Makler (Problem, Mechanik, Ergebnis).
- Sicherheitslogik ist immer explizit: unklar = Freigabe, nicht Auto.
- Rechts-/Compliance-Hinweise klar als Einordnung kennzeichnen.
- Hero-H1 und Kern-H2 auf Money-Pages müssen in `1–2` Zeilen lesbar bleiben und dürfen die eigentliche Aussage nicht im Nebensatz verstecken.

## 5) Verbotene Copy-Muster

- Keine generischen Kontrast-Slogans wie `nicht X, sondern Y`, wenn kein echter Erkenntnisgewinn entsteht.
- Keine austauschbaren `X statt Y`-Claims als Headline- oder Section-Trick.
- Keine Formeln wie `mehr X, weniger Y`, wenn sie nicht sofort konkret belegt werden.
- Keine KI-Standardphrasen wie `voll sichtbar`, `glasklar`, `maximale Kontrolle`, `nahtlos`, `revolutionär`.
- Keine Headline, die auch zu einem beliebigen anderen SaaS-Tool passen würde.
- Keine pauschalen Platzhalter wie `Standardfall`, `unklarer Fall` oder `heikler Fall`, wenn nicht direkt erklärt wird, was damit fachlich gemeint ist.
- Keine generischen CTA-Texte wie `Preisdetails`, `Fragen klären` oder andere Ausweichformulierungen, wenn eine konkretere Handlungsaufforderung möglich ist.

## 6) Rewrite-Prüfung für Headlines und Kicker

- Würde ein Makler sofort verstehen, worum es konkret geht?
- Nennt die Zeile einen Prozess, einen Engpass oder einen Vorteil mit Substanz?
- Lässt sich die Zeile ohne `statt`, `mehr/weniger` oder abstrakte KI-Wörter formulieren?
- Ist die Aussage präzise genug, um auch in Google oder AI-Snippets sinnvoll zu wirken?
- Werden Freigabe- oder Auto-Entscheidungen über prüfbare Kriterien erklärt, zum Beispiel fehlende Angaben, unklarer Objektbezug, no-reply-Absender oder sensible Inhalte?
- Lässt sich die Kernaussage in einer kurzen Zeile formulieren, statt eine halbe Policy in die Headline zu packen?

## 7) Automatischer Check

Für schnelle Konsistenzprüfung:

```bash
npm run copy:check
```

Der Check prüft Public-Copy auf verbotene Begriffe und Ansprachefehler.
