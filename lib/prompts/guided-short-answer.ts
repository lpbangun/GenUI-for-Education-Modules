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
The active handoff begins at this tier. Pick ONE term from terms_surfaced as the candidate term — prefer terms the learner has seen multiple times across the session.

Include these fields IN YOUR GuidedShortAnswer tool call input:
- terms_surfaced: ["term1", "term2"]
- dictionary_handoff: {
    "kind": "active",
    "candidate_term": "<one_term_from_terms_surfaced>",
    "handoff_question": "Is this how your school uses this term?"
  }
`.trim();
