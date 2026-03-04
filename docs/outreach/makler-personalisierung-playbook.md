# Makler-Personalisierung Playbook (Advaic)

## Ziel
Dieses Playbook sorgt dafür, dass jede Outreach-Nachricht durchgehend personalisiert ist: Einstieg, Problem, Nutzen, Sicherheitslogik und CTA.

## Pflichtfelder pro Makler
1. `firma`
2. `ansprechpartner_name`
3. `rolle`
4. `stadt`
5. `region`
6. `objektfokus` (Miete, Kauf, Neubau oder gemischt)
7. `zielgruppe` (z. B. Studenten, Familien, Kapitalanleger)
8. `prozesshinweis` (z. B. Kontaktformular, Portal-Fokus, Team-Postfach)
9. `pain_point_hypothese`
10. `hook_beobachtung` (konkrete Beobachtung von Website/Profil)
11. `cta_typ` (15-Minuten-Call, Demo, Rückfrage per Mail)
12. `kontaktkanal` (Telefon, LinkedIn, Kontaktformular, E-Mail)
13. `fit_score` (0-100)
14. `prioritaet` (A, B, C)

## Scoring-Modell
Nutze diese Formel für Priorisierung:

`fit_score = segment_fit(0-40) + volumen_indiz(0-20) + digital_fit(0-20) + umsetzungsnähe(0-20)`

Bewertung:
1. `A`: 75-100
2. `B`: 55-74
3. `C`: 0-54

## Personalisierungslogik für jede Nachricht
Jede Nachricht enthält genau diese Bausteine in dieser Reihenfolge:

1. Persönlicher Einstieg
2. Konkrete Beobachtung
3. Individuelle Problemhypothese
4. Passende Advaic-Lösung mit Guardrails
5. Sicherheits- und Kontrollsatz
6. Ein präziser CTA

## Qualitätsregeln für personalisierte Nachrichten
1. Kein generischer Einstieg wie „Ich hoffe, es geht Ihnen gut“.
2. Mindestens zwei individuelle Fakten pro Nachricht.
3. Klare Sprache ohne Buzzwords.
4. Guardrails immer erklären: Auto nur bei klaren Fällen, sonst Freigabe.
5. Maximal 120 bis 170 Wörter für Erstkontakt.
6. Immer ein einziger CTA, nicht mehrere Optionen.

## Kanalregeln
1. Telefon: sehr kurzer Opener, dann 1 konkreter Nutzen + Terminfrage.
2. LinkedIn: 60 bis 100 Wörter, locker aber präzise.
3. Kontaktformular/E-Mail: 120 bis 170 Wörter mit starker Struktur.

## Follow-up-Sequenz (wenn keine Antwort kommt)
1. Follow-up 1 nach 3 Werktagen: kurze Erinnerung + ein neuer konkreter Nutzen.
2. Follow-up 2 nach 7 Werktagen: Mini-Case-Skizze für deren Segment.
3. Follow-up 3 nach 14 Werktagen: höflicher Abschluss mit Opt-out.

## Prompt-Template für interne Personalisierung
Du kannst dieses Template intern für Nachrichtengenerierung nutzen:

"""
Erstelle eine personalisierte Erstnachricht für einen Immobilienmakler in Deutschland.

Maklerdaten:
- Firma: {{firma}}
- Ansprechpartner: {{ansprechpartner_name}}
- Rolle: {{rolle}}
- Stadt/Region: {{stadt}}, {{region}}
- Objektfokus: {{objektfokus}}
- Zielgruppe: {{zielgruppe}}
- Prozesshinweis: {{prozesshinweis}}
- Beobachtung: {{hook_beobachtung}}
- Pain-Point-Hypothese: {{pain_point_hypothese}}
- CTA-Typ: {{cta_typ}}
- Kanal: {{kontaktkanal}}

Pflichtstruktur:
1) Persönlicher Einstieg
2) Konkrete Beobachtung
3) Individuelle Problemhypothese
4) Advaic-Nutzen exakt für diesen Kontext
5) Sicherheitslogik: Auto nur bei klaren Fällen, Unklares zur Freigabe, Qualitätschecks vor Versand
6) Genau ein CTA

Stil:
- klare, professionelle deutsche Sprache
- keine Buzzwords
- maximal 150 Wörter
"""

## Minimaler Outreach-Prozess
1. Liste mit 50 Zielmaklern füllen.
2. Priorität A zuerst kontaktieren.
3. Pro Makler Notizen nach Kontakt ergänzen.
4. Antwortstatus täglich pflegen.
5. Nach 2 Wochen Ergebnisse auswerten: Antwortquote, Terminquote, Pilotquote.
