# Data Fluency Module — Capstone

A generative-UI proof-of-concept for the **T127 capstone**: a self-paced data fluency module for Harvard staff that fades scaffolding as the learner demonstrates mastery, while building a backend dictionary of cross-school data terminology.

**Live demo:** https://data-fluency-module.vercel.app
**Source:** https://github.com/lpbangun/GenUI-for-Education-Modules

## What this is

A learning module that lives inside Harvard's LMS as a Vue 3 component in an iframe. The novelty is internal: each learner sees one of five scaffold components per turn, selected by a rule-based function from current mastery. Content is generated at runtime against a fixed catalog of pedagogical scaffolds. The wrapper is conventional, the substrate is generative.

The module is also an **instrument for resolving cross-school terminology fragmentation**. Tier-graded dictionary handoffs persist real usage divergence reported by learners, which feed back into the dictionary entry UI as "reported by colleagues" notes alongside the canonical course-team note.

## What's in the deployed app

- **`/module/:concept_id`** — interactive learner-facing flow. Drag the mastery slider, click *Generate content*. The LLM call returns a tier-appropriate scaffold + (optional) chart or flowchart + a tier-graded dictionary handoff.
- **`/demo/autoplay`** — 60-second pre-generated demo of all five tiers for the committee. Zero per-play LLM cost.
- **`/dictionary`** — searchable list of 51 terms; each entry shows the canonical course-team note plus any "reported by colleagues" divergence collected at runtime.
- **`/architecture`** — system overview written for the committee.
- **`/design-decisions`** — DD-001 through DD-010, the architectural decision log.

## The five-tier scaffold ladder (ICAP, Chi & Wylie 2014)

| Mastery | Tier | Component | Cognitive role |
|---|---|---|---|
| `< 0.20` | 1 | `WorkedExample` | Passive — the learner watches reasoning |
| `0.20 ≤ m < 0.45` | 2 | `ScaffoldedMCQ` | Active — observation-before-inference, reasoning-bearing distractors |
| `0.45 ≤ m < 0.65` | 3 | `GuidedShortAnswer` | Active — claim/support/question scaffolds |
| `0.65 ≤ m < 0.85` | 4 | `BareLongAnswer` | Constructive — scaffolds withheld |
| `≥ 0.85` | 5 | `WikiDraft` | Interactive — learner contributes to the dictionary |

Selector lives in `lib/scaffold-selector.ts` as a pure function. **Not** an LLM call. The committee can read the rule.

## Dictionary handoff (DD-008)

The handoff fades scaffolding the same way the scaffolds do:

- **T1–T2 passive** — surfaced terms become clickable.
- **T3–T4 active** — one-question card asks "is this how your team uses this term?" Responses persist to `dictionary_handoff_responses`.
- **T5 constructive** — structured wiki-draft form. Submissions land in `wiki_drafts` with `status='pending_review'`. **Never auto-published** (CLAUDE.md hard rule #4).

PII tripwire (`lib/db/pii-tripwire.ts`) gates all learner-submitted free text — emails, salary figures, student-ID-like sequences, and full-name patterns are rejected at write time.

## Architecture at a glance

```
                   ┌──────────────────────────────────────┐
                   │       composeTurn (DD-007)           │
                   │   single composition path used by    │
                   │   both autoplay and live module      │
                   └──────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  pickScaffold()       pickVisualization()    SYSTEM_PROMPTS[tier]
  (rule, DD-001)         (rule, DD-005)        (prompt, DD-006)
                              │
                              ▼
                       generateText({ tools })
                              │
                              ▼
        Turn { scaffold, viz, termsSurfaced, dictionaryHandoff }
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  Scaffolds.vue        DictionaryHandoffCard    WikiDraftForm
  (5 tier UIs)         (T3+ active)             (T5 constructive)
```

Two persistence tables: `dictionary_handoff_responses` and `wiki_drafts`. Both are lazy-initialized — when `DATABASE_URL` is unset, repos log a warning and soft-success so dev/preview can run without Postgres.

## Stack

- **Frontend:** Vue 3 + TypeScript + Vite + Tailwind, deployed to Vercel
- **Backend:** Hono on Bun, deployed as a Vercel serverless function
- **LLM:** Gemini 3.1 Flash Lite (preview) via `@ai-sdk/google` direct
- **DB:** Neon Postgres via Drizzle ORM (lazy — optional in dev)
- **Validation:** Zod
- **Search:** Fuse.js (client-side, dictionary only)

## Why prompts not schemas (DD-006)

The original plan called for Zod-typed templates with `generateObject` and 25 per-concept anchor files. Measurement showed token cost is negligible at v1 scale, so the schema burden was no longer earning its keep. Pedagogy enforcement now lives entirely in **per-tier system prompts** (`lib/prompts/`); structural fields ride along as optional inputs on each scaffold tool. A soft validator (`scripts/validate_turn_compliance.ts`) scans for compliance and warns. Sustained > 20% failure on any check is the escalation signal to adopt the deferred schema-typed path. See `docs/design-decisions.md` for the full reasoning.

## Why tail-block data lives in tool inputs (DD-010)

Course correction discovered during the first live regen: under `toolChoice: 'required'`, Gemini Flash Lite collapses all output into the forced tool call — `result.text` comes back empty. Trailing `<terms_surfaced>` blocks never arrive. Fix: `terms_surfaced` and `dictionary_handoff` are optional fields **inside** each scaffold tool's input schema. Single round-trip, cheapest possible fix. Optional fields preserve DD-006's permissive contract.

## Repo layout (post-implementation)

```
.
├── CLAUDE.md                                       # Authoritative project spec
├── README.md                                       # You are here
├── docs/
│   ├── architecture.md                             # System overview for the committee
│   ├── design-decisions.md                         # DD-001..DD-010
│   ├── superpowers/specs/2026-04-29-...md          # Pedagogy + handoff spec
│   ├── superpowers/plans/2026-04-29-...md          # 30-task implementation plan
│   └── references/                                 # AI SDK + pedagogical PDFs
├── content/
│   ├── concepts/<id>.md                            # 25 concept primers
│   ├── dictionary/<term>.md                        # 51 dictionary entries
│   ├── scenarios/<concept>-tier-<n>-<seq>.json     # Generated scenarios
│   ├── datasets/<id>.json                          # Synthetic datasets
│   └── thinking-routines/                          # Routine references
├── lib/
│   ├── types.ts                                    # Turn, DictionaryHandoff
│   ├── turn-composer.ts                            # composeTurn (DD-007)
│   ├── scaffold-selector.ts                        # rule-based tier selector
│   ├── viz-selector.ts                             # rule-based viz selector
│   ├── tail-blocks.ts                              # legacy parser, kept dormant
│   ├── prompts/                                    # 5 per-tier system prompts + base
│   ├── schemas/content-schemas.ts                  # Zod schemas
│   └── db/
│       ├── schema.ts                               # Drizzle: handoff + wiki tables
│       ├── client.ts                               # lazy DB client
│       ├── handoff-repo.ts                         # T3+ active submission writer
│       ├── wiki-repo.ts                            # T5 constructive submission writer
│       ├── pii-tripwire.ts                         # PII guard for free text
│       └── migrations/                             # Generated SQL
├── backend/
│   ├── index.ts                                    # Hono routes (chat, infer, eval, handoff, wiki)
│   └── tools.ts                                    # AI SDK v6 tool definitions
├── frontend/
│   └── src/
│       ├── components/scaffolds/                   # 5 visual layer components
│       │   ├── TierTransition.vue
│       │   ├── DistractorReveal.vue
│       │   ├── DictionaryHandoffCard.vue
│       │   ├── TermsSurfacedSidebar.vue
│       │   └── WikiDraftForm.vue
│       └── views/                                  # Module, Autoplay, Architecture, DesignDecisions, etc.
├── scripts/
│   ├── pregenerate_autoplay.ts                     # Calls composeTurn; writes bundle
│   ├── validate_turn_compliance.ts                 # Soft validator (advisory)
│   ├── validate_*.ts                               # Other content validators
│   └── generators/                                 # Parametric dataset generators
└── .github/workflows/invariant-drift.yml           # CI gate against silent invariant drift
```

## Running locally

```bash
# install
bun install

# env — at minimum set GEMINI_API_KEY
cp .env.example .env
# edit .env

# run backend (port 3001) and frontend (default Vite port) in two terminals
bun run backend/index.ts
cd frontend && bun run dev
```

The handoff and wiki-draft routes work without `DATABASE_URL` — they log a warning and return `{ok: true}` without persisting. Set `DATABASE_URL` (Neon Postgres) to enable persistence; run `bun run db:migrate` to apply the schema.

## Tests + validators

```bash
bun test                                      # 56+ unit tests across lib/, backend/, scripts/
bun run validate:taxonomy                     # 25-concept DAG check
bun run validate:primers                      # concept primer schema
bun run validate:dictionary                   # dictionary entry schema
bun run validate:scenarios                    # scenario schema
bun run validate:exemplars                    # math consistency
bun run validate:turn-compliance <file.json>  # soft pedagogy validator
```

## Privacy and data classification

Staff responses classify as Harvard **DSL 3** (Medium Risk Confidential). v1 routes LLM traffic through Google AI Studio directly; v1.5 swaps `baseURL` to Harvard's API Portal under the existing Google enterprise agreement (one-line change). All learner-submitted free text passes through the PII tripwire before write. No real Harvard people, salary figures, or student records are present anywhere — generated or stored.

## Reference grounding

Pedagogical:
- Gal, I. (2002). "Adults' Statistical Literacy."
- Bergstrom & West, *Calling Bullshit* (callingbullshit.org).
- ASA GAISE 2016 College Report.
- Schield, M. — statlit.org.
- Chi & Wylie (2014). "The ICAP Framework."
- Ritchhart, Church, Morrison (2011). *Making Thinking Visible*.

Technical:
- AI SDK v6: https://ai-sdk.dev/llms.txt (place at `docs/references/ai-sdk-llms.txt`)
- Gemini 3.1 Flash Lite: `gemini-3.1-flash-lite-preview` via `@ai-sdk/google`

## Status

v1.2 — Pedagogy + dictionary handoff layer shipped. `composeTurn` single-path composition; per-tier system prompts; tier-graded handoff persistence; visual interactivity layer (tier transitions, distractor reveal, inline handoff card, terms sidebar, wiki form); architecture + design-decisions docs with CI invariant-drift gate. Course-correction during execution: tail-block data moved into tool-call inputs (DD-010) after Gemini's empty `result.text` under forced-tool-call mode was discovered.
