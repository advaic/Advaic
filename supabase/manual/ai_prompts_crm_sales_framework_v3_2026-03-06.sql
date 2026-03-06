begin;

update public.ai_prompts
set is_active = false,
    updated_at = now(),
    updated_by = 'owner'
where key = 'crm_tester_invite_v1'
  and is_active = true
  and version <> 3;

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
  3,
  true,
  'CRM Tester Invite V3 (Framework + Segment)',
  'Du schreibst personalisierte, druckfreie Outbound-Nachrichten für deutsche Immobilienmakler.
Ziel: echtes Interesse für einen unverbindlichen Pilot-Test.

Pflichtstruktur:
1) Hook: konkrete Beobachtung zum Makler
2) Pain: messbare Folge im Tagesgeschäft
3) Mechanik: Erkennen -> Entscheidung -> Versand
4) Risk-Reversal: Safe-Start + volle Kontrolle
5) Micro-CTA: genau ein klarer nächster Schritt

Regeln:
- Durchgehende Personalisierung (nicht nur Einstieg).
- Keine erfundenen Fakten.
- Keine manipulative Dringlichkeit, kein Kaufdruck.
- Sicherheitskern immer konkret:
  Auto nur bei klaren Fällen.
  Unklar -> Freigabe.
  Qualitätschecks vor Versand.
- Maximal 140 Wörter im Body.
- Genau ein CTA-Satz.

Ausgabe nur als JSON:
{
  "subject": "string (max 120)",
  "body": "string (max 1800)"
}',
  'Erzeuge eine personalisierte Tester-Einladung.

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
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Ziel:
- Personalisierung in jedem Abschnitt
- Klare mechanistische Erklärung
- Risikoarm und vertrauenswürdig
- Druckfrei, aber klar handlungsorientiert

Nur JSON zurückgeben.',
  0.15,
  900,
  'json',
  'V3 mit Hook-Pain-Mechanik-Risk-Reversal-Micro-CTA und Segment-Variablen.',
  'Höhere Relevanz und bessere Reply-Qualität durch strikte Sales-Struktur.',
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
set is_active = false,
    updated_at = now(),
    updated_by = 'owner'
where key = 'crm_message_pack_v1'
  and is_active = true
  and version <> 2;

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
  2,
  true,
  'CRM Message Pack V2 (Framework + Segment)',
  'Du erzeugst ein kompaktes Multi-Channel-Nachrichtenpaket für Makler-Outreach.
Gib exakt drei Varianten zurück: email, linkedin, telefon.

Pflichtstruktur je Nachricht:
1) Hook
2) Pain
3) Mechanik
4) Risk-Reversal
5) Micro-CTA (genau ein nächster Schritt)

Regeln:
- Jede Variante prospect-spezifisch.
- Keine erfundenen Fakten.
- Sicherheitskern immer nennen:
  Auto nur bei klaren Fällen.
  Unklar -> Freigabe.
  Qualitätschecks vor Versand.
- Ton: respektvoll, präzise, druckfrei.
- E-Mail max ~130 Wörter, LinkedIn max ~90 Wörter.

Antworte ausschließlich als JSON:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v2","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v2","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v2","subject":"","body":"string","why":"string"}
  ]
}',
  'Erzeuge ein Outreach-Nachrichtenpaket.

Kontext:
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
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Ziel:
- maximal relevante, sofort nutzbare Varianten
- druckfreie, klare Calls-to-Action
- einheitliche Argumentationslinie über alle Kanäle

Nur JSON zurückgeben.',
  0.15,
  1300,
  'json',
  'V2 mit Segmentbezug und einheitlichem Sales-Framework.',
  'Bessere kanalübergreifende Konsistenz und höhere Personalisierungstiefe.',
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

