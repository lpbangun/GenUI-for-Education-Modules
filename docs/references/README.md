# Reference materials

This folder holds external reference documents that Claude Code agents consult during the build. The harness does not auto-fetch these; the planner agent fetches them in feature F000 if available.

## What should be here

### `ai-sdk-llms.txt` (required for F007 onward)

The full LLM-readable AI SDK v6 documentation dump. Fetch with:

```bash
curl https://ai-sdk.dev/llms.txt -o docs/references/ai-sdk-llms.txt
```

This is the single most important reference. Without it, Claude Code will pattern-match v4/v5 idioms into v6 code.

### Pedagogical references (optional but recommended)

PDFs of the foundational papers cited in CLAUDE.md § Reference grounding:

- `gal-2002-statistical-literacy.pdf` — Gal (2002), International Statistical Review
- `chi-wylie-2014-icap.pdf` — Chi & Wylie (2014), Educational Psychologist
- `gaise-2016-college-report.pdf` — ASA GAISE 2016
- `calling-bullshit-syllabus.pdf` — Bergstrom & West, callingbullshit.org

If you have institutional access via Harvard, place these here. Agents reference them by citation only — they do not read the full text.

### Harvard-specific references (if available)

- `data-wise-protocols.pdf` — HGSE Data Wise vocabulary reference, if accessible
- `harvard-data-classification.md` — copy of Harvard's DSL classification policy for staff awareness

## What if I can't fetch llms.txt?

The fallback is `.claude/skills/ai-sdk/SKILL.md`, which contains the v6 idioms inline. It is less comprehensive than llms.txt but covers the patterns Claude Code most often gets wrong.

## Privacy note

Do not place real Harvard data, real student records, or any DSL Level 3+ data here. This folder is for public references only.
