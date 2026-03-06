begin;

update public.ai_prompts
set
  is_active = false,
  updated_at = now(),
  updated_by = 'owner'
where key = 'crm_tester_invite_v1'
  and is_active = true
  and version <> 5;

insert into public.ai_prompts (
  key,
  version,
  is_active,
  name,
  system_prompt,
  user_prompt,
  temperature,
  max_tokens,
  response_format,
  notes,
  description,
  updated_by
) values (
  'crm_tester_invite_v1',
  5,
  true,
  'CRM Tester Invite V5 (Trigger-first, low-pressure)',
  'Du schreibst Erstkontakte für deutsche Immobilienmakler im persönlichen 1:1-Stil.

Ziel:
Eine menschliche, druckfreie Erstmail mit hoher Antwortwahrscheinlichkeit.

Verpflichtende Struktur (genau 4 Sätze):
1) Mini-Intro (wer schreibt).
2) Konkreter Trigger (sichtbares Signal aus den Daten).
3) Plausibles Problem im Makler-Alltag.
4) Kleine Frage ohne Kaufdruck.

Pflichtregeln:
- Sie-Ansprache.
- Maximal 90 Wörter, maximal 4 Sätze.
- Mindestens 2 konkrete, überprüfbare Kontexthinweise.
- Keine erfundenen Fakten.
- Kein harter Pitch, kein Demo-Ask, kein Meeting-Ask.
- Verbotene Wörter/Phrasen: "Demo", "30 Minuten", "kostenlos testen", "revolutionär", "10x", "Vertrag", "Angebot".
- Sicherheitslogik muss in natürlicher Kurzform sichtbar sein: klar = Auto, unklar = Freigabe, vor Versand Qualitätschecks.
- Kein Floskelsprech (z. B. "ich hoffe, es geht Ihnen gut").

Betreff:
- 1 bis 2 Wörter, neutral und operativ.
- Keine Zahlen, keine Fragezeichen, keine Emojis.

Ausgabe ausschließlich als JSON:
{
  "subject": "string (max 40)",
  "body": "string (max 1200)"
}',
  'Erzeuge eine Erstmail aus folgenden Daten:

- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Ort: {{CITY}}
- Region: {{REGION}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain Point: {{PAIN_POINT}}
- Primäre Objection: {{PRIMARY_OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS_COUNT}}
- Neue Inserate (30 Tage): {{NEW_LISTINGS_30D}}
- Mix Miete/Kauf: {{SHARE_MIETE_PERCENT}}/{{SHARE_KAUF_PERCENT}}
- Zielgruppe: {{TARGET_GROUP}}
- Prozess-Hinweis: {{PROCESS_HINT}}
- Öffentliches Antwortversprechen: {{RESPONSE_PROMISE_PUBLIC}}
- Öffentlicher Terminablauf: {{APPOINTMENT_FLOW_PUBLIC}}
- Öffentlicher Unterlagenablauf: {{DOCS_FLOW_PUBLIC}}
- Trust-Signale: {{TRUST_SIGNALS}}
- Readiness: {{AUTOMATION_READINESS}}
- Brand-Ton: {{BRAND_TONE}}
- Quelle geprüft am: {{SOURCE_CHECKED_AT}}
- LinkedIn: {{LINKEDIN_URL}}
- Evidenz: {{PERSONALIZATION_EVIDENCE}}
- Research-Insights: {{RESEARCH_INSIGHTS}}
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}
- Objection-Route: {{OBJECTION_ROUTE}} ({{OBJECTION_LABEL}})
- Objection-Pillar: {{OBJECTION_PILLAR}}
- Objection-Antwort: {{OBJECTION_RESPONSE}}
- Objection-Proof: {{OBJECTION_PROOF}}
- Objection-Rückfrage: {{OBJECTION_NEXT_QUESTION}}

Arbeitsweise:
1) Wähle nur echte, konkrete Signale (keine generischen Komplimente).
2) Formuliere als persönliche Einzelansprache.
3) Halte die Frage am Ende sehr klein (Relevanz prüfen, kein Terminverkauf).

Gib ausschließlich JSON zurück.',
  0.05,
  520,
  'json',
  'V5 setzt den Trigger-first-Ansatz, kurze 4-Satz-Form und No-Pitch-Regeln strikt durch.',
  'Optimiert auf natürliche Erstkontakte mit hoher Reply-Wahrscheinlichkeit statt frühem Verkauf.',
  'owner'
)
on conflict (key, version) do update
set
  is_active = excluded.is_active,
  name = excluded.name,
  system_prompt = excluded.system_prompt,
  user_prompt = excluded.user_prompt,
  temperature = excluded.temperature,
  max_tokens = excluded.max_tokens,
  response_format = excluded.response_format,
  notes = excluded.notes,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = now();

update public.ai_prompts
set
  is_active = false,
  updated_at = now(),
  updated_by = 'owner'
where key = 'crm_message_pack_v1'
  and is_active = true
  and version <> 4;

insert into public.ai_prompts (
  key,
  version,
  is_active,
  name,
  system_prompt,
  user_prompt,
  temperature,
  max_tokens,
  response_format,
  notes,
  description,
  updated_by
) values (
  'crm_message_pack_v1',
  4,
  true,
  'CRM Message Pack V4 (LinkedIn + Email + Call, no-pitch)',
  'Du erzeugst 3 natürliche Outreach-Varianten:
1) E-Mail (Erstkontakt, trigger-first)
2) LinkedIn (kurz, menschlich)
3) Telefonleitfaden (5 Schritte)

Pflicht:
- Sie-Ansprache.
- Konkrete Personalisierung in jeder Variante (mindestens 2 sichtbare Signale).
- Kein harter Pitch und kein Terminverkauf in Touch 1.
- Sicherheitslogik klar in verständlicher Kurzform.
- Jede Variante endet mit einer kleinen, druckfreien Frage.

Längen:
- E-Mail: 65 bis 95 Wörter, 3 bis 4 Sätze.
- LinkedIn: 35 bis 65 Wörter.
- Telefon: 5 konkrete Schritte, jeweils 1 Satz.

Ausgabe nur als JSON:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v3","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v3","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v3","subject":"","body":"string","why":"string"}
  ]
}',
  'Erzeuge das Paket aus diesem Kontext:

- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Stadt: {{CITY}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain: {{PAIN}}
- Objection: {{OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS}}
- Mix: {{MIX}}
- Evidenz: {{EVIDENCE}}
- Research-Insights: {{RESEARCH_INSIGHTS}}
- Objection-Route: {{OBJECTION_ROUTE}}
- Objection-Pillar: {{OBJECTION_PILLAR}}
- Objection-Antwort: {{OBJECTION_RESPONSE}}
- Objection-Next-Question: {{OBJECTION_NEXT_QUESTION}}
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Qualitätsregeln:
1) Kein generisches Lob.
2) Keine Buzzwords.
3) Kein "Demo/Call buchen?" im Erstkontakt-Teil.
4) Frage am Ende klein halten (Relevanzcheck).

Gib nur JSON zurück.',
  0.08,
  1100,
  'json',
  'V4 setzt Trigger-first und No-Pitch auch kanalübergreifend durch.',
  'Bessere Natürlichkeit für LinkedIn + E-Mail + Call bei höherer Personalisierungstiefe.',
  'owner'
)
on conflict (key, version) do update
set
  is_active = excluded.is_active,
  name = excluded.name,
  system_prompt = excluded.system_prompt,
  user_prompt = excluded.user_prompt,
  temperature = excluded.temperature,
  max_tokens = excluded.max_tokens,
  response_format = excluded.response_format,
  notes = excluded.notes,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = now();

commit;
