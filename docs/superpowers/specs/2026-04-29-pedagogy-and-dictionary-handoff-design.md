# Pedagogy + Dictionary Handoff — Design

**Date:** 2026-04-29
**Status:** Draft, pending user review
**Supersedes:** Earlier preset-scaffolds direction (deferred — see DD-006)

## Problem

Two issues observed in the deployed app:

1. **Pedagogical gap.** Generated questions read as yes/no MCQs with "wrong, try again"-style feedback. CLAUDE.md mandates observation-before-inference, claim/support/question scaffolds, mandatory wonder prompts, and dictionary handoff at every tier ≥ 2. The current Content Generator output silently violates these rules.
2. **Dictionary fragmentation thesis is unrealized.** The capstone's load-bearing claim — that this module solves cross-school terminology fragmentation by surfacing real usage divergence — has no persistence layer. Nothing the learner does feeds back into the dictionary.

Token consumption was originally a third concern; measurement showed it is negligible at current scale, so cost is **not** a driver for this design (see DD-006).

## Goals

- Every generated turn at tier 2 and above carries the pedagogical structure CLAUDE.md requires.
- Learner interactions at tier 3 and above persist into structured tables that feed the dictionary's cross-school usage section.
- The scaffold-fade-as-mastery-grows arc is visually legible to the learner — it isn't only a backend rule.
- One composition path (`composeTurn`) drives both the autoplay demo and the live module, preventing drift.
- Architectural decisions are recorded in human-readable docs the capstone committee can read.

## Non-goals (v1)

- Zod-schema-typed templates with `generateObject` (deferred path B — see "Deferred").
- Per-concept ConceptAnchor files (deferred path C — content-production project).
- Fallback Turns, retry policy, Neon cache (cost-driven; not justified at current scale).
- Auth, vector search, role parameterization, real-time collaboration, multi-school beyond HGSE/HBS/FAS/HMS/SEAS.
- Auto-publishing any wiki draft (CLAUDE.md hard rule).

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  composeTurn(conceptId, mastery, history, surfacedTerms)     │
│                                                              │
│  1. tier         = pickScaffoldTier(mastery, history)        │
│  2. vizDecision  = pickVisualization(...)                    │
│  3. systemPrompt = SYSTEM_PROMPTS[tier]   ← per-tier rewrite │
│  4. userPrompt   = buildUserPrompt(...)                      │
│  5. result       = generateText({ model, system, prompt,     │
│                                  tools: [scaffold, viz] })   │
│  6. parseTailBlocks(result.text)  ← <terms_surfaced>,        │
│                                     <dictionary_handoff>     │
│  7. softValidate(turn)            ← warn, never block        │
│  8. return Turn                                              │
└──────────────────────────────────────────────────────────────┘
            ▲                                ▲
            │                                │
   ┌────────┴───────┐               ┌────────┴────────┐
   │ Live module    │               │ Autoplay        │
   │ (per turn)     │               │ pregenerator    │
   └────────────────┘               └─────────────────┘
```

`composeTurn` lives at `lib/turn-composer.ts` and is the **only** function that produces a Turn. Both the live `/module` route and `scripts/pregenerate_autoplay.ts` call it.

### What's preserved (unchanged)

- Scaffold Selector — rule-based pure function, ICAP-mapped 5 tiers (CLAUDE.md invariant 1–2).
- `lib/viz-selector.ts` — rule-based visualization choice.
- Single-model architecture: Gemini 3.1 Flash Lite, role differentiation by system prompt + thinkingLevel (CLAUDE.md invariant 3).
- Content as files, not vectors (CLAUDE.md invariant 5).
- Scaffold tools (`WorkedExample`, `ScaffoldedMCQ`, `GuidedShortAnswer`, `BareLongAnswer`, `WikiDraft`) and viz tools (`render_chart`, `render_flowchart`).

### What's new

- **Per-tier system prompts** carrying the pedagogical contract.
- **Structured tail blocks** appended to the model's text output: `<terms_surfaced>...</terms_surfaced>` and `<dictionary_handoff>...</dictionary_handoff>`. Frontend parses; backend persists.
- **Dictionary handoff persistence** — two Drizzle tables and a view.
- **Visual interactivity layer** in the scaffold components.
- **Soft validator** — `scripts/validate_turn_compliance.ts`, advisory only.
- **Docs** — `docs/architecture.md`, `docs/design-decisions.md`, with CI gate against silent invariant drift.

## Section 1 — Per-tier system prompts

One system prompt per tier, stored as static strings in `lib/prompts/<tier>.ts`. Each one:

- Names the tier and its ICAP role explicitly to the model.
- Lists the structural beats the turn must contain (observation → stem → distractors-with-reasoning → wonder, etc.).
- Forbids "wrong, try again" boilerplate in distractor feedback; requires reasoning that explains *why someone would pick this option*.
- Requires the tail blocks (`<terms_surfaced>`, `<dictionary_handoff>`) at the end of every response, with kind = passive/active/constructive matched to tier.
- Cites CLAUDE.md authority: visible thinking, constructivism, no-calculation, synthetic-only, no-real-Harvard-people.
- Includes a one-shot example that demonstrates the desired shape.

The tail-block format (parsed by the frontend):

```
<terms_surfaced>median, skew</terms_surfaced>
<dictionary_handoff kind="active" candidate_term="median">
Is this how your school uses this term?
options: yes | no | unsure | differently
</dictionary_handoff>
```

Per-tier handoff kind:
- T1 WorkedExample → `kind="passive"`, terms only.
- T2 ScaffoldedMCQ → `kind="passive"`, terms only.
- T3 GuidedShortAnswer → `kind="active"`, single candidate term, school-usage question.
- T4 BareLongAnswer → `kind="active"`, 2–3 surfaced terms, "which did your reasoning depend on?"
- T5 WikiDraft → `kind="constructive"`, target term + draft skeleton.

Soft validator scans for these blocks and warns on absence; missing tail blocks do not block the turn from rendering — the frontend renders what it has.

## Section 2 — Dictionary handoff persistence

The load-bearing piece for the capstone thesis.

### Tables (Drizzle)

```ts
// lib/db/schema.ts

export const dictionaryHandoffResponses = pgTable('dictionary_handoff_responses', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  conceptId: text('concept_id').notNull(),
  term: text('term').notNull(),
  schoolSelfReported: text('school_self_reported'),  // HGSE | HBS | FAS | HMS | SEAS | other | null
  agreement: text('agreement').notNull(),             // yes | no | unsure | differently
  freeText: text('free_text'),                        // ≤ 200 chars, PII-tripwire validated
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wikiDrafts = pgTable('wiki_drafts', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  term: text('term').notNull(),
  school: text('school').notNull(),
  howWeUseIt: text('how_we_use_it').notNull(),
  exampleInPractice: text('example_in_practice'),
  differsFromOtherSchools: text('differs_from_other_schools'),
  qualityScore: integer('quality_score'),             // populated async by Quality Evaluator (deferred)
  status: text('status').notNull().default('pending_review'),  // pending_review | approved | rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Read path back into the dictionary

A SQL view `dictionary_term_usage_v` joins:
- The course-designer-authored notes in `content/dictionary/<term>.md` (loaded at startup, never overwritten).
- The aggregate of `dictionary_handoff_responses` filtered to `agreement IN ('no', 'differently')` with non-null `freeText`, grouped by `schoolSelfReported`, top-3 by recency.

The dictionary entry UI renders both, **clearly labeled separately**:
- "Course team note:" — from the markdown file.
- "Reported by colleagues:" — from the live aggregate.

This is what makes the dictionary a living artifact of cross-school divergence, not a static glossary.

### Privacy guards

- `schoolSelfReported` is school-level only — never department, never role.
- `freeText` capped at 200 chars and run through a regex tripwire at write time (rejects strings matching name patterns, emails, salary figures, student-ID-like sequences). Tripped writes are dropped silently and a warning logged.
- `sessionId` is the existing simple session ID (CLAUDE.md scope) — no auth identity.
- CLAUDE.md hard rule #2 (no real Harvard people / salaries / student records) extends to learner-submitted text, not just generated content.

### What never happens automatically

- Wiki drafts are never auto-published (CLAUDE.md hard rule #4). They land with `status = 'pending_review'`.
- Handoff responses are never auto-merged into the canonical dictionary entry markdown. Course designers consume the aggregate via the view; updates to canonical notes are deliberate human edits.

## Section 3 — `composeTurn` single composition path

`lib/turn-composer.ts` exports:

```ts
export async function composeTurn(input: {
  conceptId: string;
  mastery: number;
  history: Interaction[];
  surfacedTerms: string[];
}): Promise<Turn>
```

This is the *only* place the model is invoked for content generation. Both:

- The live module's `/api/turn` route — replaces the current inline `generateText` call.
- `scripts/pregenerate_autoplay.ts` — replaces its inline tool-call orchestration.

Both call sites read `composeTurn`'s return shape; the backend route streams to the frontend, the autoplay script writes to `frontend/src/data/autoplay-bundle.json`. Drift between demo and live module becomes structurally impossible.

The `Turn` shape is a TypeScript interface (not a Zod schema) defined in `lib/types.ts`:

```ts
export interface Turn {
  tier: TierName;
  conceptId: string;
  mastery: number;
  vizDecision: VizDecision;
  scaffold: { name: TierName; input: unknown };  // tool input from the scaffold tool call
  chart: ChartInput | null;
  flowchart: FlowchartInput | null;
  termsSurfaced: string[];                        // parsed from tail block
  dictionaryHandoff: DictionaryHandoff;            // parsed from tail block
}
```

Any shape mismatch is caught at the parse-tail-blocks step; missing fields fall back to safe defaults (`termsSurfaced: []`, `dictionaryHandoff: { kind: 'passive', termsSurfaced: [] }`) and the soft validator logs a warning.

## Section 4 — Visual interactivity layer

The scaffold-fade-as-mastery-grows arc is the most interesting *pedagogical* claim and currently the most *invisible* one to the learner. This section makes it legible.

### 4.1 Tier transitions

When mastery crosses a tier boundary mid-session, render an inline transition card:

> "You've moved from **scaffolded recognition** to **guided interpretation**. Hints will be lighter from here."

A subtle 600ms fade between the previous and next scaffold component, not an abrupt swap. Implemented as a `<TierTransition>` Vue component triggered by a watcher on the active tier.

### 4.2 Distractor-reasoning reveal (T2)

Currently, all distractor feedback would dump as a wall of text. Instead:

- Distractor `why_this_reasoning` is **collapsed by default**.
- After the learner picks an option, all four distractors expand simultaneously to show their reasoning — the learner sees not just *why their answer was right or wrong* but *why each alternative might have looked plausible*.
- This is the constructivist contract: surface multiple reasoning paths, not single-answer correctness.
- Implemented in `frontend/src/components/scaffolds/ScaffoldedMCQ.vue` with a Vue transition group.

### 4.3 Dictionary handoff as inline card

The active handoff (T3+) renders as an inline card *below* the main scaffold, not a modal. Modal interruption breaks the reasoning flow; inline keeps the learner in context.

The card animates in (200ms slide + fade) only after the learner has started engaging with the main prompt — no premature distraction.

Card shape:

```
┌─────────────────────────────────────────────┐
│ One quick check: how does **your team** use │
│ the word "median"?                          │
│                                             │
│ ( ) Same as the course team note            │
│ ( ) We use it differently                   │
│ ( ) Not sure                                │
│                                             │
│ [optional, expands when "differently"]      │
│ How does your team use it?                  │
│ [          200 chars max          ]         │
└─────────────────────────────────────────────┘
```

### 4.4 Term-touched indicators

When a term enters `surfacedTerms` for the first time in the session, the corresponding entry in a small "Terms you've worked with" sidebar pulses subtly (single 800ms animation). The sidebar is collapsible, lives in the right gutter on `/module`, and links each term to its dictionary entry.

This makes the *accumulation* visible — the learner can see the vocabulary they're building, which is the module's actual instrument-of-learning thesis.

### 4.5 WikiDraft (T5) as a guided form

The constructive draft at T5 renders as a structured form, not a free-text box:

- "Your school" — dropdown, prefilled if known from earlier handoff responses this session.
- "How we use it" — textarea, placeholder shows the course-team note for contrast.
- "Example in practice" — textarea, placeholder names a generic Harvard-staff scenario type.
- "How it differs from other schools" — textarea, optional.
- Submit reveals: "Your draft will be reviewed before it appears in the dictionary. Thank you for contributing."

The form uses shadcn-vue primitives. No new component framework.

### 4.6 What we're not building visually

- Avatar/character UI elements.
- Animations on every micro-interaction.
- Sound effects.
- Light/dark mode toggle (defer to v2; respect system preference).

## Section 5 — Soft validator

`scripts/validate_turn_compliance.ts` reads a sample of recent turns (from a turn-log table or stdout capture in dev) and scores each:

| Check | Tier | Pass criterion |
|---|---|---|
| `<terms_surfaced>` block present | all | regex match |
| `<dictionary_handoff>` block present | all | regex match |
| Handoff `kind` matches tier band | all | passive ≤ T2, active T3–T4, constructive T5 |
| Observation prompt before stem | T2+ | model self-reports via tool input field |
| At least one distractor's reasoning ≥ 12 words | T2 | word count |
| `claim_prompt` / `support_prompt` / `question_prompt` non-empty | T3 | tool input field check |
| All terms in `terms_surfaced` exist in `content/dictionary/` | all | filesystem check |
| `setup_prose` mentions one of the canonical school contexts | T2+ | keyword scan |

Output: a markdown report with pass-rate per check per tier, top failure modes, sample failing turns. Warnings only — never blocks. Run nightly via cron; on demand before any demo.

If pass rate dips below 80% on any check for a sustained week, that's the signal to escalate to schema-typed templates (the deferred path B).

## Section 6 — Docs

### 6.1 `docs/architecture.md`

System overview, written for the capstone committee. Sections:

- Mission and scope (drawn from CLAUDE.md "Project mission").
- Scaffold Selector (rule-based pure function, ICAP tiers, why rule-based).
- Visualization Selector (`lib/viz-selector.ts`, viz_demand → chart/flowchart/none).
- Turn Composition Pipeline (`composeTurn`, system prompts per tier, tail blocks, soft validation).
- Dictionary handoff layer (passive → active → constructive across tiers, persistence tables, view back into dictionary).
- Pre-generated autoplay vs live-module call paths.
- LLM provider config (Gemini 3.1 Flash Lite, thinking levels per role, Claude Haiku 4.5 emergency fallback).
- Out-of-scope reaffirmations.

Renders through the existing markdown pipeline (same as the current Architecture page added in commit `b3e2aa4`). Linked from the main nav.

### 6.2 `docs/design-decisions.md`

Append-only ADR-style log. Each entry: ID, date, decision, alternatives considered, rationale, consequences.

Backfilled entries (drawn from CLAUDE.md and `decisions/005-viz-selector.md`):

- **DD-001** Scaffold Selector is rule-based, not LLM-driven.
- **DD-002** Five ICAP-mapped tiers (WorkedExample, ScaffoldedMCQ, GuidedShortAnswer, BareLongAnswer, WikiDraft).
- **DD-003** Single-model architecture: Gemini 3.1 Flash Lite, roles by system prompt + thinkingLevel.
- **DD-004** Content as files, not vectors. No embeddings, no vector DB.
- **DD-005** Visualization Selector as a pure function (links to existing `decisions/005-viz-selector.md`).

New entries from this design:

- **DD-006** **Prompt-rewrite + soft validator + structured tail blocks chosen over schema-typed templates.** Token cost was originally assumed to be the driver, but measurement showed it negligible at current scale. The pedagogy gap is the actual problem; per-tier system prompts plus a soft validator address it without the authoring burden of 25 ConceptAnchor files and 5 Zod schemas. Path B (schemas) is documented as the escalation if soft-validator failure rate exceeds 20% sustained.
- **DD-007** **`composeTurn` is the single composition path** for both autoplay and live module. Prevents drift between the demo surface and the actual learner experience.
- **DD-008** **Tier-graded dictionary handoff** — passive (T1–T2) → active (T3–T4) → constructive (T5). Mirrors the ICAP scaffold-fade arc; accumulation of structured handoff responses is the module's contribution to solving cross-school terminology fragmentation.
- **DD-009** **Visual interactivity layer is part of the pedagogy, not decoration.** Tier transitions, distractor-reasoning reveal, inline handoff card, and term-touched indicators make the otherwise-invisible mastery arc legible to the learner.

### 6.3 CI gate against silent invariant drift

A check (`.github/workflows/decisions.yml`) fails if any commit modifies the "Architectural invariants" section of `CLAUDE.md` without adding a corresponding new `DD-XXX` entry to `docs/design-decisions.md`. Implemented as a small script that diffs the relevant section of CLAUDE.md against `main` and grep's the diff of `design-decisions.md` for new entry IDs.

## Section 7 — Rollout

Each phase is independently revertable.

**Phase 0 — Skeleton, no behavior change.**
1. Add `lib/prompts/<tier>.ts` (5 system prompt strings).
2. Add `lib/turn-composer.ts` (callable, but not yet wired into routes).
3. Add `lib/types.ts` if not present (Turn interface).
4. Drizzle migrations for `dictionary_handoff_responses` and `wiki_drafts`.
5. Add `scripts/validate_turn_compliance.ts`, no LLM calls — runs against fixtures.
6. **Ship.** Nothing user-facing changes.

**Phase 1 — Autoplay swap (low blast radius).**
1. Rewrite `scripts/pregenerate_autoplay.ts` to call `composeTurn`.
2. Regenerate `frontend/src/data/autoplay-bundle.json` (this is the *first and only* deliberate Gemini call until end-to-end smoke).
3. Verify `AutoplayView.vue` renders correctly with parsed tail blocks.
4. Keep old bundle as `autoplay-bundle.legacy.json` for rollback.
5. **Ship.**

**Phase 2 — Live module swap.**
1. Replace the live module's content-generation call with `composeTurn`.
2. Wire dictionary handoff UI components and persistence calls.
3. Wire visual interactivity layer (Section 4).
4. Feature-flag via `USE_NEW_TURN_COMPOSER=true`. Default off in dev, on in preview, on in prod after one week of preview soak.
5. Telemetry: tail-block parse success rate, soft-validator pass rate, handoff submission rate, term-click-through rate.
6. **Ship.**

**Phase 3 — Docs.**
1. Create `docs/architecture.md` and `docs/design-decisions.md`.
2. Add nav entry for design-decisions next to the existing Architecture link.
3. Add CI gate.
4. **Ship.**

**Phase 4 — Soft-validator monitoring.**
1. Schedule `scripts/validate_turn_compliance.ts` nightly.
2. Watch failure rate per check per tier for one week.
3. If any check exceeds 20% failure rate sustained, escalate to deferred path B (schemas).

## Section 8 — Testing

Three layers, scaled to where bugs live.

**Layer 1 — Unit tests, no LLM.**
- Tail-block parser tests (`lib/__tests__/tail-blocks.test.ts`).
- Soft validator tests against hand-authored fixtures (`scripts/__tests__/validate_turn_compliance.test.ts`).
- Drizzle schema migrations apply cleanly to a fresh test DB.
- PII tripwire regex catches name/email/salary/ID patterns.

**Layer 2 — Composer tests with mocked LLM.**
- `composeTurn` returns the right Turn shape given canned model responses.
- Missing tail blocks fall back to safe defaults; soft validator logs warning.
- `composeTurn` is called identically by the live route and the autoplay script.

**Layer 3 — End-to-end smoke (real Gemini call).**
- Single deliberate run at the end of Phase 1: regenerate the autoplay bundle and visually inspect `/autoplay`. This is the *only* real-LLM step until Phase 2 ships behind a flag.
- Phase 2 preview-deploy soak counts as the live-module smoke.

## Section 9 — Definition of done

1. `composeTurn` is the only path producing a Turn for both autoplay and live module.
2. Five per-tier system prompts shipped and reviewed.
3. Tail-block parser ships with tests; missing blocks degrade gracefully.
4. `dictionary_handoff_responses` and `wiki_drafts` tables exist; T3+ UI writes to them.
5. Dictionary entry view reads from the joined view (course-team note + reported-by-colleagues).
6. Visual interactivity layer (Section 4) shipped: tier transitions, distractor reveal, inline handoff card, term-touched indicators, T5 form.
7. `docs/architecture.md` and `docs/design-decisions.md` shipped, linked in nav, all DD-001 through DD-009 entries present.
8. CI gate against invariant-drift in place.
9. Soft validator runs nightly; baseline failure rates recorded for each check.

## Deferred (recorded so the work isn't lost)

- **Path B — Zod-schema-typed templates with `generateObject`.** Adopt only if soft-validator failure rate exceeds 20% sustained for any check. Design exists in conversation history; recover from there if escalation is triggered.
- **Path C — 25 per-concept ConceptAnchor files.** Content-production project; revisit when course designers are ready to author. Useful regardless of path B.
- **Quality Evaluator async scoring** for wiki drafts (`qualityScore` column exists, no worker yet).
- **Human review queue UI** for wiki drafts (`status` column exists, no UI yet).
- **Per-school analytics dashboards** reading from the handoff tables.
- **Persistent cache** for composed turns (Neon-backed).
- **Light/dark mode** for the module UI.

## Open questions

None at design time. If implementation surfaces a decision that materially changes any DD-001 through DD-009 entry, log a new DD entry and pause for human review per the harness pattern.
