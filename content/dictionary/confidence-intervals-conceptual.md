---
term: confidence intervals conceptual
plain_definition: A confidence interval provides a range of values within which we are reasonably certain the true population parameter actually lies.
related_terms: ["Margin of error", "Standard error", "Null hypothesis", "P-value", "Point estimate"]
common_confusion_with: ["Probability of an event", "Standard deviation", "Prediction interval"]
school_usage:
  HGSE: "Commonly used in education policy research to qualify the uncertainty of intervention effects when analyzing student assessment trends."
  HBS: "Typically employed in market research and survey analysis to express the reliability of consumer preference estimates."
  FAS: "Used in social science research to describe the precision of survey responses or experimental outcomes within faculty publications."
  HMS: "Standard for clinical trials to communicate the expected therapeutic benefit while acknowledging inherent variability among patient populations."
  SEAS: "Used in data science and engineering workflows to assess the robustness of model parameters against noise in large datasets."
version: 1
---

## Plain-language definition
A confidence interval provides a range of values within which we are reasonably certain the true population parameter actually lies.

## What it tells you
A confidence interval indicates the precision of an estimate. If you calculate a 95 percent confidence interval for the average number of hours students spend in the library, you are saying that if you repeated your sampling process many times, 95 percent of the intervals you generated would contain the true, actual average for all students.

## When it matters
Use confidence intervals whenever you are making an inference about a larger population based on a sample. They are essential when:
- Reporting survey results where you only contacted a portion of the staff or students.
- Presenting experimental findings to show that a result is not just a fluke of a small group.
- Communicating findings where precision is just as important as the average result itself.

## Common confusion with probability
A 95 percent confidence interval does not mean there is a 95 percent probability that the true value is in that specific interval. Once the data is collected and the range is fixed, the true value is either in that range or it is not. The percentage refers to the reliability of your *method* of gathering data, not the location of the true parameter itself.

## Example in context
An administrator estimates that student satisfaction is 80 percent based on a survey. A point estimate of 80 percent might look definitive, but it lacks context. By adding a 95 percent confidence interval of plus or minus 3 percent, the administrator clarifies that the true satisfaction score is likely between 77 and 83 percent. This helps stakeholders understand the realistic margin of uncertainty.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- Margin of error: The plus-or-minus range that defines the width of the confidence interval.
- Standard error: A measurement of the variability of the sample mean, used to calculate the interval width.
- Null hypothesis: The baseline assumption that researchers often test against using confidence intervals.
- P-value: A related statistic used to determine if a result is statistically significant.
- Point estimate: The single best guess value calculated from the sample.
