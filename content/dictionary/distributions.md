---
term: distributions
plain_definition: A distribution represents the way data points are spread across a range of values, showing how frequently each outcome occurs within a group.
related_terms: ["Frequency", "Normal distribution", "Skewness", "Standard deviation", "Histogram"]
common_confusion_with: ["Data set", "Sample", "Correlation"]
school_usage:
  HGSE: "Faculty researchers often examine the distribution of student test scores to identify achievement gaps and determine if assessment tools are functioning effectively."
  HBS: "Case study analysts and MBA instructors typically look at the distribution of financial metrics to distinguish between performance trends and random market noise."
  FAS: "Academic administrators analyze the distribution of enrollment numbers across departments to make informed decisions regarding course staffing and resource allocation."
  HMS: "Clinical researchers frequently assess the distribution of patient responses to a treatment to determine if the effect is consistent or concentrated in a specific subgroup."
  SEAS: "Engineering staff monitor the distribution of system latency logs to diagnose performance bottlenecks and ensure infrastructure stability for research computing."
version: 1
---

## Plain-language definition
A distribution represents the way data points are spread across a range of values, showing how frequently each outcome occurs within a group.

## What it tells you
It provides a bird's-eye view of your data. While a single number like an average describes the center, the distribution tells you whether your data is clustered tightly around that center or if it spans a wide range. It reveals if your data is symmetric, whether it leans to one side, or if there are multiple 'peaks' indicating different sub-groups within your population.

## When it matters
Visualizing the distribution is the first step in any meaningful analysis because it informs which summary statistics are appropriate. If you do not know the distribution, you might use an average when a median is more accurate, or fail to see that a small group of exceptions is skewing your entire result.

## Common confusion with data sets
A data set is simply the collection of information you have gathered; the distribution is the *shape* that those values create when you plot their frequency. Confusing the two often leads to over-reliance on a single summary statistic without understanding the underlying variability.

## Example in context
An HR analyst reviews the distribution of staff tenure across a school. Instead of just noting the average tenure of five years, they generate a histogram. They discover a bimodal distribution: one large group has been there less than two years, and another large group has been there more than ten years, with very few people in between. The average 'five years' doesn't actually represent anyone in the department.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- **Frequency:** The count of how often a specific value appears in a distribution.
- **Normal distribution:** The classic bell-shaped curve where data is symmetric around the mean.
- **Skewness:** A measure of how much a distribution leans to one side instead of being symmetric.
- **Standard deviation:** A numerical measure of how 'spread out' the distribution is around the mean.
- **Histogram:** The standard visual chart used to display a distribution.
