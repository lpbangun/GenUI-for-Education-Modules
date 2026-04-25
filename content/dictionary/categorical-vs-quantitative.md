---
term: categorical vs quantitative
plain_definition: Categorical data groups observations into distinct labels or categories, while quantitative data uses numbers to represent measurable amounts or values.
related_terms: ["Nominal", "Ordinal", "Continuous", "Discrete", "Variable Type"]
common_confusion_with: ["Ordinal data vs quantitative ranking", "Numeric IDs as categorical variables", "Interval scales"]
school_usage:
  HGSE: "Typically used when cleaning survey data to distinguish between student demographic groups and standardized test scores."
  HBS: "Commonly referenced in marketing analytics to separate customer segments from lifetime value calculations."
  FAS: "Frequently used to differentiate between departmental course coding systems and enrollment count statistics."
  HMS: "Typically applied to distinguish between patient diagnosis codes and biological markers measured in clinical trials."
  SEAS: "Used to separate hardware component classifications from performance metrics like latency or throughput."
version: 1
---

## Plain-language definition
Categorical data groups observations into distinct labels or categories, while quantitative data uses numbers to represent measurable amounts or values.

## What it tells you
Categorical data tells you 'what kind' (e.g., student degree program, building name). Quantitative data tells you 'how much' or 'how many' (e.g., tuition dollars, square footage, years of service). Identifying the type is the first step in deciding which statistical tests or visualizations are valid.

## When it matters
Choosing the wrong type leads to nonsense reports. You cannot calculate the mean of 'Department Names' (categorical), even if you coded them as numbers 1 through 5. Conversely, you would lose detail if you treated 'Age' (quantitative) merely as a category of 'Young' or 'Old'. Matching data types to the correct operations prevents reporting errors.

## Common confusion
People often treat numerical codes as quantitative data. If a survey uses '1' for Freshman and '4' for Senior, calculating the 'average grade level' as 2.5 is mathematically invalid because the numbers are just labels, not measurements. This is the difference between coding data for a database and measuring data for analysis.

## Example in context
A staff member analyzing alumni event attendance creates a spreadsheet. 'Class Year' is quantitative (it represents a point on a timeline), allowing for an average graduation year calculation. 'School Affiliation' is categorical, so the staff member uses counts and percentages to describe the group rather than calculating an average.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- Nominal: Categorical data with no logical order.
- Ordinal: Categorical data with a clear, logical rank.
- Continuous: Quantitative data that can be any value within a range.
- Discrete: Quantitative data consisting of whole, countable units.
- Variable Type: The broader classification that determines allowable analysis.
