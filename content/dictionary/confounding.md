---
term: confounding
plain_definition: A confounding variable is an outside factor that influences both the cause and the effect, creating a false perception of a direct relationship.
related_terms: ["Correlation", "Causality", "Omitted Variable Bias", "Spurious Relationship", "Multivariate Analysis"]
common_confusion_with: ["Mediation", "Interaction Effect", "Multi-collinearity"]
school_usage:
  HGSE: "Common in education policy evaluations, researchers use this to account for student socioeconomic status when assessing the impact of new curriculum interventions."
  HBS: "Frequently discussed in management research where unobserved cultural factors might explain why certain leadership styles appear correlated with higher firm performance."
  FAS: "Typically used in social science research design to ensure that demographic variables are controlled for when analyzing student enrollment or survey response trends."
  HMS: "Central to clinical trials, where researchers must ensure that patient age or comorbidities do not distort findings regarding the efficacy of a new drug."
  SEAS: "Common in experimental data processing, where technicians monitor environmental variables to ensure that changes in sensor output are not actually caused by ambient temperature fluctuations."
version: 1
---

## Plain-language definition

A confounding variable is an outside factor that influences both the cause and the effect, creating a false perception of a direct relationship.

## What it tells you

Confounding tells you that the correlation you are observing may be a mirage. If Variable A seems to cause Variable B, confounding suggests that a hidden Variable C is actually driving the change in both. Recognizing this is the difference between identifying a true driver of success and simply observing a coincidental pattern.

## When it matters

It matters most whenever you are trying to attribute a specific outcome to a specific program or intervention. You should look for confounding when:
- You are analyzing the impact of a pilot program where participants self-selected rather than being randomized.
- You see a sudden spike in engagement metrics that correlates with multiple simultaneous changes in office policy.
- You are interpreting survey results where external timing or current events might influence how respondents answer unrelated questions.

## Common confusion with mediation

A confounding variable sits "outside" the process, affecting both the input and the output. By contrast, a mediator sits "inside" the chain of events: A causes the mediator, and the mediator then causes B. Confusing the two leads to fundamentally different strategies for data improvement.

## Example in context

A department notices that staff members who use a new digital project tool tend to be more productive. Before declaring the tool a success, a data analyst notes that the highest-performing teams were the ones who adopted the tool early. In this case, 'team tenure' is a confounder: long-tenured teams are likely both more productive and more likely to test new tools, regardless of the tool's actual utility.

## Usage across Harvard

At HGSE and HBS, researchers frequently control for confounding variables in regression models to separate the impact of a program from the background characteristics of the participants. HMS researchers rely heavily on randomization and adjustment to isolate drug effects from patient history, while FAS and SEAS analysts check for confounding to ensure that laboratory or survey environments aren't inadvertently driving the observed results.

## Related terms
- **Correlation:** A statistical measure of how two variables move together; it does not imply causation.
- **Causality:** The relationship between cause and effect, which confounding makes difficult to prove.
- **Omitted Variable Bias:** The error introduced when a relevant variable is excluded from an analysis, often leading to confounding.
- **Spurious Relationship:** A mathematical connection between two variables that is actually caused by a third, hidden factor.
- **Multivariate Analysis:** A statistical approach used to observe multiple variables simultaneously to isolate the effect of one while controlling for others.
