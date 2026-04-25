# CLAUDE.md

This file is the project's authoritative spec. Every Claude Code agent (planner, builder, reviewer) reads this before doing anything. It encodes architectural invariants, hard rules, and calibration anchors. Do not modify without explicit human approval logged in `warnings/architecture-changes.md`.

**If you are resuming an autonomous build:** read `HARNESS.md` first — it has the resume protocol, the autonomy charter, and the credential-block manifest. Then come back here.

## Project mission

We are building a generative-UI proof-of-concept for the **T127 capstone**: a self-paced data fluency module for Harvard staff that fades scaffolding as the learner demonstrates mastery. Each learner response shapes both the next interaction and a backend dictionary of cross-school data terminology. The module sits inside Harvard's LMS as a Vue 3 component in an iframe.

The module is not a stats course. It is a **data fluency** instrument: the goal is shared interpretation, vocabulary, and judgment across Harvard staff. Computation is out of scope.

## What is being built

A Vue 3 application that:

1. Renders one of five scaffold components per turn, selected by a rule-based function from current learner state.
2. Generates content (scenarios, hints, feedback) via LLM calls to a backend API.
3. Stores responses, infers mastery, and updates state asynchronously.
4. Provides a searchable dictionary of data terms with school-specific usage notes.
5. Captures high-quality learner responses as artifacts for future iterations (v2).

## Architectural invariants (do not change)

These are the load-bearing decisions. Changing any of these requires explicit human approval and a note in `warnings/architecture-changes.md`.

1. **The Scaffold Selector is a rule-based pure function. Not an LLM call.** Reads `(mastery: number, history: Interaction[])`, returns one of five component names. This is the single most defensible piece of pedagogy in the capstone — the committee can read the rule.

2. **Five tiers, mapped to ICAP (Chi & Wylie 2014):**
   - Tier 1 — `WorkedExample` (Passive). Activates when `mastery < 0.20`.
   - Tier 2 — `ScaffoldedMCQ` (Active, MCQ + always-visible hint). `0.20 ≤ mastery < 0.45`.
   - Tier 3 — `GuidedShortAnswer` (Active, short-answer with prompt scaffolds). `0.45 ≤ mastery < 0.65`.
   - Tier 4 — `BareLongAnswer` (Constructive, no scaffolding). `0.65 ≤ mastery < 0.85`.
   - Tier 5 — `WikiDraft` (Interactive, learner contributes). `mastery ≥ 0.85`.

3. **Four LLM agent roles, all on Gemini 3.1 Flash Lite.** Single-model architecture. Roles are: Content Generator, State Inferrer, Quality Evaluator, Template Filler. Differentiated by system prompt and `thinkingLevel` config, not by model. Use `thinkingLevel: 'medium'` for Content Generator and Quality Evaluator (judgment-heavy), `thinkingLevel: 'low'` for State Inferrer and Template Filler (structured-output-heavy).

4. **All LLM traffic via direct Google AI Studio (`@ai-sdk/google` + `GEMINI_API_KEY`).** v1 is a proof-of-concept; the Harvard API Portal path is documented as a v1.5 swap (one-line `baseURL` change) but not used here. Frontend never sees API keys; backend reads from env. See "Stack" section for provider config.

5. **Content is files, not vectors.** Concepts and dictionary entries are MD files with YAML frontmatter. Scenarios and datasets are JSON. The runtime loads everything into memory at startup and retrieves by ID. No embeddings, no vector DB, no semantic search. Dictionary search is client-side fuzzy match (Fuse.js).

6. **Visible-thinking and constructivism rules are baked into every Content Generator prompt.** See content rules below. Validators check compliance.

## Hard rules — never violate

1. **NEVER include calculation requirements above mean / median / proportion.** This is data fluency, not data analytics. If a generated scenario asks the learner to "calculate" anything more complex than these three, the reviewer rejects it.

2. **NEVER use real Harvard people, real salary data, or real student records.** All data is synthetic. Every dataset must include `plausibility_notes[]` declaring its synthetic boundary.

3. **NEVER skip visible-thinking scaffolds above tier 1.** Every tier 2+ scenario must embed one of the named routines (See-Think-Wonder, Claim-Support-Question, Connect-Extend-Challenge).

4. **NEVER auto-publish wiki drafts.** Quality Evaluator scores entries. "Publishable" entries route to a human review queue. (Out of scope for v1, but the hooks must remain.)

5. **NEVER store API keys or secrets in frontend code or in any file under `frontend/`.** All LLM calls go through the backend.

6. **NEVER let scenarios reference data the dataset does not contain.** Validator (`scripts/validate_exemplar_consistency.ts`) enforces that scenario artifact stats match dataset row stats within $100.

7. **NEVER assume schools share data terminology.** Always ground in the dictionary; do not hallucinate school-specific usage. Dictionary entries cover HGSE, HBS, FAS, HMS, SEAS minimum. Other schools marked `not yet verified`.

## Stack

| Layer | Choice | Version pin |
|---|---|---|
| Frontend | Vue 3 + TypeScript + Vite | vue@3.5.x, vite@6.x |
| UI primitives | shadcn-vue + Tailwind | latest |
| AI client | `@ai-sdk/vue` (AI SDK v6) | @ai-sdk/vue@2.0.x, ai@6.0.x |
| LLM provider | `@ai-sdk/google` for Gemini 3.1 Flash Lite | @ai-sdk/google@2.0.x |
| Backend | Hono on Node.js | hono@4.x |
| LLM (v1 POC) | Gemini 3.1 Flash Lite via direct Google AI Studio | gemini-3.1-flash-lite-preview |
| LLM (v1.5 pilot path) | Gemini 3.1 Flash Lite via Harvard API Portal (one-line baseURL swap) | same model id |
| LLM (emergency fallback) | Claude Haiku 4.5 via direct Anthropic | claude-haiku-4-5-20251001 |
| DB | Neon Postgres + Drizzle ORM | latest |
| Validation | Zod | zod@3.x |
| Search (dictionary) | Fuse.js client-side | fuse.js@7.x |
| Deployment | Vercel | — |

### Why Gemini 3.1 Flash Lite

- Generative UI is a stated launch use case (per Google's release blog).
- ~97% structured output compliance and ~94% intent routing accuracy in production tests — exactly the capabilities our tool-calling architecture stresses.
- Pricing: $0.25/M input, $1.50/M output. ~5x cheaper than Claude Haiku 4.5 on output tokens.
- 1M token context window allows full content library to be passed inline without RAG complexity.
- Granular thinking levels (minimal/low/medium/high) let us route by agent role without switching models.
- Available via Harvard API Portal under existing Google enterprise agreement (DSL 3 approved).

### Status caveat

Gemini 3.1 Flash Lite is currently in **preview**. Pin to a specific snapshot ID when one is available (e.g., `gemini-3.1-flash-lite-preview-03-2026`). Keep Claude Haiku 4.5 wired as an emergency fallback in env config — the swap is two lines in the provider initialization if Google deprecates the preview before our demo.

### LLM call configuration per role

```typescript
// Content Generator: judgment-heavy prose generation
{ model: gemini('gemini-3.1-flash-lite-preview'), thinkingLevel: 'medium', maxOutputTokens: 2000 }

// State Inferrer: structured JSON classification
{ model: gemini('gemini-3.1-flash-lite-preview'), thinkingLevel: 'low', maxOutputTokens: 500, responseFormat: { type: 'json_object' } }

// Quality Evaluator: rubric scoring
{ model: gemini('gemini-3.1-flash-lite-preview'), thinkingLevel: 'medium', maxOutputTokens: 800 }

// Template Filler: deterministic structured output
{ model: gemini('gemini-3.1-flash-lite-preview'), thinkingLevel: 'low', maxOutputTokens: 1000, responseFormat: { type: 'json_object' } }
```

## Content rules — embedded in every Content Generator system prompt

### Visible thinking
- Every scenario at tier 2 or above poses observation **before** inference. "What do you notice" precedes "what do you conclude."
- Every short-answer or long-answer prompt requires `claim + support + question`. Pure claims without reasoning fail rubric.
- Every scenario ends with "What question do you still have?" — captured into `visible_thinking_prompts.wonder`.
- Long-answer rubrics score reasoning quality, not answer correctness. A wrong conclusion with strong reasoning scores higher than a right conclusion with no reasoning.

### Constructivism
- Scenarios start from staff context, not abstract statistics. Setup prose names a role-plausible situation before invoking any concept.
- No single-answer acceptance above MCQ tier. Rubric-based eval.
- Prior knowledge is elicited: the first scenario for any concept asks "where have you seen this before?"
- Generic Harvard staff audience for v1. Architecture allows role parameterization (deferred to v2).

### Pedagogical scope
- Data fluency = vocabulary, interpretation, and reading skill. NOT computation.
- Examples must be plausibly Harvard-staff-relevant (admissions, advising, giving, course evaluation, institutional research).
- The reading example in every concept primer is a short, plausible Harvard communication snippet.

## AI SDK v6 idioms (do not deviate)

- Use `streamText`, not `streamUI`. RSC is experimental as of v6.
- Tool definitions: `{ description, inputSchema (zod), execute }`.
- Tool results render as `message.parts` where `part.type` starts with `tool-`.
- For Vue: `import { useChat } from '@ai-sdk/vue'`; bind to `<script setup>`.
- For multi-step tool calls: `stopWhen: stepCountIs(N)`.
- Google provider: `import { createGoogleGenerativeAI } from '@ai-sdk/google'`.
- Auth: pass `apiKey` and optional `baseURL` (for Harvard portal endpoint).

See `.claude/skills/ai-sdk/SKILL.md` for the official Claude Code skill from Vercel and `docs/references/ai-sdk-llms.txt` for the full reference. Fetch instructions are in those files.

## Harness pattern (planner / builder / reviewer)

Each feature in `feature_list.json` flows through three roles:

1. **Planner** reads the feature, breaks it into concrete file changes, writes a plan to `claude-progress.txt`.
2. **Builder** implements the plan. May iterate. Cannot mark complete without reviewer sign-off.
3. **Reviewer** runs `test_command` and validates against `acceptance_criteria`. Two outcomes: pass (mark `complete`) or fail (return to builder with stderr).

After 2 review rejections, builder wins: feature marked `accepted_with_warning`, warning logged to `warnings/<feature_id>.md` for human review next morning. Harness continues.

Features with `needs_human_input: true` block their downstream features until a human resolves. Harness pauses on these and proceeds with parallel features that don't depend on them.

Multiple agent teams (`team_a`, `team_b`, ...) work in isolated git worktrees on parallel features. Merge at phase boundaries.

## File structure

```
/
├── CLAUDE.md                       # This file
├── README.md
├── taxonomy.json                   # 25 concepts, prerequisite DAG
├── feature_list.json               # Harness work queue
├── claude-progress.txt             # Append-only progress log (created by harness)
├── .env.example
├── .claude/
│   └── skills/
│       └── ai-sdk/SKILL.md         # AI SDK Claude Code skill (fetch from Vercel)
├── content/
│   ├── concepts/<id>.md            # Concept primers (MD + frontmatter)
│   ├── dictionary/<term>.md        # Dictionary entries
│   ├── scenarios/<concept>-tier-<n>-<seq>.json
│   ├── datasets/<id>.json          # Synthetic datasets
│   └── thinking-routines/<id>.md   # Routine templates
├── docs/
│   └── references/
│       ├── ai-sdk-llms.txt         # AI SDK reference (fetch from ai-sdk.dev/llms.txt)
│       └── README.md               # Fetch instructions
├── lib/
│   └── schemas/content-schemas.ts  # Zod schemas for all content types
├── scripts/
│   ├── validate_exemplar_consistency.ts
│   ├── validate_taxonomy.ts        # Generated by F001
│   ├── validate_primers.ts         # Generated by F003
│   ├── validate_dictionary.ts      # Generated by F004
│   ├── validate_scenarios.ts       # Generated by F006
│   └── generators/                 # Parametric dataset generators (F005)
├── warnings/                       # accept_with_warning logs
├── frontend/                       # Vue 3 + Vite app (F007 onward)
└── backend/                        # Hono API (F010)
```

## Calibration anchors

Four exemplar files in `content/` are hand-calibrated and serve as the gold-standard rubric:

- `content/concepts/central-tendency.md`
- `content/dictionary/median.md`
- `content/scenarios/central-tendency-tier-2.json`
- `content/datasets/hgse_cohort_salaries.json`

When generating new content, match the exemplar's structure, voice, depth, and the way visible-thinking routines are embedded. The Reviewer agent uses these as the LLM-judge rubric anchor — content scoring below the exemplar fails review.

**Mathematical consistency rule:** when a scenario references a dataset, the stats in the scenario `artifact.content` must match computed stats from the dataset's `rows` within $100. The validator enforces this.

## Reference grounding

The Content Generator's system prompt cites these as authority:

- Gal, I. (2002). "Adults' Statistical Literacy" — defines literacy as distinct from stats education.
- Bergstrom & West, *Calling Bullshit* (callingbullshit.org) — case study format and critical reading frame.
- ASA GAISE 2016 — outcome taxonomy for statistical literacy.
- Schield, M. (statlit.org) — interpretation-not-computation framing.
- Chi & Wylie (2014) "The ICAP Framework" — tier definitions.
- Ritchhart, Church, Morrison (2011) *Making Thinking Visible* — visible thinking routines.

Place PDFs in `docs/references/` if you have access. The harness does not fetch them; agents reference by citation.

## Out of scope for v1 (do not build)

These are documented for v2; do not let agents drift into building them:

- Cross-silo wiki retrieval (replaced by static dictionary in v1).
- Role parameterization (architecture allows; not used in v1 demo).
- Multi-school dictionary verification beyond HGSE / HBS / FAS / HMS / SEAS.
- Vector embeddings or semantic search.
- Real-time collaboration on wiki drafts.
- Authentication beyond simple session ID.
- LMS Single Sign-On.
- Production rate-limiting or abuse prevention.

If a feature in `feature_list.json` drifts toward any of these, planner flags `needs_human_input: true` and pauses.

## Version

v1.1 — Gemini 3.1 Flash Lite swap. AI SDK pinned to v6. Claude Code skill scaffolding added.
