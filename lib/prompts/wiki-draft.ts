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
