---
term: outliers
plain_definition: An outlier is a data point that differs significantly from other observations in a set, appearing as an anomaly that stands apart from the pattern.
related_terms: ["Mean", "Median", "Standard Deviation", "Data Cleaning", "Influence"]
common_confusion_with: ["Extreme values", "Error codes", "Measurement noise"]
school_usage:
  HGSE: "Common in student performance data analysis where outlier assessment helps identify students needing intervention or enrichment outside the standard pedagogical arc."
  HBS: "Typically used when assessing executive compensation or market impact data where extreme values reflect legitimate, high-impact business realities rather than errors."
  FAS: "Often encountered in longitudinal faculty research or enrollment datasets where unusual data points may signify unique disciplinary trends or administrative shifts."
  HMS: "Extensively used in clinical trial monitoring where outlier detection is a critical safety protocol to identify adverse reactions in individual trial participants."
  SEAS: "Used during experimental sensor analysis where researchers must determine if a spike in data represents a physical breakthrough or a faulty equipment calibration."
version: 1
---

## Plain-language definition
An outlier is a data point that differs significantly from other observations in a set, appearing as an anomaly that stands apart from the pattern.

## What it tells you
Outliers reveal boundaries. They indicate where your data stops following the expected trend, alerting you to either unique phenomena or potential errors in the collection process.

## When it matters
Identify outliers when you are calculating averages or predicting future trends. Because they pull the mean toward themselves, they can misrepresent a central tendency. You should examine them when:
- Auditing operational budgets for anomalous spending.
- Cleaning survey responses to remove input errors.
- Investigating extreme performance metrics in pilot programs.
- Verifying the integrity of automated data imports.

## Common confusion with error codes
People often assume an outlier is 'bad' data or a system glitch. However, an outlier might be the most important part of your dataset, such as a rare student success story or an unprecedented financial gift. Never delete an outlier without verifying if it is a measurement error or a genuine insight.

## Example in context
An administrator looks at the time it takes for grant proposals to be approved. Most take 10 to 14 days, but one request took 85 days. The 85-day point is an outlier. If included, it inflates the department's 'average' wait time to 18 days, making the workflow seem inefficient. By separating the outlier for a root-cause investigation, the team discovers a specific technical hold-up that does not affect the standard process.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- **Mean** is the arithmetic average, which is highly sensitive to outliers.
- **Median** is the middle value, which remains robust despite the presence of outliers.
- **Standard Deviation** measures spread, and a high value is often caused by extreme outliers.
- **Data Cleaning** is the systematic process of identifying and addressing outliers and errors.
- **Influence** describes how much a single outlier changes the result of a statistical model.
