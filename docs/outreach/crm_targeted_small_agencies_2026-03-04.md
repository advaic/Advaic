# Ziel-Liste für CRM-Import (kleine Agenturen / Solo-Makler)

Stand: 04.03.2026

Diese Liste ist auf schnelle Pilot-Akquise ausgelegt:

1. Kleine Teams mit sichtbarem Anfrageaufkommen
2. Klarer Miete/Kauf-Fokus für eine saubere Hook in der Erstnachricht
3. Oeffentliche Signale, die im CRM als Personalisierung nutzbar sind

Hinweis LinkedIn:
Wo ein verifizierbarer Profil-Link gefunden wurde, ist er direkt in `linkedin_url` enthalten.
Zusätzlich wird pro Prospect eine `linkedin_search_url` gesetzt, damit die Recherche mit einem Klick weitergeführt werden kann.

## Felder, die im SQL-Seed gesetzt werden

1. `company_name`, `contact_name`, `contact_email`, `contact_role`
2. `city`, `region`, `website_url`
3. `source_url`, `source_checked_at`, `linkedin_url`, `linkedin_search_url`
4. `object_focus`, `active_listings_count`, `share_miete_percent`, `share_kauf_percent`, `object_types`
5. `target_group`, `process_hint`, `primary_objection`, `primary_pain_hypothesis`, `secondary_pain_hypothesis`
6. `automation_readiness`, `cta_preference_guess`, `personalization_evidence`, `hypothesis_confidence`
7. `fit_score`, `priority`, `preferred_channel`, plus `metadata` mit Online-Präsenz-Signal

## Quick-Review der Ziel-Prospects

| Unternehmen | Kontakt | Ort | Aktive Inserate | Miete/Kauf | Kanal | Warum relevant für Advaic |
|---|---|---:|---:|---|---|---|
| PAPE-IMMO Benjamin Pape | Benjamin Pape | Salzgitter | 3 | 0% Miete / 100% Kauf | E-Mail | Kleines Inhaberbüro, klare Kauf-Standardfragen |
| Dreher Immobilien | Mirko Dreher | Bad Nauheim | 8 | 87% Miete / 13% Kauf | E-Mail | Hoher Mietanteil, viele wiederkehrende Erstfragen |
| Mosler Immobilien | Dirk Mosler | Remscheid | 5 | 0% Miete / 100% Kauf | E-Mail | Klare Kauf-Route, Freigabe nur für Sonderfaelle |
| Merz Immobilien | Gunter Merz | Karlsruhe | 11 | 64% Miete / 36% Kauf | Kontaktformular | Gemischter Bestand, ideal für Auto-vs-Freigabe-Logik |
| Blancke Immobilien | Selma Blancke | Bayreuth | 4 | 50% Miete / 50% Kauf | E-Mail | Boutique-Struktur, Ton/Stil besonders wichtig |
| NOVO Immobilien | Ingolf Schmidt | Neetze | 4 | 25% Miete / 75% Kauf | Kontaktformular | Kleine Einheit, klarer Kauf-Schwerpunkt |
| Haus&Geld Immobilien | Monika Turlej | Montabaur | 4 | 0% Miete / 100% Kauf | Kontaktformular | Wenige, aber wertige Kaufanfragen |
| Kutsche Finanz Immobilien | Annika Pordzik | Geseke | 4 | 50% Miete / 50% Kauf | Kontaktformular | Gemischte Fälle, Routing/Guardrails stark relevant |
| Elevaa Hausverwaltung & Immobilien | Oguz Dogan | Backnang | 5 | 20% Miete / 80% Kauf | E-Mail | Kleine Agentur mit sichtbarer Online-Präsenz |
| Roemer & Partner | Jasmin Karaman | Marl | 5 | 80% Miete / 20% Kauf | Kontaktformular | Vermietungsfokus, Standardfragen dominieren |
| V.I.S. Vermögensverwaltung Immobilien Service | Thomas Neuhoff | Regensburg | 3 | 100% Miete / 0% Kauf | Kontaktformular | Reiner Mietfokus, hoher Automatisierungs-Nutzen |
| Cornelis Verwaltungs- und Immobilienmanagement | Mike Cornelis | Gelsenkirchen | 3 | 0% Miete / 100% Kauf | Kontaktformular | Kleine Kauf-Unit, schnelle Erstreaktion wichtig |
| BGR Immobilien | Claus Braunen | Viersen | 5 | 0% Miete / 100% Kauf | Kontaktformular | Kauf-Spezialisierung mit klaren Standardpfaden |
| BLI Group | Moritz Pese | Eching | 5 | 80% Miete / 20% Kauf | Kontaktformular | Hoher Mietanteil, repetitive Kommunikation |
| Laage Immobilien | Yvonne Laage | Apensen | 5 | 0% Miete / 100% Kauf | E-Mail | Inhabergeführt, gut für kontrollierten Pilotstart |
| Partaw Investa | Sohrab Partaw | Wiesbaden | 2 | 100% Miete / 0% Kauf | Kontaktformular | Sehr kleine Einheit, vorsichtiger Start sinnvoll |
| Jacobs Immobilien | Stefan Jacobs | Wunstorf | 6 | 0% Miete / 100% Kauf | E-Mail | Kauf-getrieben, klare nächste Schritte zentral |
| Estaetes Lanzilotto | Daniela Lanzilotto | Jülich | 5 | 20% Miete / 80% Kauf | Kontaktformular | Kleine Agentur mit Kauf-Fokus |
| Thomas Ulhas Immobilien | Thomas Ulhas | Plaidt | 8 | 12% Miete / 88% Kauf | Kontaktformular | Regionale Kauf-Last, hohe Antwort-ROI |
| Immobilienservice Zimmermann | Uwe Zimmermann | Achern | 7 | 14% Miete / 86% Kauf | Kontaktformular | Kleine Agentur, Follow-up-Disziplin relevant |
| IHR-Immobilien | Herbert Resch | Bodenmais | 8 | 0% Miete / 100% Kauf | Kontaktformular | Durchgaengiger Kauf-Fokus, gut für Templates |
| EK-Immobilien | Elisabeth Krell | Vaterstetten | 23 | 83% Miete / 17% Kauf | Kontaktformular | Höheres Vermietungsvolumen, starke Entlastungschance |

## Import

Führe aus:

`supabase/migrations/20260305_crm_personalization_core_fields.sql`

danach:

`supabase/manual/crm_targeted_small_agencies_2026-03-04.sql`

Danach im CRM:

1. Filter `priority = A`
2. Stage `new`
3. Erste Welle: 10 bis 12 Kontakte mit E-Mail oder Kontaktformular
4. Event-Tracking direkt ab dem ersten Versand aktivieren
