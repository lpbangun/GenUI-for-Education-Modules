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
Include these fields IN YOUR ScaffoldedMCQ tool call input:
- terms_surfaced: ["term1", "term2"]   (1–3 lowercase dictionary terms surfaced)
- dictionary_handoff: { "kind": "passive" }
`.trim();
