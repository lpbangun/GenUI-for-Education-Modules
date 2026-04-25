---
term: correlation causation
plain_definition: Correlation refers to two things changing together, whereas causation means one thing directly produces the change in the other.
related_terms: ["Spurious Correlation", "Confounding Variable", "Regression Analysis", "Randomized Controlled Trial", "Observational Study"]
common_confusion_with: ["Association", "Coincidence", "Predictive Modeling"]
school_usage:
  HGSE: "Researchers often discuss this when evaluating intervention program impacts on student learning outcomes versus preexisting student variables."
  HBS: "Case studies frequently warn that market trends observed in data do not guarantee that one business decision caused a specific financial result."
  FAS: "Faculty and staff in the social sciences rely on this distinction to avoid misinterpreting trends in large-scale student survey datasets."
  HMS: "Clinical teams emphasize this when interpreting epidemiological studies to ensure that observational patterns are not mistaken for therapeutic efficacy."
  SEAS: "Technical staff focus on this when evaluating machine learning models to prevent attributing system performance to incorrect input variables."
version: 1
---

## Plain-language definition
Correlation refers to two things changing together, whereas causation means one thing directly produces the change in the other.

## What it tells you
Correlation simply measures the strength and direction of a relationship between two variables. It tells you that when X goes up, Y tends to go up (or down). Causation confirms that the change in X is the specific mechanism driving the change in Y.

## When it matters
Recognizing the gap between these two concepts is vital when:
- Interpreting survey data that implies one initiative improved satisfaction.
- Designing dashboards to inform policy or resource allocation.
- Determining if an observed trend in administrative data reflects a success or a coincidental external factor.
- Reviewing research findings before sharing them with leadership.

## Common confusion with the term
It is easy to assume that because two datasets move in tandem, one must be the driver of the other. The most common pitfall is ignoring a third, hidden factor—the 'lurking variable'—that influences both datasets simultaneously, creating the illusion of a direct link.

## Example in context
An administrative report shows that students who use the campus library more often have higher GPA averages. It is tempting to report that library usage causes higher grades. However, it is equally likely that students who are naturally more motivated or have better time management skills are both more likely to use the library and more likely to achieve higher grades. Library usage is correlated with, but not necessarily the cause of, the higher GPA.

## Usage across Harvard
HGSE and HBS often center their analytical training on the tension between these concepts, particularly when evaluating the efficacy of educational or business interventions. HMS researchers are rigorous about this distinction, as observational data often suggests links that fail to hold up in controlled trials. FAS and SEAS professionals frequently apply this skepticism to complex datasets where identifying the 'why' is just as important as measuring the 'what.'

## Related terms
- **Spurious Correlation**: An instance where two variables appear related but are only connected by chance or a third factor.
- **Confounding Variable**: An external factor that influences both variables in an analysis.
- **Regression Analysis**: A statistical technique often used to test for relationships, but which requires careful design to imply causality.
- **Randomized Controlled Trial**: The gold standard for establishing causation by isolating variables.
- **Observational Study**: Research based on existing data where variables cannot be manipulated, making causal claims difficult.
