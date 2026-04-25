---
id: see-think-wonder
name: See-Think-Wonder
source: Ritchhart, Church, Morrison (2011) — Making Thinking Visible
purpose: Slow learners down so they observe before inferring
when_to_use:
  - First encounter with a chart, table, or dataset
  - When a learner has jumped to a conclusion too quickly
  - When the goal is observation skill, not interpretation
tier_compatibility: [2, 3, 4, 5]
prompt_pattern: "What do you see / What do you think / What do you wonder"
version: 1
---

# See-Think-Wonder

A three-step routine that separates observation from interpretation from question.

## The routine

1. **See** — describe what is literally there. No interpretation, no story. "I see two lines on a chart, one rising, one flat. Both have years on the x-axis."
2. **Think** — make sense of what you saw. "I think the rising line might be enrollment in undergraduate programs, while the flat one is graduate."
3. **Wonder** — note what you cannot answer from what is in front of you. "I wonder what happened in 2020 to cause that dip. I wonder whether this is total enrollment or just first-year."

## Why it works for data fluency

Most misreadings of data come from skipping straight to step 2. Learners look at a chart, form a story, and then cite the chart as evidence for the story they brought. See-Think-Wonder forces a pause at observation before any narrative is allowed.

## How to embed in a scenario prompt

In tier 2 and 3 scenarios, the visible thinking prompts field uses these exact keys:

```json
"visible_thinking_prompts": {
  "notice": "What do you see in the difference between mean and median?",
  "think": "What story does each number tell?",
  "wonder": "What would you need to know about the $500,000 value to interpret it responsibly?"
}
```

The `notice` prompt always asks for observation only. The `think` prompt invites interpretation. The `wonder` prompt asks the learner to articulate what they cannot conclude from the data alone.

## What good looks like in a learner response

A learner using this routine well will produce text that:

- Names specific values, labels, or features in the data before drawing conclusions.
- Distinguishes "the data shows X" from "the data probably means X."
- Names at least one question that the data does not answer.

A learner skipping the routine will jump straight to a conclusion, often with confident phrasing ("clearly the average is misleading") without first describing what they actually see.

## Pairing with other routines

See-Think-Wonder sits well with **Claim-Support-Question** at higher tiers: the See/Think becomes the support for a claim; the Wonder becomes the residual question.
