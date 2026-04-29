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
Surface 2–3 terms in terms_surfaced. The handoff asks the learner which of those terms their reasoning depended on AND how their team uses it. Pick the term most likely to vary across schools as the candidate.

Include these fields IN YOUR BareLongAnswer tool call input:
- terms_surfaced: ["term1", "term2", "term3"]
- dictionary_handoff: {
    "kind": "active",
    "candidate_term": "<one_term>",
    "handoff_question": "These terms came up: term1, term2, term3. Which of these did your reasoning depend on, and how does your team use it?"
  }
`.trim();
