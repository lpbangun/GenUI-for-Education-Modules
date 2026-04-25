---
id: 001
date: 2026-04-25
feature: F000
type: workaround
---

**What:** Used the inline `.claude/skills/ai-sdk/SKILL.md` fallback (already authored in the starter package) instead of fetching the official Vercel skill. Tried three plausible GitHub raw URLs (`vercel/ai/main/{contributing/skills,.claude/skills,skills}/ai-sdk/SKILL.md`); all returned 404. Successfully fetched `ai-sdk.dev/llms.txt` to `docs/references/ai-sdk-llms.txt` (~146k lines).

**Why:** F000 planner notes explicitly authorize this fallback if the URLs change. The inline skill is sufficient for the v6 idioms F007/F010 need; the full llms.txt is the deeper reference.

**Impact on downstream:** None. F007 builder will read `.claude/skills/ai-sdk/SKILL.md` and `docs/references/ai-sdk-llms.txt`, both now present and non-empty.

**Reversible:** Yes — if the user finds the canonical Vercel URL later, drop it in and the fetch logic in F000 can be re-run.
