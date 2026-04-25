---
id: 000
date: 2026-04-25
feature: harness
type: scope-change
---

**What:** Established the autonomous build harness for this project: HARNESS.md (protocol), AGENTS.md (roster), decisions/ (this folder, audit log), warnings/credential-blocks.md (parking lot for credential-walled features), claude-progress.txt (journal), git initialized with starter checkpoint.

**Why:** User explicitly granted autonomy to run the build overnight while offline. The pattern is the standard planner/builder/reviewer + e2e + verification-before-completion loop, with credential walls handled by parking on a manifest rather than blocking the whole queue. Confirmed via web search of current (2026-04) best practices: Anthropic's harness-design articles and the Ralph Wiggum technique converge on this shape.

**Impact on downstream:** Every feature now has a defined entry/exit, a rollback path (git), a way to log decisions, and a way to skip cleanly when blocked. The user's morning review is at most: read decisions/ (a handful of files), read warnings/, glance at claude-progress.txt, then decide whether to provide credentials or merge what's done.

**Reversible:** Yes — delete HARNESS.md/AGENTS.md/decisions/ and revert to manual feature-by-feature instruction. No code is gated by these files; they are documentation.
