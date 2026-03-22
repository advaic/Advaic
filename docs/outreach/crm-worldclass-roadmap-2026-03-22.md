# CRM Roadmap: World-Class Outbound System for Real-Estate Agent Outreach

## Purpose
This CRM is not a generic sales CRM.
It is an owner-only outbound operating system for finding, researching, contacting, and converting German real-estate agencies into pilots and later customers.

The system should optimize for one standard only:

`better than careful manual outreach on quality, relevance, speed, and learning rate`

## Current Baseline
The current stack already has strong foundations:

1. `prospect discovery` exists in `lib/crm/prospectDiscovery.ts`
2. `website research + enrichment` exists in `lib/crm/prospectEnrichment.ts` and `lib/crm/websiteResearchCrawler.ts`
3. `research readiness + outbound QA` exists in `lib/crm/outboundQuality.ts`
4. `next-best-action` exists in `lib/crm/nextActionEngine.ts`
5. `sequence generation + sending + tracking` exists in:
   - `app/api/crm/sequences/run/route.ts`
   - `app/api/crm/messages/[id]/send/route.ts`
   - `app/api/crm/tracking/sync/route.ts`
   - `app/api/crm/tracking/bounces/sync/route.ts`
6. `learning and rollout selection` exists in `lib/crm/sequenceExperiments.ts`

This means the right next move is not to rebuild the CRM.
The right next move is to turn the current assisted operator system into a high-precision decision engine.

## Product Standard
Before any outbound message is created, the system should be able to answer:

1. Why this office?
2. Why now?
3. Why this channel?
4. Why this contact?
5. Why this message angle?
6. Why is this safe to send?
7. What will we learn if this fails?

If the system cannot answer those questions, it should not automate the step.

## Core Architecture
The target system should be built as 6 connected loops.

### 1. Market Discovery Loop
Goal: find offices worth researching before they ever reach the main queue.

Required capabilities:

1. Search by city, region, office size clues, object focus, and trigger signals
2. Deduplicate by root domain, company identity, and near-duplicate office names
3. Score candidates before full crawl
4. Separate `candidate leads` from `accepted prospects`
5. Track why a candidate was imported or rejected

What is missing today:

1. No persistent candidate-review layer
2. No explicit discovery-run memory
3. No source-precision scoring by query, city, or domain class
4. No tracking of false positives from discovery

### 2. Account Intelligence Loop
Goal: build a structured, source-backed view of each agency.

Required capabilities:

1. Multi-page website crawl
2. Multi-source research, not website-only
3. Structured evidence storage per claim
4. Freshness and confidence per field
5. Clear research gaps, not just filled fields

The account profile should eventually know:

1. Team model: solo, owner-led, boutique, multi-office
2. Offer mix: rent, buy, new-build, commercial, investor-heavy
3. Volume signals: active listings, new listings, visible demand load
4. Process signals: forms, callbacks, docs flow, appointments, portal dependence
5. Trust signals: memberships, awards, reviews, longevity
6. Contact landscape: generic inbox, named people, LinkedIn path, phone path, contact form path
7. Pain hypotheses with confidence and supporting evidence
8. Trigger hypotheses for outreach timing

What is missing today:

1. No evidence table for field-level source attribution
2. No contact-candidate model
3. No confidence per extracted field
4. No explicit research-gap object
5. No non-website source layer

### 3. Strategy Loop
Goal: choose the best angle before writing a message.

Required capabilities:

1. Select segment and playbook
2. Select channel order
3. Select contact target
4. Select CTA type
5. Select message angle
6. Select timing and follow-up path

The strategy object should be explicit and versioned.
For each prospect, the system should persist:

1. chosen segment
2. chosen playbook
3. chosen pain angle
4. chosen trigger evidence
5. chosen CTA
6. chosen channel plan
7. chosen risk level
8. chosen fallback if first attempt fails

What is missing today:

1. Strategy is still spread across heuristics and prompt-time logic
2. No persisted decision record for why a message was chosen
3. No clear distinction between `research facts` and `strategy decision`

### 4. Message Quality Loop
Goal: ensure no message goes out unless it beats a manual quality bar.

Required capabilities:

1. Draft generation
2. Independent reviewer pass
3. Fact grounding against stored evidence
4. Style and tone compliance
5. Channel-specific QA
6. Block / revise / send decision

The reviewer should score:

1. specificity
2. evidence grounding
3. personalization depth
4. tone fit
5. CTA precision
6. risk / overclaim / genericity
7. novelty vs previous touches

What is missing today:

1. Review is useful but still mostly heuristic
2. No evidence-grounding check against structured claims
3. No draft-to-draft novelty check
4. No explicit "would Kilian actually send this?" benchmark set

### 5. Execution Loop
Goal: orchestrate outreach safely and adaptively.

Required capabilities:

1. send window logic
2. channel fallback logic
3. contact fallback logic
4. stop rules
5. manual-review gates
6. bounce and wrong-contact repair paths

What is missing today:

1. No true channel waterfall per prospect
2. No contact waterfall per office
3. No explicit retry policy for contact repair
4. No timing policy based on office type or signal freshness

### 6. Learning Loop
Goal: improve discovery, research, strategy, and messaging from outcomes.

Required capabilities:

1. attribute outcomes back to discovery source
2. attribute outcomes back to research signals
3. attribute outcomes back to strategy choices
4. attribute outcomes back to wording choices
5. log manual overrides and why they happened
6. produce rollout updates from real outcomes

What is missing today:

1. Sequence experiments exist, but mostly at variant level
2. No full learning loop from rejection reason to discovery/research/strategy fixes
3. No gold-standard comparison set for outreach quality
4. No operator feedback capture on "good lead / bad lead / good draft / bad draft"

## Data Model Upgrades
To make the system truly precise, add these tables instead of overloading `crm_prospects`.

1. `crm_discovery_runs`
   - one row per discovery run with query pack, cities, limits, totals, precision notes
2. `crm_prospect_candidates`
   - holds candidates before promotion into `crm_prospects`
3. `crm_research_evidence`
   - one row per claim with `field_name`, `field_value`, `source_url`, `source_type`, `confidence`, `captured_at`
4. `crm_contact_candidates`
   - one row per possible person/channel with role guess, confidence, source, validity status
5. `crm_strategy_decisions`
   - one row per prospect strategy version
6. `crm_quality_reviews`
   - one row per generated draft review
7. `crm_operator_feedback`
   - captures manual judgments on lead quality, strategy quality, and draft quality

These tables should sit beside the current model, not replace it all at once.

## Operator Experience
The owner-only UI should be optimized around queue clarity, not dashboards.

Primary queues:

1. `new candidates to accept`
2. `research gaps to fill`
3. `contact repair needed`
4. `strategy ready for review`
5. `safe to send now`
6. `reply needs handling`
7. `learn from outcome`

The top-level CRM should feel like a decision stack, not a report.

## Metrics That Matter
The system should be judged on these metrics:

1. discovery precision: accepted prospects / discovered candidates
2. research completeness: prospects with enough signal to write safely
3. contact success rate: prospects with at least one usable channel
4. send quality pass rate: drafts that pass QA without manual rewrite
5. reply rate by segment, channel, and strategy
6. positive reply rate by strategy
7. wrong-contact rate
8. bounce rate
9. time-to-first-safe-draft
10. manual override rate

## Phased Roadmap
### Phase 1: Precision Foundation
Scope:

1. add `crm_discovery_runs`
2. add `crm_prospect_candidates`
3. add `crm_research_evidence`
4. add `crm_contact_candidates`
5. separate `candidate` from `accepted prospect`
6. log discovery score, rejection reason, and acceptance reason
7. persist research gaps and field confidence

Success condition:
The system can explain exactly why a prospect exists in the queue and what is still missing.

### Phase 2: Research and Contact Intelligence
Scope:

1. extend crawler to collect named people, offices, phones, forms, and contact surfaces
2. add second-source research layer
3. add contact confidence scoring
4. add explicit contact waterfall per office
5. create a `missing contact` repair queue

Success condition:
Most good prospects have at least one usable and confidence-scored contact path.

### Phase 3: Strategy Engine
Scope:

1. persist strategy decisions separately from prospect facts
2. formalize playbook selection
3. add CTA selection logic
4. add channel plan logic
5. add fallback strategy if no reply / bounce / wrong person / timing objection

Success condition:
Every draft can be traced back to a stored strategy decision.

### Phase 4: Grounded Message QA
Scope:

1. compare every claim in the draft to stored evidence
2. block unsupported claims
3. score novelty against prior attempts
4. build a manual gold-set of approved and rejected messages
5. add a reviewer mode trained on your actual send judgment

Success condition:
The CRM stops producing messages you would rewrite immediately.

### Phase 5: Adaptive Automation
Scope:

1. auto-schedule only when research, contact, strategy, and quality all pass
2. channel fallback execution
3. contact fallback execution
4. timing adjustments by office type
5. stage-aware automation depth

Success condition:
Automation only runs where it is truly safer and faster than manual work.

### Phase 6: Self-Improving System
Scope:

1. feed outcomes back into discovery scoring
2. feed outcomes back into strategy scoring
3. feed outcomes back into variant selection
4. use operator feedback to retrain ranking and review logic
5. add postmortem-driven fixes for bad leads and bad drafts

Success condition:
The system gets measurably better from every wave of outreach.

## What Not To Do Yet
Do not spend time on:

1. visual redesign for the owner-only console
2. generic CRM features for teams, pipelines, or permissions
3. broad AI generation without stronger evidence grounding
4. full autonomy before confidence, contact quality, and learning loops are in place

## Recommended Immediate Build Order
This is the best first sequence from today:

1. add `crm_discovery_runs` and `crm_prospect_candidates`
2. split discovered candidates from accepted prospects
3. add `crm_research_evidence` and field-confidence writes from enrichment
4. add `crm_contact_candidates`
5. add a candidate-review queue in `/app/crm`
6. add a research-gap queue
7. add persisted strategy decisions
8. upgrade outbound review to evidence-grounded QA

## Bottom Line
The right ambition is not "best CRM."
The right ambition is:

`best single-operator outbound acquisition system for German real-estate agencies`

If the roadmap stays disciplined around that standard, this can become much better than manual work without turning into a bloated generic sales tool.
