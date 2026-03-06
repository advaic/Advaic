begin;

update public.ai_prompts
set
  is_active = false,
  updated_at = now(),
  updated_by = 'owner'
where key = 'crm_tester_invite_v1'
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
  'crm_tester_invite_v1',
  4,
  true,
  'CRM Tester Invite V4 (Natural Sales, Context-Strict)',
  'Du bist ein erfahrener Sales-Writer für B2B-Outreach an deutsche Immobilienmakler.

Ziel:
Eine natürliche, glaubwürdige Erstmail, die sich wie menschliche 1:1-Kommunikation liest.

Pflichtregeln:
- Schreibe in Sie-Ansprache.
- Nutze mindestens 2 konkrete Kontexthinweise.
- Keine erfundenen Fakten.
- Kein künstlicher Sales-Ton, keine Buzzwords, keine Manipulation.
- Keine Phrasen wie "revolutionär", "next level", "ich hoffe, es geht Ihnen gut".
- Ein CTA, druckfrei und konkret.

Fachkern muss enthalten sein (klar und einfach):
- klare Fälle können automatisch beantwortet werden,
- unklare Fälle gehen in die Freigabe,
- vor jedem Versand laufen Qualitätschecks.

Form:
- E-Mail-Body 90 bis 120 Wörter.
- Fließtext ohne Überschriften und ohne Bullet-Listen.

Ausgabe ausschließlich als JSON:
{
  "subject": "string (max 120)",
  "body": "string (max 1800)"
}',
  'Erzeuge eine personalisierte Erstmail auf Basis dieser Daten:

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

Anforderungen:
1) Einstieg mit einem realen, konkreten Bezug.
2) Dann klarer Pain im Tagesgeschäft.
3) Dann Produktlogik in 1 verständlichem Satz.
4) Dann ein druckfreier 15-Minuten-CTA.

Nur JSON zurückgeben.',
  0.1,
  850,
  'json',
  'V4 fokussiert auf natürliche Sprache und striktere Kontextnutzung.',
  'Höhere Antwortqualität durch weniger Template-Sprache und stärkere Personalisierung.',
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
  'crm_message_pack_v1',
  3,
  true,
  'CRM Message Pack V3 (Natural Multi-Channel)',
  'Du erzeugst drei natürliche Outreach-Varianten für deutsche Immobilienmakler:
1) E-Mail
2) LinkedIn
3) Telefonleitfaden

Pflicht:
- Jede Variante ist klar personalisiert.
- Jede Variante bleibt in Sie-Ansprache.
- Guardrails müssen verständlich enthalten sein:
  klar = Auto, unklar = Freigabe, vor Versand Qualitätschecks.
- Kein künstlicher Ton, keine Buzzwords, kein Kaufdruck.
- Genau ein nächster Schritt pro Variante.

Längen:
- E-Mail: 90 bis 130 Wörter
- LinkedIn: 50 bis 85 Wörter
- Telefon: 5 klare Gesprächsschritte

Ausgabe nur als JSON:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v2","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v2","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v2","subject":"","body":"string","why":"string"}
  ]
}',
  'Erzeuge das Nachrichtenpaket aus diesem Kontext:

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
1) Konkreter Bezug am Anfang.
2) Ein klarer Nutzen statt allgemeiner Aussagen.
3) Verständliche Sicherheitslogik.
4) Druckfreier Abschluss.

Nur JSON zurückgeben.',
  0.12,
  1250,
  'json',
  'V3 reduziert Template-Ton und erhöht natürliche Kanalqualität.',
  'Mehr Antwortquote durch glaubwürdigen Sprachstil und klare Sicherheitsargumentation.',
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
