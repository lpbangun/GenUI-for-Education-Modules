# SPEC.md

This is the project's **product specification**. CLAUDE.md tells agents *how* to build. SPEC.md tells everyone *what* is being built and *why*. When CLAUDE.md and SPEC.md disagree, SPEC.md wins — CLAUDE.md is updated to match. Agents read SPEC.md before each feature to answer "does this implementation actually serve the user need?"

When a feature in `feature_list.json` is ambiguous, the planner agent resolves the ambiguity by reading SPEC.md, not by guessing.

---

## 1. Problem statement

Harvard staff across schools share a vocabulary problem and a confidence problem with data. They read reports daily — admissions outcomes, donor analytics, course evaluations, IR dashboards — and routinely either over-trust numbers or dismiss them defensively. Existing data literacy training is computational (statistics courses) or generic (LinkedIn Learning). Neither addresses the actual gap: **interpretive judgment grounded in shared vocabulary**.

Three patterns the project addresses:

- A staff member sees "average salary" in a report and treats mean and median as interchangeable.
- A staff member from one school uses a term ("cohort," "yield," "retention") in a way another school misreads.
- A staff member is told a finding is "statistically significant" and conflates that with "important."

The project's job is to give staff the vocabulary, the questions to ask, and the practice reading data in their own work context, in a self-paced module that fits inside their existing LMS.

## 2. Goals and non-goals

### Goals (in scope for v1)

- Staff complete a module that visibly improves their ability to ask interpretive questions about data they encounter in work.
- Staff who already understand a concept can move past it quickly without sitting through redundant content.
- Staff struggling with a concept get progressively scaffolded support that fades as competence grows.
- Staff have access to a shared dictionary of data terms with notes on how each term is used across Harvard schools.
- The module fits into Harvard's existing LMS as a Vue 3 component without requiring custom integration work.
- Staff response data stays within the Harvard data boundary.

### Non-goals (explicitly out of scope for v1)

- Teaching computation. The module never asks staff to calculate anything beyond mean, median, or proportion.
- Replacing existing statistics training. This is a complement, not a substitute.
- Cross-silo learnersourcing. Responses are captured for v2; the v1 module does not surface other learners' contributions.
- Role-parameterized content. Architecture allows it; v1 ships with generic Harvard staff audience.
- Authentication beyond a session ID. The LMS handles identity.
- Real-time collaboration on responses.
- Multi-language support.

### Why these non-goals

Each item was considered and explicitly cut for one of three reasons: scope (would extend the build past 2-3 days), pedagogical clarity (would muddy the central thesis), or risk (would require approvals or infrastructure not yet in place). They are documented here so agents do not drift back into them mid-build.

## 3. User stories

The "user" in v1 is a single persona: a Harvard staff member, role unspecified, completing a self-paced data fluency module assigned by their unit.

### Story 1 — The fluent staff member moves fast

> *I already know the difference between mean and median. I should not be forced to sit through a worked example explaining it. The module should detect this within one or two interactions and let me skip ahead to harder questions or contribute my own example.*

Acceptance: a staff member who answers a comprehension check correctly with reasoning that demonstrates mastery progresses from tier 1 (worked example) to tier 3 or higher within three turns. They never see redundant scaffolding for that concept again in the session.

### Story 2 — The struggling staff member gets supported

> *I do not actually understand why median matters. The module should slow down, give me a worked example with annotations, and not ask me to perform until I can recognize the pattern.*

Acceptance: a staff member who answers incorrectly or shows uncertainty stays in tier 1 or 2. They receive a hint that is always visible, not gated. They do not face a long-answer prompt until they have demonstrated comprehension at lower tiers.

### Story 3 — The interrupted staff member returns

> *I started this module yesterday. When I open it today, it should remember where I was — which concept, which tier, what I already answered.*

Acceptance: state persists across sessions. A staff member returning sees their progress preserved and resumes at the appropriate scaffold tier for each concept they have started.

### Story 4 — The vocabulary-checker

> *I encountered the word "cohort" in a report and I'm not sure if my school uses it the same way HBS does. The module should let me look this up without losing my place.*

Acceptance: from any scenario, a staff member can hover over a recognized term and see a brief definition. They can click to see the full dictionary entry, including school-specific usage notes, then return to their scenario without losing state.

### Story 5 — The contributor

> *I've thought hard about this concept and I have a good way of explaining it. The module should let me write that explanation up, not just tap multiple-choice answers forever.*

Acceptance: a staff member who reaches the highest tier (mastery ≥ 0.85) is presented with a wiki-draft prompt that asks them to write an explanation for a hypothetical new colleague. Their response is captured for review (not auto-published in v1).

### Story 6 — The privacy-conscious staff member

> *I want to know what happens to what I write here. I should be able to see a clear statement of where my data goes before I begin.*

Acceptance: the module shows a brief data-handling notice on first load — what is collected, where it is stored, that vendors do not train on it, that responses are kept within the Harvard data boundary.

## 4. The pedagogical thesis

The capstone's defensible claim is that **the user interface itself is the scaffold**, not a chatbot beside the content, not a teacher narrating, not a dashboard reporting progress. The same underlying concept renders through five different Vue components depending on where the learner is in their understanding. Specifically:

- The component the learner sees is selected by a **rule-based function**, not an LLM. A committee member can read the rule.
- The fading is **anchored in ICAP** (Chi & Wylie 2014). Each tier corresponds to a specific level of cognitive engagement.
- The fading is **driven by inferred mastery**, updated after each interaction.
- Visible thinking routines (Ritchhart, See-Think-Wonder, Claim-Support-Question) are **structurally embedded**, not decoratively added. The validator rejects content that lacks them.
- Constructivism is enforced by **starting every scenario in staff context**, never abstract statistics, and by elicitng prior knowledge on first encounter with a concept.

## 5. The five scaffold tiers

Tier definitions, in order of fading. Each tier corresponds to one Vue component in the catalog. The catalog is fixed at build time; the LLM cannot invent new components.

### Tier 1 — WorkedExample (ICAP: Passive)

**When it activates:** mastery < 0.20.

**What the staff member sees:** a fully worked example. The concept is named, the data is shown, the interpretation is given, and a glossary panel surfaces unfamiliar terms inline. A single low-stakes comprehension check follows: "Did this land?" with three options (yes / sort-of / not yet).

**Why this tier exists:** for staff with no prior exposure to the concept, productive struggle on a hard problem is wasted cognitive load. The worked example reduces extraneous load (Sweller; Catrambone, 1998 on subgoal labels) and lets pattern recognition develop before performance is required.

**Retirement signal:** mastery rises to ≥ 0.20 OR the staff member self-reports comprehension twice in a row.

### Tier 2 — ScaffoldedMCQ (ICAP: Active)

**When it activates:** 0.20 ≤ mastery < 0.45.

**What the staff member sees:** a Harvard-staff-relevant scenario, an artifact (summary stats, chart description, or report excerpt), and four multiple-choice options. One is correct. Three are distractors that each embody a common misconception. An always-visible hint sits below the question — gating the hint is unnecessary friction at this tier.

**Why this tier exists:** recognition is easier than recall. MCQ surfaces whether the staff member can identify the right interpretive move when the options are explicit. Distractors carry pedagogical weight — getting the wrong one tells you something specific.

**Retirement signal:** mastery rises to ≥ 0.45 OR two consecutive correct answers without using the hint.

### Tier 3 — GuidedShortAnswer (ICAP: Active, escalating)

**When it activates:** 0.45 ≤ mastery < 0.65.

**What the staff member sees:** a scenario, an artifact, and a prompt for a 2-3 sentence response. Below the response box, three "prompt scaffolds" (also always visible) suggest angles to consider — "Which number anchors the negotiation?" / "What does the gap tell you?" — but do not give answers. No multiple choice.

**Why this tier exists:** moves from recognition to articulation. Forces the staff member to put their interpretation into their own words while the scaffolds keep them oriented.

**Retirement signal:** mastery rises to ≥ 0.65 OR one rubric-passing response.

### Tier 4 — BareLongAnswer (ICAP: Constructive)

**When it activates:** 0.65 ≤ mastery < 0.85.

**What the staff member sees:** a richer scenario (typically a multi-part interpretive task) and a long-form response field. No options, no scaffolds, no hints. A single line at the bottom: "Stuck? See examples" — a deliberate friction point, not a default.

**Why this tier exists:** Kapur's productive failure (2008) shows that struggle in this zone, when the staff member is roughly capable but not fluent, is where transfer is built. Removing scaffolding here is intentional.

**Retirement signal:** mastery rises to ≥ 0.85 OR one rubric-passing response that demonstrates clear reasoning.

### Tier 5 — WikiDraft (ICAP: Interactive)

**When it activates:** mastery ≥ 0.85.

**What the staff member sees:** an invitation to write the section of an internal wiki that explains this concept to a new colleague. The prompt is generative, not evaluative — they are not being tested, they are contributing.

**Why this tier exists:** the highest ICAP tier (Interactive) requires dialogic engagement. The wiki framing creates a hypothetical interlocutor (the new colleague) and makes the staff member's reasoning durable rather than ephemeral. Their response is captured for v2's cross-silo retrieval.

**Retirement signal:** the staff member submits. Quality Evaluator scores the entry asynchronously; high-quality entries route to a human review queue (not auto-published in v1).

## 6. Mastery, defined

Mastery is a number between 0 and 1, per concept, per learner. Updated after each interaction by the State Inferrer. Initialized at 0.10 for new learners unless a pre-test override is provided.

The 0.10 initialization sits intentionally below the tier 2 threshold of 0.20 (see CLAUDE.md § "Five tiers"). A new learner therefore enters at tier 1 (WorkedExample) and must demonstrate at least one increment of growth — either via correct comprehension or self-reported understanding — before the Scaffold Selector promotes them to tier 2. This gap is deliberate: it ensures every new learner gets at least one passive exposure before being asked to perform, which respects the worked-example effect (Sweller; Catrambone 1998) and prevents the State Inferrer's first reading from immediately overshooting on a polite or confident-sounding response.

The State Inferrer is an LLM call that reads the most recent N interactions for one concept (typically the last 3) and returns:

```json
{
  "mastery": 0.42,
  "confidence": 0.7,
  "reasoning": "Learner correctly identified median as resistant to outliers and articulated why mean was misleading. Used staff context spontaneously. Did not yet show ability to apply this without scaffolding."
}
```

The `confidence` field is independent of `mastery` and represents how much the inferrer trusts its own estimate. Low confidence with high mastery → run an explicit check question on the next turn rather than trusting the inferred value.

**Anti-pattern guard:** the State Inferrer is the highest-risk LLM call in the system. Polite responses and confident-sounding writing can both drive false high-mastery readings. Mitigation: every 3-5 turns, the system injects a comprehension check question and updates mastery from the answer rather than the surrounding prose. Bypassing this check requires explicit human approval.

## 7. The dictionary

A static reference of approximately 50 terms that staff encounter in data work, each with:

- A plain-language definition (one sentence, under 25 words)
- A technical definition (optional, longer)
- School-specific usage notes covering at least four of HGSE, HBS, FAS, HMS, SEAS
- Common confusions (terms it gets mixed up with)
- Related terms (graph edges into the rest of the dictionary)
- An example showing the term doing real work

Two surfaces:

1. **Standalone page** at `/dictionary` with search (Fuse.js, client-side fuzzy match) and full term detail.
2. **Inline popover** that detects when a known term appears in scenario prose and offers definition on hover, full entry on click.

The dictionary has two layers in v1:

1. **Calibrated entries** — the ~50 terms generated by the harness from authored seeds, reviewed against the median.md exemplar, and shipped as static MD files. These form the baseline.
2. **Contributed entries** — wiki drafts submitted at tier 5 are stored in Postgres and displayed inline within the matching term's detail page under a clearly marked **"Contributed by staff"** section. Each contributed entry carries a "user-generated" badge, the Quality Evaluator score, and (in v1) the contributor's session ID. They are visually distinct from calibrated content and do not replace it.

The dictionary is therefore read-only with respect to calibrated entries (humans edit the MD files) and append-only with respect to contributed entries (staff add via tier 5; no admin gate in v1). A review queue is roadmap §11.

## 8. The content engine

Content is generated by an LLM (Gemini 3.1 Flash Lite) under tight constraints from authored seeds. The pipeline:

1. **Authored seeds** — humans write the taxonomy (25 concepts), the calibration exemplars (one of each content type), and the visible thinking routines.
2. **Parametric synthetic datasets** — code generates realistic synthetic data with declared pedagogical features (skew, outliers, confounders). No real Harvard data.
3. **LLM variation at runtime** — the Content Generator composes (concept × dataset × tier) into scenario prose and questions, constrained by exemplars and validators.
4. **Validation** — every generated artifact is checked against Zod schemas (structure) and an LLM judge (quality) before being published into the runtime corpus.

Content is files (MD + JSON), not vectors. The runtime loads everything into memory at startup. No vector database, no embeddings, no semantic search.

## 9. Privacy and data handling

Staff responses classify as Harvard DSL 3 (Medium Risk Confidential) under Harvard's Information Security Policy. The system handles this as follows:

- All LLM calls route through the Harvard API Portal to Google's Gemini API under Harvard's existing enterprise agreement. Vendor training is contractually excluded.
- No staff response leaves the Harvard data boundary.
- API keys are held server-side only. The frontend never sees them.
- The frontend is iframe-embedded in the LMS; CORS is configured to allow only the LMS origin.
- Responses are stored in Neon Postgres in encrypted form at rest.
- Authentication is delegated to the LMS — the module itself trusts the session ID provided by the LMS embed.
- A data-handling notice is shown on first load.

V2 may add explicit consent flow, retention period configuration, and an opt-out path for response capture.

## 10. Success criteria

The capstone defense judges success on three dimensions:

### Pedagogical defensibility

The committee can read:
- The Scaffold Selector as a deterministic rule grounded in ICAP and the assistance dilemma.
- The widget catalog as an explicit theory of which scaffolding moves serve which learners.
- The visible thinking integration as structural, not decorative.

If a committee member asks "why this scaffold for this learner?" the answer is a citation, not a vibe.

### Technical defensibility

The committee can verify:
- The system runs end-to-end on demo URL or local instance.
- The fade is observably visible — moving a learner state slider produces five distinct components.
- The dictionary search works.
- Privacy claims are accurate (API keys are not in the frontend bundle, traffic routes through Harvard portal).

### Productive failure modes

The committee accepts the project even if:
- Some content is uneven in quality (the harness ships imperfectly).
- The State Inferrer is occasionally fooled by polite responses (acknowledged in the writeup).
- The dictionary is incomplete on schools beyond the core five (documented in known limitations).

The committee does not accept:
- The fade is fake or hardcoded.
- Real student data was used.
- Privacy claims are unsupported.
- Visible thinking is decorative rather than structural.

## 11. Roadmap

### v1 — Capstone POC (next 2-3 days)

The starter package and `feature_list.json` cover this scope. Single concept demonstrably faded across all five tiers, dictionary searchable, content generated by harness, deployable to Vercel for defense.

### v1.5 — TLL pilot (post-defense, 4-6 weeks if pursued)

Real staff users on a pilot module. Adds:
- Pre-test override for initial mastery
- Better State Inferrer with check-question injection
- Admin review queue for wiki drafts
- Telemetry on tier transitions and time-per-concept
- Expansion to all 25 taxonomy concepts

### v2 — Cross-silo retrieval

The deferred feature from v1. High-quality wiki drafts from staff in one role surface as citations to staff in other roles working on the same concept. Requires:
- Vector embeddings on wiki entries
- Role parameterization in content
- Quality threshold and human approval gate
- Privacy review (citing one staff member's reasoning to another)

### v2.5 — Role parameterization

Scenarios shaped by staff role. A career consultant sees salary distributions; an admissions officer sees yield rates; an HR analyst sees compensation bands. Same underlying concept, role-appropriate context.

### v3 — Institutional dictionary contribution

Staff can propose new dictionary entries or correct school-usage notes. Editorial workflow with appropriate approvals. This is the long-term institutional vision: the module becomes the engine that produces and maintains Harvard's shared data vocabulary.

### Explicit non-roadmap (forever out of scope)

- A general-purpose tutor for any topic. The module is data fluency only.
- Replacing existing data analytics training.
- Replacing human data coaches or institutional research staff.
- Computational instruction beyond mean / median / proportion.

## 12. Resolved decisions (v1.1, 2026-04-25)

The five open questions from earlier drafts are now resolved. Recorded here so future agents do not reopen them without explicit human approval.

1. **Pre-test override — no.** All learners start at the beginning. Initial mastery = 0.10 per concept. The State Inferrer raises mastery from observed performance; no pre-test is offered. Rationale: the pedagogical thesis is that the scaffold *itself* measures the learner, and a separate pre-test would be a second measurement instrument operating outside that thesis.
2. **Wiki draft destination — stored, displayed as part of the dictionary.** v1 stores every submitted wiki draft in Postgres and surfaces them inside the standalone Dictionary view, in a clearly marked **"Contributed by staff"** section per term. Each contributed entry is labeled with the contributor's session ID and a "user-generated" badge so it is visually distinct from the calibrated dictionary content. No human approval gate in v1; the Quality Evaluator score is recorded alongside but does not gate display. (A v1.5 review queue is in roadmap §11.)
3. **Mastery decay — no.** v1 does not apply decay. `last_updated` is recorded for v1.5 telemetry only.
4. **Concept count for the demo — 8 × 5 (40 scenarios).** All eight foundational concepts, five tiers each. Confirms current F006 scope.
5. **Real Harvard voice samples — no.** Calibration-only. The Content Generator grounds in the four exemplars; no scraping of TLL blogs or IR reports.

### Provider decision (2026-04-25)

The Harvard API Portal path is **not used in v1**. v1 ships against Google AI Studio directly with `@ai-sdk/google` and `GEMINI_API_KEY`. This is a proof-of-concept; the portal swap is a one-line `baseURL` change for v1.5 if a real pilot is approved. CLAUDE.md and feature_list.json reflect this.

### Demo target (2026-04-25)

**Live Vercel deployment with real LLM calls** is the primary defense path. The cached `/demo/autoplay` route remains as a backup but is not the headline.

### Demoed concept (2026-04-25)

**central-tendency** is the concept demonstrated end-to-end across all five tiers in the defense. It is the only concept with a hand-calibrated exemplar across all four content types and is therefore the lowest-risk path to a defensible live demo.

### Still open (planner may flag `needs_human_input: true`)

None at v1.1. If a new ambiguity surfaces during the build, append it here with a date stamp and pause the thread.

## 13. What this document is not

SPEC.md is not:
- A list of Vue components or API routes (those are in `feature_list.json`).
- A statement of architectural invariants (those are in CLAUDE.md).
- A schedule (build order is in `feature_list.json` phases).
- A prompt template library (those live with the Content Generator code).

If a question is structural, look in CLAUDE.md. If it is sequential, look in `feature_list.json`. If it is *what the system is for* — read this file.

## 14. Version

v1.0 — initial spec, written after CLAUDE.md and `feature_list.json` to retroactively ground them. This document is now the source of truth; CLAUDE.md and `feature_list.json` derive from it.
