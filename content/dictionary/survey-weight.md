---
term: survey weight
plain_definition: A survey weight is a statistical multiplier applied to each respondent to ensure sample results accurately represent the broader, target population.
related_terms: ["Non-response bias", "Sample frame", "Post-stratification", "Probability sampling", "Representativeness"]
common_confusion_with: ["Raw count", "Frequency distribution", "Population size"]
school_usage:
  HGSE: "Researchers frequently use weights to adjust survey data when demographic groups, such as specific teacher cohorts, are oversampled or under-represented in feedback."
  HBS: "Faculty often apply weights to executive education participant data to ensure results align with the true distribution of global industry sectors represented."
  FAS: "Student life surveys commonly utilize weighting to account for disparate response rates across different undergraduate houses or concentration years."
  HMS: "Clinical study coordinators use weights when aggregating data from multiple sites to ensure patient outcomes aren't biased by the size of individual hospital cohorts."
  SEAS: "Technical reports on alumni career trajectories apply weights to compensate for lower response rates among specific engineering disciplines or recent graduates."
version: 1
---

## Plain-language definition
A survey weight is a statistical multiplier applied to each respondent to ensure sample results accurately represent the broader, target population.

## What it tells you
Weights tell you how much 'influence' each specific survey response has in the final total. If a demographic group is under-represented in your survey compared to their actual proportion in the population, each person from that group is assigned a weight greater than one to 'boost' their voice. Conversely, over-represented groups are assigned a weight less than one.

## When it matters
Use survey weights whenever you want to move from describing only the people who took the survey to describing the entire population of interest. It is essential when:
- Response rates vary significantly across demographics or departments.
- The survey design intentionally oversampled a small or rare population.
- You are combining multiple datasets with different sampling probabilities.

## Common confusion
People often treat raw counts as population totals. If you have 50 respondents from Department A and 50 from Department B, but Department B is actually ten times larger than A, reporting simple averages will heavily bias your findings toward Department A. Weights correct this imbalance.

## Example in context
A department surveys alumni to measure satisfaction. They receive responses from 200 seniors and 50 juniors. Since there are roughly equal numbers of juniors and seniors in the population, the raw average satisfaction score is skewed by the seniors. By applying a weight of 0.25 to the senior responses and 1.0 to the junior responses, the data reflects the actual population balance of the two groups.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- **Non-response bias** is the systematic error that occurs when those who do not respond differ from those who do.
- **Sample frame** is the actual list or database from which the sample is drawn.
- **Post-stratification** is the process of adjusting weights after the survey is completed to match known population totals.
- **Probability sampling** is a method where every individual has a known chance of selection.
- **Representativeness** is the degree to which a sample reflects the characteristics of the population.
