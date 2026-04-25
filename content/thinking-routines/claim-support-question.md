---
id: claim-support-question
name: Claim-Support-Question
source: Ritchhart, Church, Morrison (2011) — Making Thinking Visible
purpose: Force learners to ground assertions in evidence and surface their own residual doubt
when_to_use:
  - Tier 3 and 4 short/long answer prompts where the learner must defend an interpretation
  - When a learner is making confident assertions without citing the data
  - When the goal is reasoning quality, not answer correctness
tier_compatibility: [3, 4, 5]
prompt_pattern: "Make a claim / Support it with what you see / Name the question that remains"
version: 1
---

# Claim-Support-Question

A three-step routine that requires every assertion to carry its evidence and its uncertainty.

## The routine

1. **Claim** — state what you believe is true based on the data. "The median better represents the typical graduate's salary than the mean."
2. **Support** — point to the specific feature of the data that backs the claim. "The mean is $93,400 and the median is $68,500. The $25K gap means a few high values are pulling the mean upward, so the median is closer to where most of the cohort actually falls."
3. **Question** — name what you still cannot conclude. "I cannot tell from this whether the high earners are outliers from one industry or a broader pattern. I also do not know if the cohort is large enough for the median to be stable."

## Why it works for data fluency

Most data misreadings are confident claims with no support, or supported claims with no acknowledgment of what the data does not show. Claim-Support-Question makes both visible. The rubric for tier 3 and 4 responses scores claim, support, and question independently — a learner who lands a strong claim with weak support scores lower than one who lands a tentative claim with strong support and an honest question.

## How to embed in a scenario prompt

In tier 3 and 4 scenarios, the visible thinking prompts field uses these exact keys:

```json
"visible_thinking_prompts": {
  "claim": "What do you tell the colleague the data is actually saying?",
  "support": "Which specific number or comparison backs that?",
  "question": "What would you still want to know before acting on it?"
}
```

The `claim` prompt asks for the headline interpretation. The `support` prompt forces the learner to cite specific data features, not vibes. The `question` prompt elicits residual uncertainty — the absence of a question is itself a signal.

## What good looks like in a learner response

A learner using this routine well will produce text that:

- States a clear interpretive claim, not a hedge.
- Cites at least one specific data feature (a value, a comparison, a shape) as support.
- Names a question the data alone cannot answer — about provenance, scope, sample size, or context.

A learner skipping the routine will assert a conclusion without citing data, or cite data without committing to a claim, or omit the question entirely (signaling overconfidence).

## Pairing with other routines

Claim-Support-Question sits well with **See-Think-Wonder** at lower tiers as a stepping stone: See/Think become the support; Wonder becomes the question. At tier 5 (WikiDraft), the routine maps directly onto the structure of a dictionary contribution — the entry's definition is a claim, its example is support, its school_usage notes name the questions that remain across contexts.
