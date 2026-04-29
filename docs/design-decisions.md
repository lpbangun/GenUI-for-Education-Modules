# Design Decisions

ADR-style log of architectural decisions. Append-only — never edit historical entries; supersede instead. Each entry: ID, date, decision, alternatives considered, rationale, consequences.

When CLAUDE.md "Architectural invariants" is modified, a new DD entry MUST land in the same PR. Enforced by `.github/workflows/invariant-drift.yml`.

---

## DD-001 — Scaffold Selector is rule-based, not LLM-driven

**Date:** 2026-03-15 (backfilled from CLAUDE.md)

**Decision:** The Scaffold Selector is a pure function `(mastery, history) → ScaffoldName`. It is not an LLM call.

**Alternatives considered:**
- LLM-classified tier selection ("which scaffold should this learner see next?").

**Rationale:** The single most defensible piece of pedagogy in the capstone is the rule the committee can read. ICAP-grounded mastery thresholds are deterministic and explicable; LLM-classification is neither.

**Consequences:** Selector lives in `lib/scaffold-selector.ts` as a one-function file. Cannot be changed without updating CLAUDE.md and adding a superseding DD entry.

---

## DD-002 — Five ICAP-mapped tiers

**Date:** 2026-03-15 (backfilled from CLAUDE.md)

**Decision:** Five tiers, mapped to Chi & Wylie's ICAP framework: WorkedExample (Passive), ScaffoldedMCQ (Active), GuidedShortAnswer (Active), BareLongAnswer (Constructive), WikiDraft (Interactive). Mastery thresholds: 0.20 / 0.45 / 0.65 / 0.85.

**Alternatives considered:**
- Three tiers (worked / guided / open).
- Bloom's taxonomy mapping.

**Rationale:** ICAP gives an explicit progression from passive consumption to interactive contribution, which mirrors the module's pedagogical thesis (fade scaffolding as mastery grows). Five tiers gives enough granularity for visible scaffold-fade without authoring overhead.

**Consequences:** All scaffold tools, components, and prompts are tier-keyed by these names.

---

## DD-003 — Single-model architecture (Gemini 3.1 Flash Lite)

**Date:** 2026-03-20 (backfilled from CLAUDE.md)

**Decision:** All four agent roles (Content Generator, State Inferrer, Quality Evaluator, Template Filler) run on Gemini 3.1 Flash Lite. Differentiation is by system prompt and `thinkingLevel`, not by model.

**Alternatives considered:**
- Multi-model (e.g., Claude for prose, Gemini for structured output).
- Heavier model for State Inferrer.

**Rationale:** Single-model simplifies provider failover (one swap), keeps cost predictable, and the published Flash Lite benchmarks (97% structured-output compliance, 94% intent-routing accuracy) cover all four roles.

**Consequences:** Claude Haiku 4.5 stays wired as emergency fallback for provider outage only — two-line swap.

---

## DD-004 — Content as files, not vectors

**Date:** 2026-03-20 (backfilled from CLAUDE.md)

**Decision:** Concepts and dictionary entries are markdown files with YAML frontmatter. Scenarios and datasets are JSON. The runtime loads everything into memory at startup. No embeddings, no vector DB, no semantic search.

**Alternatives considered:**
- pgvector / Pinecone with semantic retrieval.
- Filesystem-only with no in-memory cache.

**Rationale:** v1 is a proof-of-concept; the dictionary is small enough that fuzzy client-side search (Fuse.js) is sufficient. Vector retrieval is v2 if dictionary scope grows beyond a few hundred entries.

**Consequences:** All content fits in RAM. Adding new concepts is a file-add, not a re-embedding job.

---

## DD-005 — Visualization Selector as a pure function

**Date:** 2026-04-15 (backfilled from `decisions/005-viz-selector.md`)

**Decision:** Visualization choice (chart / flowchart / none) is a rule-based pure function from `(concept.viz_demand, mastery, history)`. The LLM never decides whether to visualize — only what to put in the visualization.

**Alternatives considered:** See [`decisions/005-viz-selector.md`](../decisions/005-viz-selector.md).

**Rationale:** Same logic as DD-001 — the rule is the defensible artifact.

**Consequences:** `lib/viz-selector.ts` is a pure function with unit tests. Concept primers carry a `viz_demand` field that drives the rule.

---

## DD-006 — Prompt-rewrite + soft validator + tail blocks (chosen over schema-typed templates)

**Date:** 2026-04-29

**Decision:** Per-tier system prompts carry the pedagogical contract (observation-before-inference, claim/support/question, distractor reasoning, dictionary handoff). The model emits `<terms_surfaced>` and `<dictionary_handoff>` trailing blocks parsed by the frontend. A soft validator scans for compliance and warns; it never blocks turn generation.

**Alternatives considered:**
- **Path A** (rejected): inline string-template substitution. Too leaky; structural invariants escape into renderer code.
- **Path B** (deferred): Zod-schema-typed templates with `generateObject`. 5 tier schemas + 25 ConceptAnchor files + fallback Turns + retry policy + cache. Strictly enforces pedagogy but adds significant authoring burden.
- **Path C** (rejected): full course-designer DSL. Maximum control, minimum dynamism, highest authoring cost.

**Rationale:** Token cost was the original driver for path B, but measurement showed cost negligible at v1 scale. The pedagogy gap is the actual problem, and rewriting per-tier system prompts addresses it directly without the burden of authoring 25 anchors. Path B remains in the back pocket: if soft-validator failure rate exceeds 20% sustained on any check, that is the trigger to adopt schemas.

**Consequences:** Schema permissiveness in `backend/tools.ts` (no required pedagogy fields); pedagogy enforcement lives in prompts; tail blocks are loosely parsed with safe-default fallbacks; soft validator is the early-warning system.

---

## DD-007 — `composeTurn` is the single composition path

**Date:** 2026-04-29

**Decision:** Both the live module's `/api/chat` route and `scripts/pregenerate_autoplay.ts` call `composeTurn` from `lib/turn-composer.ts`. There is no second path for content generation.

**Alternatives considered:**
- Separate orchestration in autoplay vs live module (simpler refactor; status quo).
- Backend orchestrates; autoplay calls backend HTTP.

**Rationale:** Drift between the demo surface and what the live module actually produces would undermine the capstone demo. A single function call site makes drift structurally impossible.

**Consequences:** Refactoring `composeTurn`'s contract requires updating both call sites in the same change.

---

## DD-008 — Tier-graded dictionary handoff

**Date:** 2026-04-29

**Decision:** The dictionary handoff is graded across tiers, mirroring the ICAP scaffold-fade arc:
- T1–T2 (passive): terms_surfaced highlights, no required interaction.
- T3–T4 (active): single-question response (`yes` / `no` / `unsure` / `differently` + optional 200-char free text), persisted to `dictionary_handoff_responses`.
- T5 (constructive): structured wiki-draft form, persisted to `wiki_drafts` with `status='pending_review'`.

A SQL view joins course-team-authored notes (in `content/dictionary/`) with recent `differently` responses, rendered separately in the dictionary entry UI.

**Alternatives considered:**
- Passive only (just highlights). Engagement signal but no corpus signal.
- Required wonder-to-dictionary on every turn. Too much friction at low mastery.

**Rationale:** The handoff itself fades scaffolding the same way the scaffolds do, which is consistent with the module's core thesis. Constructive contributions are weighted toward learners who have demonstrated they understand the term.

**Consequences:** Two new Drizzle tables; PII tripwire on all free text; "Reported by colleagues:" section in the dictionary entry UI.

---

## DD-009 — Visual interactivity layer is part of the pedagogy

**Date:** 2026-04-29

**Decision:** The scaffold-fade-as-mastery-grows arc is rendered as visible UI: a tier-transition card on tier crossings, a distractor-reasoning reveal pattern at T2, an inline (not modal) handoff card at T3+, a pulsing term-touched indicator in a session sidebar, a structured form at T5.

**Alternatives considered:**
- Backend-only changes (current state). Pedagogy is in code; learner sees no signal of the arc.
- Modal handoffs. Breaks reasoning flow.

**Rationale:** The most interesting pedagogical claim of the module is the scaffold-fade arc. Currently it is the most invisible. Making it legible to the learner is itself a pedagogical signal — they can see their own vocabulary accumulating and the scaffolding lifting.

**Consequences:** Five new Vue components in `frontend/src/components/scaffolds/`. Visual layer is shadcn-vue + Tailwind only; no new framework.

---

## DD-010 — Tail-block data travels in tool-call inputs, not trailing text

**Date:** 2026-04-29

**Decision:** `terms_surfaced` and `dictionary_handoff` are optional fields **inside** each scaffold tool's input schema (in `backend/tools.ts`). The composer reads them from `scaffold.input` directly. Trailing-text parsing is unused at runtime.

**Alternatives considered:**
- Trailing `<terms_surfaced>` and `<dictionary_handoff>` text blocks parsed from `result.text` (the original DD-006 design).
- Multi-step generation (`stopWhen: stepCountIs(2)`) — let the model call the tool first, then emit text.

**Rationale:** Discovered while regenerating the autoplay bundle for the first time: under `toolChoice: 'required'`, Gemini Flash Lite collapses all output into the forced tool call and emits empty `result.text`. Trailing text never arrives. Putting tail-block info INSIDE the tool's input is a single-round-trip, cheapest fix that matches what Gemini actually does. Optional fields preserve DD-006's permissive contract — old tool calls without these fields still parse and degrade to passive/empty handoff.

**Consequences:** `lib/tail-blocks.ts` and its tests remain in the repo but are unused by `composeTurn`. Frontend `ScaffoldResult` exposes the same fields by reading from `scaffold.input` after the AI SDK stream completes. System prompts updated to instruct the model to populate these fields IN the tool call, not as trailing text.
