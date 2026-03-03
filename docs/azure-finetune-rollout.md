# Azure Fine-Tune + Canary Rollout (sicherer Betrieb)

Dieses Setup trennt klar:

1. **Training/Job-Ebene** (Azure Fine-Tune erzeugt neues Candidate-Deployment)
2. **Produktions-Ebene** (Advaic routet nur einen kleinen Anteil über Candidate)

So bleibt ihr fail-safe: kein unkontrollierter Voll-Rollout.

## 1) Env-Variablen für Canary-Routing

Setze jeweils Stable + Candidate + Prozent (0-100):

### Reply Writer
- `AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER_CANARY_PERCENT`

### Rewrite
- `AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE_CANARY_PERCENT`

### QA
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA` (oder Fallback `AZURE_OPENAI_DEPLOYMENT_QA`)
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_CANARY_PERCENT`

### QA Recheck (Label)
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK` (Fallback auf QA)
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_CANARY_PERCENT`

### QA Recheck (Reason JSON)
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_REASON` (Fallback auf Recheck/QA)
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_REASON_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_REASON_CANARY_PERCENT`

### Follow-ups
- `AZURE_OPENAI_DEPLOYMENT_FOLLOWUPS` (optional; fallback auf Writer)
- `AZURE_OPENAI_DEPLOYMENT_FOLLOWUPS_CANDIDATE`
- `AZURE_OPENAI_DEPLOYMENT_FOLLOWUPS_CANARY_PERCENT`

## 2) Sichere Startwerte

Empfehlung:

1. Alle `*_CANARY_PERCENT=0`
2. Candidate Deployments eintragen
3. Nacheinander hochfahren:
   - 5%
   - 10%
   - 25%
   - 50%
   - 100%

Nur weiter erhöhen, wenn Gate/Monitoring stabil ist.

## 3) Gate-Evaluierung (automatisiert)

Neues Script:

- `npm run eval:rollout-gate`

Auswertung basiert auf `message_qas` (pass/warn/fail) und vergleicht Stable vs Candidate.

Wichtige Env-Parameter:

- `ROLLOUT_LOOKBACK_HOURS` (Default 24)
- `ROLLOUT_GATE_PROMPT_KEYS` (z. B. `qa_reply_v1,qa_recheck_v1,rewrite_reply_v1`)
- `ROLLOUT_GATE_MIN_CANDIDATE_SAMPLES` (Default 40)
- `ROLLOUT_GATE_MAX_WARN_DELTA` (Default 0.03)
- `ROLLOUT_GATE_MAX_FAIL_DELTA` (Default 0.01)
- `ROLLOUT_GATE_STRICT=true` (Exit Code 1 bei Gate-Verletzung)

CI Workflow:

- `.github/workflows/ai-rollout-gate.yml`

## 4) Rollback (sofort)

Sofortmaßnahme ohne Redeploy:

1. Alle `*_CANARY_PERCENT=0`
2. Redeploy (oder Runtime-Config-Reload je Umgebung)

Damit läuft sofort wieder nur Stable.

## 5) Promotion auf Stable

Wenn Candidate stabil ist:

1. Candidate-Deployment auf Stable-Variable übernehmen
2. Neue Candidate-Variable optional frei machen (nächste Runde)
3. Prozent wieder auf 0 starten und den nächsten Zyklus wieder konservativ fahren

## 6) Operative Hinweise

- Verwendetes Deployment wird in den QA-Auditdaten als `model` mitgeschrieben
  (`azure:<deployment>:stable|candidate`), damit Vergleich sauber möglich ist.
- Keine direkte 100%-Umschaltung ohne Gate.
- Bei erhöhten `warn/fail`-Raten zuerst Prozent reduzieren, dann Prompt/Training prüfen.

## 7) Vollautomatischer Workflow (Train -> Candidate -> Gate)

Workflow-Datei:

- `.github/workflows/ai-finetune-reply-writer.yml`

Dieser Workflow macht:

1. Trainingsdaten automatisch aus Supabase erzeugen (`train.jsonl` + `valid.jsonl`)
2. Datensätze automatisch zu Azure OpenAI Files hochladen
3. Fine-Tune-Job starten und bis `succeeded` warten
4. Candidate-Deployment-Slot automatisch auf das neue Fine-Tune-Modell umstellen
5. Rollout-Gate laufen lassen (optional strict)

Benötigte GitHub-Secrets:

- `AZURE_CREDENTIALS` (Service Principal JSON für `azure/login`)
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_API_VERSION_FINE_TUNE` (optional)
- `AZURE_FT_BASE_MODEL` (z. B. `gpt-4.1-mini`)
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_OPENAI_ACCOUNT_NAME`
- `AZURE_CANDIDATE_DEPLOYMENT_NAME_REPLY_WRITER` (fester Slot-Name)
- `AZURE_DEPLOYMENT_API_VERSION` (optional)
- `AZURE_DEPLOYMENT_SKU_NAME` (optional)
- `AZURE_DEPLOYMENT_SKU_CAPACITY` (optional)
- `AZURE_DEPLOYMENT_MODEL_VERSION` (optional)
- `AZURE_DEPLOYMENT_RAI_POLICY_NAME` (optional)
- `AZURE_DEPLOYMENT_VERSION_UPGRADE_OPTION` (optional)
- `NEXT_PUBLIC_SUPABASE_URL` (für Datensatzaufbau + Gate)
- `SUPABASE_SERVICE_ROLE_KEY` (für Datensatzaufbau + Gate)

Optional (Fallback nur falls Upload-Stage deaktiviert ist):

- `AZURE_FT_TRAIN_FILE_ID`
- `AZURE_FT_VALID_FILE_ID`

Empfohlene Slot-Namen (konstant, nie pro Run ändern):

- Stable: `advaic-reply-writer-stable`
- Candidate: `advaic-reply-writer-candidate`

Damit musst du bei neuen Fine-Tunes keine Env-Namen mehr anfassen; nur der Candidate-Slot bekommt ein neues Modell.

Wichtig: Das läuft nicht als dauerhafter Hintergrundprozess. Es wird zeitgesteuert im GitHub-Workflow (`schedule`) oder manuell via `workflow_dispatch` ausgeführt.
