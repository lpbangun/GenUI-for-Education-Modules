---
term: missing data
plain_definition: Missing data occurs when a value that should exist in a dataset is absent, preventing analysis of that specific record or variable.
technical_definition: "A state in a data matrix where an observation lacks a recorded value for a specific variable, often categorized as Missing Completely at Random (MCAR), Missing at Random (MAR), or Missing Not at Random (MNAR)."
related_terms: ["Data Imputation", "Non-response Bias", "Null Value", "Complete-case Analysis", "Data Cleaning"]
common_confusion_with: ["Zero", "Empty String", "Not Applicable (N/A)"]
school_usage:
  HGSE: "Commonly encountered in student longitudinal surveys where participants may stop responding to specific questions over multiple years."
  HBS: "Frequently discussed in market research contexts, where missing customer feedback requires imputation techniques to avoid overestimating satisfaction trends."
  FAS: "Used extensively when reconciling registrar and departmental student enrollment spreadsheets that contain mismatched entries or unrecorded grades."
  HMS: "Critical in clinical data systems where missing blood pressure or temperature entries during a patient visit can invalidate an entire session's study record."
  SEAS: "Typically handled through algorithmic cleaning, especially when sensor logs report blanks due to intermittent connectivity in laboratory equipment."
version: 1
---

## Plain-language definition

Missing data occurs when a value that should exist in a dataset is absent, preventing analysis of that specific record or variable.

## What it tells you

Missing data signals a gap in your knowledge. It reveals that your collection process, survey design, or data migration might have encountered a hurdle. It warns you that if you simply ignore the gaps, your remaining analysis may be biased—because the data that went missing is rarely missing at random.

## When it matters

Missing data is critical whenever you are drawing conclusions about an entire population. It matters when:
- You are calculating completion rates for financial aid applications.
- You are evaluating course satisfaction scores where only those with strong opinions responded.
- You are aggregating research outcomes from multiple lab sites with different recording protocols.
- You are running regression models that automatically exclude rows containing even one empty cell.

## Common confusion with zeros

A blank cell (missing) is not the same as a zero. A zero in a budget sheet means the expense is officially 'none,' while a blank cell suggests the information was never entered, tracked, or obtained. Treating missing data as zero can artificially lower your averages and skew your results.

## Example in context

A staff survey on remote work preferences shows a 20% non-response rate. If the data team assumes these staff members feel the same as the respondents, the results are safe. However, if the missing 20% are the staff members who work on-site and had no access to the survey link, the data is biased toward remote employees, leading to flawed policy recommendations.

## Usage across Harvard

At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms

- **Data Imputation** is the process of filling in missing values with estimated data.
- **Non-response Bias** occurs when those who do not provide data differ systematically from those who do.
- **Null Value** is the specific database term for a field that has no value.
- **Complete-case Analysis** is the practice of only using rows that have no missing data.
- **Data Cleaning** is the systematic process of finding and fixing errors in a dataset.
