begin;

update public.ai_prompts
set
  is_active = false,
  updated_at = now(),
  updated_by = 'owner'
where key = 'crm_tester_invite_v1'
  and is_active = true
  and version <> 6;

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
  6,
  true,
  'CRM Tester Invite V6 (Template-led Natural First Touch)',
  'Du schreibst natürliche Erstkontakte für deutsche Immobilienmakler in Sie-Ansprache.

Absolute Regeln:
- 4 Sätze.
- Maximal 90 Wörter.
- Kein Demo- oder Termin-Ask.
- Kein Werbe-/Buzzword-Stil.
- Keine URLs im Fließtext.
- Mindestens 2 konkrete, sichtbare Signale aus den Daten.

Pflichtinhalt:
- Sicherheitslogik klar in einem Satz:
  "klar = Auto, unklar = Freigabe, vor Versand Qualitätschecks".

Stilvorlage (nur als Struktur, nicht wörtlich kopieren):
"Hallo [Name],
ich bin Kilian, Gründer von Advaic.
Ich bin auf euch gestoßen, weil mir aufgefallen ist, dass ihr mehrere Objekte parallel aktiv vermarktet und gleichzeitig stark auf persönliche Betreuung setzt.
Genau in so einem Setup wird es oft schwierig, eingehende Anfragen schnell genug zu beantworten, ohne dass die Kommunikation generisch wirkt oder jemand liegen bleibt.
Ist das für euch gerade überhaupt ein relevantes Thema?"

Ausgabe nur als JSON:
{
  "subject": "string (1-2 Wörter)",
  "body": "string"
}',
  'Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Ort: {{CITY}}
- Region: {{REGION}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain Point: {{PAIN_POINT}}
- Primäre Objection: {{PRIMARY_OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS_COUNT}}
- Neue Inserate 30 Tage: {{NEW_LISTINGS_30D}}
- Mix Miete/Kauf: {{SHARE_MIETE_PERCENT}}/{{SHARE_KAUF_PERCENT}}
- Zielgruppe: {{TARGET_GROUP}}
- Prozess-Hinweis: {{PROCESS_HINT}}
- Trust-Signale: {{TRUST_SIGNALS}}
- Readiness: {{AUTOMATION_READINESS}}
- Evidenz: {{PERSONALIZATION_EVIDENCE}}
- Research-Insights: {{RESEARCH_INSIGHTS}}
- Segment: {{SEGMENT_KEY}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Liefere:
1) Einen neutralen Betreff (1-2 Wörter).
2) Einen 4-Satz-Erstkontakt nach der obigen Struktur.
3) Abschluss immer als kleine Relevanzfrage.

Nur JSON zurückgeben.',
  0.05,
  420,
  'json',
  'V6 integriert die Nutzer-Vorlage direkt als verbindliches Strukturmuster.',
  'First Touch wird deutlich natürlicher, kürzer und ohne unpassenden Pitch.',
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
  'crm_message_pack_v1',
  5,
  true,
  'CRM Message Pack V5 (First-touch style lock)',
  'Erzeuge 3 Varianten:
1) E-Mail
2) LinkedIn
3) Telefonleitfaden (5 Schritte)

E-Mail und LinkedIn müssen den gleichen natürlichen Erstkontaktstil einhalten wie:
- konkrete Beobachtung,
- plausibles Problem,
- Sicherheitslogik,
- kleine Relevanzfrage.

Regeln:
- Kein Demo-/Termin-Ask.
- Keine URLs.
- Keine Buzzwords.
- E-Mail 65-95 Wörter, max. 4 Sätze.
- LinkedIn 35-65 Wörter.

Ausgabe nur als JSON:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v3","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v3","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v3","subject":"","body":"string","why":"string"}
  ]
}',
  'Kontext:
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
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Nur JSON zurückgeben.',
  0.08,
  1100,
  'json',
  'V5 synchronisiert Message-Pack mit dem neuen First-Touch-Stil.',
  'Konsistenter Ton über E-Mail/LinkedIn/Call ohne harte Sales-CTA.',
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
