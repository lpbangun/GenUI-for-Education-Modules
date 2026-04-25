---
term: time series basics
plain_definition: A time series is a sequence of data points recorded at regular intervals over time, used to track changes or trends.
technical_definition: "A collection of observations obtained through repeated measurements over time, indexed by a time variable T, where the order of observations is critical."
related_terms: ["Trend", "Seasonality", "Autocorrelation", "Lag", "Moving Average"]
common_confusion_with: ["Cross-sectional data", "Cohort analysis", "Regression"]
school_usage:
  HGSE: "Common in analyzing student enrollment patterns and longitudinal achievement gains across multiple academic years."
  HBS: "Typically used for tracking quarterly financial performance metrics or market interest rate fluctuations over several decades."
  FAS: "Used to monitor historical undergraduate course registration trends or long-term fluctuations in departmental research funding."
  HMS: "Common for observing patient biometric data recorded at consistent intervals during clinical observation or longitudinal health studies."
  SEAS: "Typically used in technical models to predict energy consumption patterns or hardware performance metrics over continuous operational cycles."
version: 1
---

## Plain-language definition
A time series is a sequence of data points recorded at regular intervals over time, used to track changes or trends.

## What it tells you
Time series analysis helps you identify patterns such as growth trends, recurring cycles, or sudden shifts. By observing data points in chronological order, you can distinguish between random noise and a meaningful movement, allowing for more reliable projections about future states based on past performance.

## When it matters
Use time series analysis when your primary goal is to understand how an entity behaves over time rather than how different entities compare at a single moment. It is essential for:
- Forecasting seasonal demand for campus services.
- Evaluating the efficacy of a pilot program over its lifespan.
- Identifying cyclical fluctuations in administrative workloads.
- Detecting anomalies that deviate from historical norms.

## Common confusion with cross-sectional data
Staff often confuse time series with cross-sectional data. Cross-sectional data looks at many subjects at one point in time, like a census of all departments in 2023. Time series looks at one subject (like total University revenue) over many points in time. Comparing a snapshot to a movie—the former captures the 'what' and 'who,' while the latter captures the 'how' and 'when.'

## Example in context
An administrator wants to understand if recent changes in office traffic are unusual. By pulling the last five years of badge-tap data recorded monthly, they create a time series. They notice a clear 'seasonality'—a dip every July—that explains the current decrease. Without the time series context, they might have incorrectly attributed the dip to a failure in a specific policy.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.
