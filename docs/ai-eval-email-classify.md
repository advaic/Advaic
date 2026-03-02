# AI Eval – Email Classifier

Ziel: Vor Release und bei Prompt-/Regeländerungen messen, ob die Kernentscheidungen stabil bleiben.

## Datensatz
- Datei: [scripts/evals/email-classify-goldset.v1.json](/Users/kilianziemann/Downloads/advaic-dashboard/scripts/evals/email-classify-goldset.v1.json)
- Fokus: deterministische Sicherheitsregeln (Portal-Relay, no-reply, System, Newsletter, Billing).

## Ausführung
1. Dev-Server starten: `npm run dev -- -p 4010`
2. Eval starten:

```bash
BASE_URL=http://127.0.0.1:4010 \
INTERNAL_SECRET="$ADVAIC_INTERNAL_PIPELINE_SECRET" \
npm run eval:email-classify
```

Optionale Parameter:
- `EVAL_MIN_ACCURACY` (Default `0.95`)
- `EVAL_STRICT` (`true`/`false`, Default `true`)

## Gate-Empfehlung
- `strict=true`
- Mindestgenauigkeit: `>= 95%`
- Bei Fehlfällen: Prompt-/Regeländerung nur mit dokumentierter Begründung.

