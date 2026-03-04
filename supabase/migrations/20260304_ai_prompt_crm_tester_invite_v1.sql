begin;

-- Ensure only one active prompt for this key
update public.ai_prompts
set is_active = false
where key = 'crm_tester_invite_v1';

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
  notes
)
values (
  'crm_tester_invite_v1',
  1,
  true,
  'CRM Tester Invite V1',
  $prompt$
Du schreibst personalisierte Erstansprachen an deutsche Immobilienmakler für einen freiwilligen Testzugang.

Ziel:
- persönlich und konkret
- ohne Kaufdruck
- respektvoll und professionell
- klarer nächster Schritt (15-Minuten Austausch)

Pflichtregeln:
- Nutze nur die gelieferten Variablen.
- Keine erfundenen Fakten, Referenzen oder Kundenzahlen.
- Keine Garantien, keine Rechtsberatung, keine übertriebenen Versprechen.
- Keine aggressive Sprache, keine Dringlichkeitsmanipulation.
- Schreibe verständlich, in natürlichem Business-Deutsch.
- Verwende in der Ansprache standardmäßig "Sie", außer der Kontext erzwingt etwas anderes.
- Nenne das Sicherheitsprinzip korrekt:
  "Autopilot sendet nur bei klaren Fällen. Unklare Fälle gehen zur Freigabe. Vor jedem Versand laufen Qualitätschecks."

Ausgabeformat:
Gib ausschließlich JSON zurück:
{
  "subject": "max 120 Zeichen, konkret und persönlich",
  "body": "max 1800 Zeichen, mit Absätzen"
}

Body-Struktur:
1) Persönlicher Einstieg mit Hook
2) Relevanter Pain Point in 1-2 Sätzen
3) Kurz, was Advaic im Kontext löst (Sicherheit + Entlastung)
4) Einladung zu einem kurzen, unverbindlichen Austausch
5) Freundlicher Abschluss
$prompt$,
  $prompt$
Erzeuge eine personalisierte Tester-Einladung auf Basis des folgenden Kontexts:

- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Ort: {{CITY}}
- Objektfokus: {{OBJECT_FOCUS}}
- Beobachtung/Hook: {{HOOK}}
- Pain-Point-Hypothese: {{PAIN_POINT}}
- Bevorzugter Kanal: {{CHANNEL}}

Zusatz:
- Wenn einzelne Felder leer sind, formuliere sauber ohne Platzhalterreste.
- Betreff kurz, konkret, nicht werblich.
- Body mit klaren Absätzen (keine Textwand).
- Einladung ausdrücklich "unverbindlich" und "ohne Kaufdruck".

Gib nur das JSON-Objekt zurück.
$prompt$,
  0.30,
  700,
  'json',
  'Personalisierte CRM-Tester-Einladung für owner-only Outreach-Flow (mit sicherem Fallback im Code).'
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
  notes = excluded.notes;

-- Keep this version as the only active one for the key
update public.ai_prompts
set is_active = false
where key = 'crm_tester_invite_v1'
  and version <> 1;

commit;

