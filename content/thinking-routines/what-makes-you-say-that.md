---
id: what-makes-you-say-that
name: What Makes You Say That?
source: Ritchhart, Church, Morrison (2011) — Making Thinking Visible
purpose: Surface the implicit reasoning behind a confident interpretation
when_to_use:
  - Tier 2 hints and tier 3 prompts where a learner has chosen an answer and needs to articulate why
  - When a learner has produced a correct answer but it is unclear whether the reasoning is sound
  - When a learner has produced an incorrect answer and the diagnosis depends on hearing their reasoning
tier_compatibility: [2, 3, 4]
prompt_pattern: "Make a claim or interpretation / Name what you see in the data that makes you say that"
version: 1
---

# What Makes You Say That?

A two-step routine that requires every interpretation to be paired with the evidence that produced it.

## The routine

1. **Interpretation** — state what you think is going on. "The career outcomes report is misleading."
2. **What makes you say that** — name the specific feature of the data, the source, or the framing that produced the interpretation. "The headline says 'average starting salary $93K' but the histogram shows half the cohort earning under $70K. The mean is being pulled by three salaries above $200K, and those are not labeled."

## Why it works for data fluency

A right answer with no stated reasoning is indistinguishable from a guess. A wrong answer with stated reasoning is diagnostically useful — it tells the State Inferrer exactly which step in the chain broke. What Makes You Say That is the lightest of the four routines: a single follow-up prompt rather than a multi-step scaffold. That makes it well-suited to tier 2 and 3 where the cognitive load of the question itself is already the point.

## How to embed in a scenario prompt

In tier 2 hints and tier 3 short-answer prompts, the visible thinking prompts field uses these exact keys:

```json
"visible_thinking_prompts": {
  "claim": "What does this report most likely mean to a reader who skims it?",
  "support": "What in the report itself makes you say that?"
}
```

The keys reuse `claim` and `support` from the Claim-Support-Question schema; What Makes You Say That is effectively the two-step variant. The schema does not require a separate `wonder` or `question` field for this routine — the Quality Evaluator scores the support quality, not the residual uncertainty.

## What good looks like in a learner response

A learner using this routine well will produce text that:

- Pairs every interpretive verb ("misleading," "honest," "fits," "overstates") with a specific data feature.
- Names the feature in concrete terms — a value, a label, a missing axis, a chosen denominator — not in vague terms ("the way it's presented").
- Stops short of additional speculation; the routine asks only for the support, not the broader argument.

A learner skipping the routine will produce verdict-only responses ("this is misleading" with no anchor) or anchor-only responses (describing the data without committing to an interpretation).

## Pairing with other routines

What Makes You Say That is the entry-level form of **Claim-Support-Question** — the same first two steps without the explicit residual question. Use it at tier 2 (where adding a third step would crowd the always-visible hint) and tier 3 (where the prompt scaffolds carry the cognitive load). Promote to full Claim-Support-Question at tier 4 and above, where naming the residual question is part of what is being assessed.
