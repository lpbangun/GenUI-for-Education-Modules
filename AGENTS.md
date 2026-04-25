# AGENTS.md

The agent roster for the autonomous harness. Small set, clear lanes, no overengineering. The same conversational agent can play any of these roles sequentially; calling them as separate subagents is a cost decision, not a capability one.

When in doubt: **fewer subagents, not more.** Each subagent call is a context window cost. The main agent should do the work itself unless a specialist genuinely earns its keep.

## Tier 1 — the per-feature loop (always invoked)

| Role | Played by | When | Tools |
|---|---|---|---|
| **planner** | main agent (or `Plan` subagent for ambiguous features) | Start of every feature in `feature_list.json` | Read, Grep, Glob, write to `claude-progress.txt` |
| **builder** | main agent | After planner writes the plan | Edit, Write, Bash, Read |
| **reviewer** | `feature-dev:code-reviewer` subagent for code-heavy features; main agent for trivial validators | After builder marks done | Bash to run `test_command`, Read to verify acceptance criteria |
| **e2e** | main agent (or `general-purpose` subagent for cross-feature integration) | After reviewer passes | Bash, playwright when frontend exists, curl for backend, Read |

## Tier 2 — specialist consultants (called when applicable)

| Role | Played by | When the main loop calls it | Bring back |
|---|---|---|---|
| **ui-ux** | main agent in DESIGN.md-strict mode; or a focused `general-purpose` subagent | Reviewing F007, F009, or any frontend-touching feature | A list of DESIGN.md violations (rounded corners, extra colors, missing focus rings) and a fix or a reasoned exception. |
| **wiring** | main agent; or `feature-dev:code-architect` subagent for the AI SDK v6 streaming choreography in F010 | F010 backend, F007↔F010 integration, dictionary popover ↔ scenario prose linking | A mapping of every tool call name and message-part type, end to end. Tool name drift is the silent failure mode; this role catches it. |
| **content** | main agent with the AI SDK skill + Gemini provider + `thinkingLevel` configs | F003, F004, F006 — only when `GEMINI_API_KEY` is set | Generated MD/JSON files, plus per-output validator pass. Spot-reads 3 random outputs out loud to itself before declaring done. |
| **deploy** | main agent driving the `vercel` CLI | After F007 + F010 pass e2e, only when `VERCEL_TOKEN` available or `vercel` is logged in | A live preview URL written to `claude-progress.txt` and a smoke-test result. |
| **simplifier** | `code-simplifier` subagent | After any feature where the builder iterated 3+ times — code likely accumulated cruft | A reduced-LOC version of the touched files, or a no-op confirmation. |

## Tier 3 — meta (called rarely)

| Role | When | What it does |
|---|---|---|
| **Explore** subagent | When a feature description is ambiguous and the relevant code is spread across many files | Returns a focused report with file paths and line numbers — never modifies. |
| **decision-logger** | After any autonomous choice the user did not pre-approve | Writes a tight numbered file to `decisions/`. Not really an agent — a documentation reflex baked into the loop. |

## Hand-off rules

- **planner → builder**: hand off via `claude-progress.txt`. Builder reads only the latest plan block, no oral history.
- **builder → reviewer**: hand off via the working tree + the test_command. Reviewer does not read builder's reasoning, only the artifact.
- **reviewer → e2e**: hand off via a green test run. E2e starts from the user's perspective, not the code's.
- **anything → decision-logger**: triggered by an autonomous choice; writes a numbered file to `decisions/`.

The hand-off via files (not in-memory state) is what makes the harness restart-safe. A fresh agent reading `claude-progress.txt` + `decisions/` + the working tree can resume any in-progress feature without context loss.

## Subagent budget

Soft cap: **2-3 subagent calls per feature on average.** A typical feature looks like:

```
planner (main) → builder (main) → reviewer (subagent) → e2e (main)
```

Subagent-heavy features look like:

```
planner (Plan subagent) → builder (main) → wiring (code-architect subagent)
  → reviewer (code-reviewer subagent) → e2e (general-purpose subagent)
```

Avoid features that look like:

```
planner → explore → architect → builder → simplifier → reviewer → ui-ux
  → e2e → simplifier → reviewer-2 → e2e-2  ← stop, you are spiraling
```

If a feature needs more than 4 subagent calls, the planner should split it.

## What this is not

- Not a multi-agent framework. There is no orchestrator process, no message bus, no agent runtime. It's a documentation convention for which subagent to call when.
- Not parallel by default. Features run sequentially unless `feature_list.json` flags them as different `team_*` and a worktree is set up. v1 runs everything single-team.
- Not a replacement for the user. When the autonomy boundary in HARNESS.md §1 is hit, the loop pauses cleanly.

## Version

v1.0 — written 2026-04-25.
