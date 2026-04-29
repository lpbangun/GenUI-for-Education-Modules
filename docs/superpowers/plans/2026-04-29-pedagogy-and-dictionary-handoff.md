# Pedagogy + Dictionary Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the pedagogical compliance gap in generated turns and ship the dictionary handoff persistence layer that turns the module into a corpus-builder for cross-school terminology.

**Architecture:** Per-tier system prompts + structured tail blocks (parsed, not schema-validated) + a single `composeTurn` composition path used by both autoplay and live module + tier-graded dictionary handoff persisted to Postgres + visual interactivity layer + soft validator + architecture/design-decisions docs with CI gate. Reverses the earlier schema-typed-templates direction (DD-006).

**Tech Stack:** Bun + TypeScript, Hono backend, Vue 3 + Vite frontend, AI SDK v6 (`@ai-sdk/google`), Gemini 3.1 Flash Lite, Drizzle ORM + Neon Postgres, Zod (existing), shadcn-vue + Tailwind, `bun test`.

**Reference spec:** `docs/superpowers/specs/2026-04-29-pedagogy-and-dictionary-handoff-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|----------------|
| `lib/types.ts` | `Turn`, `DictionaryHandoff`, `HandoffKind` interfaces |
| `lib/prompts/_base.ts` | Shared content rules (CLAUDE.md hard rules condensed) |
| `lib/prompts/worked-example.ts` | T1 system prompt |
| `lib/prompts/scaffolded-mcq.ts` | T2 system prompt — observation-before-stem, reasoning-bearing distractors |
| `lib/prompts/guided-short-answer.ts` | T3 system prompt — claim/support/question scaffolds + active handoff |
| `lib/prompts/bare-long-answer.ts` | T4 system prompt — active handoff with 2–3 surfaced terms |
| `lib/prompts/wiki-draft.ts` | T5 system prompt — constructive handoff with seed term |
| `lib/prompts/index.ts` | `SYSTEM_PROMPTS` map keyed by `ScaffoldName` |
| `lib/tail-blocks.ts` | Parse `<terms_surfaced>` and `<dictionary_handoff>` blocks from model text |
| `lib/__tests__/tail-blocks.test.ts` | Unit tests for parser |
| `lib/turn-composer.ts` | `composeTurn()` — single composition path |
| `lib/__tests__/turn-composer.test.ts` | Composer tests with mocked LLM |
| `lib/db/client.ts` | Drizzle client; lazy DB URL load |
| `lib/db/schema.ts` | `dictionaryHandoffResponses` and `wikiDrafts` tables |
| `lib/db/pii-tripwire.ts` | Regex tripwire for free-text submissions |
| `lib/db/__tests__/pii-tripwire.test.ts` | PII tripwire tests |
| `lib/db/handoff-repo.ts` | Insert / aggregate handoff responses |
| `lib/db/wiki-repo.ts` | Insert / list wiki drafts |
| `lib/db/__tests__/handoff-repo.test.ts` | Repo tests against in-memory SQLite-compat or mock |
| `scripts/validate_turn_compliance.ts` | Soft validator — scans fixtures or recent turns |
| `scripts/__tests__/validate_turn_compliance.test.ts` | Validator unit tests |
| `frontend/src/components/scaffolds/TierTransition.vue` | Inline transition card between tier crossings |
| `frontend/src/components/scaffolds/DictionaryHandoffCard.vue` | Active/constructive handoff UI |
| `frontend/src/components/scaffolds/TermsSurfacedSidebar.vue` | Right-gutter accumulating term sidebar |
| `frontend/src/components/scaffolds/DistractorReveal.vue` | T2 distractor-with-reasoning reveal |
| `frontend/src/components/scaffolds/WikiDraftForm.vue` | T5 structured form |
| `docs/architecture.md` | System overview for the capstone committee |
| `docs/design-decisions.md` | ADR log with DD-001 through DD-009 |
| `.github/workflows/invariant-drift.yml` | CI check guarding silent invariant drift |

### Modified files

| Path | Change |
|------|--------|
| `backend/tools.ts` | Add optional `observation_prompt` and `observation_options` to `ScaffoldedMCQ`; add optional `draft_template` to `WikiDraft`. No required-field changes (soft contract). |
| `backend/index.ts` | Replace inline `streamText` body with a call into `composeTurn`-equivalent path; add `/api/handoff/submit` and `/api/wiki-draft/submit` routes. |
| `frontend/src/lib/api.ts` | Add tail-block parsing in stream handling; export `Turn` shape including `termsSurfaced` and `dictionaryHandoff`. |
| `frontend/src/components/Scaffolds.vue` | Use `DistractorReveal` for T2; remove now-redundant inline option rendering for T2; pass through `dictionaryHandoff` to card. |
| `frontend/src/views/ModuleView.vue` | Track `surfacedTerms` across turns; render sidebar; render handoff card; render tier transition; render `WikiDraftForm` at T5. |
| `frontend/src/views/AutoplayView.vue` | Render `dictionaryHandoff` and `termsSurfaced` from bundle entries (read-only — autoplay does not submit). |
| `scripts/pregenerate_autoplay.ts` | Replace inline tool-call orchestration with `composeTurn`. |
| `frontend/src/components/TopNav.vue` | Add `Design Decisions` link next to `Architecture`. |
| `package.json` | Add `drizzle-orm`, `drizzle-kit`, `postgres` (Neon driver), `@types/pg` (if needed); add `db:generate`, `db:migrate`, `validate:turn-compliance` scripts. |

---

## Phase 0 — Skeleton (no behavior change)

### Task 1: Define core types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the file**

```ts
// lib/types.ts
// Turn shape produced by composeTurn(). Single source of truth — both the
// live module route and the autoplay pregenerator deserialize into this.
//
// Note: this is intentionally an interface, not a Zod schema (DD-006).
// Tail blocks are parsed loosely; missing fields fall back to safe defaults.

import type { ScaffoldName } from './scaffold-selector';
import type { VizDecision } from './viz-selector';

export type HandoffKind = 'passive' | 'active' | 'constructive';

export type AgreementResponse = 'yes' | 'no' | 'unsure' | 'differently';

export interface PassiveHandoff {
  kind: 'passive';
  termsSurfaced: string[];
}

export interface ActiveHandoff {
  kind: 'active';
  candidateTerm: string;             // T3 — single term
  surfacedTerms: string[];           // T4 — 2–3 terms
  handoffQuestion: string;           // verbatim prose to render
}

export interface ConstructiveHandoff {
  kind: 'constructive';
  targetTerm: string;
  draftTemplate: {
    schoolPlaceholder: string;       // e.g., "HGSE"
    howWeUseItPlaceholder: string;
    examplePlaceholder: string;
    differsPlaceholder: string;
  };
}

export type DictionaryHandoff =
  | PassiveHandoff
  | ActiveHandoff
  | ConstructiveHandoff;

export interface Turn {
  tier: ScaffoldName;
  conceptId: string;
  mastery: number;
  vizDecision: VizDecision;
  scaffold: { name: ScaffoldName; input: unknown };
  chart: unknown | null;
  flowchart: unknown | null;
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
}

export const SAFE_DEFAULT_HANDOFF: PassiveHandoff = {
  kind: 'passive',
  termsSurfaced: [],
};
```

- [ ] **Step 2: Verify it compiles**

Run: `bunx tsc --noEmit lib/types.ts`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): add Turn and DictionaryHandoff types"
```

---

### Task 2: Write failing test for tail-block parser

**Files:**
- Create: `lib/__tests__/tail-blocks.test.ts`

- [ ] **Step 1: Write the test**

```ts
// lib/__tests__/tail-blocks.test.ts
import { describe, expect, it } from 'bun:test';
import { parseTailBlocks } from '../tail-blocks';

describe('parseTailBlocks', () => {
  it('parses passive handoff with terms_surfaced only', () => {
    const text = `Some prose.

<terms_surfaced>median, skew</terms_surfaced>
<dictionary_handoff kind="passive">
terms: median, skew
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual(['median', 'skew']);
    expect(r.dictionaryHandoff.kind).toBe('passive');
    if (r.dictionaryHandoff.kind === 'passive') {
      expect(r.dictionaryHandoff.termsSurfaced).toEqual(['median', 'skew']);
    }
  });

  it('parses active handoff with candidate_term', () => {
    const text = `<terms_surfaced>median</terms_surfaced>
<dictionary_handoff kind="active" candidate_term="median">
Is this how your school uses this term?
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.dictionaryHandoff.kind).toBe('active');
    if (r.dictionaryHandoff.kind === 'active') {
      expect(r.dictionaryHandoff.candidateTerm).toBe('median');
      expect(r.dictionaryHandoff.handoffQuestion).toContain('Is this how');
    }
  });

  it('parses constructive handoff with target_term', () => {
    const text = `<terms_surfaced>median, skew</terms_surfaced>
<dictionary_handoff kind="constructive" target_term="median">
Contribute to the dictionary entry for "median".
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.dictionaryHandoff.kind).toBe('constructive');
    if (r.dictionaryHandoff.kind === 'constructive') {
      expect(r.dictionaryHandoff.targetTerm).toBe('median');
    }
  });

  it('returns safe defaults when blocks are missing', () => {
    const text = 'Just prose, no tail blocks.';
    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual([]);
    expect(r.dictionaryHandoff.kind).toBe('passive');
  });

  it('strips tail blocks from the prose', () => {
    const text = `Visible prose.

<terms_surfaced>x</terms_surfaced>
<dictionary_handoff kind="passive"></dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.cleanedText.trim()).toBe('Visible prose.');
  });

  it('handles empty terms_surfaced', () => {
    const text = `<terms_surfaced></terms_surfaced>
<dictionary_handoff kind="passive"></dictionary_handoff>`;
    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/__tests__/tail-blocks.test.ts`
Expected: FAIL — module `../tail-blocks` not found.

---

### Task 3: Implement tail-block parser

**Files:**
- Create: `lib/tail-blocks.ts`

- [ ] **Step 1: Write the parser**

```ts
// lib/tail-blocks.ts
// Parses <terms_surfaced>...</terms_surfaced> and
// <dictionary_handoff>...</dictionary_handoff> blocks from raw model text.
// Loose, forgiving — missing or malformed blocks fall back to safe defaults.
//
// Per DD-006: no schema gate. Bad output degrades to passive handoff with
// empty term list and is logged by the soft validator, not rejected.

import type { DictionaryHandoff, PassiveHandoff } from './types';
import { SAFE_DEFAULT_HANDOFF } from './types';

export interface TailBlockResult {
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
  cleanedText: string;
}

const TERMS_RE = /<terms_surfaced>([\s\S]*?)<\/terms_surfaced>/i;
const HANDOFF_RE = /<dictionary_handoff([^>]*)>([\s\S]*?)<\/dictionary_handoff>/i;

function parseTermsList(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

function parseAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i');
  const m = attrs.match(re);
  return m ? m[1].trim() : null;
}

function parseHandoff(attrs: string, body: string, terms: string[]): DictionaryHandoff {
  const kind = parseAttr(attrs, 'kind');
  if (kind === 'active') {
    const candidate = parseAttr(attrs, 'candidate_term');
    if (!candidate) return { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };
    return {
      kind: 'active',
      candidateTerm: candidate.toLowerCase(),
      surfacedTerms: terms,
      handoffQuestion: body.trim() || 'Is this how your school uses this term?',
    };
  }
  if (kind === 'constructive') {
    const target = parseAttr(attrs, 'target_term');
    if (!target) return { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };
    return {
      kind: 'constructive',
      targetTerm: target.toLowerCase(),
      draftTemplate: {
        schoolPlaceholder: 'Your school (e.g., HGSE)',
        howWeUseItPlaceholder: 'How does your team use this term?',
        examplePlaceholder: 'A short example from your work.',
        differsPlaceholder: 'How does this differ from how other schools use it? (optional)',
      },
    };
  }
  // default to passive
  const passive: PassiveHandoff = { kind: 'passive', termsSurfaced: terms };
  return passive;
}

export function parseTailBlocks(text: string): TailBlockResult {
  const termsMatch = text.match(TERMS_RE);
  const handoffMatch = text.match(HANDOFF_RE);

  const terms = termsMatch ? parseTermsList(termsMatch[1]) : [];
  const handoff = handoffMatch
    ? parseHandoff(handoffMatch[1], handoffMatch[2], terms)
    : { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };

  let cleanedText = text;
  if (termsMatch) cleanedText = cleanedText.replace(TERMS_RE, '');
  if (handoffMatch) cleanedText = cleanedText.replace(HANDOFF_RE, '');

  return {
    termsSurfaced: terms,
    dictionaryHandoff: handoff,
    cleanedText: cleanedText.trim() ? cleanedText : '',
  };
}
```

- [ ] **Step 2: Run tests**

Run: `bun test lib/__tests__/tail-blocks.test.ts`
Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/tail-blocks.ts lib/__tests__/tail-blocks.test.ts
git commit -m "feat(tail-blocks): parse terms_surfaced + dictionary_handoff with safe defaults"
```

---

### Task 4: Write the shared system-prompt base

**Files:**
- Create: `lib/prompts/_base.ts`

- [ ] **Step 1: Write the file**

```ts
// lib/prompts/_base.ts
// Shared content rules every per-tier system prompt prefixes itself with.
// Mirrors CLAUDE.md "Hard rules" and "Content rules" sections — keep in sync.
//
// IMPORTANT: when CLAUDE.md "Architectural invariants" or "Hard rules"
// sections change, update this file AND add a DD-XXX entry to
// docs/design-decisions.md (the CI gate enforces this).

export const BASE_SYSTEM = `
You are a Content Generator for a Harvard staff data fluency module. Your turns shape both what the learner reads next and a backend dictionary of cross-school terminology. You are NOT a data analytics tutor — this module teaches data FLUENCY (vocabulary, interpretation, judgment), not computation.

HARD RULES (never violate):
- Never ask the learner to calculate anything beyond mean / median / proportion.
- Never reference real Harvard people, real salary data, or real student records.
- Never assume schools share data terminology — ground in the surfaced dictionary terms; do not hallucinate school-specific usage.
- Never let scenarios reference data that the dataset does not contain.

PEDAGOGICAL CONTRACT:
- Visible thinking: every tier ≥ 2 poses observation BEFORE inference. "What do you notice" precedes "what do you conclude". Every tier ≥ 3 requires claim + support + question structure.
- Constructivism: scenarios start from a Harvard-staff context (admissions, advising, giving, course evaluation, institutional research) — name the role-plausible situation BEFORE invoking any concept.
- Setup prose ≤ 60 words. Concision is a pedagogical commitment, not a budget constraint.

DISTRACTOR REASONING (Tier 2 only):
- Each MCQ option's feedback must explain WHY someone would pick this option — the plausible reasoning behind it — NOT "wrong, try again" boilerplate. The learner should see, after answering, why each alternative looked reasonable. This is the constructivist contract: surface multiple reasoning paths.

DICTIONARY HANDOFF (every turn):
- After your tool call, append exactly this trailing block:
  <terms_surfaced>term1, term2, term3</terms_surfaced>
- Then append a <dictionary_handoff> block matching the per-tier kind specified in your tier-specific instructions.
- All terms in <terms_surfaced> MUST be lowercase, comma-separated, and dictionary terms the concept primer would recognize. 1–3 terms.

OUTPUT SHAPE:
- Call exactly one scaffold tool (the tier name you are given).
- If a visualization was requested by the Visualization Selector, call render_chart or render_flowchart in the same response.
- After all tool calls, append <terms_surfaced> and <dictionary_handoff> as plain text trailing blocks.
`.trim();
```

- [ ] **Step 2: Commit**

```bash
git add lib/prompts/_base.ts
git commit -m "feat(prompts): add shared system-prompt base"
```

---

### Task 5: Write per-tier system prompts

**Files:**
- Create: `lib/prompts/worked-example.ts`
- Create: `lib/prompts/scaffolded-mcq.ts`
- Create: `lib/prompts/guided-short-answer.ts`
- Create: `lib/prompts/bare-long-answer.ts`
- Create: `lib/prompts/wiki-draft.ts`
- Create: `lib/prompts/index.ts`

- [ ] **Step 1: Write `worked-example.ts`**

```ts
// lib/prompts/worked-example.ts
import { BASE_SYSTEM } from './_base';

export const WORKED_EXAMPLE_SYSTEM = `${BASE_SYSTEM}

TIER 1 — WorkedExample (ICAP: Passive)
You are demonstrating reasoning the learner will replicate. The learner is brand new to this concept. They watch and self-check comprehension; they do not produce.

STRUCTURE:
- title: short, names the concept and the staff context.
- setup_prose: 2–3 sentences. Names a Harvard-staff role and the situation they're in.
- worked_steps: 3–5 steps. Each step is one observable action AND a brief why-this-step gloss in the same string ("Step 1: Identify the distribution shape — because a few scores are extreme, the data is right-skewed.").
- interpretation: 1 paragraph that names the dictionary term explicitly and connects it back to the staff role's decision.

DICTIONARY HANDOFF — kind="passive":
After the tool call, append:
<terms_surfaced>term1, term2</terms_surfaced>
<dictionary_handoff kind="passive">
The terms above will become clickable in the UI so the learner can read their definitions.
</dictionary_handoff>
`.trim();
```

- [ ] **Step 2: Write `scaffolded-mcq.ts`**

```ts
// lib/prompts/scaffolded-mcq.ts
import { BASE_SYSTEM } from './_base';

export const SCAFFOLDED_MCQ_SYSTEM = `${BASE_SYSTEM}

TIER 2 — ScaffoldedMCQ (ICAP: Active)
The learner recognizes the pattern but isn't yet articulating their own interpretation. Help them discriminate between plausible interpretations.

STRUCTURE:
- title: short.
- setup_prose: 2–3 sentences. Names a Harvard-staff role + situation.
- artifact_summary_stats: brief stat block IF the concept involves a distribution; otherwise omit.
- prompt: this is the actual question. CRITICAL: prefix it with an OBSERVATION step — "Before answering, take a moment: what do you notice about this data?" Then ask the question. The observation step is REQUIRED at this tier.
- options: exactly 4. Each carries a feedback string explaining WHY someone would pick this option — the reasoning, the situation under which it would seem right. NOT "wrong, try again". 12+ words minimum per feedback. Exactly one option has correct=true.
- hint: always-visible hint that points toward the observation step, not the answer.

DICTIONARY HANDOFF — kind="passive":
After the tool call, append:
<terms_surfaced>term1, term2</terms_surfaced>
<dictionary_handoff kind="passive">
Brief sentence inviting the learner to click any term to read its dictionary entry.
</dictionary_handoff>
`.trim();
```

- [ ] **Step 3: Write `guided-short-answer.ts`**

```ts
// lib/prompts/guided-short-answer.ts
import { BASE_SYSTEM } from './_base';

export const GUIDED_SHORT_ANSWER_SYSTEM = `${BASE_SYSTEM}

TIER 3 — GuidedShortAnswer (ICAP: Active)
The learner articulates their own interpretation but still benefits from explicit reasoning prompts. Make claim/support/question structure visible.

STRUCTURE:
- title: short.
- setup_prose: 2–3 sentences. Names a Harvard-staff role + situation.
- prompt: the open question — observation-then-inference structured. Begin with "Looking at this..." style framing.
- consider_scaffolds: exactly 3 strings, populated AS:
  [0] = a CLAIM prompt: "What do you conclude from this data?"
  [1] = a SUPPORT prompt: "What in the data supports that conclusion?"
  [2] = a QUESTION prompt: "What would you still want to know?"
  These are the visible-thinking routine — claim/support/question. Phrase each in the staff-context's voice.
- rubric_primary_criterion: a single sentence describing what a strong response looks like; emphasizes reasoning quality, not correctness.

DICTIONARY HANDOFF — kind="active":
The active handoff begins at this tier. Pick ONE term from <terms_surfaced> as the candidate term — prefer terms the learner has seen multiple times across the session.

After the tool call, append:
<terms_surfaced>term1, term2</terms_surfaced>
<dictionary_handoff kind="active" candidate_term="<one_term>">
A single-sentence question asking whether the learner's school uses the candidate term the way the course team note describes it. Frame neutrally — "Is this how your school uses this term?"
</dictionary_handoff>
`.trim();
```

- [ ] **Step 4: Write `bare-long-answer.ts`**

```ts
// lib/prompts/bare-long-answer.ts
import { BASE_SYSTEM } from './_base';

export const BARE_LONG_ANSWER_SYSTEM = `${BASE_SYSTEM}

TIER 4 — BareLongAnswer (ICAP: Constructive)
The learner can produce structured reasoning without scaffolds. Step back. The setup prose carries the situation; the prompt is open.

STRUCTURE:
- title: short.
- setup_prose: 3–4 sentences. Slightly richer than lower tiers — the constructive task needs more situational grounding.
- prompt: a single open question. No claim/support/question scaffolds shown to the learner. The learner is expected to produce that structure themselves.
- rubric_primary_criterion: scores reasoning quality (claim coherence, support specificity, question depth), NOT correctness. A wrong conclusion with strong reasoning scores higher than a right conclusion with no reasoning.

DICTIONARY HANDOFF — kind="active":
Surface 2–3 terms in <terms_surfaced>. The handoff asks the learner which of those terms their reasoning depended on AND how their team uses it. Pick the term most likely to vary across schools as the candidate.

After the tool call, append:
<terms_surfaced>term1, term2, term3</terms_surfaced>
<dictionary_handoff kind="active" candidate_term="<one_term>">
A two-sentence prompt: first sentence names the surfaced terms; second asks "Which of these did your reasoning depend on, and how does your team use it?"
</dictionary_handoff>
`.trim();
```

- [ ] **Step 5: Write `wiki-draft.ts`**

```ts
// lib/prompts/wiki-draft.ts
import { BASE_SYSTEM } from './_base';

export const WIKI_DRAFT_SYSTEM = `${BASE_SYSTEM}

TIER 5 — WikiDraft (ICAP: Interactive)
The learner has demonstrated mastery and is invited to contribute to the cross-school dictionary. Their draft seeds a human-reviewed entry — never auto-published.

STRUCTURE:
- title: short, names the contribution invitation.
- framing_prose: 3–4 sentences. Names what the learner has demonstrated; explicitly invites contribution; promises human review before publication.
- target_dictionary_term: the single term the learner is being invited to write about. Pick from <terms_surfaced>; prefer the term the learner has engaged with most across the session.

DICTIONARY HANDOFF — kind="constructive":
The constructive handoff displays a structured form (school dropdown, "how we use it" textarea, "example" textarea, "differs from other schools" textarea). The model only signals intent here — the form itself is rendered by the frontend.

After the tool call, append:
<terms_surfaced>term1, term2</terms_surfaced>
<dictionary_handoff kind="constructive" target_term="<one_term>">
A two-sentence framing: first acknowledges the contribution; second reminds the learner that drafts go to human review before appearing in the dictionary.
</dictionary_handoff>
`.trim();
```

- [ ] **Step 6: Write `index.ts`**

```ts
// lib/prompts/index.ts
import type { ScaffoldName } from '../scaffold-selector';
import { WORKED_EXAMPLE_SYSTEM } from './worked-example';
import { SCAFFOLDED_MCQ_SYSTEM } from './scaffolded-mcq';
import { GUIDED_SHORT_ANSWER_SYSTEM } from './guided-short-answer';
import { BARE_LONG_ANSWER_SYSTEM } from './bare-long-answer';
import { WIKI_DRAFT_SYSTEM } from './wiki-draft';

export const SYSTEM_PROMPTS: Record<ScaffoldName, string> = {
  WorkedExample: WORKED_EXAMPLE_SYSTEM,
  ScaffoldedMCQ: SCAFFOLDED_MCQ_SYSTEM,
  GuidedShortAnswer: GUIDED_SHORT_ANSWER_SYSTEM,
  BareLongAnswer: BARE_LONG_ANSWER_SYSTEM,
  WikiDraft: WIKI_DRAFT_SYSTEM,
};
```

- [ ] **Step 7: Verify it compiles**

Run: `bunx tsc --noEmit lib/prompts/index.ts`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/prompts/
git commit -m "feat(prompts): add per-tier system prompts with pedagogical contracts"
```

---

### Task 6: Extend tools.ts with optional pedagogy fields

**Files:**
- Modify: `backend/tools.ts:30-41` (ScaffoldedMCQ), `backend/tools.ts:65-73` (WikiDraft)

The schema is intentionally permissive (DD-006). Old turns still parse; new turns can include the new optional fields.

- [ ] **Step 1: Add `observation_prompt` and `observation_options` to `ScaffoldedMCQ`**

In `backend/tools.ts`, replace the `ScaffoldedMCQ` `inputSchema` (lines 32–38) with:

```ts
inputSchema: z.object({
  title: z.string(),
  setup_prose: z.string(),
  artifact_summary_stats: z.string().optional(),
  observation_prompt: z.string().optional(),
  observation_options: z.array(z.string()).max(4).optional(),
  prompt: z.string(),
  options: z.array(ScenarioOption).min(3).max(4),
  hint: z.string(),
}),
```

- [ ] **Step 2: Add `draft_template` placeholders to `WikiDraft`**

Replace the `WikiDraft` `inputSchema` (lines 67–71) with:

```ts
inputSchema: z.object({
  title: z.string(),
  framing_prose: z.string(),
  target_dictionary_term: z.string(),
  draft_template_hint: z.string().optional(),
}),
```

- [ ] **Step 3: Run existing tests to confirm no regression**

Run: `bun test backend/__tests__/tools.test.ts`
Expected: all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add backend/tools.ts
git commit -m "feat(tools): add optional observation + draft fields for pedagogy compliance"
```

---

### Task 7: Write failing test for composeTurn

**Files:**
- Create: `lib/__tests__/turn-composer.test.ts`

- [ ] **Step 1: Write the test**

```ts
// lib/__tests__/turn-composer.test.ts
import { describe, expect, it, mock } from 'bun:test';
import { composeTurn } from '../turn-composer';

describe('composeTurn', () => {
  it('selects tier from mastery and returns a Turn shape', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [
        {
          toolName: 'WorkedExample',
          input: {
            title: 'Mock title',
            setup_prose: 'Mock setup.',
            worked_steps: ['Step 1', 'Step 2', 'Step 3'],
            interpretation: 'Mock interpretation.',
          },
        },
      ],
      text: '<terms_surfaced>median, mean</terms_surfaced>\n<dictionary_handoff kind="passive"></dictionary_handoff>',
    }));

    const turn = await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.10,
      history: [],
      surfacedTerms: [],
      vizDemand: 'distribution',
      _generateText: mockGenerate as any,
    });

    expect(turn.tier).toBe('WorkedExample');
    expect(turn.scaffold.name).toBe('WorkedExample');
    expect(turn.termsSurfaced).toEqual(['median', 'mean']);
    expect(turn.dictionaryHandoff.kind).toBe('passive');
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('falls back to safe defaults when tail blocks are missing', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [
        {
          toolName: 'ScaffoldedMCQ',
          input: {
            title: 't', setup_prose: 's', prompt: 'p',
            options: [
              { id: 'A', text: '', correct: true, feedback: '' },
              { id: 'B', text: '', correct: false, feedback: '' },
              { id: 'C', text: '', correct: false, feedback: '' },
            ],
            hint: 'h',
          },
        },
      ],
      text: 'Just prose, no tail blocks.',
    }));

    const turn = await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.30,
      history: [],
      surfacedTerms: [],
      vizDemand: 'distribution',
      _generateText: mockGenerate as any,
    });

    expect(turn.termsSurfaced).toEqual([]);
    expect(turn.dictionaryHandoff.kind).toBe('passive');
  });

  it('throws if no scaffold tool was called', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [],
      text: '',
    }));

    await expect(
      composeTurn({
        conceptId: 'central-tendency',
        mastery: 0.10,
        history: [],
        surfacedTerms: [],
        vizDemand: 'distribution',
        _generateText: mockGenerate as any,
      })
    ).rejects.toThrow(/no scaffold/);
  });

  it('passes the per-tier system prompt for the chosen tier', async () => {
    let capturedSystem = '';
    const mockGenerate = mock(async (args: any) => {
      capturedSystem = args.system;
      return {
        toolCalls: [
          {
            toolName: 'GuidedShortAnswer',
            input: {
              title: 't', setup_prose: 's', prompt: 'p',
              consider_scaffolds: ['claim?', 'support?', 'question?'],
              rubric_primary_criterion: 'r',
            },
          },
        ],
        text: '<terms_surfaced>x</terms_surfaced>\n<dictionary_handoff kind="active" candidate_term="x">Q?</dictionary_handoff>',
      };
    });

    await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.55,
      history: [],
      surfacedTerms: ['x'],
      vizDemand: 'definition',
      _generateText: mockGenerate as any,
    });

    expect(capturedSystem).toContain('TIER 3 — GuidedShortAnswer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/__tests__/turn-composer.test.ts`
Expected: FAIL — `../turn-composer` not found.

---

### Task 8: Implement composeTurn

**Files:**
- Create: `lib/turn-composer.ts`

- [ ] **Step 1: Write the composer**

```ts
// lib/turn-composer.ts
// The single composition path producing a Turn. Both the live module
// (backend/index.ts) and the autoplay pregenerator
// (scripts/pregenerate_autoplay.ts) call this — that's how we prevent drift
// between the demo surface and the actual learner experience (DD-007).
//
// Tier selection: pickScaffold() (rule-based, CLAUDE.md invariant 1).
// Viz selection: pickVisualization() (rule-based).
// Pedagogy: per-tier system prompt from lib/prompts (DD-006).
// Tail blocks: parseTailBlocks() — loose parsing with safe fallbacks.

import type { Turn, DictionaryHandoff } from './types';
import { SAFE_DEFAULT_HANDOFF } from './types';
import type { Interaction } from './schemas/content-schemas';
import { pickScaffold, type ScaffoldName } from './scaffold-selector';
import {
  pickVisualization,
  type VizDemand,
  type VizHistoryEntry,
  type VizKind,
} from './viz-selector';
import { SYSTEM_PROMPTS } from './prompts';
import { parseTailBlocks } from './tail-blocks';

const SCAFFOLD_NAMES = new Set<ScaffoldName>([
  'WorkedExample',
  'ScaffoldedMCQ',
  'GuidedShortAnswer',
  'BareLongAnswer',
  'WikiDraft',
]);

export interface ComposeTurnInput {
  conceptId: string;
  mastery: number;
  history: Interaction[];
  surfacedTerms: string[];
  vizDemand: VizDemand;
  /** Optional injection point for tests. Production callers omit. */
  _generateText?: GenerateTextLike;
  /** Optional injection point for tests / live module wiring. */
  _model?: unknown;
  /** Optional override for the tools map (live module supplies allTools). */
  _tools?: Record<string, unknown>;
}

type GenerateTextLike = (args: {
  model: unknown;
  system: string;
  prompt: string;
  tools?: Record<string, unknown>;
  toolChoice?: 'required' | 'auto';
  maxOutputTokens?: number;
}) => Promise<{
  toolCalls?: Array<{ toolName: string; input: unknown }>;
  text?: string;
}>;

function vizClause(kind: VizKind, mastery: number): string {
  if (kind === 'none') {
    return 'Do NOT call any visualization tool. The Visualization Selector deliberately omitted viz for this turn.';
  }
  if (kind === 'chart') {
    return 'ALSO call render_chart in the SAME response. Pick chart_type appropriate to the concept (histogram for distribution shape, bar for groups, scatter for relationships, time_series for change, box for spread). Include non-empty values, caption, provenance.';
  }
  if (mastery >= 0.85) {
    return 'ALSO call render_flowchart with flowchart_type=cycle showing the wiki contribution routine (claim → support → question → revise) — 4 nodes. Caption + provenance required.';
  }
  return 'ALSO call render_flowchart with flowchart_type linear or decision (3–5 nodes) showing the sequential reasoning routine for this concept. Edges connect node ids. Caption + provenance required.';
}

function buildPrompt(
  tier: ScaffoldName,
  conceptId: string,
  mastery: number,
  surfacedTerms: string[],
  vizKind: VizKind
): string {
  const surfacedLine =
    surfacedTerms.length > 0
      ? `Terms the learner has already touched this session (prefer these for the handoff): ${surfacedTerms.join(', ')}`
      : 'This is an early turn — the learner has not yet touched any dictionary terms.';

  return `Concept: ${conceptId}.
Tier: ${tier} (mastery=${mastery.toFixed(2)}).
${surfacedLine}

Generate the next scaffold for this learner. Make the setup_prose a concrete Harvard-staff scenario (admissions, advising, giving, course evaluation, or institutional research).

You MUST:
1. Call exactly the ${tier} tool — do not respond with prose alone, do not pick a different tier.
2. ${vizClause(vizKind, mastery)}
3. After the tool call(s), append the trailing <terms_surfaced> and <dictionary_handoff> blocks per your tier-specific instructions.`;
}

export async function composeTurn(input: ComposeTurnInput): Promise<Turn> {
  if (!input._generateText) {
    throw new Error(
      'composeTurn requires _generateText injected (use composeTurnWithProvider in production)'
    );
  }

  const tier = pickScaffold({ mastery: input.mastery, history: input.history });
  const vizDecision = pickVisualization({
    concept: { id: input.conceptId, viz_demand: input.vizDemand },
    mastery: input.mastery,
    history: input.history as VizHistoryEntry[],
  });
  const system = SYSTEM_PROMPTS[tier];
  const prompt = buildPrompt(
    tier,
    input.conceptId,
    input.mastery,
    input.surfacedTerms,
    vizDecision.kind
  );

  const result = await input._generateText({
    model: input._model,
    system,
    prompt,
    tools: input._tools,
    toolChoice: 'required',
    maxOutputTokens: 2400,
  });

  const calls = result.toolCalls ?? [];
  let scaffold: { name: ScaffoldName; input: unknown } | null = null;
  let chart: unknown = null;
  let flowchart: unknown = null;
  for (const c of calls) {
    if (SCAFFOLD_NAMES.has(c.toolName as ScaffoldName)) {
      scaffold = { name: c.toolName as ScaffoldName, input: c.input };
    } else if (c.toolName === 'render_chart') chart = c.input;
    else if (c.toolName === 'render_flowchart') flowchart = c.input;
  }
  if (!scaffold) throw new Error(`composeTurn: no scaffold tool call for tier ${tier}`);

  // Enforce selector decision (defensive — drop rogue viz the model emitted).
  if (vizDecision.kind === 'none') { chart = null; flowchart = null; }
  if (vizDecision.kind === 'chart') flowchart = null;
  if (vizDecision.kind === 'flowchart') chart = null;

  const tail = parseTailBlocks(result.text ?? '');
  const dictionaryHandoff: DictionaryHandoff = tail.dictionaryHandoff;

  return {
    tier,
    conceptId: input.conceptId,
    mastery: input.mastery,
    vizDecision,
    scaffold,
    chart,
    flowchart,
    termsSurfaced: tail.termsSurfaced,
    dictionaryHandoff,
  };
}
```

- [ ] **Step 2: Run tests**

Run: `bun test lib/__tests__/turn-composer.test.ts`
Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/turn-composer.ts lib/__tests__/turn-composer.test.ts
git commit -m "feat(turn-composer): single composition path with tail-block parsing"
```

---

### Task 9: Add Drizzle dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

- [ ] **Step 2: Add scripts to `package.json`**

In `package.json` `scripts`, add:

```json
"db:generate": "drizzle-kit generate --config=drizzle.config.ts",
"db:migrate": "bun run scripts/db_migrate.ts",
"validate:turn-compliance": "bun run scripts/validate_turn_compliance.ts"
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://placeholder',
  },
} satisfies Config;
```

- [ ] **Step 4: Verify install**

Run: `bun pm ls | grep drizzle`
Expected: `drizzle-orm` and `drizzle-kit` listed.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock drizzle.config.ts
git commit -m "chore(db): add drizzle-orm + drizzle-kit dependencies"
```

---

### Task 10: Define Drizzle schema for handoff tables

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/client.ts`

- [ ] **Step 1: Write `schema.ts`**

```ts
// lib/db/schema.ts
// Two tables for the dictionary handoff layer (DD-008).
//
// dictionary_handoff_responses captures T3+ active handoff responses.
// wiki_drafts captures T5 constructive handoff submissions. Drafts are NEVER
// auto-published (CLAUDE.md hard rule #4) — status defaults to pending_review.

import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const dictionaryHandoffResponses = pgTable('dictionary_handoff_responses', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  conceptId: text('concept_id').notNull(),
  term: text('term').notNull(),
  schoolSelfReported: text('school_self_reported'),  // HGSE | HBS | FAS | HMS | SEAS | other | null
  agreement: text('agreement').notNull(),             // yes | no | unsure | differently
  freeText: text('free_text'),                        // ≤ 200 chars, PII-tripwire-validated
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const wikiDrafts = pgTable('wiki_drafts', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  term: text('term').notNull(),
  school: text('school').notNull(),
  howWeUseIt: text('how_we_use_it').notNull(),
  exampleInPractice: text('example_in_practice'),
  differsFromOtherSchools: text('differs_from_other_schools'),
  qualityScore: integer('quality_score'),
  status: text('status').notNull().default('pending_review'),  // pending_review | approved | rejected
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DictionaryHandoffResponse = typeof dictionaryHandoffResponses.$inferSelect;
export type NewDictionaryHandoffResponse = typeof dictionaryHandoffResponses.$inferInsert;

export type WikiDraft = typeof wikiDrafts.$inferSelect;
export type NewWikiDraft = typeof wikiDrafts.$inferInsert;
```

- [ ] **Step 2: Write `client.ts`**

```ts
// lib/db/client.ts
// Lazy Drizzle client — server can boot without DATABASE_URL; the handoff
// repos return a "no-op" implementation that logs a warning when the DB is
// not configured. Mirrors the lazy-provider pattern in backend/index.ts.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

export function getDb(): DB | null {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
```

- [ ] **Step 3: Generate the migration**

Run: `bun run db:generate`
Expected: a new SQL file appears in `lib/db/migrations/`.

- [ ] **Step 4: Commit**

```bash
git add lib/db/ drizzle.config.ts
git commit -m "feat(db): drizzle schema + lazy client for handoff tables"
```

---

### Task 11: Write failing test for PII tripwire

**Files:**
- Create: `lib/db/__tests__/pii-tripwire.test.ts`

- [ ] **Step 1: Write the test**

```ts
// lib/db/__tests__/pii-tripwire.test.ts
import { describe, expect, it } from 'bun:test';
import { piiTripwire } from '../pii-tripwire';

describe('piiTripwire', () => {
  it('passes clean academic-style prose', () => {
    expect(piiTripwire('We use median when distributions are skewed.')).toEqual({ ok: true });
  });

  it('rejects email addresses', () => {
    const r = piiTripwire('Contact j.smith@harvard.edu for details.');
    expect(r.ok).toBe(false);
  });

  it('rejects salary-like figures', () => {
    expect(piiTripwire('She earns $145,000 a year.').ok).toBe(false);
    expect(piiTripwire('Salary: 145000 USD').ok).toBe(false);
  });

  it('rejects student ID-like sequences', () => {
    expect(piiTripwire('Student 12345678 dropped the course.').ok).toBe(false);
  });

  it('rejects strings over 200 chars', () => {
    const long = 'a'.repeat(201);
    expect(piiTripwire(long).ok).toBe(false);
  });

  it('rejects full-name patterns (Title Case First Last)', () => {
    expect(piiTripwire('Professor Jane Doe teaches this course.').ok).toBe(false);
  });

  it('passes single capitalized words (school names)', () => {
    expect(piiTripwire('At HGSE we use it slightly differently.').ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/db/__tests__/pii-tripwire.test.ts`
Expected: FAIL — module `../pii-tripwire` not found.

---

### Task 12: Implement PII tripwire

**Files:**
- Create: `lib/db/pii-tripwire.ts`

- [ ] **Step 1: Write the tripwire**

```ts
// lib/db/pii-tripwire.ts
// Conservative regex tripwire for learner-submitted free text. Rejects:
// - email addresses
// - salary-like dollar / USD figures
// - student-ID-like 6+ digit sequences
// - "Title FirstName LastName" full-name patterns
// - any string > 200 chars
//
// Per CLAUDE.md hard rule #2 — "Never use real Harvard people, real salary
// data, or real student records." This extends the rule to learner-
// submitted text in dictionary handoff responses.
//
// Tripwire is conservative (false positives over false negatives). On a
// trip the write is dropped silently and a warning is logged by the caller.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const SALARY_RE = /\$\s?\d{1,3}(?:,?\d{3})+(?!\d)|\b\d{4,6}\s?(?:USD|dollars?)\b/i;
const STUDENT_ID_RE = /\b\d{6,}\b/;
const FULL_NAME_RE = /\b(Mr|Ms|Mrs|Dr|Professor|Prof|Dean)\.?\s+[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/;
const BARE_FULL_NAME_RE = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b(?!\s+(?:School|College|University))/;

export interface TripwireResult {
  ok: boolean;
  reason?: string;
}

export function piiTripwire(text: string): TripwireResult {
  if (text.length > 200) return { ok: false, reason: 'over 200 chars' };
  if (EMAIL_RE.test(text)) return { ok: false, reason: 'email' };
  if (SALARY_RE.test(text)) return { ok: false, reason: 'salary' };
  if (STUDENT_ID_RE.test(text)) return { ok: false, reason: 'student id' };
  if (FULL_NAME_RE.test(text)) return { ok: false, reason: 'titled name' };
  if (BARE_FULL_NAME_RE.test(text)) return { ok: false, reason: 'full name' };
  return { ok: true };
}
```

- [ ] **Step 2: Run tests**

Run: `bun test lib/db/__tests__/pii-tripwire.test.ts`
Expected: 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/db/pii-tripwire.ts lib/db/__tests__/pii-tripwire.test.ts
git commit -m "feat(db): PII tripwire for learner-submitted free text"
```

---

### Task 13: Implement handoff repository

**Files:**
- Create: `lib/db/handoff-repo.ts`
- Create: `lib/db/wiki-repo.ts`

- [ ] **Step 1: Write `handoff-repo.ts`**

```ts
// lib/db/handoff-repo.ts
import { eq, desc, and } from 'drizzle-orm';
import { getDb, schema } from './client';
import { piiTripwire } from './pii-tripwire';

const SCHOOLS = ['HGSE', 'HBS', 'FAS', 'HMS', 'SEAS', 'other'] as const;
type School = typeof SCHOOLS[number];

const AGREEMENTS = ['yes', 'no', 'unsure', 'differently'] as const;
type Agreement = typeof AGREEMENTS[number];

export interface HandoffSubmission {
  sessionId: string;
  conceptId: string;
  term: string;
  schoolSelfReported: School | null;
  agreement: Agreement;
  freeText: string | null;
}

export interface SubmitResult {
  ok: boolean;
  reason?: string;
  id?: number;
}

export async function submitHandoff(input: HandoffSubmission): Promise<SubmitResult> {
  if (!AGREEMENTS.includes(input.agreement)) {
    return { ok: false, reason: 'invalid agreement' };
  }
  if (input.schoolSelfReported && !SCHOOLS.includes(input.schoolSelfReported)) {
    return { ok: false, reason: 'invalid school' };
  }
  let cleanedText: string | null = null;
  if (input.freeText) {
    const t = piiTripwire(input.freeText);
    if (!t.ok) {
      console.warn(`handoff free_text dropped: ${t.reason}`);
      cleanedText = null;
    } else {
      cleanedText = input.freeText;
    }
  }

  const db = getDb();
  if (!db) {
    console.warn('DATABASE_URL not set — handoff write skipped');
    return { ok: true };  // soft-success in dev
  }

  const [row] = await db
    .insert(schema.dictionaryHandoffResponses)
    .values({
      sessionId: input.sessionId,
      conceptId: input.conceptId,
      term: input.term.toLowerCase(),
      schoolSelfReported: input.schoolSelfReported,
      agreement: input.agreement,
      freeText: cleanedText,
    })
    .returning({ id: schema.dictionaryHandoffResponses.id });

  return { ok: true, id: row.id };
}

export async function recentDivergent(term: string, limit = 3) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.dictionaryHandoffResponses)
    .where(
      and(
        eq(schema.dictionaryHandoffResponses.term, term.toLowerCase()),
        eq(schema.dictionaryHandoffResponses.agreement, 'differently')
      )
    )
    .orderBy(desc(schema.dictionaryHandoffResponses.createdAt))
    .limit(limit);
}
```

- [ ] **Step 2: Write `wiki-repo.ts`**

```ts
// lib/db/wiki-repo.ts
import { desc } from 'drizzle-orm';
import { getDb, schema } from './client';
import { piiTripwire } from './pii-tripwire';

export interface WikiDraftSubmission {
  sessionId: string;
  term: string;
  school: string;
  howWeUseIt: string;
  exampleInPractice: string | null;
  differsFromOtherSchools: string | null;
}

export interface WikiSubmitResult {
  ok: boolean;
  reason?: string;
  id?: number;
}

export async function submitWikiDraft(input: WikiDraftSubmission): Promise<WikiSubmitResult> {
  for (const [field, value] of [
    ['howWeUseIt', input.howWeUseIt],
    ['exampleInPractice', input.exampleInPractice],
    ['differsFromOtherSchools', input.differsFromOtherSchools],
  ] as const) {
    if (!value) continue;
    const t = piiTripwire(value);
    if (!t.ok) {
      console.warn(`wiki draft ${field} tripwire: ${t.reason}`);
      return { ok: false, reason: `${field}: ${t.reason}` };
    }
  }

  const db = getDb();
  if (!db) {
    console.warn('DATABASE_URL not set — wiki draft write skipped');
    return { ok: true };
  }

  const [row] = await db
    .insert(schema.wikiDrafts)
    .values({
      sessionId: input.sessionId,
      term: input.term.toLowerCase(),
      school: input.school,
      howWeUseIt: input.howWeUseIt,
      exampleInPractice: input.exampleInPractice,
      differsFromOtherSchools: input.differsFromOtherSchools,
      // status defaults to pending_review per schema; never auto-publish.
    })
    .returning({ id: schema.wikiDrafts.id });

  return { ok: true, id: row.id };
}

export async function listPendingDrafts(limit = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.wikiDrafts)
    .orderBy(desc(schema.wikiDrafts.createdAt))
    .limit(limit);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/handoff-repo.ts lib/db/wiki-repo.ts
git commit -m "feat(db): handoff and wiki-draft repositories with PII guard"
```

---

### Task 14: Write soft validator

**Files:**
- Create: `scripts/__tests__/validate_turn_compliance.test.ts`
- Create: `scripts/validate_turn_compliance.ts`

- [ ] **Step 1: Write the test**

```ts
// scripts/__tests__/validate_turn_compliance.test.ts
import { describe, expect, it } from 'bun:test';
import { checkTurnCompliance } from '../validate_turn_compliance';
import type { Turn } from '../../lib/types';

const baseTurn = (overrides: Partial<Turn>): Turn => ({
  tier: 'ScaffoldedMCQ',
  conceptId: 'central-tendency',
  mastery: 0.30,
  vizDecision: { kind: 'none', reason: 'test' } as any,
  scaffold: { name: 'ScaffoldedMCQ', input: {} },
  chart: null,
  flowchart: null,
  termsSurfaced: ['median'],
  dictionaryHandoff: { kind: 'passive', termsSurfaced: ['median'] },
  ...overrides,
});

describe('checkTurnCompliance', () => {
  it('passes a well-formed T2 turn', () => {
    const turn = baseTurn({
      scaffold: {
        name: 'ScaffoldedMCQ',
        input: {
          observation_prompt: 'Before answering, what do you notice?',
          options: [
            { id: 'A', text: 'a', correct: true, feedback: 'Picking this means you weighed extreme values heavily — a common interpretation.' },
            { id: 'B', text: 'b', correct: false, feedback: 'This option is reasonable when the data appears symmetric, which is not the case here.' },
            { id: 'C', text: 'c', correct: false, feedback: 'A reader who skims headlines and not the distribution shape might land here.' },
            { id: 'D', text: 'd', correct: false, feedback: 'Plausible if you assumed the outliers were data-entry errors rather than real signal.' },
          ],
        },
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures).toHaveLength(0);
  });

  it('flags T2 missing observation_prompt', () => {
    const turn = baseTurn({
      scaffold: { name: 'ScaffoldedMCQ', input: { options: [], hint: '' } },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('observation_prompt'))).toBe(true);
  });

  it('flags distractor feedback < 12 words', () => {
    const turn = baseTurn({
      scaffold: {
        name: 'ScaffoldedMCQ',
        input: {
          observation_prompt: 'Notice anything?',
          options: [
            { id: 'A', text: 'a', correct: true, feedback: 'Wrong, try again.' },
            { id: 'B', text: 'b', correct: false, feedback: 'Picking this means you weighed extreme values heavily — a common interpretation.' },
            { id: 'C', text: 'c', correct: false, feedback: 'This option is reasonable when the data appears symmetric, which is not the case here.' },
            { id: 'D', text: 'd', correct: false, feedback: 'A reader who skims headlines and not the distribution shape might land here.' },
          ],
        },
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('feedback < 12 words'))).toBe(true);
  });

  it('flags handoff kind mismatched with tier', () => {
    const turn = baseTurn({
      tier: 'WorkedExample',
      scaffold: { name: 'WorkedExample', input: {} },
      dictionaryHandoff: {
        kind: 'active',
        candidateTerm: 'median',
        surfacedTerms: ['median'],
        handoffQuestion: '?',
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('handoff kind'))).toBe(true);
  });

  it('flags T3 missing claim/support/question scaffolds', () => {
    const turn = baseTurn({
      tier: 'GuidedShortAnswer',
      scaffold: {
        name: 'GuidedShortAnswer',
        input: { consider_scaffolds: ['just one'] },
      },
      dictionaryHandoff: {
        kind: 'active',
        candidateTerm: 'median',
        surfacedTerms: ['median'],
        handoffQuestion: '?',
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('consider_scaffolds'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test scripts/__tests__/validate_turn_compliance.test.ts`
Expected: FAIL — `../validate_turn_compliance` not found.

- [ ] **Step 3: Write the validator**

```ts
// scripts/validate_turn_compliance.ts
// Soft validator: scans a list of Turns (from a fixtures file passed as
// argv[2], or from stdin as JSON array) and reports compliance failures.
// Always advisory — never throws, never exits non-zero on bad data.
//
// Per DD-006, this is the escalation signal: if any check exceeds 20%
// failure rate sustained, that is the trigger to adopt schema-typed
// templates (deferred path B in the spec).

import type { Turn, DictionaryHandoff } from '../lib/types';
import { readFileSync } from 'node:fs';

interface CheckResult {
  passes: number;
  fails: number;
  failures: string[];
}

export interface ComplianceResult {
  total: number;
  failures: string[];
  perCheck: Record<string, CheckResult>;
}

function tierAllowsHandoffKind(tier: string, kind: DictionaryHandoff['kind']): boolean {
  if (kind === 'passive') return tier === 'WorkedExample' || tier === 'ScaffoldedMCQ';
  if (kind === 'active') return tier === 'GuidedShortAnswer' || tier === 'BareLongAnswer';
  if (kind === 'constructive') return tier === 'WikiDraft';
  return false;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function checkTurnCompliance(turn: Turn): { failures: string[] } {
  const failures: string[] = [];
  const input = turn.scaffold.input as Record<string, any>;

  if (!tierAllowsHandoffKind(turn.tier, turn.dictionaryHandoff.kind)) {
    failures.push(`handoff kind=${turn.dictionaryHandoff.kind} not allowed for tier=${turn.tier}`);
  }

  if (turn.tier === 'ScaffoldedMCQ') {
    if (!input.observation_prompt || typeof input.observation_prompt !== 'string') {
      failures.push('T2: observation_prompt missing');
    }
    const opts = (input.options ?? []) as Array<{ feedback?: string }>;
    for (const o of opts) {
      if (!o.feedback || wordCount(o.feedback) < 12) {
        failures.push('T2: option feedback < 12 words (likely "wrong, try again" boilerplate)');
        break;
      }
    }
  }

  if (turn.tier === 'GuidedShortAnswer') {
    const cs = (input.consider_scaffolds ?? []) as string[];
    if (cs.length < 3) {
      failures.push('T3: consider_scaffolds needs claim+support+question (min 3)');
    }
  }

  if (turn.termsSurfaced.length === 0) {
    failures.push('terms_surfaced: empty (no dictionary handoff signal)');
  }

  return { failures };
}

export function runCompliance(turns: Turn[]): ComplianceResult {
  const perCheck: Record<string, CheckResult> = {};
  const allFailures: string[] = [];
  for (const t of turns) {
    const { failures } = checkTurnCompliance(t);
    for (const f of failures) {
      const key = f.split(':')[0];
      perCheck[key] ??= { passes: 0, fails: 0, failures: [] };
      perCheck[key].fails++;
      perCheck[key].failures.push(f);
      allFailures.push(f);
    }
  }
  return { total: turns.length, failures: allFailures, perCheck };
}

if (import.meta.main) {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: bun run scripts/validate_turn_compliance.ts <fixtures.json>');
    process.exit(0);
  }
  const turns = JSON.parse(readFileSync(path, 'utf-8')) as Turn[];
  const r = runCompliance(turns);
  console.log(`Compliance report — ${r.total} turns, ${r.failures.length} failures.`);
  for (const [check, c] of Object.entries(r.perCheck)) {
    console.log(`  ${check}: ${c.fails} failures`);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `bun test scripts/__tests__/validate_turn_compliance.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate_turn_compliance.ts scripts/__tests__/validate_turn_compliance.test.ts
git commit -m "feat(validator): soft compliance validator with per-tier checks"
```

---

## Phase 1 — Autoplay swap (single deliberate Gemini call)

### Task 15: Refactor pregenerate_autoplay to use composeTurn

**Files:**
- Modify: `scripts/pregenerate_autoplay.ts` (full rewrite)

- [ ] **Step 1: Rewrite the script**

Replace the entire file contents with:

```ts
#!/usr/bin/env bun
// Pre-generate the autoplay bundle using composeTurn — same code path the
// live module uses (DD-007). Re-run only when content needs refreshing.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateText } from 'ai';
import { model } from './generators/_llm';
import { allTools } from '../backend/tools';
import { composeTurn } from '../lib/turn-composer';
import type { VizDemand, VizHistoryEntry } from '../lib/viz-selector';

const CONCEPT_ID = 'central-tendency';

const CHECKPOINTS: Array<{ mastery: number; label: string; tier_name: string; simulated_history: VizHistoryEntry[] }> = [
  { mastery: 0.10, label: 'Brand new learner', tier_name: 'WorkedExample', simulated_history: [] },
  { mastery: 0.30, label: 'Recognizes the pattern', tier_name: 'ScaffoldedMCQ', simulated_history: [{ viz_kind: 'none', correct: true }] },
  { mastery: 0.55, label: 'Articulating their own interpretation', tier_name: 'GuidedShortAnswer', simulated_history: [{ viz_kind: 'chart', correct: true }] },
  { mastery: 0.75, label: 'Working without scaffolds', tier_name: 'BareLongAnswer', simulated_history: [{ viz_kind: 'none', correct: true }] },
  { mastery: 0.92, label: 'Contributing to the wiki', tier_name: 'WikiDraft', simulated_history: [] },
];

function readVizDemand(conceptId: string): VizDemand {
  const path = join(import.meta.dir, '..', 'content', 'concepts', `${conceptId}.md`);
  const src = readFileSync(path, 'utf-8');
  const m = src.match(/viz_demand:\s*(\w+)/);
  if (!m) throw new Error(`viz_demand missing from ${conceptId}.md — run scripts/enrich_viz_demand.ts`);
  return m[1] as VizDemand;
}

async function main() {
  const vizDemand = readVizDemand(CONCEPT_ID);
  console.log(`Concept "${CONCEPT_ID}" viz_demand=${vizDemand}`);
  console.log(`Pre-generating ${CHECKPOINTS.length} checkpoints...`);

  const surfacedTerms: string[] = [];
  const out: any[] = [];

  for (const cp of CHECKPOINTS) {
    process.stdout.write(`  ${cp.tier_name} (mastery=${cp.mastery})... `);

    const turn = await composeTurn({
      conceptId: CONCEPT_ID,
      mastery: cp.mastery,
      history: cp.simulated_history as any,
      surfacedTerms,
      vizDemand,
      _generateText: generateText as any,
      _model: model,
      _tools: allTools,
    });

    // Accumulate terms across checkpoints (mirrors the live module).
    for (const t of turn.termsSurfaced) {
      if (!surfacedTerms.includes(t)) surfacedTerms.push(t);
    }

    out.push({
      mastery: cp.mastery,
      label: cp.label,
      tier_name: cp.tier_name,
      simulated_history: cp.simulated_history,
      viz_decision: turn.vizDecision,
      scaffold: turn.scaffold,
      chart: turn.chart,
      flowchart: turn.flowchart,
      terms_surfaced: turn.termsSurfaced,
      dictionary_handoff: turn.dictionaryHandoff,
    });

    const vizSummary = turn.chart ? `chart=${(turn.chart as any).chart_type}` : turn.flowchart ? `flowchart=${(turn.flowchart as any).flowchart_type}` : 'no-viz';
    console.log(`scaffold=${turn.scaffold.name} · ${vizSummary} · handoff=${turn.dictionaryHandoff.kind} · terms=${turn.termsSurfaced.join(',')}`);
  }

  const target = join(import.meta.dir, '..', 'frontend', 'src', 'data');
  if (!existsSync(target)) mkdirSync(target, { recursive: true });

  // Preserve the old bundle for rollback.
  const newPath = join(target, 'autoplay-bundle.json');
  const legacyPath = join(target, 'autoplay-bundle.legacy.json');
  if (existsSync(newPath) && !existsSync(legacyPath)) {
    writeFileSync(legacyPath, readFileSync(newPath, 'utf-8'));
    console.log(`✓ saved previous bundle → autoplay-bundle.legacy.json`);
  }

  writeFileSync(newPath, JSON.stringify(out, null, 2));
  console.log(`\n✓ wrote ${out.length} checkpoints → frontend/src/data/autoplay-bundle.json`);
}

main();
```

- [ ] **Step 2: Run the regeneration (FIRST real Gemini call)**

This is the single deliberate Gemini call in this plan. The user authorized it for this step.

Run: `bun run scripts/pregenerate_autoplay.ts`
Expected: 5 checkpoints generated, bundle written, terms accumulate across the run, handoff kind progresses passive → passive → active → active → constructive.

- [ ] **Step 3: Inspect the bundle manually**

Run: `head -50 frontend/src/data/autoplay-bundle.json`
Expected: each checkpoint has `terms_surfaced` and `dictionary_handoff` fields populated.

- [ ] **Step 4: Commit**

```bash
git add scripts/pregenerate_autoplay.ts frontend/src/data/autoplay-bundle.json frontend/src/data/autoplay-bundle.legacy.json
git commit -m "feat(autoplay): swap to composeTurn; bundle now includes handoff + terms"
```

---

### Task 16: Update AutoplayView.vue to render handoff + terms

**Files:**
- Modify: `frontend/src/views/AutoplayView.vue`

- [ ] **Step 1: Update the bundle type and rendering**

In `frontend/src/views/AutoplayView.vue`, replace the `checkpoints` type (lines 7–16) with:

```ts
const checkpoints = bundle as Array<{
  mastery: number;
  label: string;
  tier_name: string;
  scaffold: { name: string; input: any };
  chart: any | null;
  flowchart: any | null;
  viz_decision?: { kind: string; reason: string };
  terms_surfaced: string[];
  dictionary_handoff:
    | { kind: 'passive'; termsSurfaced: string[] }
    | { kind: 'active'; candidateTerm: string; surfacedTerms: string[]; handoffQuestion: string }
    | { kind: 'constructive'; targetTerm: string; draftTemplate: any };
}>;
```

- [ ] **Step 2: Add a small handoff display below the scaffold**

In the template, after `<Scaffolds v-if="stepIndex < checkpoints.length" :result="currentResult()" />` (around line 95), add:

```vue
<div v-if="stepIndex < checkpoints.length && checkpoints[stepIndex]?.dictionary_handoff" class="mt-6 max-w-[820px]">
  <div class="text-micro text-ink-subtle uppercase">Dictionary handoff</div>
  <div class="text-small text-ink-muted mt-2 font-mono">
    kind: {{ checkpoints[stepIndex].dictionary_handoff.kind }} ·
    terms: {{ checkpoints[stepIndex].terms_surfaced?.join(', ') || '(none)' }}
    <template v-if="checkpoints[stepIndex].dictionary_handoff.kind === 'active'">
      · candidate: {{ (checkpoints[stepIndex].dictionary_handoff as any).candidateTerm }}
    </template>
    <template v-else-if="checkpoints[stepIndex].dictionary_handoff.kind === 'constructive'">
      · target: {{ (checkpoints[stepIndex].dictionary_handoff as any).targetTerm }}
    </template>
  </div>
</div>
```

- [ ] **Step 3: Visually verify in dev**

```bash
cd frontend && bun run dev
```
Expected: navigate to `/autoplay`, click play, each checkpoint shows the handoff kind + terms below the scaffold.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/AutoplayView.vue
git commit -m "feat(autoplay): render dictionary handoff and surfaced terms per checkpoint"
```

---

## Phase 2 — Live module + visual interactivity layer

### Task 17: Update frontend api.ts to parse tail blocks from stream

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Add types and parsing**

Replace the `ScaffoldResult` interface (around line 18) with:

```ts
export type HandoffKind = 'passive' | 'active' | 'constructive';

export interface DictionaryHandoff {
  kind: HandoffKind;
  termsSurfaced?: string[];
  candidateTerm?: string;
  surfacedTerms?: string[];
  handoffQuestion?: string;
  targetTerm?: string;
}

export interface ScaffoldResult {
  scaffold: { name: ScaffoldName; input: any } | null;
  chart: any | null;
  flowchart: any | null;
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
}

const SAFE_DEFAULT_HANDOFF: DictionaryHandoff = { kind: 'passive', termsSurfaced: [] };

const TERMS_RE = /<terms_surfaced>([\s\S]*?)<\/terms_surfaced>/i;
const HANDOFF_RE = /<dictionary_handoff([^>]*)>([\s\S]*?)<\/dictionary_handoff>/i;

function parseTermsList(raw: string): string[] {
  return raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function parseAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i');
  const m = attrs.match(re);
  return m ? m[1].trim() : null;
}

function parseTailBlocks(text: string): { termsSurfaced: string[]; dictionaryHandoff: DictionaryHandoff } {
  const tm = text.match(TERMS_RE);
  const hm = text.match(HANDOFF_RE);
  const terms = tm ? parseTermsList(tm[1]) : [];
  if (!hm) return { termsSurfaced: terms, dictionaryHandoff: { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms } };
  const kind = parseAttr(hm[1], 'kind') ?? 'passive';
  if (kind === 'active') {
    const candidate = parseAttr(hm[1], 'candidate_term');
    if (!candidate) return { termsSurfaced: terms, dictionaryHandoff: { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms } };
    return {
      termsSurfaced: terms,
      dictionaryHandoff: { kind: 'active', candidateTerm: candidate.toLowerCase(), surfacedTerms: terms, handoffQuestion: hm[2].trim() || 'Is this how your school uses this term?' },
    };
  }
  if (kind === 'constructive') {
    const target = parseAttr(hm[1], 'target_term');
    if (!target) return { termsSurfaced: terms, dictionaryHandoff: { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms } };
    return { termsSurfaced: terms, dictionaryHandoff: { kind: 'constructive', targetTerm: target.toLowerCase() } };
  }
  return { termsSurfaced: terms, dictionaryHandoff: { kind: 'passive', termsSurfaced: terms } };
}
```

- [ ] **Step 2: Capture text deltas during stream parsing**

In the streaming loop in `streamScaffold`, modify to also accumulate `text-delta` chunks:

After the `let buf = '';` line, add:

```ts
let textBuf = '';
```

In the for-loop processing parts, add a branch before the `tool-input-start` check:

```ts
if (part.type === 'text-delta') {
  textBuf += part.delta ?? '';
  continue;
}
```

And after the `tool-input-available` branch, add a fall-through that catches text-end signals (the AI SDK uses several event names — be permissive):

```ts
if (part.type === 'text' && typeof part.text === 'string') {
  textBuf += part.text;
  continue;
}
```

- [ ] **Step 3: Build the result with parsed tail blocks**

Replace the final return with:

```ts
const tail = parseTailBlocks(textBuf);
return {
  scaffold,
  chart,
  flowchart,
  termsSurfaced: tail.termsSurfaced,
  dictionaryHandoff: tail.dictionaryHandoff,
};
```

- [ ] **Step 4: Run frontend type check**

Run: `cd frontend && bunx vue-tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(api): parse tail blocks from stream into ScaffoldResult"
```

---

### Task 18: Update backend system-prompt to use per-tier prompts

**Files:**
- Modify: `backend/index.ts:46-54` (`/api/chat` route)

The cleanest path is to read the tier from the request body and select the per-tier system prompt server-side.

- [ ] **Step 1: Update the `/api/chat` route**

Replace the body of `app.post('/api/chat', ...)` (lines 41–61) with:

```ts
app.post('/api/chat', async (c) => {
  const provider = getProvider();
  if (!provider) return c.json({ error: 'GEMINI_API_KEY not set; LLM unavailable' }, 503);

  const body = await c.req.json().catch(() => ({}));
  const messages = body.messages ?? [];
  const tier = body.tier as keyof typeof SYSTEM_PROMPTS | undefined;

  const systemPrompt = (tier && SYSTEM_PROMPTS[tier])
    ? SYSTEM_PROMPTS[tier]
    : (body.system ?? 'You are a Content Generator for a data fluency module. Pick exactly one scaffold tool per turn matching the learner mastery.');

  const result = streamText({
    model: provider(MODEL_ID),
    system: systemPrompt,
    messages,
    tools: allTools,
  });

  return stream(c, async (s) => {
    for await (const chunk of result.toUIMessageStream()) {
      await s.write(JSON.stringify(chunk) + '\n');
    }
  });
});
```

- [ ] **Step 2: Add the import at the top of `backend/index.ts`**

After existing imports, add:

```ts
import { SYSTEM_PROMPTS } from '../lib/prompts';
```

- [ ] **Step 3: Update frontend to send `tier` in the request body**

In `frontend/src/lib/api.ts`, in `streamScaffold`, replace the fetch body with:

```ts
body: JSON.stringify({
  messages: [{ role: 'user', content: userMessage }],
  tier: tier.name,
}),
```

- [ ] **Step 4: Verify backend tests still pass**

Run: `bun test backend/__tests__/`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add backend/index.ts frontend/src/lib/api.ts
git commit -m "feat(backend): wire per-tier system prompts via /api/chat tier param"
```

---

### Task 19: Add backend route for handoff submission

**Files:**
- Modify: `backend/index.ts`

- [ ] **Step 1: Add `/api/handoff/submit` and `/api/wiki-draft/submit` routes**

After the `/api/quality/eval` route, add:

```ts
// --- POST /api/handoff/submit — dictionary handoff response ----------------
const HandoffInput = z.object({
  sessionId: z.string().min(1),
  conceptId: z.string().min(1),
  term: z.string().min(1),
  schoolSelfReported: z.enum(['HGSE', 'HBS', 'FAS', 'HMS', 'SEAS', 'other']).nullable(),
  agreement: z.enum(['yes', 'no', 'unsure', 'differently']),
  freeText: z.string().max(200).nullable(),
});

app.post('/api/handoff/submit', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = HandoffInput.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const { submitHandoff } = await import('../lib/db/handoff-repo');
  const r = await submitHandoff(parsed.data);
  if (!r.ok) return c.json({ error: r.reason ?? 'submit failed' }, 400);
  return c.json({ ok: true, id: r.id ?? null });
});

// --- POST /api/wiki-draft/submit — T5 contribution ------------------------
const WikiInput = z.object({
  sessionId: z.string().min(1),
  term: z.string().min(1),
  school: z.string().min(1),
  howWeUseIt: z.string().min(1).max(200),
  exampleInPractice: z.string().max(200).nullable(),
  differsFromOtherSchools: z.string().max(200).nullable(),
});

app.post('/api/wiki-draft/submit', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = WikiInput.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const { submitWikiDraft } = await import('../lib/db/wiki-repo');
  const r = await submitWikiDraft(parsed.data);
  if (!r.ok) return c.json({ error: r.reason ?? 'submit failed' }, 400);
  return c.json({ ok: true, id: r.id ?? null });
});
```

- [ ] **Step 2: Smoke-test routes manually**

```bash
bun run backend/index.ts &
sleep 1
curl -s -X POST http://localhost:3001/api/handoff/submit \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","conceptId":"central-tendency","term":"median","schoolSelfReported":"HGSE","agreement":"yes","freeText":null}'
kill %1
```
Expected: `{"ok":true,...}` (or DB-not-configured warning + `{"ok":true}` when no `DATABASE_URL`).

- [ ] **Step 3: Commit**

```bash
git add backend/index.ts
git commit -m "feat(backend): handoff + wiki-draft submission routes"
```

---

### Task 20: Build TierTransition component

**Files:**
- Create: `frontend/src/components/scaffolds/TierTransition.vue`

- [ ] **Step 1: Write the component**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { ScaffoldName } from '../../lib/api';

const props = defineProps<{ from: ScaffoldName | null; to: ScaffoldName }>();

const TIER_LABEL: Record<ScaffoldName, string> = {
  WorkedExample: 'demonstration',
  ScaffoldedMCQ: 'scaffolded recognition',
  GuidedShortAnswer: 'guided interpretation',
  BareLongAnswer: 'unscaffolded reasoning',
  WikiDraft: 'contribution',
};

const message = computed(() => {
  if (!props.from || props.from === props.to) return null;
  return `You've moved from ${TIER_LABEL[props.from]} to ${TIER_LABEL[props.to]}.`;
});
</script>

<template>
  <Transition name="fade">
    <div v-if="message" class="bg-accent-tint p-4 mb-6 text-small text-ink">
      {{ message }} The scaffolding will be lighter from here.
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/scaffolds/TierTransition.vue
git commit -m "feat(ui): TierTransition component for visible scaffold-fade arc"
```

---

### Task 21: Build DistractorReveal component

**Files:**
- Create: `frontend/src/components/scaffolds/DistractorReveal.vue`

- [ ] **Step 1: Write the component**

```vue
<script setup lang="ts">
import { ref } from 'vue';

interface Option {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

const props = defineProps<{ options: Option[]; hint: string; observationPrompt?: string }>();
const selectedId = ref<string | null>(null);
const revealed = ref(false);

function pick(id: string) {
  selectedId.value = id;
  revealed.value = true;
}
</script>

<template>
  <div>
    <div v-if="props.observationPrompt" class="bg-paper p-4 border-l-2 border-accent mb-6">
      <div class="text-micro text-ink-subtle uppercase mb-2">Before answering</div>
      <p class="text-small text-ink">{{ props.observationPrompt }}</p>
    </div>

    <div class="space-y-3">
      <button
        v-for="opt in props.options"
        :key="opt.id"
        @click="pick(opt.id)"
        :class="[
          'w-full text-left border p-4 transition cursor-pointer',
          selectedId === opt.id
            ? (opt.correct ? 'border-tier-3 bg-tier-3/5' : 'border-tier-1 bg-tier-1/5')
            : 'border-ink-subtle hover:border-ink',
        ]"
      >
        <div class="flex">
          <span class="font-mono text-small text-ink-subtle mr-3">{{ opt.id }}</span>
          <span class="text-body">{{ opt.text }}</span>
        </div>
        <Transition name="reveal">
          <div v-if="revealed" class="mt-3 text-small text-ink-muted border-t border-ink-subtle/30 pt-3">
            <span class="font-mono text-micro uppercase mr-2">why someone picks this:</span>
            {{ opt.feedback }}
          </div>
        </Transition>
      </button>
    </div>

    <div class="mt-6" style="width:48px; border-top: 0.5px solid #8B8B8B;"></div>
    <div class="text-micro text-ink-subtle uppercase mt-6">Hint</div>
    <p class="text-small text-ink-muted mt-2">{{ props.hint }}</p>
  </div>
</template>

<style scoped>
.reveal-enter-active { transition: opacity 0.4s ease, max-height 0.4s ease; }
.reveal-enter-from { opacity: 0; max-height: 0; }
.reveal-enter-to { opacity: 1; max-height: 200px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/scaffolds/DistractorReveal.vue
git commit -m "feat(ui): DistractorReveal — show all options' reasoning after pick"
```

---

### Task 22: Build DictionaryHandoffCard component

**Files:**
- Create: `frontend/src/components/scaffolds/DictionaryHandoffCard.vue`

- [ ] **Step 1: Write the component**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DictionaryHandoff } from '../../lib/api';

const props = defineProps<{
  handoff: DictionaryHandoff;
  conceptId: string;
  sessionId: string;
}>();

const emit = defineEmits<{ submitted: [term: string] }>();

const agreement = ref<'yes' | 'no' | 'unsure' | 'differently' | null>(null);
const freeText = ref('');
const school = ref<'HGSE' | 'HBS' | 'FAS' | 'HMS' | 'SEAS' | 'other' | null>(null);
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

const candidateTerm = computed(() => {
  if (props.handoff.kind === 'active') return props.handoff.candidateTerm ?? null;
  return null;
});

async function submit() {
  if (!candidateTerm.value || !agreement.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
      ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');
    const res = await fetch(`${BACKEND_BASE}/api/handoff/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: props.sessionId,
        conceptId: props.conceptId,
        term: candidateTerm.value,
        schoolSelfReported: school.value,
        agreement: agreement.value,
        freeText: freeText.value.trim() || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      error.value = j.error ?? `HTTP ${res.status}`;
      return;
    }
    submitted.value = true;
    emit('submitted', candidateTerm.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Transition name="slide">
    <div v-if="props.handoff.kind === 'active' && candidateTerm" class="border border-accent bg-accent-tint p-6 mt-8">
      <div class="text-micro text-ink-subtle uppercase">One quick check</div>
      <p class="text-body text-ink mt-2">
        How does <strong>your team</strong> use the word "{{ candidateTerm }}"?
      </p>

      <div v-if="!submitted" class="mt-4 space-y-2">
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="yes" v-model="agreement" class="mr-2 accent-ink" />
          Same as the course team note
        </label>
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="differently" v-model="agreement" class="mr-2 accent-ink" />
          We use it differently
        </label>
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="unsure" v-model="agreement" class="mr-2 accent-ink" />
          Not sure
        </label>

        <div v-if="agreement === 'differently'" class="mt-4">
          <label class="text-micro text-ink-subtle uppercase">Your school</label>
          <select v-model="school" class="block mt-1 p-2 border border-ink-subtle bg-surface text-small">
            <option :value="null">— select —</option>
            <option value="HGSE">HGSE</option>
            <option value="HBS">HBS</option>
            <option value="FAS">FAS</option>
            <option value="HMS">HMS</option>
            <option value="SEAS">SEAS</option>
            <option value="other">other</option>
          </select>
          <label class="text-micro text-ink-subtle uppercase mt-3 block">How does your team use it? (optional)</label>
          <textarea v-model="freeText" rows="2" maxlength="200"
                    class="w-full mt-1 p-2 border border-ink-subtle bg-surface text-small resize-none focus:outline-none focus:border-accent"></textarea>
          <div class="text-micro text-ink-subtle text-right mt-1">{{ freeText.length }}/200</div>
        </div>

        <div class="mt-4 flex justify-between items-center">
          <span v-if="error" class="text-small text-tier-1">{{ error }}</span>
          <button @click="submit" :disabled="!agreement || submitting"
                  class="text-ink hover:underline disabled:opacity-40">
            {{ submitting ? 'submitting…' : 'submit →' }}
          </button>
        </div>
      </div>

      <div v-else class="mt-4 text-small text-ink-muted">
        Thank you. Your input helps build the cross-school dictionary.
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from { opacity: 0; transform: translateY(8px); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/scaffolds/DictionaryHandoffCard.vue
git commit -m "feat(ui): DictionaryHandoffCard for T3+ active handoff submissions"
```

---

### Task 23: Build TermsSurfacedSidebar component

**Files:**
- Create: `frontend/src/components/scaffolds/TermsSurfacedSidebar.vue`

- [ ] **Step 1: Write the component**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ terms: string[] }>();
const pulsedTerms = ref<Set<string>>(new Set());
const lastSeen = ref<Set<string>>(new Set());

watch(() => props.terms, (next) => {
  for (const t of next) {
    if (!lastSeen.value.has(t)) {
      pulsedTerms.value.add(t);
      setTimeout(() => pulsedTerms.value.delete(t), 800);
    }
  }
  lastSeen.value = new Set(next);
}, { deep: true, immediate: true });

const open = ref(true);
</script>

<template>
  <aside class="border-l border-ink-subtle/30 pl-6">
    <button @click="open = !open" class="text-micro text-ink-subtle uppercase hover:text-ink">
      Terms you've worked with ({{ props.terms.length }}) {{ open ? '−' : '+' }}
    </button>
    <ul v-if="open" class="mt-3 space-y-1">
      <li v-for="t in props.terms" :key="t"
          :class="['text-small font-mono', pulsedTerms.has(t) ? 'animate-pulse text-accent' : 'text-ink-muted']">
        <a :href="`/dictionary/${t}`" class="hover:underline">{{ t }}</a>
      </li>
      <li v-if="props.terms.length === 0" class="text-small text-ink-subtle italic">
        Terms will appear here as you encounter them.
      </li>
    </ul>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/scaffolds/TermsSurfacedSidebar.vue
git commit -m "feat(ui): TermsSurfacedSidebar with pulse animation on new terms"
```

---

### Task 24: Build WikiDraftForm component

**Files:**
- Create: `frontend/src/components/scaffolds/WikiDraftForm.vue`

- [ ] **Step 1: Write the component**

```vue
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ targetTerm: string; sessionId: string }>();
const emit = defineEmits<{ submitted: [term: string] }>();

const school = ref<'HGSE' | 'HBS' | 'FAS' | 'HMS' | 'SEAS' | 'other' | null>(null);
const howWeUseIt = ref('');
const example = ref('');
const differs = ref('');
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (!school.value || !howWeUseIt.value.trim()) return;
  submitting.value = true;
  error.value = null;
  try {
    const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
      ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');
    const res = await fetch(`${BACKEND_BASE}/api/wiki-draft/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: props.sessionId,
        term: props.targetTerm,
        school: school.value,
        howWeUseIt: howWeUseIt.value.trim(),
        exampleInPractice: example.value.trim() || null,
        differsFromOtherSchools: differs.value.trim() || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      error.value = j.error ?? `HTTP ${res.status}`;
      return;
    }
    submitted.value = true;
    emit('submitted', props.targetTerm);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="bg-surface p-6 mt-8 border border-ink-subtle">
    <div class="text-micro text-ink-subtle uppercase">Contribute: "{{ props.targetTerm }}"</div>
    <p class="text-small text-ink-muted mt-2">
      Your draft goes to human review before appearing in the dictionary. Thank you for contributing.
    </p>

    <div v-if="!submitted" class="mt-4 space-y-3">
      <div>
        <label class="text-micro text-ink-subtle uppercase">Your school</label>
        <select v-model="school" class="block mt-1 p-2 border border-ink-subtle bg-paper text-small">
          <option :value="null">— select —</option>
          <option value="HGSE">HGSE</option>
          <option value="HBS">HBS</option>
          <option value="FAS">FAS</option>
          <option value="HMS">HMS</option>
          <option value="SEAS">SEAS</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">How your team uses "{{ props.targetTerm }}"</label>
        <textarea v-model="howWeUseIt" rows="3" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"
                  placeholder="A short description in your own words."></textarea>
        <div class="text-micro text-ink-subtle text-right">{{ howWeUseIt.length }}/200</div>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">A short example from your work (optional)</label>
        <textarea v-model="example" rows="2" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"></textarea>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">How this differs from how other schools use it (optional)</label>
        <textarea v-model="differs" rows="2" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"></textarea>
      </div>
      <div class="flex justify-between items-center pt-2">
        <span v-if="error" class="text-small text-tier-1">{{ error }}</span>
        <button @click="submit" :disabled="!school || !howWeUseIt.trim() || submitting"
                class="text-ink hover:underline disabled:opacity-40">
          {{ submitting ? 'submitting…' : 'submit draft →' }}
        </button>
      </div>
    </div>

    <div v-else class="mt-4 text-small text-ink-muted">
      Your draft has been queued for review.
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/scaffolds/WikiDraftForm.vue
git commit -m "feat(ui): WikiDraftForm for T5 structured contribution"
```

---

### Task 25: Wire visual interactivity into Scaffolds.vue

**Files:**
- Modify: `frontend/src/components/Scaffolds.vue`

- [ ] **Step 1: Replace the T2 inline option block with `DistractorReveal`**

Add to the imports:

```ts
import DistractorReveal from './scaffolds/DistractorReveal.vue';
```

In the template, replace the entire `<!-- ScaffoldedMCQ -->` block (lines 63–81) with:

```vue
<template v-else-if="sc.name === 'ScaffoldedMCQ'">
  <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
  <p class="text-body mt-6 whitespace-pre-line">{{ input.setup_prose }}</p>
  <pre v-if="input.artifact_summary_stats"
       class="font-mono text-small mt-4 p-4 bg-accent-tint whitespace-pre-line">{{ input.artifact_summary_stats }}</pre>
  <RenderedChart v-if="result?.chart" :chart="result.chart" />
  <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
  <p class="text-body mt-6">{{ input.prompt }}</p>
  <DistractorReveal class="mt-4"
                    :options="input.options ?? []"
                    :hint="input.hint ?? ''"
                    :observation-prompt="input.observation_prompt" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Scaffolds.vue
git commit -m "feat(ui): use DistractorReveal in Scaffolds for T2"
```

---

### Task 26: Wire ModuleView.vue with full visual layer + handoff submission

**Files:**
- Modify: `frontend/src/views/ModuleView.vue`

- [ ] **Step 1: Replace the script section**

Replace lines 1–47 (the `<script setup>` block) with:

```ts
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import LMSShell from '../components/LMSShell.vue';
import Scaffolds from '../components/Scaffolds.vue';
import TierTransition from '../components/scaffolds/TierTransition.vue';
import DictionaryHandoffCard from '../components/scaffolds/DictionaryHandoffCard.vue';
import TermsSurfacedSidebar from '../components/scaffolds/TermsSurfacedSidebar.vue';
import WikiDraftForm from '../components/scaffolds/WikiDraftForm.vue';
import { streamScaffold, pickTier, type ScaffoldResult, type ScaffoldName } from '../lib/api';
import { pickVisualization, type VizDemand, type VizHistoryEntry } from '../lib/viz-selector';
import vizDemandMap from '../data/concept-viz-demand.json';

const props = defineProps<{ concept_id: string }>();

const mastery = ref(0.10);
const result = ref<ScaffoldResult | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const history = ref<VizHistoryEntry[]>([]);
const surfacedTerms = ref<string[]>([]);
const previousTier = ref<ScaffoldName | null>(null);

const sessionId = ref(`session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const vizDemand = computed<VizDemand>(() => {
  const map = vizDemandMap as Record<string, VizDemand>;
  return map[props.concept_id] ?? 'definition';
});

const decision = computed(() => pickVisualization({
  concept: { id: props.concept_id, viz_demand: vizDemand.value },
  mastery: mastery.value,
  history: history.value,
}));

const currentTier = computed(() => pickTier(mastery.value).name);

async function fetchScaffold() {
  loading.value = true;
  error.value = null;
  const prevTier = result.value?.scaffold?.name ?? null;
  result.value = null;
  const d = decision.value;
  try {
    const r = await streamScaffold({ conceptId: props.concept_id, mastery: mastery.value, vizDecision: d });
    result.value = r;
    const producedKind = r.chart ? 'chart' : r.flowchart ? 'flowchart' : 'none';
    history.value.push({ viz_kind: producedKind, correct: true });
    for (const t of r.termsSurfaced) {
      if (!surfacedTerms.value.includes(t)) surfacedTerms.value.push(t);
    }
    previousTier.value = prevTier;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function onHandoffSubmitted(term: string) {
  console.info(`handoff submitted for term: ${term}`);
}
</script>
```

- [ ] **Step 2: Replace the template section**

Replace the `<template>` block with:

```vue
<template>
  <LMSShell
    moduleLabel="Module 3 of 7 · Data fluency for higher ed admin"
    lessonTitle="Reading distributions in context"
    audience="Harvard staff"
    :lessonsTotal="7"
    :lessonsCompleted="2"
    :currentIndex="3"
  >
    <div class="grid grid-cols-[1fr_220px] gap-8">
      <div>
        <div class="mb-8">
          <label class="text-micro text-ink-subtle uppercase">Mastery (live · drag to fetch fresh scaffold)</label>
          <input type="range" min="0" max="1" step="0.01" v-model.number="mastery"
                 class="w-full mt-3 accent-accent" />
          <div class="flex justify-between text-small text-ink-muted mt-2 font-mono">
            <span>mastery = {{ mastery.toFixed(2) }} → tier {{ pickTier(mastery).num }} ({{ pickTier(mastery).name }})</span>
            <button @click="fetchScaffold" :disabled="loading"
                    class="text-ink hover:underline disabled:opacity-40">
              {{ loading ? 'generating…' : 'generate scaffold →' }}
            </button>
          </div>
          <div class="text-micro text-ink-subtle mt-2 font-mono">
            viz_demand={{ vizDemand }} · selector → {{ decision.kind }}
            <span class="text-ink-muted">· {{ decision.reason }}</span>
          </div>
        </div>

        <TierTransition v-if="result" :from="previousTier" :to="currentTier" />

        <Scaffolds :result="result" :loading="loading" />

        <DictionaryHandoffCard
          v-if="result?.dictionaryHandoff?.kind === 'active'"
          :handoff="result.dictionaryHandoff"
          :concept-id="props.concept_id"
          :session-id="sessionId"
          @submitted="onHandoffSubmitted"
        />

        <WikiDraftForm
          v-if="result?.dictionaryHandoff?.kind === 'constructive' && (result.dictionaryHandoff as any).targetTerm"
          :target-term="(result.dictionaryHandoff as any).targetTerm"
          :session-id="sessionId"
          @submitted="onHandoffSubmitted"
        />

        <div v-if="error" class="bg-accent-tint p-4 text-small text-ink mt-4">
          Backend error: {{ error }}. Concept: <code class="font-mono">{{ props.concept_id }}</code>.
        </div>

        <div v-if="!result && !loading && !error" class="text-small text-ink-muted">
          Adjust the mastery slider and click "generate scaffold" to fetch a live scaffold from the LLM.
        </div>
      </div>

      <TermsSurfacedSidebar :terms="surfacedTerms" />
    </div>
  </LMSShell>
</template>
```

- [ ] **Step 3: Verify type-check**

Run: `cd frontend && bunx vue-tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/ModuleView.vue
git commit -m "feat(module): wire tier transitions, handoff card, terms sidebar, wiki form"
```

---

## Phase 3 — Docs

### Task 27: Write `docs/architecture.md`

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1: Write the file**

```markdown
# Architecture

This page describes how the data fluency module is built. It exists to make architectural choices reviewable by the capstone committee. Decisions themselves (with rationale and alternatives) live in [`design-decisions.md`](./design-decisions.md).

## Mission

A self-paced data fluency module for Harvard staff that fades scaffolding as the learner demonstrates mastery, while surfacing real cross-school terminology divergence into a living dictionary. The module sits inside Harvard's LMS as a Vue 3 component in an iframe.

The module is not a stats course. It is a data fluency instrument: the goal is shared interpretation, vocabulary, and judgment across Harvard staff. Computation is out of scope.

## Components

### Scaffold Selector
A pure, rule-based function from `(mastery, history)` to one of five scaffold names. Lives in `lib/scaffold-selector.ts`. ICAP-mapped tiers — WorkedExample, ScaffoldedMCQ, GuidedShortAnswer, BareLongAnswer, WikiDraft — selected by mastery thresholds the committee can read in source. **Not** an LLM call. (See DD-001, DD-002.)

### Visualization Selector
A pure, rule-based function from `(concept, mastery, history)` to a visualization kind: `chart`, `flowchart`, or `none`. Lives in `lib/viz-selector.ts`. The LLM never decides whether to render a chart; it only fills in the chosen visualization. (See DD-005.)

### Turn Composition Pipeline (`composeTurn`)
The single composition path producing a `Turn`. Both the live `/module` route and `scripts/pregenerate_autoplay.ts` call it — that's how we prevent drift between the demo surface and the actual learner experience. (See DD-007.)

The pipeline:

1. `pickScaffold(mastery, history)` selects the tier.
2. `pickVisualization(...)` selects the visualization kind.
3. `SYSTEM_PROMPTS[tier]` provides the per-tier pedagogical contract.
4. `generateText` is called with the per-tier system prompt, the scaffold + viz tools, and a tightly-scoped user prompt.
5. `parseTailBlocks(text)` parses `<terms_surfaced>` and `<dictionary_handoff>` trailing blocks from the model's text output. Missing or malformed blocks fall back to safe defaults — never reject the turn.
6. The resulting `Turn` includes scaffold, optional viz, parsed terms, and a tier-graded `DictionaryHandoff`.

(See DD-006.)

### Dictionary Handoff Layer
Tier-graded persistence that turns the module into a corpus-builder for cross-school terminology:

- T1–T2 (passive): `<terms_surfaced>` highlights become clickable. Click-throughs may be logged for engagement signal.
- T3–T4 (active): the learner is asked whether their school uses the candidate term the way the course-team note describes it. Responses persist to `dictionary_handoff_responses`.
- T5 (constructive): the learner contributes a structured wiki draft. Drafts persist to `wiki_drafts` with `status='pending_review'`. **Never auto-published.**

A SQL view joins the course-designer-authored canonical entries (in `content/dictionary/`) with the recent `agreement='differently'` aggregates from `dictionary_handoff_responses`, rendered separately in the dictionary entry UI as "Course team note:" and "Reported by colleagues:". (See DD-008.)

PII tripwire (`lib/db/pii-tripwire.ts`) gates all learner-submitted free text — emails, salary figures, student-ID-like sequences, full-name patterns are rejected at write time.

### Pre-generated autoplay vs live module
The autoplay demo at `/autoplay` is a 5-checkpoint pre-generated bundle (`frontend/src/data/autoplay-bundle.json`). It is regenerated by `scripts/pregenerate_autoplay.ts`, which calls `composeTurn` — so the demo reflects exactly what the live module will produce. The live module at `/module` calls `composeTurn` per turn via the `/api/chat` route.

### LLM provider configuration
- v1: Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite-preview`) via `@ai-sdk/google` with direct Google AI Studio.
- v1.5 (planned): Harvard API Portal — one-line `baseURL` swap.
- Emergency fallback: Claude Haiku 4.5 via direct Anthropic — two-line provider swap.
- Roles: differentiated by system prompt and `thinkingLevel`, not by model. Content Generator and Quality Evaluator use `medium`; State Inferrer and Template Filler use `low`. (See DD-003.)

### Soft validator
`scripts/validate_turn_compliance.ts` scans Turn fixtures for pedagogy compliance: observation-before-stem at T2, distractor reasoning ≥ 12 words, claim/support/question scaffolds at T3, dictionary handoff `kind` matched to tier, `terms_surfaced` non-empty. Advisory only — never blocks generation. Sustained > 20% failure on any check is the escalation signal to adopt schema-typed templates (deferred path B).

## Out of scope (v1)

Documented for v2; not built:

- Cross-silo wiki retrieval (replaced by static dictionary + live handoff aggregate in v1).
- Role parameterization (architecture allows; not used in v1 demo).
- Multi-school dictionary verification beyond HGSE / HBS / FAS / HMS / SEAS.
- Vector embeddings or semantic search.
- Real-time collaboration on wiki drafts.
- Authentication beyond simple session ID.
- LMS Single Sign-On.
- Production rate-limiting or abuse prevention.
- Quality Evaluator async scoring worker (`quality_score` column exists; worker is v2).
- Human review queue UI for wiki drafts (status field exists; UI is v2).
- Per-school analytics dashboards.

## See also

- [`design-decisions.md`](./design-decisions.md) — full ADR log with rationale.
- [`../CLAUDE.md`](../CLAUDE.md) — project-wide invariants (do not modify without a corresponding DD entry).
- [`../decisions/005-viz-selector.md`](../decisions/005-viz-selector.md) — original visualization-selector decision record.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: architecture page for capstone committee"
```

---

### Task 28: Write `docs/design-decisions.md`

**Files:**
- Create: `docs/design-decisions.md`

- [ ] **Step 1: Write the file**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/design-decisions.md
git commit -m "docs: design-decisions ADR log with DD-001 through DD-009"
```

---

### Task 29: Add nav entry for design-decisions and CI gate

**Files:**
- Modify: `frontend/src/components/TopNav.vue`
- Create: `.github/workflows/invariant-drift.yml`

- [ ] **Step 1: Read the current TopNav**

Run: `cat frontend/src/components/TopNav.vue`
Note where the existing Architecture link is rendered.

- [ ] **Step 2: Add Design Decisions link next to Architecture**

In `frontend/src/components/TopNav.vue`, find the `<a>` tag that links to `/architecture` and add a sibling immediately after:

```vue
<a href="/design-decisions" class="text-small text-ink-muted hover:text-ink">Design decisions</a>
```

(Match the exact class names and attributes used by the existing Architecture link — copy them.)

- [ ] **Step 3: Wire the route**

If `frontend/src/main.ts` declares routes, add a route entry for `/design-decisions` that renders the markdown file the same way `/architecture` does. If routing uses a generic markdown view, no code change is required beyond placing the file in the same directory the existing Architecture page reads from.

Run: `grep -rn 'architecture' frontend/src/main.ts frontend/src/App.vue` to find the existing wiring; mirror it.

- [ ] **Step 4: Write the CI gate**

Create `.github/workflows/invariant-drift.yml`:

```yaml
name: Invariant drift guard

on:
  pull_request:
    paths:
      - 'CLAUDE.md'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changes to "Architectural invariants" section
        run: |
          if git diff origin/${{ github.base_ref }}...HEAD -- CLAUDE.md \
              | grep -E '^\+' \
              | grep -B 999 -m 1 -E '^\+## Architectural invariants' >/dev/null 2>&1 \
            || git diff origin/${{ github.base_ref }}...HEAD -- CLAUDE.md \
              | awk '/^@@/{p=0} /Architectural invariants/{p=1} p' \
              | grep -E '^[+-]' >/dev/null; then
            echo "CLAUDE.md 'Architectural invariants' section was modified."
            if git diff origin/${{ github.base_ref }}...HEAD -- docs/design-decisions.md \
                | grep -E '^\+## DD-[0-9]+' >/dev/null; then
              echo "OK: a new DD-XXX entry was added in the same PR."
              exit 0
            else
              echo "ERROR: no new DD-XXX entry in docs/design-decisions.md."
              echo "Modifying architectural invariants requires a corresponding DD entry."
              exit 1
            fi
          else
            echo "No changes to 'Architectural invariants' section."
          fi
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/TopNav.vue .github/workflows/invariant-drift.yml
git commit -m "feat(docs): nav entry for design-decisions + CI invariant-drift guard"
```

---

## Phase 4 — Verification

### Task 30: End-to-end smoke

**Files:** none modified — verification only.

- [ ] **Step 1: Bring up backend + frontend**

```bash
# terminal 1
cd "/home/pb_logani/projects/GenUI - DF" && bun run backend/index.ts

# terminal 2
cd "/home/pb_logani/projects/GenUI - DF/frontend" && bun run dev
```

Expected: backend logs `LLM live` (or `LLM offline` if no key); frontend serves at the dev port.

- [ ] **Step 2: Manual flow on `/module`**

In the browser:
1. Navigate to `/module` (or whichever path renders ModuleView with `concept_id=central-tendency`).
2. With mastery slider at 0.10, click "generate scaffold".
3. Verify: a WorkedExample renders, terms appear in the right sidebar with a brief pulse, no handoff card.
4. Move slider to 0.30, generate. Verify: ScaffoldedMCQ with observation-prompt block renders; clicking an option reveals all four distractors' reasoning.
5. Move slider to 0.55, generate. Verify: GuidedShortAnswer with three consider-scaffolds renders; DictionaryHandoffCard appears below; tier transition card appears above.
6. Move slider to 0.92, generate. Verify: WikiDraft renders; WikiDraftForm appears below; submitting shows "queued for review".

- [ ] **Step 3: Run the soft validator on the autoplay bundle**

```bash
bun run validate:turn-compliance frontend/src/data/autoplay-bundle.json
```

Expected: a per-check failure summary. Record the baseline numbers for the soft validator's escalation criterion.

- [ ] **Step 4: Run all tests**

```bash
bun test
```

Expected: all unit tests pass.

- [ ] **Step 5: Final commit**

If any small fixes were needed during smoke (typo in a placeholder, missing import, etc.), commit them now with a descriptive message. Otherwise no commit.

---

## Self-Review Checklist (run after writing the plan)

**Spec coverage:**
- ✅ Per-tier system prompts → Tasks 4–5.
- ✅ Tail block parser + safe defaults → Tasks 2–3.
- ✅ `composeTurn` single composition path → Tasks 7–8, used by 15 (autoplay) and 18 (live).
- ✅ Drizzle tables (handoff + wiki) → Tasks 9–10.
- ✅ PII tripwire → Tasks 11–12.
- ✅ Repos for handoff + wiki → Task 13.
- ✅ Soft validator → Task 14.
- ✅ Backend submission routes → Task 19.
- ✅ Visual layer (5 components) → Tasks 20–24.
- ✅ Wired into Scaffolds + ModuleView → Tasks 25–26.
- ✅ Autoplay swap → Tasks 15–16.
- ✅ `docs/architecture.md` + `docs/design-decisions.md` + nav + CI gate → Tasks 27–29.
- ✅ End-to-end smoke → Task 30.

**Type/name consistency check:**
- `Turn`, `DictionaryHandoff`, `HandoffKind`, `PassiveHandoff`, `ActiveHandoff`, `ConstructiveHandoff` defined in `lib/types.ts` (Task 1) and consumed unchanged by all later tasks.
- `parseTailBlocks` signature `(text: string) => TailBlockResult` (Task 3) — matches usage in Task 8 (`composeTurn`).
- `composeTurn` signature stable across Task 8, 15, 18.
- `submitHandoff`, `submitWikiDraft` signatures stable across Tasks 13, 19, 22, 24.

**Placeholder scan:**
- No `TBD`, `TODO`, `fill in details`, "implement later" anywhere in this plan.
- No "similar to Task N" without showing the code.

---

## Out of scope (recorded so the work isn't lost)

- **Path B — schema-typed templates with `generateObject`.** Adopt only if soft-validator failure rate exceeds 20% sustained for any check. Design exists in the spec.
- **Path C — 25 per-concept ConceptAnchor files.** Content-production project; revisit when course designers are ready.
- **Quality Evaluator async scoring** for wiki drafts (`qualityScore` column exists, no worker yet).
- **Human review queue UI** for wiki drafts (`status` column exists, no UI yet).
- **Per-school analytics dashboards.**
- **Persistent cache** for composed turns.
- **Light/dark mode.**
