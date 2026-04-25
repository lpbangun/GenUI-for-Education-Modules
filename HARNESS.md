# HARNESS.md

The protocol for running this project autonomously over many hours, with the user offline. Read this first when resuming.

CLAUDE.md = how to build. SPEC.md = what to build. DESIGN.md = what it looks like. **HARNESS.md = how to keep building when nobody is watching.**

## 0. Resume protocol (read first when restarting)

When a fresh agent starts work on this repo:

1. Read `claude-progress.txt` from the bottom — most recent entries are last. Find the most recent feature with status `in_progress` or the most recent `BLOCKED` line.
2. Read `decisions/` (numbered files, append-only) for autonomous decisions logged so far.
3. Read `warnings/credential-blocks.md` for which features are parked on missing credentials.
4. Run `bun run scripts/harness/status.ts` (when it exists) for a one-screen state summary.
5. Resume from the last in-progress feature, or pick the next unblocked feature from `feature_list.json`.

**Never restart from F000 if `claude-progress.txt` shows progress past it.** That is the journal-replay invariant.

## 1. The autonomy charter

The user has explicitly granted autonomy on 2026-04-25 to:

- Decide build order within the constraints of `feature_list.json` `depends_on` edges.
- Skip credential-blocked features and proceed with parallel unblocked work.
- Spawn subagents (Plan, Explore, code-architect, code-reviewer, general-purpose) when the work matches the agent's description.
- Make small workarounds without asking — the boundary is "don't break invariants in CLAUDE.md."
- Deploy to Vercel when frontend + backend are both green and a Vercel token is available.
- Hot-fix issues found in E2E testing without a separate review round.

The user has **not** granted autonomy to:

- Modify CLAUDE.md architectural invariants without logging to `warnings/architecture-changes.md` AND pausing.
- Spend money outside what GEMINI_API_KEY usage already implies (no paid SaaS sign-ups, no domain purchases).
- Send messages, emails, or external notifications.
- Push to GitHub remotes or create public PRs (local commits only).
- Use real Harvard data (the hard rule from CLAUDE.md).

If a task requires anything from the second list, **stop and write a `BLOCKED-USER` line to `claude-progress.txt`** with the specific question, then proceed to the next unblocked feature.

## 2. The three-role loop (per feature)

Every feature in `feature_list.json` flows through three roles. The roles can be the same agent playing them sequentially, or three subagent calls — pick the cheaper option.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ planner  │ →  │ builder  │ →  │ reviewer │ →  │   e2e    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   reads          implements      runs           integration
   the feature    the plan,       test_command,  test against
   into a         iterates        validates      the live
   plan written   until the       acceptance     system; hot
   to claude-     plan is done    criteria       fixes count
   progress.txt                                  as same round
```

### Per-role rules

- **planner**: writes a numbered plan to `claude-progress.txt` (one block per feature). Names every file it expects to create or modify. Marks any open question with `Q:` and either resolves it from SPEC.md/DESIGN.md or escalates by appending to `warnings/<feature_id>.md` and continuing with a documented assumption.
- **builder**: implements the plan, can iterate freely. Cannot mark complete without reviewer sign-off.
- **reviewer**: runs the feature's `test_command`. If it passes and acceptance criteria are met → mark complete. If not → return to builder with stderr.
- **e2e**: after reviewer passes, runs an integration check that crosses feature boundaries (build the frontend, hit the backend, click through the live UI). Hot fixes are allowed in this same round. Escalates to a fresh feature only if the issue is structural, not local.

### Rounds and warning escalation

- Default: 2 review rounds before `accept_with_warning`. F010 has 4 (tool name drift catches matter).
- After max rounds: write `warnings/<feature_id>.md` with the failing criteria and the final state, mark feature `accepted_with_warning`, continue.
- Hot fixes during e2e count against the original feature's round budget. If e2e finds a structural issue (not a typo), open a new feature `F<id>-hotfix` instead.

## 3. Verification before completion (the Boris Cherny rule)

Never claim a feature is complete without running its `test_command` and observing exit 0. Never claim a UI feature works without launching it in a browser (or playwright headless) and confirming the goldenpath. Never claim an LLM integration works without making one real call and inspecting the response shape.

This is non-negotiable. Self-reported success without verification is the single most common autonomy failure mode.

## 4. Credential walls (handling user-offline blocks)

Features that depend on credentials park on `warnings/credential-blocks.md`. The handling protocol:

1. Before starting a feature, check `.env` for the required credential.
2. If missing, do **not** ask interactively. Append a line to `warnings/credential-blocks.md`:
   ```
   <FEATURE_ID> · <ISO_TIMESTAMP> · needs <CRED_NAME> · <one-sentence reason>
   ```
3. Mark the feature `blocked_on_credential` in `claude-progress.txt`.
4. Skip to the next unblocked feature.
5. When the user returns and adds the credential, the resume protocol picks the feature back up.

Known credential walls:
- `GEMINI_API_KEY` — gates F003, F004, F006, F010 (all LLM-dependent features).
- `VERCEL_TOKEN` (or interactive `vercel login`) — gates the deploy step.
- `DATABASE_URL` (Neon Postgres) — gates wiki draft persistence in F010 (frontend can stub a `localStorage` fallback for the demo).

## 5. Git checkpointing (the rollback safety net)

This repo was `git init`-ed at harness start. Every successful feature creates a commit:

```
<feature_id>: <title> [accept|warning]
```

If a feature breaks the build catastrophically and cannot be hot-fixed in 2 rounds, the rollback protocol is:

1. `git status` — confirm the bad change is unstaged or in the most recent commit.
2. `git stash` (unstaged) or `git revert HEAD --no-edit` (committed).
3. Log the rollback to `decisions/<NNN>-rollback-<feature_id>.md` with what failed and why.
4. Mark the feature `accepted_with_warning` and continue with downstream features that don't depend on it.

Never `git reset --hard` without writing a decision log first. The user's autonomy grant does not extend to silent destructive history rewrites.

## 6. The decision log (decisions/)

Every autonomous decision that the user did not pre-approve gets a numbered file in `decisions/`:

```
decisions/000-harness-bootstrap.md
decisions/001-skip-f003-no-gemini-key.md
decisions/002-mock-dictionary-content-for-f009.md
decisions/003-rollback-f010-tool-schema.md
```

Format (keep it tight, this is for the user's morning review):

```markdown
---
id: NNN
date: 2026-04-25
feature: F00X
type: skip | workaround | rollback | scope-change | warning
---

**What:** one sentence.
**Why:** one sentence.
**Impact on downstream:** one sentence.
**Reversible:** yes/no — if yes, how.
```

Aim for 3-6 of these per overnight session, not 30. Log decisions, not steps.

## 7. End-to-end testing protocol

After each feature, before marking complete:

| Feature class | E2E check |
|---|---|
| Validator script (F001, F002) | Run the script against all current content; observe exit 0. |
| Pure function (F008) | Run the test suite; observe all cases pass; spot-check edge cases by hand. |
| Content generator (F003, F004, F006) | Validator pass + judge pass + spot-read 3 random outputs for prose quality. |
| Dataset generator (F005) | Generate one of each, validate consistency, sanity-check stats by eye. |
| Frontend feature (F007, F009) | `npm run build` succeeds + start dev server + navigate routes via playwright (or curl HTML and grep for expected text) + verify no console errors. |
| Backend feature (F010) | `bun test` + start server + curl the endpoints + inspect response shapes + confirm tool names in stream output match the 7 expected names. |
| Integration (F009 + F010 + F007) | Spin up frontend + backend + click the autoplay path + confirm a tier transition fires. |

Write the e2e check result to `claude-progress.txt` as a single line:
```
E2E F00X · pass | hot-fix-applied | escalated
```

## 8. Working around being stuck

If a build error blocks for >30 minutes of work:
1. Try the obvious fix once. If it doesn't work, don't spiral.
2. Switch to a parallel unblocked feature.
3. Log the stuck feature to `decisions/<NNN>-stuck-<feature_id>.md` with what was tried.
4. Come back after the diversion — fresh context often unblocks.

Common workarounds that count as fine:
- Mock a piece of generated content with a hand-written stub if the generator is blocked.
- Skip a non-load-bearing test if it's the only thing preventing F<X> from completing (log it, file as a hotfix feature).
- Substitute a reasonable default for a config value (log it).
- Use `localStorage` instead of Postgres for the v1 demo if `DATABASE_URL` is missing (log it, the demo works, the swap is one file).

Workarounds that are NOT fine:
- Disabling a hard rule in CLAUDE.md.
- Committing real Harvard data (synthetic only — invariant).
- Hardcoding an API key anywhere in the codebase.
- Using `--no-verify` on git commits to skip hooks.

## 9. Deployment to Vercel (when ready)

Trigger conditions: F007 ✅ AND F010 ✅ AND e2e integration pass AND `VERCEL_TOKEN` available (or `vercel` CLI is logged in).

```
vercel --prod=false  # preview deploy first
```

Capture the preview URL into `claude-progress.txt`. Smoke-test the preview before any prod deploy. Prod deploy requires a `decisions/<NNN>-prod-deploy.md` entry.

## 9b. Context compaction (keep the agent fast)

A long-running build burns context. When the conversation context starts feeling heavy:

- **Trigger:** at the boundary between features, or after any e2e round that ran multiple subagents, or whenever a single tool result returns >100 lines you no longer need.
- **Before compacting:** make sure the latest state is on disk — `claude-progress.txt` updated, decision logs written, in-progress code committed (or stashed with a note). The harness is restart-safe via files; in-memory state is disposable.
- **How:** run `/compact` (or accept Claude Code's automatic compaction). Pass a one-line goal to the compaction prompt: *"Resume the harness on the current in-progress feature; full state is in HARNESS.md, claude-progress.txt, and decisions/."*
- **After compacting:** re-run the resume protocol (§0). The first action of the freshened agent is always a status check, not a guess.

Do not wait for the runtime to force a compaction mid-tool-call. Compact at clean boundaries.

## 10. Stop conditions

Stop the harness and wait for the user when:
- All unblocked features are complete and the only remaining work needs credentials.
- A `BLOCKED-USER` question is logged that genuinely cannot be answered from existing docs.
- Two consecutive features hit `accepted_with_warning` (signals systemic confusion, time for a human gut-check).
- The user-supplied autonomy boundary in §1 would be crossed.

When stopping, write a `STOP` line to `claude-progress.txt` with a one-paragraph status summary the user can read on phone in 30 seconds.

## 11. References for the harness pattern

- Anthropic — [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — the planner/generator/evaluator architecture and the journal-handoff insight informing this doc.
- Anthropic — [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) — verification-before-completion as the foundation that makes autonomy reliable.
- "Ralph Wiggum" technique — completion-promise + stop-hook intercept loops; this harness is a lighter sequential variant suited to a fixed `feature_list.json`, not an open-ended task.
- Durable execution patterns — git checkpoint per feature is the cheapest journal-replay mechanism for our scale.

## 12. Version

v1.0 — written 2026-04-25 at the start of the autonomous build. Update this doc when the protocol changes; log the change to `decisions/`.
