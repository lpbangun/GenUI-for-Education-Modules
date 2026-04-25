---
term: population vs sample
plain_definition: A population includes every single member of a group, while a sample is a smaller, representative subset selected for easier analysis.
related_terms: ["Parameter", "Statistic", "Inference", "Generalizability", "Sampling bias"]
common_confusion_with: ["Sample size", "Census", "Representative vs convenience sample"]
school_usage:
  HGSE: "Common in education research, this distinction helps distinguish between statewide student outcomes and performance metrics derived from a specific school district pilot."
  HBS: "Typically used when evaluating market research, where faculty differentiate between data representing the entire customer base versus responses from a focus group."
  FAS: "Often cited in social science departments to ensure students clarify whether survey results reflect the entire undergraduate body or just a voluntary course-based group."
  HMS: "Used heavily in clinical trials to explain that the treatment effect observed in a specific patient trial is being used to estimate outcomes for the entire affected patient population."
  SEAS: "Used in data science contexts to clarify whether an algorithm is being tested on an entire available dataset or a small training subset for model validation."
version: 1
---

## Plain-language definition
A population includes every single member of a group, while a sample is a smaller, representative subset selected for easier analysis.

## What it tells you
The population represents the 'truth' of the entire group you are interested in. A sample is a proxy that allows you to calculate statistics when analyzing the whole population—such as every staff member or every donor—is too costly, time-consuming, or physically impossible.

## When it matters
Use the population if you have access to every record, such as the full roster of active staff for a benefits review. Use a sample when you are performing predictive modeling or surveying a large group, where you need to draw inferences about the whole based on a manageable subset.

## Common confusion with census
A census is an attempt to collect data from every member of a population. If you succeed, you have the full population data. If your census results are incomplete—which happens often—you have effectively ended up with a sample, not a population, which changes how you should interpret your margin of error.

## Example in context
You are evaluating office space utilization. If you track every single desk in every Harvard building for a month, you are analyzing a population. If you track 50 desks across five departments and assume those represent how everyone else works, you are using a sample to estimate behavior for the larger population of all employees.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- **Parameter** is a numerical value that describes an entire population.
- **Statistic** is a value derived from a sample used to estimate a population parameter.
- **Inference** is the process of drawing conclusions about a population based on sample data.
- **Generalizability** is the degree to which findings from a sample apply to the larger population.
