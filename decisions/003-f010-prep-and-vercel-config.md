---
id: 003
date: 2026-04-25
feature: F010 / deploy
type: scope-change
---

**What:** Built F010 backend skeleton even though it is parked on `GEMINI_API_KEY`: `backend/index.ts` (Hono server with /api/health, /api/chat streaming, /api/state/infer, /api/quality/eval), `backend/tools.ts` (the canonical 7 tool definitions matching DESIGN.md and feature_list.json), `backend/__tests__/tools.test.ts` (4 tests verifying tool name correctness — green). Also wrote `vercel.json` + `api/index.ts` so the Vercel deploy is one command once `VERCEL_TOKEN` lands.

**Why:** Continuous improvement is baked in (per user direction). The credential wall doesn't block scaffolding — only the live LLM verification. Server boots without the key (degrades gracefully: /api/health reports `provider: "NONE"`, LLM endpoints return 503 JSON with a clear error). When the key arrives, F010's reviewer can run a single curl against /api/chat to verify the streaming + tool-call path; total time to F010 completion drops from "hours" to "minutes."

**Impact on downstream:** F010 status remains `pending` (will not mark complete until a real LLM call confirms tool name correctness end-to-end, per HARNESS.md §3 verification rule). Vercel deploy still blocked on `VERCEL_TOKEN`. The `vercel.json` + `api/` shim presumes Hono runs as a single serverless function (not edge); revisit if cold-start latency matters for the demo.

**Reversible:** Yes — deleting `backend/`, `api/`, `vercel.json` puts us back to the F007-only state. None of the new code blocks existing features.
