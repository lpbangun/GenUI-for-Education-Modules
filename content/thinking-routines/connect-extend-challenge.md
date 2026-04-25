---
id: connect-extend-challenge
name: Connect-Extend-Challenge
source: Ritchhart, Church, Morrison (2011) — Making Thinking Visible
purpose: Integrate new data concepts with prior knowledge, push thinking forward, and surface what does not yet fit
when_to_use:
  - Tier 4 and 5 prompts where the learner is expected to relate a concept to their own work context
  - When introducing a concept that builds on a prerequisite the learner has already covered
  - When a learner needs to wrestle with something counterintuitive
tier_compatibility: [3, 4, 5]
prompt_pattern: "How does this connect / How does it extend / What challenges your prior thinking"
version: 1
---

# Connect-Extend-Challenge

A three-step routine that situates a new concept against what the learner already believes.

## The routine

1. **Connect** — name where this concept overlaps with something you already know or have seen at work. "This connects to the way I read course evaluation summaries — I always look at the median rating, not the mean, because a few outlier comments can skew everything."
2. **Extend** — name a new idea, distinction, or implication the concept gives you. "I had not thought about how the gap between mean and median is itself a signal about distribution shape. That is information I was throwing away."
3. **Challenge** — name what is now harder, more confusing, or in tension with what you previously believed. "I am now unsure how to talk to my dean about 'average' anything without first checking the distribution. That feels like more work than I was doing before."

## Why it works for data fluency

Constructivism requires that learners build new understanding on prior knowledge, not on a blank slate. Connect-Extend-Challenge makes the prior knowledge explicit, validates the extension, and respects the cognitive cost of revising a held belief. The Challenge step is the most important — it is where productive struggle gets named instead of suppressed.

## How to embed in a scenario prompt

In tier 4 and 5 scenarios, the visible thinking prompts field uses these exact keys:

```json
"visible_thinking_prompts": {
  "connect": "Where in your own work have you seen this pattern, even if you didn't name it?",
  "extend": "What does this concept give you that you didn't have before?",
  "challenge": "What about your usual practice does this complicate?"
}
```

The `connect` prompt elicits prior knowledge — particularly important the first time a concept is encountered. The `extend` prompt confirms the learner has gained something concrete. The `challenge` prompt invites honest difficulty; a learner who reports no challenge is either fully fluent or not yet engaging.

## What good looks like in a learner response

A learner using this routine well will produce text that:

- Names a specific prior experience or domain artifact, not a generic "I've seen this before."
- Articulates a concrete new distinction or move the concept enables.
- Surfaces a real tension with prior practice, in language that does not minimize it.

A learner skipping the routine will produce vague affirmations ("yes, this makes sense") without anchoring in their own context, or will skip the challenge step (signaling either superficial engagement or unwillingness to revise).

## Pairing with other routines

Connect-Extend-Challenge is the natural choice for the **first scenario** a learner sees for any new concept, regardless of tier. It elicits the prior knowledge that constructivism requires before scaffolded practice begins. At tier 5, it pairs with **Claim-Support-Question** — the wiki draft becomes a Claim, the Connect/Extend become the Support, and the Challenge becomes the residual Question for future contributors.
