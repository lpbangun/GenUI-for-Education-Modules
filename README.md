# Data Fluency Module — Capstone

A generative-UI proof-of-concept for the **T127 capstone**: a self-paced data fluency module for Harvard staff that fades scaffolding as the learner demonstrates mastery, while building a backend dictionary of cross-school data terminology.

## What this is

A learning module that lives inside Harvard's LMS as a Vue 3 component in an iframe. The novelty is internal: each learner sees one of five scaffold components per turn, selected by a rule-based function from current mastery. Content is generated at runtime against a fixed catalog of pedagogical scaffolds. The wrapper is conventional, the substrate is generative.

## Stack

- **Frontend:** Vue 3 + TypeScript + Vite + shadcn-vue + `@ai-sdk/vue` (v6)
- **Backend:** Hono on Node.js, deployed to Vercel
- **LLM:** Gemini 3.1 Flash Lite via Harvard API Portal (Google Gemini endpoint)
- **DB:** Neon Postgres + Drizzle
- **Validation:** Zod
- **Search:** Fuse.js (client-side, dictionary only)

See `CLAUDE.md` for the full architectural spec including invariants, hard rules, AI SDK v6 idioms, and reference grounding.

## Why Gemini 3.1 Flash Lite

- **Generative UI is a stated launch use case** (per Google's release blog).
- **~97% structured output compliance** in production tests — exactly what tool-calling needs.
- **~5x cheaper than Claude Haiku 4.5** on output tokens ($0.25/M input, $1.50/M output).
- **1M token context window** allows the full content library inline without RAG.
- **Granular thinking levels** (minimal/low/medium/high) let us route by agent role without switching models.
- **DSL 3 approved** via Harvard's Google enterprise agreement, accessible through the Harvard API Portal.

Status caveat: in **preview** as of late March 2026. Pin to a snapshot ID when published. Claude Haiku 4.5 wired as emergency fallback in env config.

## What is in this starter package

```
.
├── CLAUDE.md                                       # Authoritative project spec
├── README.md                                       # You are here
├── taxonomy.json                                   # 25 data fluency concepts (DAG)
├── feature_list.json                               # Harness work queue (11 features)
├── .env.example                                    # Environment variables template
├── .claude/
│   └── skills/ai-sdk/SKILL.md                      # AI SDK v6 Claude Code skill (fallback)
├── content/
│   ├── concepts/central-tendency.md                # Calibrated exemplar (1 of 25)
│   ├── dictionary/median.md                        # Calibrated exemplar (1 of 50)
│   ├── scenarios/central-tendency-tier-2.json      # Calibrated exemplar (1 of 40+)
│   ├── datasets/hgse_cohort_salaries.json          # Calibrated exemplar (1 of 5+)
│   └── thinking-routines/see-think-wonder.md       # Routine reference
├── docs/references/                                # AI SDK docs + pedagogical refs
├── lib/schemas/content-schemas.ts                  # Zod schemas + AGENT_CONFIGS
└── scripts/validate_exemplar_consistency.ts        # Math-consistency validator
```

The four exemplars in `content/` are hand-calibrated and serve as the gold-standard rubric for the autonomous Reviewer agent. The harness generates the rest via Gemini Content Generator calls.

## Running the autonomous content harness

This package contains scaffolding only. To run the harness:

1. Initialize the repo: `git init && git add . && git commit -m "starter"`
2. Set up dependencies (placeholder — Claude Code generates `package.json` in F007). For the validator alone: `bun init -y && bun add zod gray-matter`.
3. Set environment variables: copy `.env.example` to `.env`, fill in `GEMINI_API_KEY` (or Harvard portal credentials).
4. Apply for Harvard API Portal access at https://api.harvard.edu/ — they expose Google Gemini API under the existing enterprise agreement.
5. Point Claude Code at this repo and instruct: *"Read CLAUDE.md and feature_list.json. Begin with F000."*
6. The harness runs through phases 0 → 4, with planner/builder/reviewer per feature.

Expected timeline: 8-10 overnight sessions for a complete demo (per `feature_list.json` phasing).

## Demo deployment (post-harness)

For capstone defense:

1. **Live URL:** Deploy frontend + backend to Vercel.
2. **Autoplay route** at `/demo/autoplay` simulates a learner moving through 5 tiers in 90 seconds with cached LLM responses (no live API dependency).
3. **2-minute screencast** as ultimate fallback.

For LMS embed (post-defense):

1. Compile Vue component as a standalone bundle.
2. Paste into Harvard LMS code block (TypeScript + Vue.js iframe per TLL technical lead).
3. Configure backend CORS to allow LMS iframe origin.
4. Verify Harvard API Portal access for Gemini.

## Privacy and data classification

Staff responses classify as Harvard **DSL 3** (Medium Risk Confidential). All LLM traffic routes through Harvard's API Portal to Google's Gemini API under the existing enterprise agreement. No staff responses leave the Harvard boundary. Vendors do not train on the data per contract terms. See `CLAUDE.md` § "Hard rules" for the full rule set.

## Reference grounding

Pedagogical decisions cite:

- Gal, I. (2002). "Adults' Statistical Literacy."
- Bergstrom & West, *Calling Bullshit* (callingbullshit.org).
- ASA GAISE 2016 College Report.
- Schield, M. — statlit.org.
- Chi & Wylie (2014). "The ICAP Framework."
- Ritchhart, Church, Morrison (2011). *Making Thinking Visible*.

Technical references:

- AI SDK v6 docs: https://ai-sdk.dev/llms.txt (place at `docs/references/ai-sdk-llms.txt`)
- AI SDK Claude Code skill: see `.claude/skills/ai-sdk/SKILL.md`

## Status

v1.1.0 — Gemini 3.1 Flash Lite swap. AI SDK v6 pinned. Claude Code skill scaffolding added. Four exemplars calibrated. Taxonomy validated. Harness ready to run.
