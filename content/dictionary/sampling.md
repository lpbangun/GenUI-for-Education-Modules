---
term: sampling
plain_definition: Sampling is the process of selecting a subset of individuals or items from a larger population to draw inferences about the whole group.
related_terms: ["representative sample", "random sampling", "bias", "population", "sample size"]
common_confusion_with: ["census", "convenience sampling", "population"]
school_usage:
  HGSE: "Common in education research, where sampling strategies are carefully documented to ensure diverse classroom environments are accurately represented in survey results."
  HBS: "Typically used for market research and consumer behavior studies where precise sampling frames are needed to test how prospective customers react to new product prototypes."
  FAS: "Often centers on probability sampling methods in social science research to ensure that survey data gathered from undergraduate student groups can be generalized."
  HMS: "Focuses on clinical sampling techniques to ensure study participants mirror the target patient demographic, minimizing selection bias in medical trials."
  SEAS: "Typically used in technical contexts regarding sensor data or computational models, where sampling rates determine the fidelity of the digital representation of physical phenomena."
version: 1
---

## Plain-language definition
Sampling is the process of selecting a subset of individuals or items from a larger population to draw inferences about the whole group.

## What it tells you
Sampling allows you to understand the characteristics, opinions, or behaviors of a large population without needing to survey every single member. If the sample is chosen correctly, the results will serve as a reliable estimate of the entire group's metrics.

## When it matters
Use sampling when the population is too large, inaccessible, or expensive to measure entirely. It is critical for:
- Alumni surveys that aim to capture feedback from thousands of graduates.
- Research projects where studying an entire population is logistically impossible.
- Quality control checks on large datasets where a full audit would be inefficient.
- Predictive modeling where a subset of historical data is used to train an algorithm.

## Common confusion with census
A census attempts to collect data from every single member of the population, whereas sampling relies on a fraction. A census provides exact parameters for the population, while sampling provides estimates with a calculated margin of error.

## Example in context
An administrative office wants to understand staff sentiment regarding remote work policies. With over 2,000 employees, they decide to send the survey to a random selection of 400 staff members rather than everyone. By using a randomized approach, they increase the likelihood that their findings accurately reflect the broader sentiment of the entire staff, provided the sample size is sufficient.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.
