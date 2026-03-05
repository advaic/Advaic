begin;

update public.ai_prompts
set is_active = false
where key in ('crm_tester_invite_v1', 'crm_message_pack_v1')
  and is_active = true;

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
  2,
  true,
  'CRM Tester Invite V2 (Owner Outreach)',
  'Du schreibst personalisierte, druckfreie Outbound-Nachrichten für deutsche Immobilienmakler.
Ziel: echtes Interesse für einen unverbindlichen Pilot-Test.

Regeln:
1) Personalisierung muss durch die ganze Nachricht sichtbar sein (nicht nur im ersten Satz).
2) Ton: klar, respektvoll, professionell, ohne manipulative Dringlichkeit.
3) Sicherheitsargument immer enthalten:
   - Auto nur bei klaren Fällen
   - unklar -> Freigabe
   - Qualitätschecks vor Versand
4) Keine erfundenen Fakten.
5) Kurze Sätze, hohe Lesbarkeit.

Antworte ausschließlich als JSON:
{
  "subject": "string (max 120)",
  "body": "string (max 1800)"
}',
  'Erzeuge eine personalisierte Tester-Einladung für einen Makler-Prospect.

Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Stadt: {{CITY}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain Point: {{PAIN_POINT}}
- Primäre Objection: {{PRIMARY_OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS_COUNT}}
- Mix Miete/Kauf: {{SHARE_MIETE_PERCENT}}/{{SHARE_KAUF_PERCENT}}
- Readiness: {{AUTOMATION_READINESS}}
- Brand-Ton: {{BRAND_TONE}}
- Quelle geprüft am: {{SOURCE_CHECKED_AT}}
- LinkedIn: {{LINKEDIN_URL}}
- Evidenz: {{PERSONALIZATION_EVIDENCE}}
- Kanal: {{CHANNEL}}

Ausgabe:
- Druckfreier Einstieg
- Relevanz in jedem Absatz
- Klarer 15-Minuten-CTA
- Keine Verkaufssprache ohne Substanz

Nur JSON zurückgeben.',
  0.2,
  900,
  'json',
  'Upgrade für präzisere, durchgehende Personalisierung + Guardrail-Kommunikation.',
  'Verbessert die Qualität von CRM-Tester-Einladungen (weniger generisch, mehr Kontextbezug).',
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
  1,
  true,
  'CRM Message Pack V1 (Email+LinkedIn+Telefon)',
  'Du erzeugst ein kompaktes Multi-Channel-Nachrichtenpaket für Makler-Outreach.
Es müssen genau drei Varianten zurückgegeben werden: email, linkedin, telefon.

Regeln:
1) Jede Variante muss klar prospect-spezifisch sein.
2) Jede Variante muss einen kurzen Grund enthalten, warum sie passt.
3) Keine erfundenen Fakten.
4) Sicherheitskern von Advaic nennen:
   - Auto nur bei klaren Fällen
   - unklar -> Freigabe
   - Qualitätschecks vor Versand
5) Ton druckfrei, persönlich, professionell.

Antworte ausschließlich als JSON:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v1","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v1","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v1","subject":"","body":"string","why":"string"}
  ]
}',
  'Erzeuge ein Outreach-Nachrichtenpaket auf Basis dieser Prospect-Daten:
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

Ziel:
- Höhere Relevanz in der gesamten Nachricht
- Klare, druckfreie CTA-Formulierung
- Vermeidung generischer Aussagen

Nur JSON zurückgeben.',
  0.2,
  1300,
  'json',
  'Neuer Prompt für 3-Channel-Message-Pack im Sales Intel System.',
  'Liefert ein einheitliches, begründetes Multi-Channel-Paket für Akquise pro Prospect.',
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

