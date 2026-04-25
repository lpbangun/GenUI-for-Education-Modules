# Credential blocks

Features that need a credential the user has not yet provided. Format: `<feature_id> · <ISO timestamp> · needs <CRED> · <one-sentence reason>`.

When the user provides a credential, the harness picks the matching features off this list on resume. Append-only; do not delete entries — strike through with `~~...~~` and add a `RESOLVED` line on the next line below when unblocked.

---

## Active blocks

(none yet — populated as the harness encounters them)

## Known walls

These features are pre-flagged as credential-dependent. They are not "blocked" until the harness actually starts them and confirms the credential is missing.

- **F003** (24 concept primers) · needs `GEMINI_API_KEY` · LLM content generation via @ai-sdk/google.
- **F004** (50 dictionary entries) · needs `GEMINI_API_KEY` · same.
- **F006** (40 scenarios) · needs `GEMINI_API_KEY` AND F003 + F005 complete · same, with chart/flowchart tool calls.
- **F010** (Hono backend wiring) · needs `GEMINI_API_KEY` · the streamText path needs a real provider to verify tool name correctness.
- **Vercel deploy** · needs `VERCEL_TOKEN` env var or interactive `vercel login` · the harness cannot run interactive login. If only the token path is missing, the deploy is parked but the build is still verified locally.
- **Wiki draft Postgres persistence** (subset of F010) · needs `DATABASE_URL` (Neon) · workaround available: `localStorage` fallback for the demo, log a decision when applied.

## How to unblock

User adds the missing var to `.env` (template at `.env.example`), then re-runs the harness. The resume protocol in HARNESS.md §0 will pick the parked feature back up.

For Vercel: `vercel login` once, or set `VERCEL_TOKEN`. The harness will detect either.
