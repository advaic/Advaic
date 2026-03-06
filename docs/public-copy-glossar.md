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

## 5) Automatischer Check

Für schnelle Konsistenzprüfung:

```bash
npm run copy:check
```

Der Check prüft Public-Copy auf verbotene Begriffe und Ansprachefehler.
