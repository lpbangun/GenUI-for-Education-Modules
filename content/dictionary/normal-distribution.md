---
term: normal distribution
plain_definition: A normal distribution is a symmetrical bell-shaped frequency curve where most observations cluster around a central mean, thinning out toward the extreme tails.
related_terms: ["Standard Deviation", "Skewness", "Z-Score", "Central Limit Theorem"]
common_confusion_with: ["Uniform distribution", "Skewed distribution", "T-distribution"]
school_usage:
  HGSE: "Commonly used in psychometrics to describe the distribution of standardized test scores across a large student population."
  HBS: "Typically used in financial modeling and risk assessment when assuming asset returns follow a classic bell curve pattern."
  FAS: "Frequently invoked in social science research to check if a specific dataset meets the assumptions required for parametric statistical tests."
  HMS: "Often used in clinical trial analysis to determine if biological markers or physiological responses follow a predictable range in a healthy cohort."
  SEAS: "Typically used in signal processing and computational modeling to describe expected variations or natural noise patterns within a system."
version: 1
---

## Plain-language definition

A normal distribution is a symmetrical bell-shaped frequency curve where most observations cluster around a central mean, thinning out toward the extreme tails.

## What it tells you

It tells you that the bulk of your data points reside near the average, with predictable decreasing frequency as you move toward the low or high ends. In a perfect normal distribution, the mean, median, and mode are all the same value, sitting right in the center.

## When it matters

It matters most when you are choosing which statistical tests to run. Many common tools, like t-tests or linear regressions, often assume that your data or the residuals of your model are normally distributed. If your data is heavily skewed or has multiple peaks, these tests may produce misleading results.

## Common confusion with skewed distributions

People often mistake any bell-shaped curve for a normal distribution. However, a distribution can be symmetric and bell-shaped without being 'normal.' A true normal distribution follows specific mathematical rules regarding how quickly the tails fall off. If your data has very fat tails—meaning extreme values occur more often than expected—it is not normal, even if it looks like a bell.

## Example in context

When a department analyzes the time staff spend on a recurring administrative task, they might plot the data and see a bell curve. If it looks like a normal distribution, they can reliably predict that 95 percent of staff will finish within two standard deviations of the mean. If the data is skewed, those predictions will be wrong.

## Usage across Harvard

At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms

- **Standard Deviation** is the measure of the 'width' of the bell curve.
- **Skewness** is a measure of how much the distribution leans away from the center.
- **Z-Score** measures how many standard deviations a value is from the mean in a normal distribution.
- **Central Limit Theorem** explains why sample means tend to form a normal distribution even when the underlying data is not normal.
